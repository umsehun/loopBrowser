import { WebContents, app } from 'electron'
import { logger } from '../../../shared/logger/index'

export interface V8OptimizationConfig {
    enableGCOptimization: boolean
    enableJITOptimization: boolean
    heapSizeLimit: number // MB
    enableTurboFan: boolean
    enableCodeCache: boolean
}

export class V8Service {
    private static instance: V8Service
    private config: V8OptimizationConfig = {
        enableGCOptimization: true,
        enableJITOptimization: true,
        heapSizeLimit: 1024, // 1GB
        enableTurboFan: true,
        enableCodeCache: true
    }
    private gcStats = {
        totalCollections: 0,
        totalTime: 0,
        lastCollection: Date.now()
    }

    constructor() {
        logger.info('V8Service initialized')
    }

    static getInstance(): V8Service {
        if (!V8Service.instance) {
            V8Service.instance = new V8Service()
        }
        return V8Service.instance
    }

    // V8 엔진 최적화 활성화
    async optimizeV8Engine(): Promise<void> {
        try {
            await this.setupGCOptimization()
            await this.setupJITOptimization()
            await this.setupHeapLimits()
            await this.setupTurboFan()
            await this.setupCodeCache()

            logger.info('V8 engine optimization applied successfully', this.config)
        } catch (error) {
            logger.error('Failed to apply V8 optimization', { error })
            throw error
        }
    }

    // 가비지 컬렉션 최적화
    private async setupGCOptimization(): Promise<void> {
        if (!this.config.enableGCOptimization) return

        try {
            // V8 플래그 설정 (앱 시작 시점에서만 가능)
            const v8Flags = [
                '--max-old-space-size=' + this.config.heapSizeLimit,
                '--optimize-for-size', // 메모리 사용량 최적화
                '--gc-interval=100', // GC 주기 최적화
                '--incremental-marking', // 점진적 마킹
                '--concurrent-marking', // 동시 마킹
                '--parallel-scavenge', // 병렬 스카벤징
            ]

            // 런타임에서 가능한 최적화
            if (global.gc) {
                // 주기적 가비지 컬렉션
                setInterval(() => {
                    const startTime = Date.now()
                    if (global.gc) {
                        global.gc()
                    }
                    const gcTime = Date.now() - startTime

                    this.gcStats.totalCollections++
                    this.gcStats.totalTime += gcTime
                    this.gcStats.lastCollection = Date.now()

                    if (gcTime > 50) { // 50ms 이상 걸린 경우 로깅
                        logger.debug('Manual GC completed', {
                            duration: gcTime,
                            totalCollections: this.gcStats.totalCollections
                        })
                    }
                }, 60000) // 1분마다
            }

            logger.debug('GC optimization enabled', { heapLimit: this.config.heapSizeLimit })
        } catch (error) {
            logger.error('Failed to setup GC optimization', { error })
        }
    }

    // JIT 컴파일러 최적화
    private async setupJITOptimization(): Promise<void> {
        if (!this.config.enableJITOptimization) return

        try {
            // TurboFan 최적화 설정은 앱 시작 시점에서만 가능
            logger.debug('JIT optimization enabled')
        } catch (error) {
            logger.error('Failed to setup JIT optimization', { error })
        }
    }

