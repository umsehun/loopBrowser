import { app } from 'electron'
import { createLogger } from '../../../shared/logger'
import { IOptimizationService } from '../../../shared/types'

const logger = createLogger('GarbageCollectionService')

/**
 * 🗑️ V8 가비지 컬렉션 최적화 서비스 (SRP: GC 최적화만 담당)
 * - 증분 가비지 컬렉션
 * - 병렬 가비지 컬렉션
 * - 메모리 압력 기반 GC
 * - 강제 GC 실행
 */
export class GarbageCollectionService implements IOptimizationService {
    private isInitialized = false

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Garbage collection optimization already initialized')
            return
        }

        logger.info('🗑️ Initializing V8 garbage collection optimization...')

        this.setupBasicGC()
        this.setupIncrementalGC()
        this.setupParallelGC()
        this.setupMemoryPressureGC()

        this.isInitialized = true
        logger.info('✅ V8 garbage collection optimization initialized successfully')
    }

    private setupBasicGC(): void {
        logger.debug('Setting up basic garbage collection...')

        // 기본 GC 설정
        app.commandLine.appendSwitch('enable-idle-time-gc')
        app.commandLine.appendSwitch('expose-gc-as', 'gc')

        logger.debug('Basic garbage collection enabled')
    }

    private setupIncrementalGC(): void {
        logger.debug('Setting up incremental garbage collection...')

        // 증분 가비지 컬렉션 최적화
        app.commandLine.appendSwitch('incremental-marking')
        app.commandLine.appendSwitch('incremental-marking-wrappers')

        logger.debug('Incremental garbage collection enabled')
    }

    private setupParallelGC(): void {
        logger.debug('Setting up parallel garbage collection...')

        // 병렬 가비지 컬렉션 강화
        app.commandLine.appendSwitch('parallel-scavenge')
        app.commandLine.appendSwitch('concurrent-marking')
        app.commandLine.appendSwitch('concurrent-sweeping')
        app.commandLine.appendSwitch('parallel-pointer-update')

        logger.debug('Parallel garbage collection enabled')
    }

    private setupMemoryPressureGC(): void {
        logger.debug('Setting up memory pressure-based garbage collection...')

        // 메모리 압력 기반 GC
        app.commandLine.appendSwitch('memory-pressure-gc')

        logger.debug('Memory pressure-based garbage collection enabled')
    }

    // 강제 가비지 컬렉션 실행
    forceGarbageCollection(): { success: boolean; beforeMB: number; afterMB: number } {
        if (!global.gc) {
            logger.warn('Garbage collection not exposed. Use --expose-gc flag')
            return { success: false, beforeMB: 0, afterMB: 0 }
        }

        try {
            const beforeMem = process.memoryUsage()
            const beforeMB = beforeMem.heapUsed / 1024 / 1024

            global.gc()

            const afterMem = process.memoryUsage()
            const afterMB = afterMem.heapUsed / 1024 / 1024
            const freedMB = beforeMB - afterMB

            logger.info('Forced garbage collection completed', {
                beforeMB: `${beforeMB.toFixed(2)} MB`,
                afterMB: `${afterMB.toFixed(2)} MB`,
                freedMB: `${freedMB.toFixed(2)} MB`
            })

            return { success: true, beforeMB, afterMB }
        } catch (error) {
            logger.error('Failed to force garbage collection', error)
            return { success: false, beforeMB: 0, afterMB: 0 }
        }
    }

    // GC 통계 가져오기
    getGCStats(): { heapUsed: number; heapTotal: number; gcAvailable: boolean } {
        const memUsage = process.memoryUsage()

        return {
            heapUsed: memUsage.heapUsed / 1024 / 1024, // MB
            heapTotal: memUsage.heapTotal / 1024 / 1024, // MB
            gcAvailable: typeof global.gc === 'function'
        }
    }

    // 자동 GC 임계값 설정
    setGCThreshold(heapUsagePercentThreshold: number = 80): void {
        if (heapUsagePercentThreshold < 50 || heapUsagePercentThreshold > 95) {
            logger.warn('GC threshold should be between 50% and 95%')
            return
        }

        // 주기적으로 메모리 사용량 체크하고 임계값 초과시 강제 GC
        setInterval(() => {
            const memUsage = process.memoryUsage()
            const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100

            if (usagePercent > heapUsagePercentThreshold) {
                logger.warn(`High memory usage detected: ${usagePercent.toFixed(1)}%`)
                this.forceGarbageCollection()
            }
        }, 10000) // 10초마다 체크

        logger.info(`GC threshold set to ${heapUsagePercentThreshold}%`)
    }
}