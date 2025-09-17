import { WebContentsView } from 'electron'
import { createLogger } from '../../../shared/logger'
import { IOptimizationService } from '../../../shared/types'

const logger = createLogger('WebContentsNavigationService')

export interface NavigationState {
    canGoBack: boolean
    canGoForward: boolean
    isLoading: boolean
    url: string
    title: string
}

export interface LoadOptions {
    userAgent?: string
    extraHeaders?: string
    postData?: Electron.UploadRawData[] | Electron.UploadFile[]
    baseURLForDataURL?: string
}

/**
 * 🧭 WebContents 네비게이션 서비스 (SRP: URL 로딩 및 네비게이션만 담당)
 * - URL 로딩 및 검증
 * - 네비게이션 히스토리 관리
 * - 페이지 이동 (뒤로/앞으로)
 * - 새로고침 관리
 */
export class WebContentsNavigationService implements IOptimizationService {
    private isInitialized = false
    private navigationHistory = new Map<string, string[]>()
    private currentUrls = new Map<string, string>()

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('WebContents navigation service already initialized')
            return
        }

        logger.info('🧭 Initializing WebContents navigation service...')

        this.isInitialized = true
        logger.info('✅ WebContents navigation service initialized successfully')
    }

    // URL 로딩
    async loadUrl(webView: WebContentsView, url: string, options?: LoadOptions): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('WebContents navigation service not initialized')
        }

        try {
            // URL 검증
            if (!this.isValidUrl(url)) {
                throw new Error(`Invalid URL: ${url}`)
            }

            logger.info('Loading URL', { url, hasOptions: !!options })

            // 로딩 옵션 설정
            const loadOptions: any = {}
            if (options?.userAgent) loadOptions.userAgent = options.userAgent
            if (options?.extraHeaders) loadOptions.extraHeaders = options.extraHeaders
            if (options?.postData) loadOptions.postData = options.postData
            if (options?.baseURLForDataURL) loadOptions.baseURLForDataURL = options.baseURLForDataURL

            // URL 로딩
            await webView.webContents.loadURL(url, loadOptions)

            // 히스토리 업데이트
            this.updateNavigationHistory(webView, url)

            logger.info('URL loaded successfully', { url })
        } catch (error) {
            logger.error('Failed to load URL', { url, error })
            throw error
        }
    }

    // URL 검증
    private isValidUrl(url: string): boolean {
        try {
            const urlObj = new URL(url)

            // 허용된 프로토콜 확인
            const allowedProtocols = ['http:', 'https:', 'file:', 'about:']

            if (!allowedProtocols.includes(urlObj.protocol)) {
                logger.warn('Blocked unsafe protocol', { protocol: urlObj.protocol, url })
                return false
            }

            // about:blank는 항상 허용
            if (url === 'about:blank') {
                return true
            }

            // 파일 프로토콜의 경우 추가 검증
            if (urlObj.protocol === 'file:') {
                return this.isValidFileUrl(url)
            }

            return true
        } catch (error) {
            logger.warn('Invalid URL format', { url, error })
            return false
        }
    }

    // 파일 URL 검증
    private isValidFileUrl(url: string): boolean {
        try {
            const urlObj = new URL(url)

            // 기본적인 파일 경로 검증
            if (urlObj.pathname.includes('..')) {
                logger.warn('Blocked path traversal attempt', { url })
                return false
            }

            return true
        } catch (error) {
            return false
        }
    }

    // 뒤로 가기
    async goBack(webView: WebContentsView): Promise<boolean> {
        if (!this.canGoBack(webView)) {
            logger.warn('Cannot go back - no history available')
            return false
        }

        try {
            webView.webContents.goBack()
            logger.debug('Navigation: went back')
            return true
        } catch (error) {
            logger.error('Failed to go back', { error })
            return false
        }
    }

    // 앞으로 가기
    async goForward(webView: WebContentsView): Promise<boolean> {
        if (!this.canGoForward(webView)) {
            logger.warn('Cannot go forward - no forward history available')
            return false
        }

        try {
            webView.webContents.goForward()
            logger.debug('Navigation: went forward')
            return true
        } catch (error) {
            logger.error('Failed to go forward', { error })
            return false
        }
    }

    // 새로고침
    async reload(webView: WebContentsView, ignoreCache: boolean = false): Promise<void> {
        try {
            if (ignoreCache) {
                webView.webContents.reloadIgnoringCache()
                logger.debug('Navigation: hard reload (ignoring cache)')
            } else {
                webView.webContents.reload()
                logger.debug('Navigation: reload')
            }
        } catch (error) {
            logger.error('Failed to reload', { error })
            throw error
        }
    }

    // 로딩 중지
    stop(webView: WebContentsView): void {
        try {
            webView.webContents.stop()
            logger.debug('Navigation: stopped loading')
        } catch (error) {
            logger.error('Failed to stop loading', { error })
        }
    }

    // 네비게이션 상태 확인
    canGoBack(webView: WebContentsView): boolean {
        try {
            return webView.webContents.canGoBack()
        } catch (error) {
            logger.error('Failed to check canGoBack', { error })
            return false
        }
    }

    canGoForward(webView: WebContentsView): boolean {
        try {
            return webView.webContents.canGoForward()
        } catch (error) {
            logger.error('Failed to check canGoForward', { error })
            return false
        }
    }

    // 현재 네비게이션 상태 가져오기
    getNavigationState(webView: WebContentsView): NavigationState {
        try {
            return {
                canGoBack: this.canGoBack(webView),
                canGoForward: this.canGoForward(webView),
                isLoading: webView.webContents.isLoading(),
                url: webView.webContents.getURL(),
                title: webView.webContents.getTitle()
            }
        } catch (error) {
            logger.error('Failed to get navigation state', { error })
            return {
                canGoBack: false,
                canGoForward: false,
                isLoading: false,
                url: '',
                title: ''
            }
        }
    }

    // 특정 히스토리 인덱스로 이동
    async goToIndex(webView: WebContentsView, index: number): Promise<boolean> {
        try {
            webView.webContents.goToIndex(index)
            logger.debug('Navigation: went to index', { index })
            return true
        } catch (error) {
            logger.error('Failed to go to index', { index, error })
            return false
        }
    }

    // 히스토리 항목 개수
    getHistoryLength(webView: WebContentsView): number {
        try {
            // Electron의 WebContents에서 히스토리 길이를 직접 가져오는 방법이 없으므로
            // 내부 히스토리 배열의 길이를 사용
            const viewId = this.getViewId(webView)
            if (!viewId) return 0

            const history = this.navigationHistory.get(viewId) || []
            return history.length
        } catch (error) {
            logger.error('Failed to get history length', { error })
            return 0
        }
    }

    // 현재 히스토리 인덱스
    getCurrentIndex(webView: WebContentsView): number {
        try {
            // Electron의 WebContents에서 현재 인덱스를 직접 가져오는 방법이 없으므로
            // 간접적으로 계산
            const viewId = this.getViewId(webView)
            if (!viewId) return 0

            const history = this.navigationHistory.get(viewId) || []
            const currentUrl = webView.webContents.getURL()

            // 현재 URL의 마지막 인덱스를 찾음
            for (let i = history.length - 1; i >= 0; i--) {
                if (history[i] === currentUrl) {
                    return i
                }
            }

            return Math.max(0, history.length - 1)
        } catch (error) {
            logger.error('Failed to get current index', { error })
            return 0
        }
    }

    // 네비게이션 히스토리 업데이트
    private updateNavigationHistory(webView: WebContentsView, url: string): void {
        try {
            const viewId = this.getViewId(webView)
            if (!viewId) return

            let history = this.navigationHistory.get(viewId) || []

            // 중복 URL 제거 (연속된 같은 URL)
            if (history.length === 0 || history[history.length - 1] !== url) {
                history.push(url)

                // 히스토리 크기 제한 (최대 50개)
                if (history.length > 50) {
                    history = history.slice(-50)
                }

                this.navigationHistory.set(viewId, history)
            }

            this.currentUrls.set(viewId, url)
        } catch (error) {
            logger.error('Failed to update navigation history', { error })
        }
    }

    // WebView ID 가져오기 (간단한 해시 기반)
    private getViewId(webView: WebContentsView): string | null {
        try {
            // WebContents의 ID를 기반으로 고유 식별자 생성
            return `view-${webView.webContents.id}`
        } catch (error) {
            logger.error('Failed to get view ID', { error })
            return null
        }
    }

    // 히스토리 조회
    getNavigationHistory(webView: WebContentsView): string[] {
        const viewId = this.getViewId(webView)
        if (!viewId) return []

        return this.navigationHistory.get(viewId) || []
    }

    // 현재 URL 조회
    getCurrentUrl(webView: WebContentsView): string {
        const viewId = this.getViewId(webView)
        if (!viewId) return ''

        return this.currentUrls.get(viewId) || webView.webContents.getURL() || ''
    }

    // URL 히스토리 검색
    searchHistory(webView: WebContentsView, query: string): string[] {
        const history = this.getNavigationHistory(webView)
        return history.filter(url =>
            url.toLowerCase().includes(query.toLowerCase())
        )
    }

    // 특정 도메인 히스토리 필터링
    getHistoryByDomain(webView: WebContentsView, domain: string): string[] {
        const history = this.getNavigationHistory(webView)
        return history.filter(url => {
            try {
                const urlObj = new URL(url)
                return urlObj.hostname === domain
            } catch {
                return false
            }
        })
    }

    // 히스토리 통계
    getHistoryStats(webView: WebContentsView): {
        totalPages: number;
        uniqueDomains: number;
        currentPosition: number;
        domains: { [domain: string]: number };
    } {
        const history = this.getNavigationHistory(webView)
        const domains: { [domain: string]: number } = {}

        history.forEach(url => {
            try {
                const urlObj = new URL(url)
                const domain = urlObj.hostname
                domains[domain] = (domains[domain] || 0) + 1
            } catch {
                // URL 파싱 실패 시 무시
            }
        })

        return {
            totalPages: history.length,
            uniqueDomains: Object.keys(domains).length,
            currentPosition: this.getCurrentIndex(webView),
            domains
        }
    }

    // 히스토리 정리
    clearHistory(webView: WebContentsView): void {
        const viewId = this.getViewId(webView)
        if (viewId) {
            this.navigationHistory.delete(viewId)
            this.currentUrls.delete(viewId)
            logger.info('Navigation history cleared', { viewId })
        }
    }

    // 정리 함수
    cleanup(): void {
        this.navigationHistory.clear()
        this.currentUrls.clear()
        logger.info('WebContents navigation service cleaned up')
    }
}