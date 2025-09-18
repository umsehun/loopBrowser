import { app } from 'electron'
import { createModuleLogger } from '../shared/logger/index'
import { AppLifecycle } from './core/AppLifecycle'
import { PerformanceOptimizer } from './core/PerformanceOptimizer'

// 메인 프로세스 로거 생성
const mainLogger = createModuleLogger('MainProcess', 'main')

// 메인 프로세스 시작점
async function bootstrap(): Promise<void> {
    try {
        mainLogger.info('Starting Loop Browser main process...')

        // 1. 성능 최적화 적용 (앱 이벤트 등록 전)
        const optimizer = PerformanceOptimizer.getInstance()
        optimizer.applyAllOptimizations()

        // 2. 앱 라이프사이클 관리자 초기화 및 이벤트 핸들러 설정
        const lifecycle = AppLifecycle.getInstance()
        lifecycle.setupEventHandlers()

        mainLogger.info('Main process bootstrap complete')

    } catch (error) {
        mainLogger.error('Failed to bootstrap main process', { error })
        process.exit(1)
    }
}

// 메인 함수 실행
bootstrap()