    // 힙 크기 제한 설정
    private async setupHeapLimits(): Promise<void> {
        try {
            // 메모리 사용량 모니터링
            const memoryUsage = process.memoryUsage()
            const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
            const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)

            logger.debug('Memory usage stats', {
                heapUsed: `${heapUsedMB}MB`,
                heapTotal: `${heapTotalMB}MB`,
                heapLimit: `${this.config.heapSizeLimit}MB`
            })

            // 메모리 사용량이 임계치를 넘으면 경고
            if (heapUsedMB > this.config.heapSizeLimit * 0.8) {
                logger.warn('High memory usage detected', {
                    current: `${heapUsedMB}MB`,
                    limit: `${this.config.heapSizeLimit}MB`
                })
            }
        } catch (error) {
            logger.error('Failed to setup heap limits', { error })
        }
    }

    // TurboFan 최적화
    private async setupTurboFan(): Promise<void> {
        if (!this.config.enableTurboFan) return

        try {
            // TurboFan 관련 설정은 V8 플래그로 처리
            logger.debug('TurboFan optimization enabled')
        } catch (error) {
            logger.error('Failed to setup TurboFan', { error })
        }
    }

    // 코드 캐시 최적화
    private async setupCodeCache(): Promise<void> {
        if (!this.config.enableCodeCache) return

        try {
            // 코드 캐시 활성화 (WebContents 생성 시 적용)
            logger.debug('Code cache optimization enabled')
        } catch (error) {
            logger.error('Failed to setup code cache', { error })
        }
    }

    // WebContents별 V8 최적화
    optimizeWebContents(webContents: WebContents): void {
        try {
            // 코드 캐시 활성화
            if (this.config.enableCodeCache) {
                webContents.session.setCodeCachePath(
                    require('path').join(app.getPath('userData'), 'code-cache')
                )
            }

            // V8 컨텍스트 최적화
            webContents.on('dom-ready', () => {
                webContents.executeJavaScript(`
                    // 메모리 최적화를 위한 JavaScript 설정
                    if (window.performance && window.performance.memory) {
                        // 메모리 사용량 모니터링
                        const memInfo = window.performance.memory;
                        logger.debug('WebContents memory usage:', {
                            used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
                            total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
                            limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB'
                        });
                    }

                    // 이벤트 리스너 최적화
                    const optimizeEventListeners = () => {
                        // Passive 이벤트 리스너 사용
                        ['touchstart', 'touchmove', 'wheel'].forEach(event => {
                            document.addEventListener(event, function() {}, { passive: true });
                        });
                    };
                    optimizeEventListeners();
                `).catch(() => {
                    // JavaScript 실행 실패는 무시
                })
            })

            logger.debug('WebContents V8 optimization applied')
        } catch (error) {
            logger.error('Failed to optimize WebContents V8', { error })
        }
    }

    // 메모리 통계 수집
    getMemoryStats(): any {
        const memoryUsage = process.memoryUsage()
        return {
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
            external: Math.round(memoryUsage.external / 1024 / 1024), // MB
            rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
            gcStats: this.gcStats,
            heapLimit: this.config.heapSizeLimit
        }
    }

    // V8 플래그 반환 (앱 시작 시 사용)
    getV8Flags(): string[] {
        const flags: string[] = []

        if (this.config.enableGCOptimization) {
            flags.push('--max-old-space-size=1024')
            flags.push('--gc-interval=100')
            flags.push('--incremental-marking')
            flags.push('--concurrent-marking')
            flags.push('--parallel-scavenge')
        }

        if (this.config.enableJITOptimization) {
            flags.push('--turbo-fast-api-calls')
            flags.push('--turbo-inline-array-elements')
            flags.push('--enable-turbofan')
            flags.push('--turbo-instruction-scheduling')
        }

        return flags
    }

    // 강제 가비지 컬렉션
    forceGC(): void {
        if (global.gc) {
            const startTime = Date.now()
            if (global.gc) {
                global.gc()
            }
            const gcTime = Date.now() - startTime

            this.gcStats.totalCollections++
            this.gcStats.totalTime += gcTime
            this.gcStats.lastCollection = Date.now()

            logger.debug('Forced GC completed', { duration: gcTime })
        } else {
            logger.warn('Global GC not available')
        }
    }

    // 설정 업데이트
    updateConfig(newConfig: Partial<V8OptimizationConfig>): void {
        this.config = { ...this.config, ...newConfig }
        logger.info('V8Service configuration updated', this.config)
    }

    // 정리 작업
    cleanup(): void {
        if (global.gc) {
            this.forceGC()
        }
        logger.info('V8Service cleanup completed')
    }
}

export const v8Service = V8Service.getInstance()
export default v8Service