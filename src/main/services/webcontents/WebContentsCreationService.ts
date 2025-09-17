import { WebContentsView, BaseWindow } from 'electron'
import { createLogger } from '../../../shared/logger'
import { IOptimizationService } from '../../../shared/types'

const logger = createLogger('WebContentsCreationService')

export interface WebViewBounds {
    x: number
    y: number
    width: number
    height: number
}

export interface WebViewConfig {
    contextIsolation?: boolean
    nodeIntegration?: boolean
    webSecurity?: boolean
    sandbox?: boolean
    preload?: string
}

/**
 * 🏗️ WebContents 생성 서비스 (SRP: WebContentsView 생성 및 기본 설정만 담당)
 * - WebContentsView 생성
 * - 보안 설정 구성
 * - 기본 WebPreferences 설정
 * - 부모 창 연결 관리
 */
export class WebContentsCreationService implements IOptimizationService {
    private isInitialized = false
    private webViews = new Map<string, WebContentsView>()
    private viewIdCounter = 0

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('WebContents creation service already initialized')
            return
        }

        logger.info('🏗️ Initializing WebContents creation service...')

        this.isInitialized = true
        logger.info('✅ WebContents creation service initialized successfully')
    }

    // WebContentsView 생성
    createWebView(parentWindow: BaseWindow, bounds: WebViewBounds, config?: WebViewConfig): {
        webView: WebContentsView;
        viewId: string;
    } {
        if (!this.isInitialized) {
            throw new Error('WebContents creation service not initialized')
        }

        const viewId = `view-${++this.viewIdCounter}`

        logger.info('Creating WebContentsView', { viewId, bounds })

        // 보안 설정 - Electron 공식 권장사항
        const webPreferences = {
            contextIsolation: config?.contextIsolation ?? true,     // 보안 필수!
            nodeIntegration: config?.nodeIntegration ?? false,      // 보안 필수!
            webSecurity: config?.webSecurity ?? true,              // 보안 유지
            sandbox: config?.sandbox ?? false,                     // preload 스크립트 허용
            ...((config?.preload) && { preload: config.preload })  // preload 스크립트 경로
        }

        const webView = new WebContentsView({
            webPreferences
        })

        // 부모 창에 추가 및 크기 설정
        this.attachToParent(parentWindow, webView, bounds, viewId)

        // WebView 레지스트리에 등록
        this.webViews.set(viewId, webView)

        logger.info('WebContentsView created successfully', {
            viewId,
            security: {
                contextIsolation: webPreferences.contextIsolation,
                nodeIntegration: webPreferences.nodeIntegration,
                webSecurity: webPreferences.webSecurity,
                sandbox: webPreferences.sandbox
            }
        })

        return { webView, viewId }
    }

    // 부모 창에 WebView 연결
    private attachToParent(parentWindow: BaseWindow, webView: WebContentsView, bounds: WebViewBounds, viewId: string): void {
        // 부모 창에 추가
        parentWindow.contentView.addChildView(webView)
        webView.setBounds(bounds)

        // 메모리 누수 방지 - 부모 창 종료 시 정리
        parentWindow.on('closed', () => {
            this.cleanupWebView(viewId)
        })

        logger.debug('WebView attached to parent window', { viewId })
    }

    // WebView 동적 리사이징
    resizeWebView(viewId: string, bounds: WebViewBounds): void {
        const webView = this.webViews.get(viewId)
        if (!webView) {
            logger.warn('WebView not found for resizing', { viewId })
            return
        }

        webView.setBounds(bounds)
        logger.debug('WebView resized', { viewId, bounds })
    }

    // 특정 WebView에 대한 리사이징 (WebView 객체로)
    resizeWebViewDirect(webView: WebContentsView, bounds: WebViewBounds): void {
        webView.setBounds(bounds)
        logger.debug('WebView resized directly', { bounds })
    }

    // WebView 제거
    removeWebView(viewId: string): boolean {
        const webView = this.webViews.get(viewId)
        if (!webView) {
            logger.warn('WebView not found for removal', { viewId })
            return false
        }

        this.cleanupWebView(viewId)
        return true
    }

    // WebView 정리
    private cleanupWebView(viewId: string): void {
        const webView = this.webViews.get(viewId)
        if (!webView) {
            return
        }

        try {
            // WebContents 정리
            if (webView.webContents && !webView.webContents.isDestroyed()) {
                webView.webContents.close()
            }

            // 레지스트리에서 제거
            this.webViews.delete(viewId)

            logger.info('WebView cleaned up successfully', { viewId })
        } catch (error) {
            logger.error('Failed to cleanup WebView', { viewId, error })
        }
    }

    // WebView 조회
    getWebView(viewId: string): WebContentsView | undefined {
        return this.webViews.get(viewId)
    }

    // 모든 WebView 목록
    getAllWebViews(): Map<string, WebContentsView> {
        return new Map(this.webViews)
    }

    // WebView 개수
    getWebViewCount(): number {
        return this.webViews.size
    }

    // WebView 존재 확인
    hasWebView(viewId: string): boolean {
        return this.webViews.has(viewId)
    }

    // WebView 보안 설정 검증
    validateWebViewSecurity(webView: WebContentsView): {
        isSecure: boolean;
        issues: string[];
        recommendations: string[];
    } {
        const issues: string[] = []
        const recommendations: string[] = []

        // WebContents에서 직접 WebPreferences를 가져올 수 없으므로
        // 기본적인 보안 검사만 수행
        try {
            if (webView.webContents.isDestroyed()) {
                issues.push('WebContents가 이미 파괴되었습니다')
                recommendations.push('새로운 WebView를 생성하세요')
            }

            // 추가적인 보안 검사는 runtime에서 확인 가능한 것들만
            const url = webView.webContents.getURL()
            if (url && !url.startsWith('https://') && !url.startsWith('file://') && url !== 'about:blank') {
                issues.push('안전하지 않은 프로토콜을 사용하고 있습니다')
                recommendations.push('HTTPS 프로토콜을 사용하세요')
            }

        } catch (error) {
            issues.push('WebView 보안 검증 중 오류가 발생했습니다')
            recommendations.push('WebView 상태를 확인하세요')
        }

        const isSecure = issues.length === 0

        logger.debug('WebView security validation completed', {
            isSecure,
            issues: issues.length,
            recommendations: recommendations.length
        })

        return { isSecure, issues, recommendations }
    }

    // WebView 디버그 정보
    getWebViewDebugInfo(viewId: string): {
        viewId: string;
        exists: boolean;
        isDestroyed?: boolean;
        url?: string;
        userAgent?: string;
        bounds?: any;
    } {
        const webView = this.webViews.get(viewId)

        if (!webView) {
            return { viewId, exists: false }
        }

        try {
            const isDestroyed = webView.webContents.isDestroyed()

            return {
                viewId,
                exists: true,
                isDestroyed,
                url: isDestroyed ? undefined : webView.webContents.getURL(),
                userAgent: isDestroyed ? undefined : webView.webContents.getUserAgent(),
                bounds: webView.getBounds()
            }
        } catch (error) {
            logger.error('Failed to get WebView debug info', { viewId, error })
            return { viewId, exists: true, isDestroyed: true }
        }
    }

    // 모든 WebView 정리
    cleanup(): void {
        logger.info('Cleaning up all WebViews', { count: this.webViews.size })

        for (const [viewId] of this.webViews) {
            this.cleanupWebView(viewId)
        }

        this.webViews.clear()
        this.viewIdCounter = 0

        logger.info('WebContents creation service cleaned up')
    }
}