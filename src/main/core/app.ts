import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { EngineService } from '../services/EngineService'
import { SearchService } from '../services/SearchService'
import { ShortcutService } from '../services/ShortcutService'
import { WindowManager } from './window'
import { SecurityManager } from './security'
import { TabManager } from '../managers/tabManager'
import { SettingsManager } from '../managers/SettingsManager'
import { SearchHandler } from '../handlers/SearchHandler'
import { TabHandler } from '../handlers/TabHandler'
import { NavigationHandler } from '../handlers/NavigationHandler'
import { createModuleLogger } from '../../shared/logger'

// GIGA-CHAD: 앱 핵심 관리 모듈
export class GigaBrowserApp {
    private static instance: GigaBrowserApp
    private isInitialized = false
    private mainWindow?: BrowserWindow
    private logger = createModuleLogger('GigaBrowserApp')

    private constructor() { }

    /**
     * 싱글톤 인스턴스 가져오기
     */
    static getInstance(): GigaBrowserApp {
        if (!this.instance) {
            this.instance = new GigaBrowserApp()
        }
        return this.instance
    }

    /**
     * 앱 초기화
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            this.logger.warn('App already initialized')
            return
        }

        this.logger.info('Initializing Giga Browser...')

        // 1. Chromium 엔진 최적화 (앱 시작 전에 적용되어야 함)
        EngineService.applyOptimizations()

        if (is.dev) {
            EngineService.enableDevelopmentFlags()
        }

        // 2. Electron 앱 기본 설정
        this.setupElectronApp()

        // 3. 보안 설정 초기화
        SecurityManager.initialize()

        // 4. 설정 관리자 초기화
        await SettingsManager.getInstance().initialize()

        // 5. 서비스 초기화
        SearchService.getInstance()
        TabManager.getInstance()

        // 6. IPC 핸들러 등록
        this.registerHandlers()

        // 7. 앱 이벤트 리스너 설정
        this.setupAppEvents()

        this.isInitialized = true
        this.logger.info('App initialization complete')
    }

    /**
     * IPC 핸들러 등록
     */
    private registerHandlers(): void {
        this.logger.info('Registering IPC handlers...')

        SearchHandler.getInstance().register()
        TabHandler.getInstance().register()
        NavigationHandler.getInstance().register()

        this.logger.info('All IPC handlers registered')
    }

    /**
     * Electron 앱 기본 설정
     */
    private setupElectronApp(): void {
        // Set app user model id for windows
        electronApp.setAppUserModelId('com.gigabrowser')

        // Default open or close DevTools by F12 in development
        // and ignore CommandOrControl + R in production.
        app.on('browser-window-created', (_, window) => {
            optimizer.watchWindowShortcuts(window)
        })
    }

    /**
     * 앱 이벤트 리스너 설정
     */
    private setupAppEvents(): void {
        // 앱 준비 완료 시
        app.on('ready', () => {
            this.onAppReady()
        })

        // 모든 윈도우가 닫혔을 때
        app.on('window-all-closed', () => {
            this.onWindowAllClosed()
        })

        // 앱 활성화 시 (macOS)
        app.on('activate', () => {
            this.onActivate()
        })

        // 앱 종료 전
        app.on('before-quit', () => {
            this.onBeforeQuit()
        })
    }

    /**
     * 앱 준비 완료 시 실행
     */
    private onAppReady(): void {
        this.logger.info('App ready, creating main window...')

        // 메인 윈도우 생성
        this.mainWindow = WindowManager.createMainWindow()

        // TabManager에 메인 윈도우 설정
        TabManager.getInstance().setMainWindow(this.mainWindow).catch(error => {
            this.logger.error('Failed to set main window on TabManager:', error)
        })

        // GIGA-CHAD: 글로벌 단축키 등록
        ShortcutService.getInstance().registerAllShortcuts()

        // 개발 환경에서 메모리 모니터링 시작
        if (is.dev) {
            this.startMemoryMonitoring()
        }
    }

    /**
     * 모든 윈도우가 닫혔을 때
     */
    private onWindowAllClosed(): void {
        // macOS에서는 앱이 활성 상태로 유지
        if (process.platform !== 'darwin') {
            app.quit()
        }
    }

    /**
     * 앱 활성화 시 (macOS)
     */
    private onActivate(): void {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (WindowManager.getWindowCount() === 0) {
            this.mainWindow = WindowManager.createMainWindow()
        }
    }

    /**
     * 앱 종료 전 정리 작업
     */
    private onBeforeQuit(): void {
        this.logger.info('App is quitting, cleaning up...')

        // GIGA-CHAD: 글로벌 단축키 해제
        ShortcutService.getInstance().unregisterAllShortcuts()

        // IPC 핸들러 정리
        this.unregisterHandlers()

        // 설정 저장
        SettingsManager.getInstance().cleanup()

        // 모든 윈도우 정리
        WindowManager.closeAllWindows()

        // 모든 탭 정리
        TabManager.getInstance().closeAllTabs()
    }

    /**
     * IPC 핸들러 해제
     */
    private unregisterHandlers(): void {
        this.logger.info('Unregistering IPC handlers...')

        SearchHandler.getInstance().unregister()
        TabHandler.getInstance().unregister()
        NavigationHandler.getInstance().unregister()

        this.logger.info('All IPC handlers unregistered')
    }

    /**
     * 개발 환경 메모리 모니터링
     */
    private startMemoryMonitoring(): void {
        setInterval(async () => {
            try {
                const memoryInfo = await process.getProcessMemoryInfo()
                const windowCount = WindowManager.getWindowCount()

                this.logger.info('Memory Usage', {
                    private: `${Math.round(memoryInfo.private / 1024)}MB`,
                    shared: `${Math.round(memoryInfo.shared / 1024)}MB`,
                    total: `${Math.round((memoryInfo.private + memoryInfo.shared) / 1024)}MB`,
                    windows: windowCount
                })

                // 메모리 경고 (목표: 1GB 미만)
                const totalMB = (memoryInfo.private + memoryInfo.shared) / 1024
                if (totalMB > 1000) {
                    this.logger.warn(`Memory usage exceeds target (${Math.round(totalMB)}MB > 1000MB)`)
                }
            } catch (error) {
                this.logger.error('Failed to get memory info', error)
            }
        }, 5000) // 5초마다 메모리 사용량 출력
    }

    /**
     * 메인 윈도우 가져오기
     */
    getMainWindow(): BrowserWindow | undefined {
        return this.mainWindow
    }

    /**
     * 앱 상태 확인
     */
    isReady(): boolean {
        return this.isInitialized && app.isReady()
    }
}