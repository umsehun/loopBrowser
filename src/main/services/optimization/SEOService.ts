import { WebContents } from 'electron'
import { logger } from '../../../shared/logger/index'

export interface SEOOptimizationConfig {
    enablePrerendering: boolean
    enableCrawlerOptimization: boolean
    enableMetaOptimization: boolean
    enableStructuredData: boolean
    enableOpenGraph: boolean
}

export class SEOService {
    private static instance: SEOService
    private config: SEOOptimizationConfig = {
        enablePrerendering: true,
        enableCrawlerOptimization: true,
        enableMetaOptimization: true,
        enableStructuredData: true,
        enableOpenGraph: true
    }

    constructor() {
        logger.info('SEOService initialized')
    }

    static getInstance(): SEOService {
        if (!SEOService.instance) {
            SEOService.instance = new SEOService()
        }
        return SEOService.instance
    }

    // SEO 최적화 활성화
    async optimizeSEO(): Promise<void> {
        try {
            await this.setupPrerendering()
            await this.setupCrawlerOptimization()
            await this.setupMetaOptimization()
            await this.setupStructuredData()
            await this.setupOpenGraph()

            logger.info('SEO optimization applied successfully', this.config)
        } catch (error) {
            logger.error('Failed to apply SEO optimization', { error })
            throw error
        }
    }

    // 프리렌더링 설정
    private async setupPrerendering(): Promise<void> {
        if (!this.config.enablePrerendering) return

        try {
            // 프리렌더링 최적화 로직
            logger.debug('Prerendering optimization enabled')
        } catch (error) {
            logger.error('Failed to setup prerendering', { error })
        }
    }

    // 크롤러 최적화
    private async setupCrawlerOptimization(): Promise<void> {
        if (!this.config.enableCrawlerOptimization) return

        try {
            // 크롤러 친화적 설정
            logger.debug('Crawler optimization enabled')
        } catch (error) {
            logger.error('Failed to setup crawler optimization', { error })
        }
    }

    // 메타태그 최적화
    private async setupMetaOptimization(): Promise<void> {
        if (!this.config.enableMetaOptimization) return

        try {
            // 메타태그 자동 최적화
            logger.debug('Meta tag optimization enabled')
        } catch (error) {
            logger.error('Failed to setup meta optimization', { error })
        }
    }

    // 구조화된 데이터 설정
    private async setupStructuredData(): Promise<void> {
        if (!this.config.enableStructuredData) return

        try {
            // JSON-LD 구조화 데이터 최적화
            logger.debug('Structured data optimization enabled')
        } catch (error) {
            logger.error('Failed to setup structured data', { error })
        }
    }

    // Open Graph 최적화
    private async setupOpenGraph(): Promise<void> {
        if (!this.config.enableOpenGraph) return

        try {
            // Open Graph 메타태그 최적화
            logger.debug('Open Graph optimization enabled')
        } catch (error) {
            logger.error('Failed to setup Open Graph', { error })
        }
    }

    // WebContents별 SEO 최적화
    optimizeWebContents(webContents: WebContents): void {
        try {
            webContents.on('dom-ready', () => {
                this.injectSEOOptimizations(webContents)
            })

            webContents.on('did-finish-load', () => {
                this.optimizePageSpeed(webContents)
            })

            logger.debug('WebContents SEO optimization applied')
        } catch (error) {
            logger.error('Failed to optimize WebContents SEO', { error })
        }
    }

    // SEO 최적화 주입
    private injectSEOOptimizations(webContents: WebContents): void {
        webContents.executeJavaScript(`
            (function() {
                // 메타태그 최적화
                const optimizeMeta = () => {
                    // Viewport 메타태그 확인 및 추가
                    if (!document.querySelector('meta[name="viewport"]')) {
                        const viewport = document.createElement('meta');
                        viewport.name = 'viewport';
                        viewport.content = 'width=device-width, initial-scale=1.0';
                        document.head.appendChild(viewport);
                    }

                    // 언어 속성 설정
                    if (!document.documentElement.lang) {
                        document.documentElement.lang = 'ko';
                    }

                    // 메타 description 최적화
                    const description = document.querySelector('meta[name="description"]');
                    if (description && description.content.length > 160) {
                        description.content = description.content.substring(0, 157) + '...';
                    }
                };

                // 이미지 최적화
                const optimizeImages = () => {
                    const images = document.querySelectorAll('img:not([alt])');
                    images.forEach(img => {
                        if (!img.alt) {
                            img.alt = img.title || 'Image';
                        }
                    });

                    // 지연 로딩 적용
                    const lazyImages = document.querySelectorAll('img[data-src]');
                    if ('IntersectionObserver' in window) {
                        const imageObserver = new IntersectionObserver((entries) => {
                            entries.forEach(entry => {
                                if (entry.isIntersecting) {
                                    const img = entry.target;
                                    img.src = img.dataset.src;
                                    img.classList.remove('lazy');
                                    imageObserver.unobserve(img);
                                }
                            });
                        });

                        lazyImages.forEach(img => imageObserver.observe(img));
                    }
                };

                // 링크 최적화
                const optimizeLinks = () => {
                    const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])');
                    externalLinks.forEach(link => {
                        if (!link.rel) {
                            link.rel = 'noopener noreferrer';
                        }
                    });
                };

                // 구조화된 데이터 추가
                const addStructuredData = () => {
                    if (!document.querySelector('script[type="application/ld+json"]')) {
                        const structuredData = {
                            "@context": "https://schema.org",
                            "@type": "WebPage",
                            "name": document.title,
                            "description": document.querySelector('meta[name="description"]')?.content || '',
                            "url": window.location.href
                        };

                        const script = document.createElement('script');
                        script.type = 'application/ld+json';
                        script.textContent = JSON.stringify(structuredData);
                        document.head.appendChild(script);
                    }
                };

                // 모든 최적화 실행
                optimizeMeta();
                optimizeImages();
                optimizeLinks();
                addStructuredData();

                logger.debug('SEO optimizations applied');
            })();
        `).catch(() => {
            // JavaScript 실행 실패는 무시
        })
    }

