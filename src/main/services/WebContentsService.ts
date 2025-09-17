import { WebContentsView, BaseWindow } from 'electron'
import { createLogger } from '../../shared/logger'

const logger = createLogger('WebContentsService')

interface WebViewBounds {
    x: number
    y: number
    width: number
    height: number
}

/**
 * WebContents 서비스 - Electron 공식 문서 기반 안전한 구현
 * SRP: WebContentsView 생성, 로딩, 메모리 관리만 담당
 */
export class WebContentsService {
    private webViews = new Map<string, WebContentsView>()
    private viewIdCounter = 0

    createWebView(parentWindow: BaseWindow, bounds: WebViewBounds): WebContentsView {
        const viewId = `view-${++this.viewIdCounter}`

        logger.info(`Creating WebContentsView: ${viewId}`)

        // EXA 연구: 안전한 WebContentsView 설정
        const webView = new WebContentsView({
            webPreferences: {
                contextIsolation: true,     // 보안 필수!
                nodeIntegration: false,     // 보안 필수!
                webSecurity: true,          // 기본값 유지
                sandbox: false              // preload 스크립트 허용
            }
        })

        // 부모 창에 추가
        parentWindow.contentView.addChildView(webView)
        webView.setBounds(bounds)

        // 메모리 누수 방지 - EXA 연구 핵심!
        parentWindow.on('closed', () => {
            if (webView.webContents && !webView.webContents.isDestroyed()) {
                webView.webContents.close()
            }
            this.webViews.delete(viewId)
            logger.info(`WebView cleaned up: ${viewId}`)
        })

        // 오류 처리 - render-process-gone 사용 (Electron 공식 권장)
        webView.webContents.on('render-process-gone', (event, details) => {
            logger.error(`Render process gone: ${details.reason}`)
            // 구현 예정: 복구 로직
        })

        // 로딩 이벤트
        webView.webContents.on('did-start-loading', () => {
            logger.info(`Loading started: ${viewId}`)
        })

        webView.webContents.on('did-finish-load', () => {
            logger.info(`Loading finished: ${viewId}`)
        })

        webView.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            logger.error(`Load failed: ${errorDescription} (${errorCode})`)
        })

        this.webViews.set(viewId, webView)
        return webView
    }

    async loadUrl(webView: WebContentsView, url: string): Promise<void> {
        try {
            logger.info(`Loading URL: ${url}`)
            await webView.webContents.loadURL(url)
        } catch (error) {
            logger.error(`Failed to load URL: ${error}`)
            throw error
        }
    }

    // 동적 리사이징 - EXA 연구 베스트 프랙티스
    resizeWebView(webView: WebContentsView, bounds: WebViewBounds): void {
        webView.setBounds(bounds)
    }

    // 네비게이션 헬퍼들
    canGoBack(webView: WebContentsView): boolean {
        return webView.webContents.canGoBack()
    }

    canGoForward(webView: WebContentsView): boolean {
        return webView.webContents.canGoForward()
    }

    async goBack(webView: WebContentsView): Promise<void> {
        if (this.canGoBack(webView)) {
            webView.webContents.goBack()
        }
    }

    async goForward(webView: WebContentsView): Promise<void> {
        if (this.canGoForward(webView)) {
            webView.webContents.goForward()
        }
    }

    async reload(webView: WebContentsView): Promise<void> {
        webView.webContents.reload()
    }
}