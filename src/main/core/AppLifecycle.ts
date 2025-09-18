import { app, BrowserWindow } from 'electron'
import { logger } from '../../shared/logger/index'
import { WindowManager } from '../managers/WindowManager'
import { IpcHandlers } from '../handlers/IpcHandlers'

export class AppLifecycle {
    private static instance: AppLifecycle
    private windowManager: WindowManager
    private ipcHandlers: IpcHandlers
    private isInitialized = false

    constructor() {
        this.windowManager = WindowManager.getInstance()
        this.ipcHandlers = IpcHandlers.getInstance()
        logger.info('AppLifecycle initialized')
    }

    static getInstance(): AppLifecycle {
        if (!AppLifecycle.instance) {
            AppLifecycle.instance = new AppLifecycle()
        }
        return AppLifecycle.instance
    }

    // 앱 준비 이벤트 핸들러
    async onReady(): Promise<void> {
        try {
            logger.info('App ready event triggered')

            if (!this.isInitialized) {
                await this.initializeApp()
            }

            // 메인 창 생성
            await this.windowManager.createMainWindow()

        } catch (error) {
            logger.error('Failed to handle app ready event', { error })
            app.quit()
        }
    }

    // 모든 창 닫힘 이벤트 핸들러
    onWindowAllClosed(): void {
        logger.info('All windows closed')

        // macOS에서는 Cmd+Q로 완전히 종료할 때까지 앱 유지
        if (process.platform !== 'darwin') {
            logger.info('Quitting app on non-macOS platform')
            app.quit()
        }
    }

    // 앱 활성화 이벤트 핸들러 (macOS dock 클릭)
    onActivate(): void {
        logger.info('App activated')

        // macOS에서 창이 없으면 새 창 생성
        if (BrowserWindow.getAllWindows().length === 0) {
            this.windowManager.createMainWindow()
        }
    }

    // 앱 시작 전 초기화
    onBeforeQuit(): void {
        logger.info('App is about to quit - cleaning up resources')

        // 리소스 정리
        this.windowManager.cleanup()
        this.ipcHandlers.cleanup()
    }

    // 앱 초기화
    private async initializeApp(): Promise<void> {
        try {
            logger.info('Initializing application components...')

            // IPC 핸들러 설정
            this.ipcHandlers.setupHandlers()

            // 추가 초기화 로직 (필요시)
            // await this.initializeAdditionalServices()

            this.isInitialized = true
            logger.info('Application initialization complete')

        } catch (error) {
            logger.error('Failed to initialize app', { error })
            throw error
        }
    }

    // 이벤트 핸들러 등록
    setupEventHandlers(): void {
        logger.info('Setting up app event handlers')

        app.on('ready', () => this.onReady())
        app.on('window-all-closed', () => this.onWindowAllClosed())
        app.on('activate', () => this.onActivate())
        app.on('before-quit', () => this.onBeforeQuit())

        // 추가 이벤트 핸들러 (필요시)
        // app.on('browser-window-created', ...)
        // app.on('web-contents-created', ...)
    }
}