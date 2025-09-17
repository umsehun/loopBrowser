import { createLogger, Logger } from '../../../shared/logger'
import { IOptimizationService, MemoryStats } from '../../../shared/types'

const logger = createLogger('PerformanceReportService')

export interface PerformanceReport {
    timestamp: Date;
    uptime: string;
    uptimeMs: number;
    memory: MemoryStats;
    logStats: {
        debug: number;
        info: number;
        warn: number;
        error: number;
        total: number;
    };
    health: 'excellent' | 'good' | 'warning' | 'critical';
    recommendations: string[];
}

/**
 * 📊 성능 리포트 서비스 (SRP: 성능 리포트 생성 및 관리만 담당)
 * - 종합 성능 리포트 생성
 * - 성능 히스토리 관리
 * - 성능 트렌드 분석
 * - 성능 등급 평가
 */
export class PerformanceReportService implements IOptimizationService {
    private isInitialized = false
    private startTime: number = Date.now()
    private reportHistory: PerformanceReport[] = []
    private maxReports = 50
    private reportingInterval?: NodeJS.Timeout

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Performance report service already initialized')
            return
        }

        logger.info('📊 Initializing performance report service...')

        this.startTime = Date.now()

        // 주기적 리포트 생성 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
            this.reportingInterval = setInterval(() => {
                this.generatePerformanceReport()
            }, 60000) // 1분마다
        }

        this.isInitialized = true
        logger.info('✅ Performance report service initialized successfully')
    }

    // 성능 리포트 생성
    generatePerformanceReport(): PerformanceReport {
        if (!this.isInitialized) {
            throw new Error('Performance report service not initialized')
        }

        const now = new Date()
        const uptimeMs = now.getTime() - this.startTime
        const uptime = this.formatUptime(uptimeMs)

        // 메모리 통계
        const memUsage = process.memoryUsage()
        const memory: MemoryStats = {
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external,
            heapUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
            timestamp: now
        }

        // 로그 통계
        const logs = Logger.getLogs()
        const logStats = logs.reduce((acc, log) => {
            acc[log.level] = (acc[log.level] || 0) + 1
            return acc
        }, {} as Record<number, number>)

        const logStatsFormatted = {
            debug: logStats[0] || 0,
            info: logStats[1] || 0,
            warn: logStats[2] || 0,
            error: logStats[3] || 0,
            total: logs.length
        }

        // 시스템 건강도 평가
        const health = this.evaluateSystemHealth(memory, logStatsFormatted, uptimeMs)

        // 권장사항 생성
        const recommendations = this.generateRecommendations(memory, logStatsFormatted, health)

        const report: PerformanceReport = {
            timestamp: now,
            uptime,
            uptimeMs,
            memory,
            logStats: logStatsFormatted,
            health,
            recommendations
        }

        // 리포트 히스토리에 추가
        this.reportHistory.push(report)
        if (this.reportHistory.length > this.maxReports) {
            this.reportHistory = this.reportHistory.slice(-this.maxReports)
        }

        logger.info('Performance report generated', {
            uptime,
            memoryUsage: `${memory.heapUsagePercent?.toFixed(1)}%`,
            health,
            errorCount: logStatsFormatted.error
        })

        return report
    }

    // 시스템 건강도 평가
    private evaluateSystemHealth(
        memory: MemoryStats,
        logStats: { error: number; warn: number; total: number },
        uptime: number
    ): 'excellent' | 'good' | 'warning' | 'critical' {
        const memoryUsage = memory.heapUsagePercent || 0
        const errorRate = logStats.total > 0 ? logStats.error / logStats.total : 0
        const warningRate = logStats.total > 0 ? logStats.warn / logStats.total : 0

        // 임계점들
        if (memoryUsage > 90 || errorRate > 0.1) {
            return 'critical'
        }

        if (memoryUsage > 80 || errorRate > 0.05 || warningRate > 0.2) {
            return 'warning'
        }

        if (memoryUsage < 60 && errorRate < 0.01 && warningRate < 0.1) {
            return 'excellent'
        }

        return 'good'
    }

    // 권장사항 생성
    private generateRecommendations(
        memory: MemoryStats,
        logStats: { error: number; warn: number; debug: number; total: number },
        health: string
    ): string[] {
        const recommendations: string[] = []
        const memoryUsage = memory.heapUsagePercent || 0

        // 메모리 관련 권장사항
        if (memoryUsage > 90) {
            recommendations.push('🚨 메모리 사용량이 매우 높습니다. 즉시 가비지 컬렉션을 실행하세요.')
        } else if (memoryUsage > 80) {
            recommendations.push('⚠️ 메모리 사용량이 높습니다. 메모리 최적화를 고려하세요.')
        } else if (memoryUsage < 30) {
            recommendations.push('✅ 메모리 사용량이 양호합니다.')
        }

        // 로그 관련 권장사항
        if (logStats.error > 0) {
            recommendations.push(`❌ ${logStats.error}개의 에러가 발생했습니다. 로그를 확인하세요.`)
        }

        if (logStats.warn > 10) {
            recommendations.push(`⚠️ ${logStats.warn}개의 경고가 발생했습니다. 잠재적 문제를 확인하세요.`)
        }

        // 디버그 로그가 너무 많으면
        if (logStats.debug > 1000) {
            recommendations.push('🔍 디버그 로그가 많습니다. 로그 레벨 조정을 고려하세요.')
        }

        // 건강도별 권장사항
        switch (health) {
            case 'excellent':
                recommendations.push('🌟 시스템이 최적 상태입니다!')
                break
            case 'good':
                recommendations.push('👍 시스템이 양호한 상태입니다.')
                break
            case 'warning':
                recommendations.push('⚠️ 시스템 성능을 점검하고 최적화하세요.')
                break
            case 'critical':
                recommendations.push('🚨 시스템이 위험 상태입니다. 즉시 조치가 필요합니다.')
                break
        }

        return recommendations
    }

    // 시간 포맷팅
    private formatUptime(ms: number): string {
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`
        } else {
            return `${seconds}s`
        }
    }

    // 성능 트렌드 분석
    analyzePerformanceTrend(): {
        memoryTrend: 'increasing' | 'decreasing' | 'stable';
        errorTrend: 'increasing' | 'decreasing' | 'stable';
        overallTrend: 'improving' | 'declining' | 'stable';
        insights: string[];
    } {
        if (this.reportHistory.length < 3) {
            return {
                memoryTrend: 'stable',
                errorTrend: 'stable',
                overallTrend: 'stable',
                insights: ['더 많은 데이터가 필요합니다.']
            }
        }

        const recentReports = this.reportHistory.slice(-10)

        // 메모리 트렌드
        const memoryUsages = recentReports.map(r => r.memory.heapUsagePercent || 0)
        const memoryTrend = this.calculateTrend(memoryUsages)

        // 에러 트렌드
        const errorCounts = recentReports.map(r => r.logStats.error)
        const errorTrend = this.calculateTrend(errorCounts)

        // 전반적 트렌드 (건강도 기반)
        const healthScores = recentReports.map(r => {
            switch (r.health) {
                case 'excellent': return 4
                case 'good': return 3
                case 'warning': return 2
                case 'critical': return 1
                default: return 2
            }
        })

        const overallTrend = this.calculateTrend(healthScores) === 'increasing' ? 'improving' :
            this.calculateTrend(healthScores) === 'decreasing' ? 'declining' : 'stable'

        // 인사이트 생성
        const insights = this.generateTrendInsights(memoryTrend, errorTrend, overallTrend)

        logger.info('Performance trend analysis completed', {
            memoryTrend,
            errorTrend,
            overallTrend,
            insights: insights.length
        })

        return { memoryTrend, errorTrend, overallTrend, insights }
    }

    // 트렌드 계산 헬퍼
    private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
        if (values.length < 2) return 'stable'

        const firstHalf = values.slice(0, Math.ceil(values.length / 2))
        const secondHalf = values.slice(Math.floor(values.length / 2))

        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length

        const threshold = Math.abs(firstAvg) * 0.1 // 10% 변화를 의미있는 변화로 간주

        if (secondAvg - firstAvg > threshold) {
            return 'increasing'
        } else if (firstAvg - secondAvg > threshold) {
            return 'decreasing'
        } else {
            return 'stable'
        }
    }

    // 트렌드 인사이트 생성
    private generateTrendInsights(
        memoryTrend: string,
        errorTrend: string,
        overallTrend: string
    ): string[] {
        const insights: string[] = []

        if (memoryTrend === 'increasing') {
            insights.push('메모리 사용량이 지속적으로 증가하고 있습니다. 메모리 누수를 확인하세요.')
        } else if (memoryTrend === 'decreasing') {
            insights.push('메모리 사용량이 개선되고 있습니다. 좋은 최적화가 진행 중입니다.')
        }

        if (errorTrend === 'increasing') {
            insights.push('에러 발생이 증가하고 있습니다. 시스템 안정성을 점검하세요.')
        } else if (errorTrend === 'decreasing') {
            insights.push('에러 발생이 감소하고 있습니다. 시스템이 안정화되고 있습니다.')
        }

        if (overallTrend === 'improving') {
            insights.push('전반적인 시스템 성능이 향상되고 있습니다.')
        } else if (overallTrend === 'declining') {
            insights.push('전반적인 시스템 성능이 저하되고 있습니다. 즉시 점검이 필요합니다.')
        }

        if (insights.length === 0) {
            insights.push('시스템 성능이 안정적으로 유지되고 있습니다.')
        }

        return insights
    }

    // 성능 비교 (두 리포트 간)
    compareReports(report1: PerformanceReport, report2: PerformanceReport): {
        memoryChange: number;
        uptimeChange: number;
        errorChange: number;
        healthImprovement: boolean;
        summary: string;
    } {
        const memoryChange = (report2.memory.heapUsagePercent || 0) - (report1.memory.heapUsagePercent || 0)
        const uptimeChange = report2.uptimeMs - report1.uptimeMs
        const errorChange = report2.logStats.error - report1.logStats.error

        const healthScores = { 'critical': 1, 'warning': 2, 'good': 3, 'excellent': 4 }
        const healthImprovement = healthScores[report2.health] > healthScores[report1.health]

        let summary = ''
        if (healthImprovement) {
            summary = '성능이 개선되었습니다.'
        } else if (healthScores[report2.health] < healthScores[report1.health]) {
            summary = '성능이 저하되었습니다.'
        } else {
            summary = '성능이 유지되고 있습니다.'
        }

        return { memoryChange, uptimeChange, errorChange, healthImprovement, summary }
    }

    // 리포트 히스토리 조회
    getReportHistory(limit: number = 10): PerformanceReport[] {
        return this.reportHistory.slice(-limit)
    }

    // 현재 성능 스냅샷
    getCurrentPerformanceSnapshot(): PerformanceReport {
        return this.generatePerformanceReport()
    }

    // 성능 경고 임계값 체크
    checkPerformanceThresholds(): {
        warnings: string[];
        critical: string[];
        healthy: string[];
    } {
        const current = this.generatePerformanceReport()
        const warnings: string[] = []
        const critical: string[] = []
        const healthy: string[] = []

        const memUsage = current.memory.heapUsagePercent || 0

        if (memUsage > 90) {
            critical.push(`메모리 사용량: ${memUsage.toFixed(1)}%`)
        } else if (memUsage > 80) {
            warnings.push(`메모리 사용량: ${memUsage.toFixed(1)}%`)
        } else {
            healthy.push(`메모리 사용량: ${memUsage.toFixed(1)}%`)
        }

        if (current.logStats.error > 0) {
            warnings.push(`에러 로그: ${current.logStats.error}개`)
        } else {
            healthy.push('에러 없음')
        }

        return { warnings, critical, healthy }
    }

    // 리포트 내보내기
    exportReport(report: PerformanceReport, format: 'json' | 'text' = 'text'): string {
        if (format === 'json') {
            return JSON.stringify(report, null, 2)
        }

        return `
성능 리포트
=========

생성 시간: ${report.timestamp.toLocaleString()}
가동 시간: ${report.uptime}
시스템 상태: ${report.health.toUpperCase()}

메모리 사용량:
- RSS: ${(report.memory.rss / 1024 / 1024).toFixed(2)} MB
- 힙 사용량: ${(report.memory.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(report.memory.heapTotal / 1024 / 1024).toFixed(2)} MB (${report.memory.heapUsagePercent?.toFixed(1)}%)
- 외부 메모리: ${(report.memory.external / 1024 / 1024).toFixed(2)} MB

로그 통계:
- 전체: ${report.logStats.total}개
- 에러: ${report.logStats.error}개
- 경고: ${report.logStats.warn}개
- 정보: ${report.logStats.info}개
- 디버그: ${report.logStats.debug}개

권장사항:
${report.recommendations.map(rec => `- ${rec}`).join('\n')}
        `.trim()
    }

    // 정리 함수
    cleanup(): void {
        if (this.reportingInterval) {
            clearInterval(this.reportingInterval)
            this.reportingInterval = undefined
        }

        this.reportHistory = []
        logger.info('Performance report service cleaned up')
    }
}