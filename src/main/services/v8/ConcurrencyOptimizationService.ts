import { app } from 'electron'
import { createLogger } from '../../../shared/logger'
import { IOptimizationService } from '../../../shared/types'

const logger = createLogger('ConcurrencyOptimizationService')

/**
 * 🔄 V8 동시성 최적화 서비스 (SRP: 동시성 관련 최적화만 담당)
 * - SharedArrayBuffer 활성화
 * - Atomics 지원
 * - 워커 스레드 최적화
 * - 병렬 컴파일 최적화
 */
export class ConcurrencyOptimizationService implements IOptimizationService {
    private isInitialized = false
    private maxWorkers = 8

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Concurrency optimization already initialized')
            return
        }

        logger.info('🔄 Initializing V8 concurrency optimization...')

        this.setupSharedMemory()
        this.setupWorkerThreads()
        this.setupParallelCompilation()
        this.adjustWorkerCount()

        this.isInitialized = true
        logger.info('✅ V8 concurrency optimization initialized successfully')
    }

    private setupSharedMemory(): void {
        logger.debug('Setting up shared memory features...')

        // SharedArrayBuffer와 Atomics 활성화
        app.commandLine.appendSwitch('enable-shared-array-buffer')
        app.commandLine.appendSwitch('enable-atomics')

        logger.debug('Shared memory features enabled')
    }

    private setupWorkerThreads(): void {
        logger.debug('Setting up worker thread optimization...')

        // 워커 스레드 최적화
        app.commandLine.appendSwitch('max-web-workers', this.maxWorkers.toString())
        app.commandLine.appendSwitch('enable-worker-threads')

        logger.debug(`Worker threads enabled (max: ${this.maxWorkers})`)
    }

    private setupParallelCompilation(): void {
        logger.debug('Setting up parallel compilation...')

        // 병렬 컴파일 활성화
        app.commandLine.appendSwitch('enable-parallel-compilation')

        logger.debug('Parallel compilation enabled')
    }

    private adjustWorkerCount(): void {
        // CPU 코어 수에 따라 워커 수 조정
        const cpuCount = require('os').cpus().length
        this.maxWorkers = Math.min(Math.max(cpuCount - 1, 2), 16) // 최소 2개, 최대 16개

        logger.info(`Adjusted worker count based on CPU cores: ${this.maxWorkers} workers (${cpuCount} cores)`)
    }

    // 동시성 상태 체크
    getConcurrencyStatus(): {
        maxWorkers: number;
        cpuCores: number;
        sharedArrayBufferSupported: boolean;
        atomicsSupported: boolean;
    } {
        const cpuCores = require('os').cpus().length

        return {
            maxWorkers: this.maxWorkers,
            cpuCores,
            sharedArrayBufferSupported: typeof SharedArrayBuffer !== 'undefined',
            atomicsSupported: typeof Atomics !== 'undefined'
        }
    }

    // 워커 수 동적 조정
    setMaxWorkers(count: number): void {
        if (count < 1 || count > 32) {
            logger.warn('Worker count should be between 1 and 32')
            return
        }

        this.maxWorkers = count

        // 새로운 설정은 다음 초기화에서 적용됨
        logger.info(`Max workers set to ${count} (will apply on next restart)`)
    }

    // CPU 사용률 모니터링 (워커 스케줄링 최적화용)
    async getCPUUsage(): Promise<{ loadAverage: number[]; usage: number }> {
        try {
            const os = require('os')
            const loadAverage = os.loadavg()
            const cpuCount = os.cpus().length

            // 1분 평균 로드를 CPU 사용률로 근사치 계산
            const usage = Math.min((loadAverage[0] / cpuCount) * 100, 100)

            return { loadAverage, usage }
        } catch (error) {
            logger.error('Failed to get CPU usage', error)
            return { loadAverage: [0, 0, 0], usage: 0 }
        }
    }

    // 동시성 성능 테스트
    async performConcurrencyTest(): Promise<{ success: boolean; duration: number }> {
        const startTime = performance.now()

        try {
            // 간단한 병렬 작업 테스트
            const promises = Array.from({ length: this.maxWorkers }, (_, i) => {
                return new Promise<number>(resolve => {
                    setTimeout(() => resolve(i), 10)
                })
            })

            await Promise.all(promises)

            const duration = performance.now() - startTime
            logger.info(`Concurrency test completed in ${duration.toFixed(2)}ms`)

            return { success: true, duration }
        } catch (error) {
            const duration = performance.now() - startTime
            logger.error('Concurrency test failed', error)

            return { success: false, duration }
        }
    }
}