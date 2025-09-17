import { BaseWindow, WebContentsView } from 'electron'
import { createLogger } from '../../shared/logger'

const logger = createLogger('ResizeHandler')

/**
 * 리사이징 핸들러 - EXA 연구 기반 동적 크기 조정
 * SRP: 창 크기 변경 이벤트 처리만 담당
 */
export class ResizeHandler {
    private resizeListeners = new Map<BaseWindow, () => void>()

    setupAutoResize(window: BaseWindow, webView: WebContentsView, headerHeight = 0): void {
        logger.info('Setting up auto-resize for WebContentsView')

        const resizeCallback = () => {
            if (window.isDestroyed() || webView.webContents.isDestroyed()) {
                return
            }

            const [width, height] = window.getSize()

            // 하드코딩 금지! 동적으로 계산
            const bounds = {
                x: 0,
                y: headerHeight,
                width: width,
                height: height - headerHeight
            }

            webView.setBounds(bounds)
            logger.info(`Resized WebView to: ${width}x${height - headerHeight}`)
        }

        // 초기 크기 설정
        resizeCallback()

        // 리사이즈 이벤트 등록
        window.on('resize', resizeCallback)

        // 정리를 위해 저장
        this.resizeListeners.set(window, resizeCallback)

        // 창이 닫힐 때 정리
        window.on('closed', () => {
            this.cleanup(window)
        })
    }

    private cleanup(window: BaseWindow): void {
        this.resizeListeners.delete(window)
        logger.info('Resize handler cleaned up')
    }

    // 수동 리사이즈 (필요시)
    manualResize(window: BaseWindow, webView: WebContentsView, headerHeight = 0): void {
        const callback = this.resizeListeners.get(window)
        if (callback) {
            callback()
        }
    }
}