import { session } from 'electron'
import { createLogger } from '../../../shared/logger'
import { NetworkStats, IMonitoringService, PERFORMANCE_THRESHOLDS } from '../../../shared/types'

const logger = createLogger('NetworkMonitoringService')

/**
 * 📊 네트워크 모니터링 서비스 (SRP: 네트워크 상태 모니터링만 담당)
 * - 네트워크 에러 추적
 * - 성능 모니터링
 * - 요청 통계
 * - 느린 요청 감지
 */
export class NetworkMonitoringService implements IMonitoringService {
    private isInitialized = false
    private stats: NetworkStats = {
        totalRequests: 0,
        errorRequests: 0,
        slowRequests: 0,
        errorRate: 0
    }
    private slowRequestThreshold: number = PERFORMANCE_THRESHOLDS.SLOW_REQUEST_MS

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Network monitoring already initialized')
            return
        }

        logger.info('📊 Initializing network monitoring...')

        try {
            this.setupNetworkMonitoring()
            this.isInitialized = true
            logger.info('✅ Network monitoring initialized successfully')
        } catch (error) {
            logger.error('Failed to initialize network monitoring', error)
            throw error
        }
    }

    private setupNetworkMonitoring(): void {
        const ses = session.defaultSession

        // 요청 시작 추적
        ses.webRequest.onBeforeRequest((details) => {
            this.stats.totalRequests++
            logger.debug(`Request started: ${details.url}`)
        })

        // 요청 완료 추적
        ses.webRequest.onCompleted((details) => {
            const duration = Date.now() - details.timestamp

            if (duration > this.slowRequestThreshold) {
                this.stats.slowRequests++
                logger.warn(`Slow request detected: ${details.url} took ${duration}ms`)
            } else {
                logger.debug(`Request completed: ${details.url} in ${duration}ms`)
            }
        })

        // 에러 추적 (중요!)
        ses.webRequest.onErrorOccurred((details) => {
            this.stats.errorRequests++
            this.updateErrorRate()

            // 특정 에러들은 로그 레벨을 낮춤 (너무 많은 로그 방지)
            if (this.isIgnorableError(details.error)) {
                logger.debug(`Ignorable network error: ${details.error} for ${details.url}`)
            } else {
                logger.error(`Network error: ${details.error} for ${details.url}`)
            }
        })

        // 주기적 통계 보고 (개발 모드에서만)
        if (process.env.NODE_ENV === 'development') {
            setInterval(() => {
                this.logStats()
            }, 30000) // 30초마다
        }
    }

    // 무시 가능한 에러인지 판별
    private isIgnorableError(error: string): boolean {
        const ignorableErrors = [
            'net::ERR_ABORTED',        // 사용자가 중단한 요청
            'net::ERR_CACHE_MISS',     // 캐시 미스 (정상)
            'net::ERR_BLOCKED_BY_CLIENT' // 광고 차단기 등
        ]

        return ignorableErrors.some(ignorable => error.includes(ignorable))
    }

    // 에러율 업데이트
    private updateErrorRate(): void {
        if (this.stats.totalRequests > 0) {
            this.stats.errorRate = (this.stats.errorRequests / this.stats.totalRequests) * 100
        }
    }

    // 통계 로깅
    private logStats(): void {
        if (this.stats.totalRequests === 0) return

        logger.info('Network Statistics', {
            totalRequests: this.stats.totalRequests,
            errorRequests: this.stats.errorRequests,
            slowRequests: this.stats.slowRequests,
            errorRate: `${this.stats.errorRate.toFixed(2)}%`
        })
    }

    // 공개 메서드들
    getStats(): NetworkStats {
        this.updateErrorRate()
        return { ...this.stats }
    }

    resetStats(): void {
        this.stats = {
            totalRequests: 0,
            errorRequests: 0,
            slowRequests: 0,
            errorRate: 0
        }
        logger.info('Network statistics reset')
    }

    // 네트워크 상태 체크
    isOnline(): boolean {
        return navigator.onLine
    }

    // 성능 임계값 설정
    setSlowRequestThreshold(ms: number): void {
        this.slowRequestThreshold = ms
        logger.info(`Slow request threshold set to ${ms}ms`)
    }
}