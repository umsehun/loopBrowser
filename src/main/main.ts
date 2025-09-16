import { GigaBrowserApp } from './core/app'
import { createModuleLogger } from '../shared/logger'

// GIGA-CHAD: 🚀 Giga Browser 진입점
// 단순하고 깔끔한 시작점 - 모든 복잡한 로직은 모듈화됨

const logger = createModuleLogger('Main')

async function main(): Promise<void> {
    try {
        logger.info('Starting Giga Browser...')

        // 앱 인스턴스 가져오기 및 초기화
        const app = GigaBrowserApp.getInstance()
        await app.initialize()

        logger.info('Giga Browser started successfully!')
    } catch (error) {
        logger.error('Failed to start Giga Browser', error)
        process.exit(1)
    }
}

// 앱 시작
main().catch(error => {
    logger.error('Unhandled error in main', error)
    process.exit(1)
})