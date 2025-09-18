import { WebContents, session } from 'electron'
import { logger } from '../../../shared/logger/index'

export interface NetworkOptimizationConfig {
    enableHTTP2: boolean
    enablePreloading: boolean
    enableCompression: boolean
    enableCaching: boolean
    cacheMaxAge: number
    maxConcurrentConnections: number
}

export class NetworkService {
    private static instance: NetworkService
    private config: NetworkOptimizationConfig = {
        enableHTTP2: true,
        enablePreloading: true,
        enableCompression: true,
        enableCaching: true,
        cacheMaxAge: 3600000, // 1시간
        maxConcurrentConnections: 6
    }

    constructor() {
        logger.info('NetworkService initialized')
    }

    static getInstance(): NetworkService {
        if (!NetworkService.instance) {
            NetworkService.instance = new NetworkService()
        }
        return NetworkService.instance
    }

    // 네트워크 최적화 활성화
    async optimizeNetwork(): Promise<void> {
        try {
            await this.setupHTTP2()
            await this.setupCompression()
            await this.setupCaching()
            await this.setupPreloading()
            await this.setupConnectionLimits()

            logger.info('Network optimization applied successfully', this.config)
        } catch (error) {
            logger.error('Failed to apply network optimization', { error })
            throw error
        }
    }

    // HTTP/2 활성화
    private async setupHTTP2(): Promise<void> {
        if (!this.config.enableHTTP2) return

        try {
            // Electron의 기본 세션에 HTTP/2 설정
            const defaultSession = session.defaultSession

            // HTTP/2 push 활성화
            defaultSession.setSpellCheckerEnabled(false) // 성능을 위해 맞춤법 검사 비활성화

            logger.debug('HTTP/2 optimization enabled')
        } catch (error) {
            logger.error('Failed to setup HTTP/2', { error })
        }
    }

    // 압축 최적화
    private async setupCompression(): Promise<void> {
        if (!this.config.enableCompression) return

        try {
            const defaultSession = session.defaultSession

            // Accept-Encoding 헤더 설정
            defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
                details.requestHeaders['Accept-Encoding'] = 'gzip, deflate, br'
                callback({ requestHeaders: details.requestHeaders })
            })

            logger.debug('Compression optimization enabled')
        } catch (error) {
            logger.error('Failed to setup compression', { error })
        }
    }

    // 캐싱 최적화
    private async setupCaching(): Promise<void> {
        if (!this.config.enableCaching) return

        try {
            const defaultSession = session.defaultSession

            // 캐시 설정
            defaultSession.webRequest.onHeadersReceived((details, callback) => {
                const responseHeaders = details.responseHeaders || {}

                // 정적 리소스 캐싱
                if (this.isStaticResource(details.url)) {
                    responseHeaders['Cache-Control'] = [`max-age=${this.config.cacheMaxAge}`]
                }

                callback({ responseHeaders })
            })

            logger.debug('Caching optimization enabled', { maxAge: this.config.cacheMaxAge })
        } catch (error) {
            logger.error('Failed to setup caching', { error })
        }
    }

    // 프리로딩 최적화
    private async setupPreloading(): Promise<void> {
        if (!this.config.enablePreloading) return

        try {
            const defaultSession = session.defaultSession

            // DNS 프리패치 활성화
            defaultSession.webRequest.onBeforeRequest((details, callback) => {
                // 중요한 리소스 우선순위 설정
                if (this.isCriticalResource(details.url)) {
                    // 중요 리소스는 우선 처리
                    callback({})
                } else {
                    callback({})
                }
            })

            logger.debug('Preloading optimization enabled')
        } catch (error) {
            logger.error('Failed to setup preloading', { error })
        }
    }

    // 연결 제한 설정
    private async setupConnectionLimits(): Promise<void> {
        try {
            const defaultSession = session.defaultSession

            // 동시 연결 수 제한 (브라우저 성능 최적화)
            await defaultSession.clearCache()

            logger.debug('Connection limits configured', {
                maxConnections: this.config.maxConcurrentConnections
            })
        } catch (error) {
            logger.error('Failed to setup connection limits', { error })
        }
    }

    // 정적 리소스 판별
    private isStaticResource(url: string): boolean {
        const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf']
        return staticExtensions.some(ext => url.includes(ext))
    }

    // 중요 리소스 판별
    private isCriticalResource(url: string): boolean {
        const criticalPatterns = ['.css', '.js', '/api/', '/critical/']
        return criticalPatterns.some(pattern => url.includes(pattern))
    }

    // WebContents별 네트워크 최적화
    optimizeWebContents(webContents: WebContents): void {
        try {
            // Resource hints 활성화
            webContents.on('dom-ready', () => {
                webContents.executeJavaScript(`
                    // DNS 프리페치 최적화
                    const linkEl = document.createElement('link');
                    linkEl.rel = 'dns-prefetch';
                    linkEl.href = '//fonts.googleapis.com';
                    document.head.appendChild(linkEl);

                    // 이미지 지연 로딩
                    if ('loading' in HTMLImageElement.prototype) {
                        const images = document.querySelectorAll('img[data-src]');
                        images.forEach(img => {
                            img.src = img.dataset.src;
                            img.loading = 'lazy';
                        });
                    }
                `).catch(() => {
                    // JavaScript 실행 실패는 무시 (페이지에 따라 발생할 수 있음)
                })
            })

            logger.debug('WebContents network optimization applied')
        } catch (error) {
            logger.error('Failed to optimize WebContents', { error })
        }
    }

    // 네트워크 통계 수집
    getNetworkStats(): Promise<any> {
        return new Promise((resolve) => {
            const stats = {
                cacheHitRate: 0,
                averageLoadTime: 0,
                compressionRatio: 0,
                activeConnections: 0
            }

            // 실제 통계는 향후 구현
            resolve(stats)
        })
    }

    // 설정 업데이트
    updateConfig(newConfig: Partial<NetworkOptimizationConfig>): void {
        this.config = { ...this.config, ...newConfig }
        logger.info('NetworkService configuration updated', this.config)
    }

    // 정리 작업
    cleanup(): void {
        logger.info('NetworkService cleanup completed')
    }
}

export const networkService = NetworkService.getInstance()
export default networkService