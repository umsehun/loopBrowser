// 중앙집권적 서비스 관리자
// 모든 최적화 서비스를 하나로 통합하여 Main.ts에서 쉽게 사용할 수 있도록 함

import { WebContents } from 'electron'
import { logger } from '../../shared/logger/index'

// 최적화 서비스들 가져오기
import { networkService, NetworkService } from './optimization/NetworkService'
import { v8Service, V8Service } from './optimization/V8Service'
import { seoService, SEOService } from './optimization/SEOService'
import { memoryService, MemoryService } from './optimization/MemoryService'

// 기존 서비스들
import { devToolsService, DevToolsService } from './DevToolsService'
import { tabService, TabService } from './TabService'
import { settingsService, SettingsService } from './SettingsService'

export interface ServiceManagerConfig {
    enableNetworkOptimization: boolean
    enableV8Optimization: boolean
    enableSEOOptimization: boolean
    enableMemoryOptimization: boolean
    enablePerformanceMonitoring: boolean
    // 최적화 레벨 설정 (성능 회귀 방지)
    optimizationLevel: 'minimal' | 'balanced' | 'aggressive'
    // 모니터링 간격 (기본 5분으로 변경)
    monitoringIntervalMs: number
}

export interface PerformanceMetrics {
    network: any
    memory: any
    v8: any
    seo: number
    overall: number
    timestamp: number
}

export class ServiceManager {
    private static instance: ServiceManager
    private config: ServiceManagerConfig = {
        enableNetworkOptimization: true,
        enableV8Optimization: true,
        enableSEOOptimization: true,
        enableMemoryOptimization: true,
        enablePerformanceMonitoring: false, // 기본적으로 비활성화
        optimizationLevel: 'balanced', // 균형잡힌 최적화
        monitoringIntervalMs: 300000 // 5분 (300초)
    }
    private performanceHistory: PerformanceMetrics[] = []
    private monitoringInterval: NodeJS.Timeout | null = null

    constructor() {
        logger.info('ServiceManager initialized')
    }

    static getInstance(): ServiceManager {
        if (!ServiceManager.instance) {
            ServiceManager.instance = new ServiceManager()
        }
        return ServiceManager.instance
    }

    // 모든 서비스 초기화
    async initializeAllServices(): Promise<void> {
        try {
            logger.info('Initializing all services...')

            // 기존 서비스들 초기화
            await this.initializeCoreServices()

            // 최적화 서비스들 초기화
            await this.initializeOptimizationServices()

            // 성능 모니터링 시작
            if (this.config.enablePerformanceMonitoring) {
                await this.startPerformanceMonitoring()
            }

            logger.info('All services initialized successfully')
        } catch (error) {
            logger.error('Failed to initialize services', { error })
            throw error
        }
    }

    // 핵심 서비스들 초기화
    private async initializeCoreServices(): Promise<void> {
        try {
            // SettingsService 초기화
            await settingsService.initialize()

            // 다른 핵심 서비스들은 이미 초기화됨
            logger.debug('Core services initialized')
        } catch (error) {
            logger.error('Failed to initialize core services', { error })
            throw error
        }
    }

    // 최적화 서비스들 초기화
    private async initializeOptimizationServices(): Promise<void> {
        try {
            const initPromises = []

            if (this.config.enableNetworkOptimization) {
                initPromises.push(networkService.optimizeNetwork())
            }

            if (this.config.enableV8Optimization) {
                initPromises.push(v8Service.optimizeV8Engine())
            }

            if (this.config.enableSEOOptimization) {
                initPromises.push(seoService.optimizeSEO())
            }

            if (this.config.enableMemoryOptimization) {
                initPromises.push(memoryService.optimizeMemory())
            }

            await Promise.all(initPromises)
            logger.debug('Optimization services initialized')
        } catch (error) {
            logger.error('Failed to initialize optimization services', { error })
            throw error
        }
    }

    // WebContents별 최적화 적용 (선택적 최적화)
    optimizeWebContents(webContents: WebContents): void {
        try {
            const level = this.config.optimizationLevel

            // 최소 최적화: 필수적인 것만
            if (level === 'minimal') {
                if (this.config.enableMemoryOptimization) {
                    memoryService.optimizeWebContents(webContents)
                }
                logger.debug('Minimal WebContents optimization applied')
                return
            }

            // 균형 최적화: 성능과 안정성 균형
            if (level === 'balanced') {
                if (this.config.enableNetworkOptimization) {
                    networkService.optimizeWebContents(webContents)
                }

                if (this.config.enableMemoryOptimization) {
                    memoryService.optimizeWebContents(webContents)
                }

                logger.debug('Balanced WebContents optimization applied')
                return
            }

            // 공격적 최적화: 모든 최적화 적용
            if (level === 'aggressive') {
                if (this.config.enableNetworkOptimization) {
                    networkService.optimizeWebContents(webContents)
                }

                if (this.config.enableV8Optimization) {
                    v8Service.optimizeWebContents(webContents)
                }

                if (this.config.enableSEOOptimization) {
                    seoService.optimizeWebContents(webContents)
                }

                if (this.config.enableMemoryOptimization) {
                    memoryService.optimizeWebContents(webContents)
                }

                logger.debug('Aggressive WebContents optimization applied')
            }

        } catch (error) {
            logger.error('Failed to optimize WebContents', { error })
        }
    }

    // 성능 모니터링 시작 (간격 조정됨)
    private async startPerformanceMonitoring(): Promise<void> {
        try {
            // 모니터링이 비활성화되어 있으면 실행하지 않음
            if (!this.config.enablePerformanceMonitoring) {
                logger.debug('Performance monitoring is disabled')
                return
            }

            this.monitoringInterval = setInterval(async () => {
                await this.collectPerformanceMetrics()
            }, this.config.monitoringIntervalMs) // 설정 가능한 간격 사용

            logger.debug(`Performance monitoring started with ${this.config.monitoringIntervalMs / 1000}s interval`)
        } catch (error) {
            logger.error('Failed to start performance monitoring', { error })
        }
    }

