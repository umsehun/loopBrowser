import { app } from 'electron'
import { createLogger } from '../../shared/logger'

const logger = createLogger('Application')

/**
 * 핵심 애플리케이션 클래스
 * SRP: 앱 생명주기만 관리
 */
export class Application {
    private isInitialized = false

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Application already initialized')
            return
        }

        logger.info('Initializing SEO Browser...')

        // 앱 준비 대기
        await app.whenReady()

        this.setupEventHandlers()
        this.isInitialized = true

        logger.info('Application initialized successfully')
    }

    private setupEventHandlers(): void {
        // 모든 창이 닫힐 때 (macOS 제외)
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit()
            }
        })

        // macOS에서 활성화될 때
        app.on('activate', () => {
            // 구현 예정: 새 창 생성
        })

        // 종료 전 정리
        app.on('before-quit', () => {
            logger.info('Application shutting down...')
        })
    }
}