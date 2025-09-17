import { session } from 'electron'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('CacheOptimizationService')

/**
 * 💾 캐시 최적화 서비스 (SRP: 캐시 관련 최적화만 담당)
 * - 캐시 크기 관리
 * - 응답 헤더 최적화
 * - 캐시 제어 정책
 * - 정적 리소스 캐싱
 */
export class CacheOptimizationService {
    private isInitialized = false

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Cache optimization already initialized')
            return
        }

        logger.info('💾 Initializing cache optimization...')

        try {
            await this.setupCacheOptimization()
            this.isInitialized = true
            logger.info('✅ Cache optimization initialized successfully')
        } catch (error) {
            logger.error('Failed to initialize cache optimization', error)
            throw error
        }
    }

    private async setupCacheOptimization(): Promise<void> {
        try {
            const ses = session.defaultSession

            // 현재 캐시 크기 체크
            const cacheSize = await ses.getCacheSize()
            logger.info(`Current cache size: ${(cacheSize / 1024 / 1024).toFixed(2)} MB`)

            // 응답 헤더 최적화
            ses.webRequest.onHeadersReceived((details, callback) => {
                const responseHeaders = { ...details.responseHeaders }

                // 정적 리소스 캐시 제어 최적화
                if (this.isStaticResource(details.url)) {
                    // 1년간 캐시
                    responseHeaders['Cache-Control'] = ['public, max-age=31536000']
                    responseHeaders['Expires'] = [new Date(Date.now() + 31536000000).toUTCString()]
                    logger.debug(`Cached static resource: ${details.url}`)
                } else if (this.isAPIResource(details.url)) {
                    // API 응답은 5분간 캐시
                    responseHeaders['Cache-Control'] = ['public, max-age=300']
                    logger.debug(`Cached API resource: ${details.url}`)
                }

                // 압축 인코딩 선호 설정
                if (!responseHeaders['Content-Encoding']) {
                    responseHeaders['Accept-Encoding'] = ['gzip, deflate, br']
                }

                callback({ responseHeaders })
            })

            logger.info('Cache optimization setup completed')
        } catch (error) {
            logger.error('Cache optimization setup failed', error)
            throw error
        }
    }

    // 정적 리소스 판별
    private isStaticResource(url: string): boolean {
        const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.ico']
        return staticExtensions.some(ext => url.includes(ext))
    }

    // API 리소스 판별
    private isAPIResource(url: string): boolean {
        return url.includes('/api/') || url.includes('/v1/') || url.includes('/v2/')
    }

    // 캐시 클리어
    async clearCache(): Promise<void> {
        try {
            await session.defaultSession.clearCache()
            logger.info('Cache cleared successfully')
        } catch (error) {
            logger.error('Failed to clear cache', error)
            throw error
        }
    }

    // 캐시 통계 가져오기
    async getCacheStats(): Promise<{ size: number; sizeFormatted: string }> {
        try {
            const size = await session.defaultSession.getCacheSize()
            const sizeFormatted = `${(size / 1024 / 1024).toFixed(2)} MB`

            logger.debug('Cache stats retrieved', { size, sizeFormatted })

            return { size, sizeFormatted }
        } catch (error) {
            logger.error('Failed to get cache stats', error)
            return { size: 0, sizeFormatted: '0 MB' }
        }
    }
}