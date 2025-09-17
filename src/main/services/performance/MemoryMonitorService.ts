import { createLogger } from '../../../shared/logger'
import { IOptimizationService, MemoryStats } from '../../../shared/types'

const logger = createLogger('MemoryMonitorService')

/**
 * 🧠 메모리 모니터링 서비스 (SRP: 메모리 관련 모니터링만 담당)
 * - V8 힙 메모리 모니터링
 * - 메모리 사용량 추적
 * - 메모리 누수 감지
 * - 가비지 컬렉션 제어
 */
export class MemoryMonitorService implements IOptimizationService {
    private isInitialized = false
    private memoryHistory: MemoryStats[] = []
    private maxHistorySize = 100
    private monitoringInterval?: NodeJS.Timeout

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Memory monitor already initialized')
            return
        }

        logger.info('🧠 Initializing memory monitor...')

        // 메모리 모니터링 시작 (개발 환경에서는 더 자주)
        const interval = process.env.NODE_ENV === 'development' ? 5000 : 15000
        this.monitoringInterval = setInterval(() => {
            this.recordMemorySnapshot()
        }, interval)

        this.isInitialized = true
        logger.info('✅ Memory monitor initialized successfully')
    }

    // 메모리 스냅샷 기록
    private recordMemorySnapshot(): void {
        const memUsage = process.memoryUsage()
        const timestamp = new Date()

        const snapshot: MemoryStats = {
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external,
            timestamp
        }

        this.memoryHistory.push(snapshot)

        // 히스토리 크기 제한
        if (this.memoryHistory.length > this.maxHistorySize) {
            this.memoryHistory = this.memoryHistory.slice(-this.maxHistorySize)
        }

        // 메모리 압력 체크
        this.checkMemoryPressure(snapshot)
    }

    // 메모리 압력 상태 체크
    private checkMemoryPressure(snapshot: MemoryStats): void {
        const heapUsagePercent = (snapshot.heapUsed / snapshot.heapTotal) * 100

        if (heapUsagePercent > 90) {
            logger.error('🚨 Critical memory usage detected', {
                heapUsage: `${heapUsagePercent.toFixed(1)}%`,
                heapUsed: `${(snapshot.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                heapTotal: `${(snapshot.heapTotal / 1024 / 1024).toFixed(2)} MB`
            })
        } else if (heapUsagePercent > 80) {
            logger.warn('⚠️ High memory usage detected', {
                heapUsage: `${heapUsagePercent.toFixed(1)}%`,
                heapUsed: `${(snapshot.heapUsed / 1024 / 1024).toFixed(2)} MB`
            })
        }
    }

    // 현재 메모리 상태 가져오기
    getCurrentMemoryStats(): MemoryStats {
        const memUsage = process.memoryUsage()
        return {
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external,
            timestamp: new Date()
        }
    }

    // 메모리 사용량 트렌드 분석
    analyzeMemoryTrend(): {
        trend: 'increasing' | 'decreasing' | 'stable';
        averageUsage: number;
        peakUsage: number;
        currentUsage: number;
        recommendations: string[];
    } {
        if (this.memoryHistory.length < 5) {
            const current = this.getCurrentMemoryStats()
            return {
                trend: 'stable',
                averageUsage: current.heapUsed / current.heapTotal,
                peakUsage: current.heapUsed / current.heapTotal,
                currentUsage: current.heapUsed / current.heapTotal,
                recommendations: ['더 많은 데이터가 필요합니다. 잠시 후 다시 시도하세요.']
            }
        }

        const recentSnapshots = this.memoryHistory.slice(-10)
        const usageRatios = recentSnapshots.map(s => s.heapUsed / s.heapTotal)

        const averageUsage = usageRatios.reduce((sum, ratio) => sum + ratio, 0) / usageRatios.length
        const peakUsage = Math.max(...usageRatios)
        const currentUsage = usageRatios[usageRatios.length - 1]

        // 트렌드 계산
        const firstHalf = usageRatios.slice(0, Math.ceil(usageRatios.length / 2))
        const secondHalf = usageRatios.slice(Math.floor(usageRatios.length / 2))

        const firstAvg = firstHalf.reduce((sum, ratio) => sum + ratio, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((sum, ratio) => sum + ratio, 0) / secondHalf.length

        let trend: 'increasing' | 'decreasing' | 'stable'
        if (secondAvg - firstAvg > 0.05) {
            trend = 'increasing'
        } else if (firstAvg - secondAvg > 0.05) {
            trend = 'decreasing'
        } else {
            trend = 'stable'
        }

        // 권장사항 생성
        const recommendations: string[] = []

        if (trend === 'increasing') {
            recommendations.push('메모리 사용량이 증가하고 있습니다. 메모리 누수를 확인하세요.')
        }

        if (peakUsage > 0.8) {
            recommendations.push('메모리 사용량이 높습니다. 가비지 컬렉션 실행을 고려하세요.')
        }

        if (averageUsage > 0.7) {
            recommendations.push('평균 메모리 사용량이 높습니다. 메모리 최적화가 필요합니다.')
        }

        if (recommendations.length === 0) {
            recommendations.push('메모리 사용량이 정상 범위입니다.')
        }

        logger.debug('Memory trend analysis completed', {
            trend,
            averageUsage: `${(averageUsage * 100).toFixed(1)}%`,
            peakUsage: `${(peakUsage * 100).toFixed(1)}%`,
            currentUsage: `${(currentUsage * 100).toFixed(1)}%`
        })

        return { trend, averageUsage, peakUsage, currentUsage, recommendations }
    }

    // 메모리 누수 감지
    detectMemoryLeaks(): {
        suspected: boolean;
        evidence: string[];
        recommendations: string[];
    } {
        if (this.memoryHistory.length < 20) {
            return {
                suspected: false,
                evidence: [],
                recommendations: ['더 많은 데이터가 필요합니다.']
            }
        }

        const evidence: string[] = []
        const recommendations: string[] = []
        let suspected = false

        // 지속적인 메모리 증가 패턴 체크
        const recentHour = this.memoryHistory.slice(-20)
        const usageRatios = recentHour.map(s => s.heapUsed / s.heapTotal)

        let increasingCount = 0
        for (let i = 1; i < usageRatios.length; i++) {
            if (usageRatios[i] > usageRatios[i - 1]) {
                increasingCount++
            }
        }

        // 70% 이상 지속적으로 증가하면 누수 의심
        if (increasingCount / (usageRatios.length - 1) > 0.7) {
            suspected = true
            evidence.push('메모리 사용량이 지속적으로 증가하고 있습니다.')
        }

        // 높은 메모리 사용량 유지
        const highUsageCount = usageRatios.filter(ratio => ratio > 0.8).length
        if (highUsageCount / usageRatios.length > 0.5) {
            suspected = true
            evidence.push('높은 메모리 사용량이 지속되고 있습니다.')
        }

        // 권장사항
        if (suspected) {
            recommendations.push('메모리 프로파일링을 실행하세요.')
            recommendations.push('이벤트 리스너와 타이머를 확인하세요.')
            recommendations.push('순환 참조를 검사하세요.')
            recommendations.push('큰 객체들의 참조를 해제했는지 확인하세요.')
        }

        logger.info('Memory leak detection completed', {
            suspected,
            evidenceCount: evidence.length,
            recommendations: recommendations.length
        })

        return { suspected, evidence, recommendations }
    }

    // 강제 가비지 컬렉션
    forceGarbageCollection(): { success: boolean; beforeMB: number; afterMB: number; freedMB: number } {
        if (!global.gc) {
            logger.warn('Garbage collection not exposed. Use --expose-gc flag')
            return { success: false, beforeMB: 0, afterMB: 0, freedMB: 0 }
        }

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

        return { success: true, beforeMB, afterMB, freedMB }
    }

    // 메모리 경고 임계값 설정
    setMemoryThreshold(warningPercent: number = 80, criticalPercent: number = 90): void {
        if (warningPercent < 50 || criticalPercent > 95 || warningPercent >= criticalPercent) {
            logger.warn('Invalid memory thresholds. Using defaults.')
            return
        }

        logger.info('Memory thresholds updated', {
            warning: `${warningPercent}%`,
            critical: `${criticalPercent}%`
        })
    }

    // 메모리 히스토리 가져오기
    getMemoryHistory(limit: number = 20): MemoryStats[] {
        return this.memoryHistory.slice(-limit)
    }

    // 메모리 통계 요약
    getMemorySummary(): {
        current: MemoryStats;
        peak: MemoryStats;
        average: number;
        trend: string;
        health: 'good' | 'warning' | 'critical';
    } {
        const current = this.getCurrentMemoryStats()

        if (this.memoryHistory.length === 0) {
            return {
                current,
                peak: current,
                average: current.heapUsed / current.heapTotal,
                trend: 'stable',
                health: 'good'
            }
        }

        const peak = this.memoryHistory.reduce((max, snapshot) =>
            snapshot.heapUsed > max.heapUsed ? snapshot : max
        )

        const averageUsage = this.memoryHistory.reduce((sum, snapshot) =>
            sum + (snapshot.heapUsed / snapshot.heapTotal), 0
        ) / this.memoryHistory.length

        const trendAnalysis = this.analyzeMemoryTrend()

        let health: 'good' | 'warning' | 'critical'
        const currentUsage = current.heapUsed / current.heapTotal

        if (currentUsage > 0.9) {
            health = 'critical'
        } else if (currentUsage > 0.8 || trendAnalysis.trend === 'increasing') {
            health = 'warning'
        } else {
            health = 'good'
        }

        return {
            current,
            peak,
            average: averageUsage,
            trend: trendAnalysis.trend,
            health
        }
    }

    // 정리 함수
    cleanup(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval)
            this.monitoringInterval = undefined
        }

        this.memoryHistory = []
        logger.info('Memory monitor cleaned up')
    }
}