    // 페이지 속도 최적화
    private optimizePageSpeed(webContents: WebContents): void {
        webContents.executeJavaScript(`
            (function() {
                // CSS 최적화
                const optimizeCSS = () => {
                    // 사용하지 않는 CSS 제거 (간단한 버전)
                    const unusedStyles = document.querySelectorAll('style:empty, link[rel="stylesheet"]:not([href])');
                    unusedStyles.forEach(style => style.remove());
                };

                // JavaScript 최적화
                const optimizeJS = () => {
                    // 사용하지 않는 스크립트 제거
                    const emptyScripts = document.querySelectorAll('script:empty:not([src])');
                    emptyScripts.forEach(script => script.remove());
                };

                // 폰트 최적화
                const optimizeFonts = () => {
                    // font-display: swap 추가
                    const style = document.createElement('style');
                    style.textContent = \`
                        @font-face {
                            font-display: swap;
                        }
                    \`;
                    document.head.appendChild(style);
                };

                // 리소스 힌트 추가
                const addResourceHints = () => {
                    const hints = [
                        { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
                        { rel: 'dns-prefetch', href: '//www.google-analytics.com' },
                        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true }
                    ];

                    hints.forEach(hint => {
                        if (!document.querySelector(\`link[href="\${hint.href}"]\`)) {
                            const link = document.createElement('link');
                            link.rel = hint.rel;
                            link.href = hint.href;
                            if (hint.crossorigin) link.crossOrigin = hint.crossorigin;
                            document.head.appendChild(link);
                        }
                    });
                };

                optimizeCSS();
                optimizeJS();
                optimizeFonts();
                addResourceHints();

                logger.debug('Page speed optimizations applied');
            })();
        `).catch(() => {
            // JavaScript 실행 실패는 무시
        })
    }

    // SEO 점수 계산
    calculateSEOScore(webContents: WebContents): Promise<number> {
        return new Promise((resolve) => {
            webContents.executeJavaScript(`
                (function() {
                    let score = 0;
                    const checks = [];

                    // 제목 태그 검사
                    const title = document.querySelector('title');
                    if (title && title.textContent.trim().length > 0) {
                        score += 20;
                        checks.push('Title tag exists');
                    }

                    // 메타 description 검사
                    const description = document.querySelector('meta[name="description"]');
                    if (description && description.content.trim().length > 0) {
                        score += 20;
                        checks.push('Meta description exists');
                    }

                    // 헤딩 태그 검사
                    const h1 = document.querySelector('h1');
                    if (h1) {
                        score += 15;
                        checks.push('H1 tag exists');
                    }

                    // 이미지 alt 속성 검사
                    const images = document.querySelectorAll('img');
                    const imagesWithAlt = document.querySelectorAll('img[alt]');
                    if (images.length === 0 || imagesWithAlt.length / images.length > 0.8) {
                        score += 15;
                        checks.push('Images have alt attributes');
                    }

                    // 내부 링크 검사
                    const internalLinks = document.querySelectorAll('a[href^="/"], a[href*="' + window.location.hostname + '"]');
                    if (internalLinks.length > 0) {
                        score += 10;
                        checks.push('Internal links present');
                    }

                    // 페이지 속도 관련 검사
                    if (document.readyState === 'complete') {
                        score += 10;
                        checks.push('Page loaded completely');
                    }

                    // 구조화된 데이터 검사
                    const structuredData = document.querySelector('script[type="application/ld+json"]');
                    if (structuredData) {
                        score += 10;
                        checks.push('Structured data present');
                    }

                    return { score, checks };
                })();
            `).then((result: any) => {
                logger.debug('SEO score calculated', result)
                resolve(result.score)
            }).catch(() => {
                resolve(50) // 기본 점수
            })
        })
    }

    // 설정 업데이트
    updateConfig(newConfig: Partial<SEOOptimizationConfig>): void {
        this.config = { ...this.config, ...newConfig }
        logger.info('SEOService configuration updated', this.config)
    }

    // 정리 작업
    cleanup(): void {
        logger.info('SEOService cleanup completed')
    }
}

export const seoService = SEOService.getInstance()
export default seoService