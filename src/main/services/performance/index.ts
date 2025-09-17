/**
 * 📊 Performance Services - Index (SRP + SOLID 적용)
 * 
 * 성능 모니터링을 위한 모든 서비스들을 중앙에서 export
 * - MemoryMonitorService: 메모리 모니터링 및 분석
 * - PerformanceReportService: 성능 리포트 생성 및 관리
 * - MetricsCollectorService: 시스템 메트릭 수집 및 분석
 */

// 개별 Performance 서비스들 export
export { MemoryMonitorService } from './MemoryMonitorService';
export { PerformanceReportService } from './PerformanceReportService';
export { MetricsCollectorService } from './MetricsCollectorService';

// 타입들 re-export
export type {
    IOptimizationService,
    MemoryStats
} from '../../../shared/types';

export type { PerformanceReport } from './PerformanceReportService';
export type { SystemMetrics } from './MetricsCollectorService';

// 통합 성능 대시보드 관리자
import { createLogger } from '../../../shared/logger';
import { IOptimizationService } from '../../../shared/types';
import { MemoryMonitorService } from './MemoryMonitorService';
import { PerformanceReportService, PerformanceReport } from './PerformanceReportService';
import { MetricsCollectorService, SystemMetrics } from './MetricsCollectorService';

const logger = createLogger('PerformanceDashboardManager');

/**
 * 🎯 성능 대시보드 통합 관리자
 * 모든 성능 서비스들을 조합하여 통합 관리
 */
export class PerformanceDashboard implements IOptimizationService {
    private isInitialized = false;
    private memoryMonitor: MemoryMonitorService;
    private reportService: PerformanceReportService;
    private metricsCollector: MetricsCollectorService;

    constructor() {
        this.memoryMonitor = new MemoryMonitorService();
        this.reportService = new PerformanceReportService();
        this.metricsCollector = new MetricsCollectorService();
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Performance dashboard already initialized');
            return;
        }

        logger.info('📊 Initializing performance dashboard...');

