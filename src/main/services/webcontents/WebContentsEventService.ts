import { WebContentsView } from 'electron'
import { createLogger } from '../../../shared/logger'
import { IOptimizationService } from '../../../shared/types'

const logger = createLogger('WebContentsEventService')

export interface EventListener {
    event: string
    callback: Function
    once?: boolean
}

export interface LoadingState {
    isLoading: boolean
    progress: number
    url: string
    canGoBack: boolean
    canGoForward: boolean
}

export interface PageInfo {
    title: string
    url: string
    favicon?: string
    description?: string
    keywords?: string[]
}

/**
 * 🎭 WebContents 이벤트 서비스 (SRP: 이벤트 리스너 관리만 담당)
 * - 로딩 이벤트 처리
 * - 페이지 정보 추출
 * - 에러 처리 및 복구
 * - 커스텀 이벤트 관리
 * - 성능 모니터링 이벤트
 */
export class WebContentsEventService implements IOptimizationService {
    private isInitialized = false
    private eventListeners = new Map<string, EventListener[]>()
    private loadingStates = new Map<string, LoadingState>()
    private pageInfoCache = new Map<string, PageInfo>()

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('WebContents event service already initialized')
            return
        }

        logger.info('🎭 Initializing WebContents event service...')

        this.isInitialized = true
        logger.info('✅ WebContents event service initialized successfully')
    }

    // WebView에 이벤트 리스너 설정
    setupEventListeners(webView: WebContentsView): void {
        if (!this.isInitialized) {
            throw new Error('WebContents event service not initialized')
        }

        const viewId = this.getViewId(webView)
        logger.info('Setting up event listeners', { viewId })

        try {
            // 로딩 이벤트
            this.setupLoadingEvents(webView, viewId)

            // 네비게이션 이벤트
            this.setupNavigationEvents(webView, viewId)

            // 에러 처리 이벤트
            this.setupErrorEvents(webView, viewId)

            // 페이지 정보 이벤트
            this.setupPageInfoEvents(webView, viewId)

            // 성능 모니터링 이벤트
            this.setupPerformanceEvents(webView, viewId)

            // 리소스 이벤트
            this.setupResourceEvents(webView, viewId)

            logger.info('Event listeners setup completed', { viewId })
        } catch (error) {
            logger.error('Failed to setup event listeners', { viewId, error })
            throw error
        }
    }

    // 로딩 이벤트 설정
    private setupLoadingEvents(webView: WebContentsView, viewId: string): void {
        // 로딩 시작
        webView.webContents.on('did-start-loading', () => {
            const state: LoadingState = {
                isLoading: true,
                progress: 0,
                url: webView.webContents.getURL(),
                canGoBack: webView.webContents.canGoBack(),
                canGoForward: webView.webContents.canGoForward()
            }

            this.loadingStates.set(viewId, state)
            logger.debug('Loading started', { viewId, url: state.url })

            this.emitCustomEvent(viewId, 'loading-started', state)
        })

        // 로딩 진행률
        webView.webContents.on('did-start-loading', () => {
            // Electron doesn't provide built-in progress events
            // 로딩 진행률 시뮬레이션
            this.simulateLoadingProgress(viewId)
        })

        // 로딩 완료
        webView.webContents.on('did-finish-load', () => {
            const state: LoadingState = {
                isLoading: false,
                progress: 100,
                url: webView.webContents.getURL(),
                canGoBack: webView.webContents.canGoBack(),
                canGoForward: webView.webContents.canGoForward()
            }

            this.loadingStates.set(viewId, state)
            logger.debug('Loading finished', { viewId, url: state.url })

            this.emitCustomEvent(viewId, 'loading-finished', state)

            // 페이지 정보 추출
            this.extractPageInfo(webView, viewId)
        })

        // 로딩 중지
        webView.webContents.on('did-stop-loading', () => {
            const currentState = this.loadingStates.get(viewId)
            if (currentState) {
                currentState.isLoading = false
                this.loadingStates.set(viewId, currentState)
            }

            logger.debug('Loading stopped', { viewId })
            this.emitCustomEvent(viewId, 'loading-stopped', currentState)
        })
    }

    // 네비게이션 이벤트 설정
    private setupNavigationEvents(webView: WebContentsView, viewId: string): void {
        // 네비게이션 시작
        webView.webContents.on('did-start-navigation', (event, url, isInPlace, isMainFrame) => {
            logger.debug('Navigation started', { viewId, url, isInPlace, isMainFrame })

            this.emitCustomEvent(viewId, 'navigation-started', {
                url,
                isInPlace,
                isMainFrame,
                timestamp: Date.now()
            })
        })

        // 네비게이션 완료
        webView.webContents.on('did-navigate', (event, url) => {
            logger.debug('Navigation completed', { viewId, url })

            this.emitCustomEvent(viewId, 'navigation-completed', {
                url,
                timestamp: Date.now()
            })
        })

        // 네비게이션 실패
        webView.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            logger.warn('Navigation failed', {
                viewId,
                errorCode,
                errorDescription,
                url: validatedURL
            })

            this.emitCustomEvent(viewId, 'navigation-failed', {
                errorCode,
                errorDescription,
                url: validatedURL,
                timestamp: Date.now()
            })
        })
    }

    // 에러 처리 이벤트 설정
    private setupErrorEvents(webView: WebContentsView, viewId: string): void {
        // 렌더 프로세스 충돌
        webView.webContents.on('render-process-gone', (event, details) => {
            logger.error('Render process gone', { viewId, details })

            this.emitCustomEvent(viewId, 'render-process-gone', {
                reason: details.reason,
                exitCode: details.exitCode,
                timestamp: Date.now()
            })

            // 자동 복구 시도
            this.attemptRecovery(webView, viewId)
        })

        // 응답하지 않는 페이지
        webView.webContents.on('unresponsive', () => {
            logger.warn('Page became unresponsive', { viewId })

            this.emitCustomEvent(viewId, 'page-unresponsive', {
                url: webView.webContents.getURL(),
                timestamp: Date.now()
            })
        })

        // 페이지 응답 재개
        webView.webContents.on('responsive', () => {
            logger.info('Page became responsive again', { viewId })

            this.emitCustomEvent(viewId, 'page-responsive', {
                url: webView.webContents.getURL(),
                timestamp: Date.now()
            })
        })
    }

    // 페이지 정보 이벤트 설정
    private setupPageInfoEvents(webView: WebContentsView, viewId: string): void {
        // 제목 변경
        webView.webContents.on('page-title-updated', (event, title) => {
            logger.debug('Page title updated', { viewId, title })

            // 페이지 정보 캐시 업데이트
            const cachedInfo = this.pageInfoCache.get(viewId) || {} as PageInfo
            cachedInfo.title = title
            cachedInfo.url = webView.webContents.getURL()
            this.pageInfoCache.set(viewId, cachedInfo)

            this.emitCustomEvent(viewId, 'title-updated', { title })
        })

        // 파비콘 변경
        webView.webContents.on('page-favicon-updated', (event, favicons) => {
            logger.debug('Favicon updated', { viewId, favicons })

            const cachedInfo = this.pageInfoCache.get(viewId) || {} as PageInfo
            cachedInfo.favicon = favicons[0] // 첫 번째 파비콘 사용
            this.pageInfoCache.set(viewId, cachedInfo)

            this.emitCustomEvent(viewId, 'favicon-updated', { favicons })
        })
    }

    // 성능 모니터링 이벤트 설정
    private setupPerformanceEvents(webView: WebContentsView, viewId: string): void {
        // DOM 로딩 완료
        webView.webContents.on('dom-ready', () => {
            logger.debug('DOM ready', { viewId })

            this.emitCustomEvent(viewId, 'dom-ready', {
                url: webView.webContents.getURL(),
                timestamp: Date.now()
            })
        })

        // 메모리 사용량 모니터링 (주기적)
        const memoryInterval = setInterval(async () => {
            try {
                if (webView.webContents.isDestroyed()) {
                    clearInterval(memoryInterval)
                    return
                }

                // process.getProcessMemoryInfo() 사용 (Electron main process에서)
                const processMemory = process.getProcessMemoryInfo ?
                    await process.getProcessMemoryInfo() :
                    { private: 0, shared: 0, rss: 0 }

                this.emitCustomEvent(viewId, 'memory-usage', {
                    memory: processMemory,
                    timestamp: Date.now()
                })

                // 메모리 사용량이 높은 경우 경고
                if (processMemory.private > 512 * 1024) { // 512MB 이상
                    logger.warn('High memory usage detected', {
                        viewId,
                        memoryMB: Math.round(processMemory.private / 1024)
                    })

                    this.emitCustomEvent(viewId, 'high-memory-warning', {
                        memoryMB: Math.round(processMemory.private / 1024),
                        timestamp: Date.now()
                    })
                }
            } catch (error) {
                // WebContents가 파괴된 경우 등
                clearInterval(memoryInterval)
            }
        }, 10000) // 10초마다 체크

        // WebContents 파괴 시 인터벌 정리
        webView.webContents.once('destroyed', () => {
            clearInterval(memoryInterval)
        })
    }

    // 리소스 이벤트 설정
    private setupResourceEvents(webView: WebContentsView, viewId: string): void {
        // 새 리소스 로딩
        webView.webContents.session.webRequest.onBeforeRequest((details, callback) => {
            logger.debug('Resource loading', {
                viewId,
                url: details.url,
                resourceType: details.resourceType
            })

            this.emitCustomEvent(viewId, 'resource-loading', {
                url: details.url,
                resourceType: details.resourceType,
                timestamp: Date.now()
            })

            callback({})
        })

        // 리소스 로딩 완료
        webView.webContents.session.webRequest.onCompleted((details) => {
            logger.debug('Resource loaded', {
                viewId,
                url: details.url,
                statusCode: details.statusCode
            })

            this.emitCustomEvent(viewId, 'resource-loaded', {
                url: details.url,
                statusCode: details.statusCode,
                resourceType: details.resourceType,
                timestamp: Date.now()
            })
        })

        // 리소스 로딩 실패
        webView.webContents.session.webRequest.onErrorOccurred((details) => {
            logger.warn('Resource loading failed', {
                viewId,
                url: details.url,
                error: details.error
            })

            this.emitCustomEvent(viewId, 'resource-failed', {
                url: details.url,
                error: details.error,
                resourceType: details.resourceType,
                timestamp: Date.now()
            })
        })
    }

    // 로딩 진행률 시뮬레이션
    private simulateLoadingProgress(viewId: string): void {
        let progress = 0
        const interval = setInterval(() => {
            progress += Math.random() * 20

            const currentState = this.loadingStates.get(viewId)
            if (currentState && currentState.isLoading && progress < 90) {
                currentState.progress = Math.min(progress, 90)
                this.loadingStates.set(viewId, currentState)

                this.emitCustomEvent(viewId, 'loading-progress', {
                    progress: currentState.progress
                })
            } else {
                clearInterval(interval)
            }
        }, 100)

        // 5초 후 강제 종료
        setTimeout(() => clearInterval(interval), 5000)
    }

    // 페이지 정보 추출
    private async extractPageInfo(webView: WebContentsView, viewId: string): Promise<void> {
        try {
            const pageInfo: PageInfo = {
                title: webView.webContents.getTitle(),
                url: webView.webContents.getURL()
            }

            // 메타데이터 추출 (JavaScript 실행)
            const metadata = await webView.webContents.executeJavaScript(`
                (() => {
                    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
                    const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content')?.split(',').map(k => k.trim()) || [];
                    
                    return { description, keywords };
                })()
            `)

            pageInfo.description = metadata.description
            pageInfo.keywords = metadata.keywords

            this.pageInfoCache.set(viewId, pageInfo)

            this.emitCustomEvent(viewId, 'page-info-extracted', pageInfo)

            logger.debug('Page info extracted', { viewId, pageInfo })
        } catch (error) {
            logger.error('Failed to extract page info', { viewId, error })
        }
    }

    // 복구 시도
    private attemptRecovery(webView: WebContentsView, viewId: string): void {
        logger.info('Attempting recovery', { viewId })

        try {
            // 현재 URL 저장
            const currentUrl = webView.webContents.getURL()

            // 3초 후 페이지 다시 로딩
            setTimeout(() => {
                if (!webView.webContents.isDestroyed() && currentUrl) {
                    webView.webContents.loadURL(currentUrl)
                    logger.info('Recovery attempted - page reloaded', { viewId, url: currentUrl })

                    this.emitCustomEvent(viewId, 'recovery-attempted', {
                        url: currentUrl,
                        timestamp: Date.now()
                    })
                }
            }, 3000)
        } catch (error) {
            logger.error('Recovery attempt failed', { viewId, error })
        }
    }

    // 커스텀 이벤트 발생
    private emitCustomEvent(viewId: string, eventName: string, data?: any): void {
        const listeners = this.eventListeners.get(viewId) || []

        for (const listener of listeners) {
            if (listener.event === eventName) {
                try {
                    listener.callback(data)

                    // once 리스너인 경우 제거
                    if (listener.once) {
                        this.removeEventListener(viewId, eventName, listener.callback)
                    }
                } catch (error) {
                    logger.error('Event listener error', { viewId, eventName, error })
                }
            }
        }

        logger.debug('Custom event emitted', { viewId, eventName, listenerCount: listeners.length })
    }

    // WebView ID 가져오기
    private getViewId(webView: WebContentsView): string {
        return `view-${webView.webContents.id}`
    }

    // 이벤트 리스너 추가
    addEventListener(viewId: string, eventName: string, callback: Function, once: boolean = false): void {
        if (!this.eventListeners.has(viewId)) {
            this.eventListeners.set(viewId, [])
        }

        const listeners = this.eventListeners.get(viewId)!
        listeners.push({ event: eventName, callback, once })

        logger.debug('Event listener added', { viewId, eventName, once })
    }

    // 이벤트 리스너 제거
    removeEventListener(viewId: string, eventName: string, callback: Function): void {
        const listeners = this.eventListeners.get(viewId)
        if (!listeners) return

        const index = listeners.findIndex(l => l.event === eventName && l.callback === callback)
        if (index !== -1) {
            listeners.splice(index, 1)
            logger.debug('Event listener removed', { viewId, eventName })
        }
    }

    // 모든 이벤트 리스너 제거
    removeAllEventListeners(viewId: string): void {
        this.eventListeners.delete(viewId)
        logger.debug('All event listeners removed', { viewId })
    }

    // 로딩 상태 조회
    getLoadingState(viewId: string): LoadingState | undefined {
        return this.loadingStates.get(viewId)
    }

    // 페이지 정보 조회
    getPageInfo(viewId: string): PageInfo | undefined {
        return this.pageInfoCache.get(viewId)
    }

    // 이벤트 통계
    getEventStats(viewId: string): {
        totalListeners: number;
        eventTypes: { [eventName: string]: number };
    } {
        const listeners = this.eventListeners.get(viewId) || []
        const eventTypes: { [eventName: string]: number } = {}

        listeners.forEach(listener => {
            eventTypes[listener.event] = (eventTypes[listener.event] || 0) + 1
        })

        return {
            totalListeners: listeners.length,
            eventTypes
        }
    }

    // 정리 함수
    cleanup(): void {
        this.eventListeners.clear()
        this.loadingStates.clear()
        this.pageInfoCache.clear()
        logger.info('WebContents event service cleaned up')
    }
}