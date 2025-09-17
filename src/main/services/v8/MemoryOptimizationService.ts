import { app } from 'electron'
import { createLogger } from '../../../shared/logger'
import { IOptimizationService } from '../../../shared/types'

const logger = createLogger('MemoryOptimizationService')

/**
 * 🧠 V8 메모리 최적화 서비스 (SRP: 메모리 관련 최적화만 담당)
 * - 힙 메모리 크기 최적화
 * - 메모리 압축 강화
 * - 힙 압축 최적화
 * - 메모리 매핑 최적화
 */
export class MemoryOptimizationService implements IOptimizationService {
    private isInitialized = false

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Memory optimization already initialized')
            return
        }

        logger.info('🧠 Initializing V8 memory optimization...')

        this.setupHeapSizeOptimization()
        this.setupMemoryCompression()
        this.setupHeapCompaction()
        this.setupMemoryMapping()

        this.isInitialized = true
        logger.info('✅ V8 memory optimization initialized successfully')
    }

    private setupHeapSizeOptimization(): void {
        logger.debug('Setting up heap size optimization...')

        // 힙 메모리 크기 최적화 (8GB)
        app.commandLine.appendSwitch('max-old-space-size', '8192')
        app.commandLine.appendSwitch('max-semi-space-size', '256')

        logger.debug('Heap size optimization completed')
    }

    private setupMemoryCompression(): void {
        logger.debug('Setting up memory compression...')

        // 메모리 압축 강화
        app.commandLine.appendSwitch('enable-pointer-compression')
        app.commandLine.appendSwitch('enable-lazy-source-positions')

        logger.debug('Memory compression enabled')
    }

    private setupHeapCompaction(): void {
        logger.debug('Setting up heap compaction...')

        // 힙 압축 최적화
        app.commandLine.appendSwitch('heap-compaction')
        app.commandLine.appendSwitch('max-heap-compaction-candidates', '2000')
        app.commandLine.appendSwitch('minor-mc-parallel-marking')

        logger.debug('Heap compaction optimization enabled')
    }

    private setupMemoryMapping(): void {
        logger.debug('Setting up memory mapping...')

        // 메모리 매핑 및 압축 추가 최적화
        app.commandLine.appendSwitch('enable-precise-memory-info')
        app.commandLine.appendSwitch('memory-pressure-api')

        logger.debug('Memory mapping optimization enabled')
    }

    // 메모리 사용량 모니터링
    getMemoryUsage(): NodeJS.MemoryUsage {
        return process.memoryUsage()
    }

    // 메모리 통계 로깅
    logMemoryStats(): void {
        try {
            const memUsage = this.getMemoryUsage()
            logger.info('V8 Memory Statistics', {
                rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
                heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
                heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`,
                heapUsagePercent: `${((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1)}%`
            })
        } catch (error) {
            logger.error('Failed to get memory stats', error)
        }
    }

    // 메모리 압력 상태 체크
    checkMemoryPressure(): { isHigh: boolean; usage: number } {
        const memUsage = this.getMemoryUsage()
        const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100

        return {
            isHigh: usagePercent > 80,
            usage: usagePercent
        }
    }
}