        try {
            // 순차적으로 초기화
            await this.memoryMonitor.initialize();
            await this.reportService.initialize();
            await this.metricsCollector.initialize();

            this.isInitialized = true;
            logger.info('✅ Performance dashboard initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize performance dashboard', error);
            throw error;
        }
    }

    // 종합 성능 보고서 생성
    generatePerformanceReport(): PerformanceReport {
        if (!this.isInitialized) {
            throw new Error('Performance dashboard not initialized');
        }

        return this.reportService.generatePerformanceReport();
    }

    // 현재 성능 스냅샷
    async getCurrentPerformanceSnapshot(): Promise<{
        report: PerformanceReport;
        metrics: SystemMetrics;
        memory: any;
    }> {
        if (!this.isInitialized) {
            throw new Error('Performance dashboard not initialized');
        }

        return {
            report: this.reportService.getCurrentPerformanceSnapshot(),
            metrics: await this.metricsCollector.getCurrentMetrics(),
            memory: this.memoryMonitor.getCurrentMemoryStats()
        };
    }

    // 성능 트렌드 분석
    analyzePerformanceTrends(): {
        performance: any;
        memory: any;
        metrics: any;
        overall: {
            status: 'excellent' | 'good' | 'warning' | 'critical';
            recommendations: string[];
        };
    } {
        if (!this.isInitialized) {
            throw new Error('Performance dashboard not initialized');
        }

        const performanceTrend = this.reportService.analyzePerformanceTrend();
        const memoryTrend = this.memoryMonitor.analyzeMemoryTrend();
        const metricsTrend = this.metricsCollector.analyzeMetrics();

        // 전반적 상태 평가
        let overallStatus: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
        const recommendations: string[] = [];

        // 메모리 상태 평가
        if (memoryTrend.currentUsage > 0.9 || memoryTrend.trend === 'increasing') {
            overallStatus = 'critical';
            recommendations.push('메모리 사용량이 위험 수준입니다.');
        } else if (memoryTrend.currentUsage > 0.8) {
            if (overallStatus === 'good') overallStatus = 'warning';
            recommendations.push('메모리 사용량이 높습니다.');
        }

        // 성능 메트릭 평가
        if (metricsTrend.performance.averageEventLoopDelay > 10) {
            if (overallStatus === 'good') overallStatus = 'warning';
            recommendations.push('이벤트 루프 지연이 높습니다.');
        }

        // 추가 권장사항 병합
        recommendations.push(...memoryTrend.recommendations);
        recommendations.push(...metricsTrend.insights);

        // 우수한 상태일 때
        if (overallStatus === 'good' && memoryTrend.currentUsage < 0.6 && metricsTrend.performance.averageEventLoopDelay < 2) {
            overallStatus = 'excellent';
        }

        logger.info('Performance trends analyzed', {
            overallStatus,
            memoryTrend: memoryTrend.trend,
            recommendationCount: recommendations.length
        });

        return {
            performance: performanceTrend,
            memory: memoryTrend,
            metrics: metricsTrend,
            overall: { status: overallStatus, recommendations }
        };
    }

    // 메모리 누수 감지
    detectMemoryLeaks() {
        return this.memoryMonitor.detectMemoryLeaks();
    }

    // 강제 가비지 컬렉션
    forceGarbageCollection() {
        return this.memoryMonitor.forceGarbageCollection();
    }

    // 성능 벤치마크 실행
    async runPerformanceBenchmark(): Promise<{
        memory: any;
        metrics: SystemMetrics;
        report: PerformanceReport;
        benchmark: {
            duration: number;
            memoryBefore: any;
            memoryAfter: any;
            improvement: number;
        };
    }> {
        if (!this.isInitialized) {
            throw new Error('Performance dashboard not initialized');
        }

        logger.info('Starting performance benchmark...');
        const startTime = performance.now();

        // 벤치마크 전 상태
        const memoryBefore = this.memoryMonitor.getCurrentMemoryStats();

        // 간단한 성능 테스트 실행
        await this.runSimplePerformanceTest();

        // 벤치마크 후 상태
        const memoryAfter = this.memoryMonitor.getCurrentMemoryStats();
        const metrics = await this.metricsCollector.getCurrentMetrics();
        const report = this.reportService.generatePerformanceReport();

        const duration = performance.now() - startTime;
        const improvement = this.calculatePerformanceImprovement(memoryBefore, memoryAfter);

        const results = {
            memory: this.memoryMonitor.analyzeMemoryTrend(),
            metrics,
            report,
            benchmark: {
                duration,
                memoryBefore,
                memoryAfter,
                improvement
            }
        };

        logger.info('Performance benchmark completed', {
            duration: `${duration.toFixed(2)}ms`,
            improvement: `${improvement.toFixed(1)}%`,
            memoryUsage: `${((memoryAfter.heapUsed / memoryAfter.heapTotal) * 100).toFixed(1)}%`
        });

        return results;
    }

    // 간단한 성능 테스트
    private async runSimplePerformanceTest(): Promise<void> {
        // CPU 집약적 작업 시뮬레이션
        const iterations = 100000;
        let result = 0;

        for (let i = 0; i < iterations; i++) {
            result += Math.random() * Math.sin(i) * Math.cos(i);
        }

        // 메모리 할당 테스트
        const arrays: number[][] = [];
        for (let i = 0; i < 100; i++) {
            arrays.push(new Array(1000).fill(Math.random()));
        }

        // 비동기 작업 테스트
        await Promise.all([
            new Promise(resolve => setTimeout(resolve, 10)),
            new Promise(resolve => setImmediate(resolve)),
            new Promise(resolve => process.nextTick(resolve))
        ]);

        // 정리
        arrays.length = 0;
    }

    // 성능 개선도 계산
    private calculatePerformanceImprovement(before: any, after: any): number {
        const beforeUsage = (before.heapUsed / before.heapTotal) * 100;
        const afterUsage = (after.heapUsed / after.heapTotal) * 100;

        return beforeUsage - afterUsage; // 양수면 개선, 음수면 악화
    }

    // 실시간 모니터링 시작
    startRealTimeMonitoring(callback: (data: any) => void): void {
        if (!this.isInitialized) {
            throw new Error('Performance dashboard not initialized');
        }

        logger.info('Starting real-time performance monitoring');

        this.metricsCollector.startRealTimeMonitoring((metrics) => {
            const memoryStats = this.memoryMonitor.getCurrentMemoryStats();
            const report = this.reportService.generatePerformanceReport();

            callback({
                timestamp: new Date(),
                metrics,
                memory: memoryStats,
                report: {
                    health: report.health,
                    uptime: report.uptime,
                    memoryUsage: report.memory.heapUsagePercent
                }
            });
        });
    }

    // 성능 알림 설정
    setPerformanceAlerts(config: {
        memoryThreshold?: number;
        eventLoopThreshold?: number;
        autoGC?: boolean;
    }): void {
        logger.info('Performance alerts configured', config);

        if (config.memoryThreshold) {
            this.memoryMonitor.setMemoryThreshold(config.memoryThreshold);
        }

        if (config.eventLoopThreshold) {
            this.metricsCollector.setPerformanceThresholds({
                eventLoopDelayWarning: config.eventLoopThreshold
            });
        }
    }

    // 리포트 히스토리 조회
    getReportHistory(limit: number = 10) {
        return this.reportService.getReportHistory(limit);
    }

    // 메트릭 히스토리 조회
    getMetricsHistory(limit: number = 50) {
        return this.metricsCollector.getMetricsHistory(limit);
    }

    // 메모리 히스토리 조회
    getMemoryHistory(limit: number = 20) {
        return this.memoryMonitor.getMemoryHistory(limit);
    }

    // 성능 데이터 내보내기
    exportPerformanceData(format: 'json' | 'csv' = 'json'): {
        reports: string;
        metrics: string;
        memory: string;
    } {
        const reports = this.reportService.exportReport(
            this.reportService.getCurrentPerformanceSnapshot(),
            format === 'json' ? 'json' : 'text'
        );

        const metrics = this.metricsCollector.exportMetrics(format);

        // 메모리 데이터는 JSON으로만 내보내기
        const memory = JSON.stringify(this.memoryMonitor.getMemoryHistory(), null, 2);

        return { reports, metrics, memory };
    }

    // 성능 요약 가져오기
    getPerformanceSummary(): {
        uptime: string;
        memoryHealth: string;
        performanceGrade: string;
        recommendations: string[];
        lastReport: Date;
    } {
        if (!this.isInitialized) {
            throw new Error('Performance dashboard not initialized');
        }

        const report = this.reportService.getCurrentPerformanceSnapshot();
        const memoryAnalysis = this.memoryMonitor.analyzeMemoryTrend();
        const trends = this.analyzePerformanceTrends();

        return {
            uptime: report.uptime,
            memoryHealth: memoryAnalysis.trend,
            performanceGrade: trends.overall.status.toUpperCase(),
            recommendations: trends.overall.recommendations.slice(0, 3), // 상위 3개만
            lastReport: report.timestamp
        };
    }

    // 정리 함수
    cleanup(): void {
        this.memoryMonitor.cleanup();
        this.reportService.cleanup();
        this.metricsCollector.cleanup();

        logger.info('Performance dashboard cleaned up');
    }
}