    // 성능 메트릭 수집
    private async collectPerformanceMetrics(): Promise<void> {
        try {
            const metrics: PerformanceMetrics = {
                network: await networkService.getNetworkStats(),
                memory: memoryService.generateMemoryReport(),
                v8: v8Service.getMemoryStats(),
                seo: 0, // SEO 점수는 WebContents가 있을 때만 계산 가능
                overall: 0,
                timestamp: Date.now()
            }

            // 전체 성능 점수 계산
            metrics.overall = this.calculateOverallScore(metrics)

            this.performanceHistory.push(metrics)

            // 최근 100개 기록만 유지
            if (this.performanceHistory.length > 100) {
                this.performanceHistory = this.performanceHistory.slice(-100)
            }

            // 성능 경고 확인
            this.checkPerformanceAlerts(metrics)

        } catch (error) {
            logger.error('Failed to collect performance metrics', { error })
        }
    }

    // 전체 성능 점수 계산
    private calculateOverallScore(metrics: PerformanceMetrics): number {
        let score = 100

        // 메모리 사용률에 따른 점수 차감
        const memoryStatus = metrics.memory.status
        if (memoryStatus === 'critical') {
            score -= 40
        } else if (memoryStatus === 'warning') {
            score -= 20
        }

        // V8 힙 사용률에 따른 점수 차감
        const heapUsage = metrics.v8.heapUsed / metrics.v8.heapLimit
        if (heapUsage > 0.8) {
            score -= 20
        } else if (heapUsage > 0.6) {
            score -= 10
        }

        return Math.max(0, score)
    }

    // 성능 경고 확인 (덜 공격적으로 변경)
    private checkPerformanceAlerts(metrics: PerformanceMetrics): void {
        // 긴급 최적화는 더 엄격한 조건에서만 실행
        if (metrics.overall < 40 && this.config.optimizationLevel === 'aggressive') {
            logger.warn('Critical performance detected - emergency optimization triggered', {
                score: metrics.overall,
                memory: metrics.memory.status,
                v8HeapUsage: `${metrics.v8.heapUsed}MB`
            })

            // 긴급 최적화 수행
            this.performEmergencyOptimization()
        } else if (metrics.overall < 60) {
            // 경고만 로그
            logger.warn('Low performance detected', {
                score: metrics.overall,
                memory: metrics.memory.status,
                level: this.config.optimizationLevel
            })
        }
    }

    // 긴급 최적화 수행
    private performEmergencyOptimization(): void {
        try {
            logger.warn('Performing emergency optimization...')

            // 강제 가비지 컬렉션
            v8Service.forceGC()

            // 메모리 정리
            memoryService.cleanup()

            logger.warn('Emergency optimization completed')
        } catch (error) {
            logger.error('Failed to perform emergency optimization', { error })
        }
    }

    // 성능 보고서 생성
    generatePerformanceReport(): any {
        const latest = this.performanceHistory[this.performanceHistory.length - 1]
        const history = this.performanceHistory.slice(-20) // 최근 20개

        return {
            current: latest,
            history: history,
            averageScore: history.reduce((sum, m) => sum + m.overall, 0) / history.length,
            trends: {
                memory: this.calculateTrend(history.map(h => h.memory.current.heapUsed)),
                v8: this.calculateTrend(history.map(h => h.v8.heapUsed)),
                overall: this.calculateTrend(history.map(h => h.overall))
            },
            config: this.config
        }
    }

    // 트렌드 계산
    private calculateTrend(values: number[]): string {
        if (values.length < 2) return 'stable'

        const first = values[0]
        const last = values[values.length - 1]
        const change = ((last - first) / first) * 100

        if (change > 10) return 'increasing'
        if (change < -10) return 'decreasing'
        return 'stable'
    }

    // 서비스별 접근자
    get network(): NetworkService { return networkService }
    get v8(): V8Service { return v8Service }
    get seo(): SEOService { return seoService }
    get memory(): MemoryService { return memoryService }
    get devTools(): DevToolsService { return devToolsService }
    get tab(): TabService { return tabService }
    get settings(): SettingsService { return settingsService }

    // V8 최적화 플래그 가져오기 (PerformanceOptimizer에서 사용)
    getV8Flags(): string[] {
        return v8Service.getV8Flags()
    }

    // 설정 업데이트
    updateConfig(newConfig: Partial<ServiceManagerConfig>): void {
        this.config = { ...this.config, ...newConfig }
        logger.info('ServiceManager configuration updated', this.config)
    }

    // 정리 작업
    async cleanup(): Promise<void> {
        try {
            logger.info('Cleaning up all services...')

            // 모니터링 중지
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval)
                this.monitoringInterval = null
            }

            // 각 서비스 정리
            const cleanupPromises = [
                networkService.cleanup(),
                v8Service.cleanup(),
                seoService.cleanup(),
                memoryService.cleanup()
            ]

            await Promise.allSettled(cleanupPromises)

            logger.info('All services cleanup completed')
        } catch (error) {
            logger.error('Error during services cleanup', { error })
        }
    }
}

// 싱글톤 인스턴스 내보내기
export const serviceManager = ServiceManager.getInstance()

// 개별 서비스들도 내보내기 (하위 호환성)
export {
    networkService,
    v8Service,
    seoService,
    memoryService,
    devToolsService,
    tabService,
    settingsService
}

export default serviceManager