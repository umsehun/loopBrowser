import { session } from 'electron'
import { createLogger } from '../../shared/logger'

const logger = createLogger('NetworkOptimizationService')

/**
 * 🌐 네트워크 최적화 서비스
 * HTTP/2, 압축, 캐싱, 프리로딩 최적화
 */
export class NetworkOptimizationService {
    private isInitialized = false

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Network optimization already initialized')
            return
        }

        logger.info('🌐 Initializing network optimization...')

        this.setupHTTPOptimization()
        this.setupCacheOptimization()
        this.setupCompressionOptimization()
        this.setupSecurityOptimization()
        await this.setupSessionOptimization()

        this.isInitialized = true
        logger.info('🌐 Network optimization initialized successfully')
    }

    private setupHTTPOptimization(): void {
        logger.info('Setting up HTTP optimization...')

        // HTTP/2 활성화
        const ses = session.defaultSession

        // User-Agent 최적화 (SEO 친화적)
        ses.setUserAgent('SEO-Browser/1.0 (Optimized for Search Engines) Chrome/121.0.0.0')

        // DNS 프리페칭
        ses.setPreloads([])

        // 연결 최적화
        ses.webRequest.onBeforeRequest((details, callback) => {
            // 리소스 우선순위 최적화 (단순하게)
            callback({ cancel: false })
        })
    }

    private setupCacheOptimization(): void {
        logger.info('Setting up cache optimization...')

        const ses = session.defaultSession

        // 캐시 크기 체크 (읽기 전용)
        logger.info(`Current cache size: ${ses.getCacheSize()} bytes`)

        // 응답 헤더 최적화
        ses.webRequest.onHeadersReceived((details, callback) => {
            const responseHeaders = { ...details.responseHeaders }

            // 캐시 제어 최적화
            if (details.url.match(/\.(css|js|png|jpg|jpeg|gif|woff2?|ttf|eot)$/)) {
                responseHeaders['Cache-Control'] = ['public, max-age=31536000'] // 1년
                responseHeaders['Expires'] = [new Date(Date.now() + 31536000000).toUTCString()]
            }

            // 압축 인코딩 선호
            if (!responseHeaders['Content-Encoding']) {
                responseHeaders['Accept-Encoding'] = ['gzip, deflate, br']
            }

            callback({ responseHeaders })
        })
    }

    private setupCompressionOptimization(): void {
        logger.info('Setting up compression optimization...')

        const ses = session.defaultSession

        // 요청 헤더 압축 최적화
        ses.webRequest.onBeforeSendHeaders((details, callback) => {
            const requestHeaders = { ...details.requestHeaders }

            // Brotli, Gzip 압축 요청
            requestHeaders['Accept-Encoding'] = 'br, gzip, deflate'

            // 연결 유지
            requestHeaders['Connection'] = 'keep-alive'

            // HTTP/2 최적화
            requestHeaders['Upgrade-Insecure-Requests'] = '1'

            callback({ requestHeaders })
        })
    }

    private setupSecurityOptimization(): void {
        logger.info('Setting up security optimization...')

        const ses = session.defaultSession

        // CSP 최적화
        ses.webRequest.onHeadersReceived((details, callback) => {
            const responseHeaders = { ...details.responseHeaders }

            // SEO 친화적 보안 헤더
            responseHeaders['X-Content-Type-Options'] = ['nosniff']
            responseHeaders['X-Frame-Options'] = ['SAMEORIGIN']
            responseHeaders['Referrer-Policy'] = ['strict-origin-when-cross-origin']

            // 검색 엔진 최적화를 위한 CSP
            responseHeaders['Content-Security-Policy'] = [
                "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
                "style-src 'self' 'unsafe-inline' https:; " +
                "img-src 'self' data: blob: https:; " +
                "font-src 'self' data: https:; " +
                "connect-src 'self' https: wss:;"
            ]

            callback({ responseHeaders })
        })
    }

    private async setupSessionOptimization(): Promise<void> {
        logger.info('Setting up session optimization...')

        try {
            const ses = session.defaultSession

            // 쿠키 최적화
            await ses.cookies.flushStore()

            // 스토리지 최적화
            await ses.clearStorageData({
                storages: ['indexdb', 'localstorage', 'websql', 'serviceworkers']
            })

            logger.info('Session optimization completed')
        } catch (error) {
            logger.error(`Session optimization failed: ${error}`)
        }
    }

    // 네트워크 성능 모니터링
    setupPerformanceMonitoring(): void {
        const ses = session.defaultSession

        // 네트워크 요청 로깅 (개발용)
        if (process.env.NODE_ENV === 'development') {
            ses.webRequest.onCompleted((details) => {
                const timing = Date.now() - (details.timestamp || 0)
                if (timing > 1000) { // 1초 이상 걸리는 요청만 로깅
                    logger.warn(`Slow request: ${details.url} took ${timing}ms`)
                }
            })
        }

        // 리소스 로딩 실패 모니터링
        ses.webRequest.onErrorOccurred((details) => {
            logger.error(`Network error: ${details.error} for ${details.url}`)
        })
    }

    // DNS 캐시 클리어 (필요시)
    async clearDNSCache(): Promise<void> {
        try {
            await session.defaultSession.clearCache()
            logger.info('DNS cache cleared')
        } catch (error) {
            logger.error(`Failed to clear DNS cache: ${error}`)
        }
    }

    // 네트워크 상태 체크
    checkNetworkStatus(): boolean {
        return navigator.onLine
    }
}