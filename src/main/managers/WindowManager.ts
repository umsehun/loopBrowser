import { BaseWindow } from 'electron'
import { createLogger } from '../../shared/logger'

const logger = createLogger('WindowManager')

interface WindowConfig {
    width?: number
    height?: number
    minWidth?: number
    minHeight?: number
    show?: boolean
}

/**
 * 창 관리자 - EXA 연구 기반 베스트 프랙티스
 * SRP: 창 생성, 관리, 메모리 정리만 담당
 */
export class WindowManager {
    private windows = new Map<string, BaseWindow>()
    private windowIdCounter = 0

    createWindow(config: WindowConfig = {}): BaseWindow {
        const windowId = `win-${++this.windowIdCounter}`

        logger.info(`Creating window: ${windowId}`)

        const window = new BaseWindow({
            width: config.width || 1200,
            height: config.height || 800,
            minWidth: config.minWidth || 800,
            minHeight: config.minHeight || 600,
            show: config.show || false // 준비되면 보여주기
        })

        // 메모리 관리 - EXA 연구 핵심!
        window.on('closed', () => {
            this.windows.delete(windowId)
            logger.info(`Window cleaned up: ${windowId}`)
        })

        this.windows.set(windowId, window)
        logger.info(`Window created successfully: ${windowId}`)

        return window
    }

    getActiveWindow(): BaseWindow | null {
        // 첫 번째 창 반환 (단순화)
        const windows = Array.from(this.windows.values())
        return windows[0] || null
    }

    getWindowCount(): number {
        return this.windows.size
    }

    closeAllWindows(): void {
        logger.info('Closing all windows...')
        for (const window of this.windows.values()) {
            if (!window.isDestroyed()) {
                window.close()
            }
        }
    }
}