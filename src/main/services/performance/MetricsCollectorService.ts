import { createLogger } from '../../../shared/logger'
import { IOptimizationService } from '../../../shared/types'

const logger = createLogger('MetricsCollectorService')

export interface SystemMetrics {
    timestamp: Date;
    cpu: {
        usage: number;
        processes: number;
    };
    memory: {
        total: number;
        used: number;
        free: number;
        cached?: number;
    };
    process: {
        pid: number;
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
        cpuUsage: NodeJS.CpuUsage;
    };
    performance: {
        eventLoopDelay: number;
        eventLoopUtilization: number;
    };
}

/**
 * 📈 메트릭 수집 서비스 (SRP: 시스템 메트릭 수집만 담당)
 * - 시스템 리소스 메트릭 수집
 * - 프로세스 성능 메트릭 추적
 * - 이벤트 루프 모니터링
 * - 메트릭 데이터 저장 및 분석
 */
export class MetricsCollectorService implements IOptimizationService {
    private isInitialized = false
    private metricsHistory: SystemMetrics[] = []
    private maxMetrics = 200
    private collectionInterval?: NodeJS.Timeout
    private startTime = Date.now()

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Metrics collector already initialized')
            return
        }

        logger.info('📈 Initializing metrics collector...')

        // 메트릭 수집 시작
        this.startMetricsCollection()

        this.isInitialized = true
        logger.info('✅ Metrics collector initialized successfully')
    }

    // 메트릭 수집 시작
    private startMetricsCollection(): void {
        // 5초마다 메트릭 수집
        this.collectionInterval = setInterval(() => {
            this.collectMetrics()
        }, 5000)

        // 초기 메트릭 수집
        this.collectMetrics()
    }

    // 시스템 메트릭 수집
    private async collectMetrics(): Promise<void> {
        try {
            const metrics = await this.gatherSystemMetrics()

            this.metricsHistory.push(metrics)

            // 메트릭 히스토리 크기 제한
            if (this.metricsHistory.length > this.maxMetrics) {
                this.metricsHistory = this.metricsHistory.slice(-this.maxMetrics)
            }

            // 성능 이상 감지
            this.detectPerformanceAnomalies(metrics)

        } catch (error) {
            logger.error('Failed to collect metrics', error)
        }
    }

    // 시스템 메트릭 수집
    private async gatherSystemMetrics(): Promise<SystemMetrics> {
        const timestamp = new Date()

        // 프로세스 정보
        const memoryUsage = process.memoryUsage()
        const cpuUsage = process.cpuUsage()

        // 시스템 메모리 정보 (Node.js에서 제한적)
        const systemMemory = {
            total: 0, // 시스템 총 메모리는 Node.js에서 직접 접근하기 어려움
            used: memoryUsage.rss,
            free: 0,
            cached: 0
        }

        // 이벤트 루프 성능 측정
        const eventLoopDelay = await this.measureEventLoopDelay()
        const eventLoopUtilization = this.measureEventLoopUtilization()

        return {
            timestamp,
            cpu: {
                usage: this.calculateCPUUsage(cpuUsage),
                processes: 1 // 현재 프로세스만 추적
            },
            memory: systemMemory,
            process: {
                pid: process.pid,
                uptime: process.uptime(),
                memoryUsage,
                cpuUsage
            },
            performance: {
                eventLoopDelay,
                eventLoopUtilization
            }
        }
    }

    // CPU 사용량 계산
    private calculateCPUUsage(cpuUsage: NodeJS.CpuUsage): number {
        // 간단한 CPU 사용량 계산 (실제로는 더 복잡한 로직 필요)
        const totalTime = cpuUsage.user + cpuUsage.system
        const totalTimeMs = totalTime / 1000 // 마이크로초를 밀리초로 변환
        const uptimeMs = process.uptime() * 1000

        return Math.min((totalTimeMs / uptimeMs) * 100, 100)
    }

    // 이벤트 루프 지연 측정
    private measureEventLoopDelay(): Promise<number> {
        return new Promise((resolve) => {
            const start = process.hrtime.bigint()

            setImmediate(() => {
                const end = process.hrtime.bigint()
                const delay = Number(end - start) / 1000000 // 나노초를 밀리초로 변환
                resolve(delay)
            })
        })
    }

    // 이벤트 루프 사용률 측정
    private measureEventLoopUtilization(): number {
        // Node.js 14+ 에서 사용 가능한 performance.eventLoopUtilization() 시뮬레이션
        try {
            const perf = require('perf_hooks').performance
            if (perf.eventLoopUtilization) {
                const elu = perf.eventLoopUtilization()
                return elu.utilization || 0
            }
        } catch (error) {
            // fallback
        }

        return 0 // 기본값
    }

    // 성능 이상 감지
    private detectPerformanceAnomalies(metrics: SystemMetrics): void {
        const warnings: string[] = []

        // 메모리 사용량 이상
        const heapUsagePercent = (metrics.process.memoryUsage.heapUsed / metrics.process.memoryUsage.heapTotal) * 100
        if (heapUsagePercent > 85) {
            warnings.push(`높은 힙 메모리 사용률: ${heapUsagePercent.toFixed(1)}%`)
        }

        // 이벤트 루프 지연 이상
        if (metrics.performance.eventLoopDelay > 10) {
            warnings.push(`높은 이벤트 루프 지연: ${metrics.performance.eventLoopDelay.toFixed(2)}ms`)
        }

        // 이벤트 루프 사용률 이상
        if (metrics.performance.eventLoopUtilization > 0.9) {
            warnings.push(`높은 이벤트 루프 사용률: ${(metrics.performance.eventLoopUtilization * 100).toFixed(1)}%`)
        }

        if (warnings.length > 0) {
            logger.warn('Performance anomalies detected', { warnings })
        }
    }

    // 현재 메트릭 가져오기
    async getCurrentMetrics(): Promise<SystemMetrics> {
        return await this.gatherSystemMetrics()
    }

    // 메트릭 히스토리 가져오기
    getMetricsHistory(limit: number = 50): SystemMetrics[] {
        return this.metricsHistory.slice(-limit)
    }

    // 메트릭 통계 분석
    analyzeMetrics(timeRangeMinutes: number = 30): {
        memory: {
            average: number;
            peak: number;
            trend: 'increasing' | 'decreasing' | 'stable';
        };
        performance: {
            averageEventLoopDelay: number;
            maxEventLoopDelay: number;
            averageUtilization: number;
        };
        insights: string[];
    } {
        const cutoffTime = new Date(Date.now() - timeRangeMinutes * 60 * 1000)
        const recentMetrics = this.metricsHistory.filter(m => m.timestamp >= cutoffTime)

        if (recentMetrics.length === 0) {
            return {
                memory: { average: 0, peak: 0, trend: 'stable' },
                performance: { averageEventLoopDelay: 0, maxEventLoopDelay: 0, averageUtilization: 0 },
                insights: ['데이터가 부족합니다.']
            }
        }

        // 메모리 분석
        const heapUsages = recentMetrics.map(m =>
            (m.process.memoryUsage.heapUsed / m.process.memoryUsage.heapTotal) * 100
        )
        const averageMemory = heapUsages.reduce((sum, usage) => sum + usage, 0) / heapUsages.length
        const peakMemory = Math.max(...heapUsages)

        // 메모리 트렌드 계산
        const memoryTrend = this.calculateTrend(heapUsages)

        // 성능 분석
        const eventLoopDelays = recentMetrics.map(m => m.performance.eventLoopDelay)
        const utilizations = recentMetrics.map(m => m.performance.eventLoopUtilization)

        const averageEventLoopDelay = eventLoopDelays.reduce((sum, delay) => sum + delay, 0) / eventLoopDelays.length
        const maxEventLoopDelay = Math.max(...eventLoopDelays)
        const averageUtilization = utilizations.reduce((sum, util) => sum + util, 0) / utilizations.length

        // 인사이트 생성
        const insights = this.generateMetricsInsights(averageMemory, peakMemory, memoryTrend, averageEventLoopDelay, averageUtilization)

        logger.debug('Metrics analysis completed', {
            timeRange: `${timeRangeMinutes} minutes`,
            dataPoints: recentMetrics.length,
            averageMemory: `${averageMemory.toFixed(1)}%`,
            memoryTrend
        })

        return {
            memory: { average: averageMemory, peak: peakMemory, trend: memoryTrend },
            performance: { averageEventLoopDelay, maxEventLoopDelay, averageUtilization },
            insights
        }
    }

    // 트렌드 계산
    private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
        if (values.length < 4) return 'stable'

        const firstHalf = values.slice(0, Math.ceil(values.length / 2))
        const secondHalf = values.slice(Math.floor(values.length / 2))

        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length

        const changePercent = Math.abs((secondAvg - firstAvg) / firstAvg) * 100

        if (changePercent < 5) return 'stable'
        return secondAvg > firstAvg ? 'increasing' : 'decreasing'
    }

    // 메트릭 인사이트 생성
    private generateMetricsInsights(
        averageMemory: number,
        peakMemory: number,
        memoryTrend: string,
        averageEventLoopDelay: number,
        averageUtilization: number
    ): string[] {
        const insights: string[] = []

        // 메모리 인사이트
        if (averageMemory > 80) {
            insights.push('평균 메모리 사용량이 높습니다. 메모리 최적화가 필요합니다.')
        } else if (averageMemory < 30) {
            insights.push('메모리 사용량이 효율적입니다.')
        }

        if (peakMemory > 90) {
            insights.push('메모리 사용량 피크가 위험 수준입니다.')
        }

        if (memoryTrend === 'increasing') {
            insights.push('메모리 사용량이 지속적으로 증가하고 있습니다. 메모리 누수를 확인하세요.')
        } else if (memoryTrend === 'decreasing') {
            insights.push('메모리 사용량이 개선되고 있습니다.')
        }

        // 성능 인사이트
        if (averageEventLoopDelay > 5) {
            insights.push('이벤트 루프 지연이 높습니다. 동기 작업을 줄이세요.')
        } else if (averageEventLoopDelay < 1) {
            insights.push('이벤트 루프 성능이 우수합니다.')
        }

        if (averageUtilization > 0.8) {
            insights.push('이벤트 루프 사용률이 높습니다. 비동기 작업 분산을 고려하세요.')
        }

        if (insights.length === 0) {
            insights.push('시스템 성능이 양호합니다.')
        }

        return insights
    }

    // 성능 알림 설정
    setPerformanceThresholds(thresholds: {
        memoryWarning?: number;
        memoryCritical?: number;
        eventLoopDelayWarning?: number;
        utilizationWarning?: number;
    }): void {
        logger.info('Performance thresholds updated', thresholds)
        // 실제 구현에서는 이 임계값들을 저장하고 모니터링에 사용
    }

    // 메트릭 내보내기
    exportMetrics(format: 'json' | 'csv' = 'json', limit: number = 100): string {
        const metrics = this.metricsHistory.slice(-limit)

        if (format === 'json') {
            return JSON.stringify(metrics, null, 2)
        }

        // CSV 형태로 내보내기
        const headers = [
            'timestamp',
            'heapUsed_MB',
            'heapTotal_MB',
            'heapUsage_%',
            'rss_MB',
            'external_MB',
            'eventLoopDelay_ms',
            'eventLoopUtilization_%'
        ].join(',')

        const rows = metrics.map(m => [
            m.timestamp.toISOString(),
            (m.process.memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
            (m.process.memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
            ((m.process.memoryUsage.heapUsed / m.process.memoryUsage.heapTotal) * 100).toFixed(1),
            (m.process.memoryUsage.rss / 1024 / 1024).toFixed(2),
            (m.process.memoryUsage.external / 1024 / 1024).toFixed(2),
            m.performance.eventLoopDelay.toFixed(2),
            (m.performance.eventLoopUtilization * 100).toFixed(1)
        ].join(','))

        return [headers, ...rows].join('\n')
    }

    // 실시간 성능 모니터링
    startRealTimeMonitoring(callback: (metrics: SystemMetrics) => void): void {
        logger.info('Starting real-time performance monitoring')

        const monitor = setInterval(async () => {
            const metrics = await this.getCurrentMetrics()
            callback(metrics)
        }, 1000) // 1초마다

        // 10분 후 자동 중지
        setTimeout(() => {
            clearInterval(monitor)
            logger.info('Real-time monitoring stopped automatically')
        }, 10 * 60 * 1000)
    }

    // 정리 함수
    cleanup(): void {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval)
            this.collectionInterval = undefined
        }

        this.metricsHistory = []
        logger.info('Metrics collector cleaned up')
    }
}