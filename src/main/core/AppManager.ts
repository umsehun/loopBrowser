import { app, BrowserWindow } from 'electron'
import { logger } from '../../shared/logger/index'
import { WindowManager } from '../managers/WindowManager'
import { IpcHandlers } from '../handlers/IpcHandlers'
import { serviceManager } from '../services/index'

export class AppManager {
    private static instance: AppManager
    private windowManager: WindowManager
    private ipcHandlers: IpcHandlers
    private isInitialized = false

    constructor() {
        this.windowManager = WindowManager.getInstance()
        this.ipcHandlers = IpcHandlers.getInstance()
        logger.info('AppManager initialized')
    }

    static getInstance(): AppManager {
        if (!AppManager.instance) {
            AppManager.instance = new AppManager()
        }
        return AppManager.instance
    }

    // 앱 초기화
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('AppManager already initialized')
            return
        }

        try {
            logger.info('Initializing Loop Browser...')

            // 성능 최적화 설정 조정 (성능 회귀 방지)
            serviceManager.updateConfig({
                optimizationLevel: 'balanced', // 균형잡힌 최적화
                enablePerformanceMonitoring: false, // 모니터링 비활성화로 성능 향상
                monitoringIntervalMs: 300000 // 5분으로 설정 (필요시만)
            })

            // 모든 서비스 초기화 (최적화 포함)
            await serviceManager.initializeAllServices()

            // IPC 핸들러 설정
            this.ipcHandlers.setupHandlers()

            this.isInitialized = true
            logger.info('App initialization complete with performance optimizations')
        } catch (error) {
            logger.error('Failed to initialize app', { error })
            throw error
        }
    }

    // 앱 시작
    async start(): Promise<void> {
        try {
            await this.initialize()

            // 메인 윈도우 생성
            await this.windowManager.createMainWindow()

            logger.info('Loop Browser started successfully')
        } catch (error) {
            logger.error('Failed to start app', { error })
            throw error
        }
    }

    // 앱 이벤트 핸들러 설정
    setupAppEvents(): void {
        // 앱 준비 완료
        app.whenReady().then(() => {
            logger.info('App ready')
            this.start().catch(error => {
                logger.error('Failed to start app after ready', { error })
                app.quit()
            })

            // macOS: Dock 아이콘 클릭시 윈도우 생성 (윈도우가 없을 때만)
            app.on('activate', () => {
                const allWindows = BrowserWindow.getAllWindows()
                if (allWindows.length === 0) {
                    logger.info('No windows found, creating new window on activate')
                    this.windowManager.createMainWindow().catch(error => {
                        logger.error('Failed to create window on activate', { error })
                    })
                } else {
                    logger.debug('Window already exists, skipping create on activate')
                }
            })
        })

        // 모든 윈도우 닫힘
        app.on('window-all-closed', () => {
            logger.info('All windows closed')
            if (process.platform !== 'darwin') {
                app.quit()
            }
        })

        // 앱 종료 전
        app.on('before-quit', async (event) => {
            logger.info('App before quit')
            await this.cleanup()
        })

        // 앱 종료
        app.on('will-quit', () => {
            logger.info('App will quit')
        })

        logger.info('App event handlers setup complete')
    }

    // 정리 작업
    private async cleanup(): Promise<void> {
        try {
            // 모든 서비스 정리
            await serviceManager.cleanup()

            // WindowManager 정리
            this.windowManager.cleanup()

            logger.info('App cleanup complete')
        } catch (error) {
            logger.error('Error during cleanup', { error })
        }
    }

    // 상태 확인
    isReady(): boolean {
        return this.isInitialized && app.isReady()
    }

    // 종료
    quit(): void {
        logger.info('Quitting app')
        app.quit()
    }
}

// 싱글톤 인스턴스 내보내기
export const appManager = AppManager.getInstance()
export default appManager