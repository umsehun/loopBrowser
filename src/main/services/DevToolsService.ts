import { BrowserWindow, globalShortcut } from 'electron'
import { logger } from '../../shared/logger/index'

export class DevToolsService {
    private mainWindow: BrowserWindow | null = null
    private static instance: DevToolsService

    constructor() {
        logger.info('DevToolsService initialized')
    }

    static getInstance(): DevToolsService {
        if (!DevToolsService.instance) {
            DevToolsService.instance = new DevToolsService()
        }
        return DevToolsService.instance
    }

    // 메인 윈도우 설정
    setMainWindow(window: BrowserWindow): void {
        this.mainWindow = window
        this.registerShortcuts()
    }

    // 단축키 등록
    private registerShortcuts(): void {
        try {
            // F12 - Chrome DevTools 열기
            globalShortcut.register('F12', () => {
                this.openChromeDevTools()
            })

            // Cmd+Option+I (Mac) / Ctrl+Shift+I (Win/Linux) - Chrome DevTools
            globalShortcut.register('CommandOrControl+Alt+I', () => {
                this.openChromeDevTools()
            })

            logger.info('DevTools shortcuts registered')
        } catch (error) {
            logger.error('Failed to register shortcuts', { error })
        }
    }

    // Chrome DevTools 열기 (기존 방식)
    openChromeDevTools(mode?: 'right' | 'bottom' | 'undocked' | 'detach'): void {
        if (!this.mainWindow) {
            logger.warn('No main window available for DevTools')
            return
        }

        try {
            const webContents = this.mainWindow.webContents

            if (webContents.isDevToolsOpened()) {
                webContents.closeDevTools()
                logger.info('DevTools closed')
            } else {
                webContents.openDevTools({ mode: mode || 'detach' })
                logger.info('DevTools opened', { mode: mode || 'detach' })
            }
        } catch (error) {
            logger.error('Failed to toggle Chrome DevTools', { error })
        }
    }

    // 단축키 해제
    unregisterShortcuts(): void {
        try {
            globalShortcut.unregisterAll()
            logger.info('DevTools shortcuts unregistered')
        } catch (error) {
            logger.error('Failed to unregister shortcuts', { error })
        }
    }

    // DevTools 상태 확인
    isDevToolsOpen(): boolean {
        return this.mainWindow?.webContents.isDevToolsOpened() || false
    }
}

// 싱글톤 인스턴스 내보내기
export const devToolsService = DevToolsService.getInstance()
export default devToolsService