import { BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'

export interface WindowConfig {
    width?: number
    height?: number
    minWidth?: number
    minHeight?: number
    show?: boolean
    autoHideMenuBar?: boolean
    titleBarStyle?: 'default' | 'hidden' | 'hiddenInset' | 'customButtonsOnHover'
}

// GIGA-CHAD: 윈도우 관리 핵심 모듈
export class WindowManager {
    private static windows: Map<number, BrowserWindow> = new Map()
    private static logger = require('../../shared/logger').createModuleLogger('WindowManager')

    /**
     * 최적화된 메인 윈도우 생성
     */
    static createMainWindow(config: WindowConfig = {}): BrowserWindow {
        const defaultConfig: WindowConfig = {
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            show: false, // ready-to-show까지 숨김
            autoHideMenuBar: false, // GIGA-CHAD: AppBar 표시
            titleBarStyle: 'default' // GIGA-CHAD: 기본 타이틀바 표시
        }

        const finalConfig = { ...defaultConfig, ...config }

        const mainWindow = new BrowserWindow({
            width: finalConfig.width,
            height: finalConfig.height,
            minWidth: finalConfig.minWidth,
            minHeight: finalConfig.minHeight,
            show: finalConfig.show,
            autoHideMenuBar: finalConfig.autoHideMenuBar,
            titleBarStyle: finalConfig.titleBarStyle,
            webPreferences: {
                preload: join(__dirname, '../preload/preload.js'),
                sandbox: false,
                contextIsolation: true,
                nodeIntegration: false,
                backgroundThrottling: true, // 백그라운드 스로틀링 활성화
                webSecurity: true,
                partition: 'persist:main' // 메인 윈도우 전용 세션
            }
        })

        // 윈도우 ID로 추적
        this.windows.set(mainWindow.id, mainWindow)

        // GIGA-CHAD: 이벤트 리스너 설정
        this.setupWindowEvents(mainWindow)

        // 콘텐츠 로딩
        this.loadContent(mainWindow)

        this.logger.info(`🖼️ GIGA-CHAD: Main window created (ID: ${mainWindow.id})`)

        return mainWindow
    }

    /**
     * 윈도우 이벤트 설정
     */
    private static setupWindowEvents(window: BrowserWindow): void {
        // GIGA-CHAD: 시각적 깜빡임 방지
        window.on('ready-to-show', () => {
            window.show()

            if (is.dev) {
                window.webContents.openDevTools()
            }

            this.logger.info(`✨ GIGA-CHAD: Window ${window.id} ready to show`)
        })

        // GIGA-CHAD: 외부 링크는 기본 브라우저에서 열기
        window.webContents.setWindowOpenHandler((details) => {
            shell.openExternal(details.url)
            return { action: 'deny' }
        })

        // 윈도우 닫힐 때 추적에서 제거
        window.on('closed', () => {
            this.windows.delete(window.id)
            this.logger.info(`🗑️ GIGA-CHAD: Window ${window.id} removed from tracking`)
        })
    }

    /**
     * 콘텐츠 로딩 (HMR 지원)
     */
    private static loadContent(window: BrowserWindow): void {
        // HMR for renderer base on electron-vite cli.
        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            window.loadURL(process.env['ELECTRON_RENDERER_URL'])
        } else {
            window.loadFile(join(__dirname, '../renderer/index.html'))
        }
    }

    /**
     * 모든 윈도우 가져오기
     */
    static getAllWindows(): BrowserWindow[] {
        return Array.from(this.windows.values())
    }

    /**
     * 특정 윈도우 가져오기
     */
    static getWindow(id: number): BrowserWindow | undefined {
        return this.windows.get(id)
    }

    /**
     * 윈도우 개수 가져오기
     */
    static getWindowCount(): number {
        return this.windows.size
    }

    /**
     * 모든 윈도우 닫기
     */
    static closeAllWindows(): void {
        this.windows.forEach(window => {
            if (!window.isDestroyed()) {
                window.close()
            }
        })
        this.windows.clear()
        this.logger.info('🚪 GIGA-CHAD: All windows closed')
    }
}