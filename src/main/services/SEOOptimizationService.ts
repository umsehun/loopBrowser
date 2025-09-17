import { WebContentsView } from 'electron'
import { createLogger } from '../../shared/logger'

const logger = createLogger('SEOOptimizationService')

interface SEOMetadata {
    title?: string
    description?: string
    keywords?: string[]
    ogTitle?: string
    ogDescription?: string
    ogImage?: string
    canonical?: string
}

/**
 * 🔍 SEO 최적화 서비스
 * 검색 엔진 최적화, 메타데이터, 구조화 데이터
 */
export class SEOOptimizationService {
    private isInitialized = false

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('SEO optimization already initialized')
            return
        }

        logger.info('🔍 Initializing SEO optimization...')

        this.isInitialized = true
        logger.info('🔍 SEO optimization initialized successfully')
    }

    // 페이지 SEO 메타데이터 추출
    async extractSEOMetadata(webView: WebContentsView): Promise<SEOMetadata> {
        try {
            const result = await webView.webContents.executeJavaScript(`
                (function() {
                    const metadata = {};
                    
                    // 기본 메타데이터
                    metadata.title = document.title || '';
                    
                    // 메타 태그들
                    const metaTags = document.querySelectorAll('meta');
                    metaTags.forEach(tag => {
                        const name = tag.getAttribute('name') || tag.getAttribute('property');
                        const content = tag.getAttribute('content');
                        
                        if (!name || !content) return;
                        
                        switch(name.toLowerCase()) {
                            case 'description':
                                metadata.description = content;
                                break;
                            case 'keywords':
                                metadata.keywords = content.split(',').map(k => k.trim());
                                break;
                            case 'og:title':
                                metadata.ogTitle = content;
                                break;
                            case 'og:description':
                                metadata.ogDescription = content;
                                break;
                            case 'og:image':
                                metadata.ogImage = content;
                                break;
                        }
                    });
                    
                    // Canonical URL
                    const canonical = document.querySelector('link[rel="canonical"]');
                    if (canonical) {
                        metadata.canonical = canonical.getAttribute('href');
                    }
                    
                    return metadata;
                })();
            `)

            logger.info(`SEO metadata extracted: ${JSON.stringify(result, null, 2)}`)
            return result as SEOMetadata
        } catch (error) {
            logger.error(`Failed to extract SEO metadata: ${error}`)
            return {}
        }
    }

    // 구조화 데이터 추출
    async extractStructuredData(webView: WebContentsView): Promise<any[]> {
        try {
            const result = await webView.webContents.executeJavaScript(`
                (function() {
                    const structuredData = [];
                    
                    // JSON-LD 추출
                    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
                    jsonLdScripts.forEach(script => {
                        try {
                            const data = JSON.parse(script.textContent || '');
                            structuredData.push({
                                type: 'json-ld',
                                data: data
                            });
                        } catch (e) {
                            console.warn('Invalid JSON-LD:', e);
                        }
                    });
                    
                    // Microdata 추출
                    const microdataItems = document.querySelectorAll('[itemscope]');
                    microdataItems.forEach(item => {
                        const itemType = item.getAttribute('itemtype');
                        const properties = {};
                        
                        const propElements = item.querySelectorAll('[itemprop]');
                        propElements.forEach(prop => {
                            const propName = prop.getAttribute('itemprop');
                            const propValue = prop.getAttribute('content') || prop.textContent;
                            properties[propName] = propValue;
                        });
                        
                        if (itemType) {
                            structuredData.push({
                                type: 'microdata',
                                itemType: itemType,
                                properties: properties
                            });
                        }
                    });
                    
                    return structuredData;
                })();
            `)

            logger.info(`Structured data found: ${result.length} items`)
            return result
        } catch (error) {
            logger.error(`Failed to extract structured data: ${error}`)
            return []
        }
    }

    // SEO 점수 분석
    async analyzeSEOScore(webView: WebContentsView): Promise<number> {
        try {
            const metadata = await this.extractSEOMetadata(webView)
            const structuredData = await this.extractStructuredData(webView)

            let score = 0
            let maxScore = 100

            // 제목 (20점)
            if (metadata.title && metadata.title.length > 10 && metadata.title.length < 60) {
                score += 20
            } else if (metadata.title) {
                score += 10
            }

            // 설명 (20점)
            if (metadata.description && metadata.description.length > 120 && metadata.description.length < 160) {
                score += 20
            } else if (metadata.description) {
                score += 10
            }

            // 키워드 (10점)
            if (metadata.keywords && metadata.keywords.length > 0) {
                score += 10
            }

            // OpenGraph (15점)
            if (metadata.ogTitle && metadata.ogDescription) {
                score += 15
            } else if (metadata.ogTitle || metadata.ogDescription) {
                score += 7
            }

            // Canonical URL (10점)
            if (metadata.canonical) {
                score += 10
            }

            // 구조화 데이터 (15점)
            if (structuredData.length > 0) {
                score += 15
            }

            // 추가 페이지 분석 (10점)
            const pageAnalysis = await webView.webContents.executeJavaScript(`
                (function() {
                    const analysis = {
                        hasH1: !!document.querySelector('h1'),
                        imageAltTags: document.querySelectorAll('img[alt]').length,
                        totalImages: document.querySelectorAll('img').length,
                        internalLinks: document.querySelectorAll('a[href^="/"], a[href*="' + location.hostname + '"]').length,
                        externalLinks: document.querySelectorAll('a[href^="http"]:not([href*="' + location.hostname + '"])').length
                    };
                    
                    return analysis;
                })();
            `)

            if (pageAnalysis.hasH1) score += 5
            if (pageAnalysis.totalImages > 0 && pageAnalysis.imageAltTags / pageAnalysis.totalImages > 0.8) {
                score += 5
            }

            const finalScore = Math.round((score / maxScore) * 100)
            logger.info(`SEO Score: ${finalScore}/100`)

            return finalScore
        } catch (error) {
            logger.error(`Failed to analyze SEO score: ${error}`)
            return 0
        }
    }

    // 페이지 성능 분석
    async analyzePagePerformance(webView: WebContentsView): Promise<any> {
        try {
            const performance = await webView.webContents.executeJavaScript(`
                (function() {
                    if (!window.performance || !window.performance.timing) {
                        return null;
                    }
                    
                    const timing = window.performance.timing;
                    const navigation = timing.navigationStart;
                    
                    return {
                        domainLookup: timing.domainLookupEnd - timing.domainLookupStart,
                        tcpConnect: timing.connectEnd - timing.connectStart,
                        request: timing.responseStart - timing.requestStart,
                        response: timing.responseEnd - timing.responseStart,
                        domProcessing: timing.domComplete - timing.domLoading,
                        totalLoad: timing.loadEventEnd - navigation,
                        domContentLoaded: timing.domContentLoadedEventEnd - navigation,
                        firstPaint: window.performance.getEntriesByType('paint')
                            .find(entry => entry.name === 'first-paint')?.startTime || 0,
                        firstContentfulPaint: window.performance.getEntriesByType('paint')
                            .find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
                    };
                })();
            `)

            if (performance) {
                logger.info(`Page Performance:
                    Total Load Time: ${performance.totalLoad}ms
                    DOM Content Loaded: ${performance.domContentLoaded}ms
                    First Paint: ${performance.firstPaint}ms
                    First Contentful Paint: ${performance.firstContentfulPaint}ms`)
            }

            return performance
        } catch (error) {
            logger.error(`Failed to analyze page performance: ${error}`)
            return null
        }
    }

    // SEO 보고서 생성
    async generateSEOReport(webView: WebContentsView, url: string): Promise<any> {
        try {
            logger.info(`Generating SEO report for: ${url}`)

            const [metadata, structuredData, seoScore, performance] = await Promise.all([
                this.extractSEOMetadata(webView),
                this.extractStructuredData(webView),
                this.analyzeSEOScore(webView),
                this.analyzePagePerformance(webView)
            ])

            const report = {
                url,
                timestamp: new Date().toISOString(),
                seoScore,
                metadata,
                structuredData,
                performance,
                recommendations: this.generateRecommendations(metadata, seoScore)
            }

            logger.info(`SEO Report generated with score: ${seoScore}/100`)
            return report
        } catch (error) {
            logger.error(`Failed to generate SEO report: ${error}`)
            return null
        }
    }

    private generateRecommendations(metadata: SEOMetadata, score: number): string[] {
        const recommendations: string[] = []

        if (!metadata.title || metadata.title.length < 10) {
            recommendations.push('페이지 제목을 10자 이상으로 작성하세요')
        }
        if (!metadata.description || metadata.description.length < 120) {
            recommendations.push('메타 설명을 120자 이상으로 작성하세요')
        }
        if (!metadata.keywords || metadata.keywords.length === 0) {
            recommendations.push('키워드 메타 태그를 추가하세요')
        }
        if (!metadata.ogTitle) {
            recommendations.push('OpenGraph 제목을 추가하세요')
        }
        if (!metadata.canonical) {
            recommendations.push('Canonical URL을 설정하세요')
        }
        if (score < 70) {
            recommendations.push('전반적인 SEO 개선이 필요합니다')
        }

        return recommendations
    }
}