import { WebContentsView } from 'electron'
import { createLogger } from '../../../shared/logger'
import { IOptimizationService, SEOPerformance } from '../../../shared/types'

const logger = createLogger('PerformanceAnalyzerService')

/**
 * ⚡ 성능 분석 서비스 (SRP: 웹 성능 분석만 담당)
 * - 페이지 로딩 시간 측정
 * - Core Web Vitals 분석
 * - 렌더링 성능 측정
 * - 네트워크 타이밍 분석
 */
export class PerformanceAnalyzerService implements IOptimizationService {
    private isInitialized = false

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Performance analyzer already initialized')
            return
        }

        logger.info('⚡ Initializing performance analyzer...')

        this.isInitialized = true
        logger.info('✅ Performance analyzer initialized successfully')
    }

    // 페이지 성능 분석
    async analyzePagePerformance(webView: WebContentsView): Promise<SEOPerformance | null> {
        if (!this.isInitialized) {
            throw new Error('Performance analyzer not initialized')
        }

        try {
            logger.debug('Analyzing page performance...')

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
                        totalLoadTime: timing.loadEventEnd - navigation,
                        domContentLoaded: timing.domContentLoadedEventEnd - navigation,
                        firstPaint: window.performance.getEntriesByType('paint')
                            .find(entry => entry.name === 'first-paint')?.startTime || 0,
                        firstContentfulPaint: window.performance.getEntriesByType('paint')
                            .find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
                    };
                })();
            `)

            if (!performance) {
                logger.warn('Performance API not available')
                return null
            }

            const result: SEOPerformance = {
                totalLoadTime: performance.totalLoadTime,
                domContentLoaded: performance.domContentLoaded,
                firstPaint: performance.firstPaint,
                firstContentfulPaint: performance.firstContentfulPaint
            }

            logger.debug('Page performance analyzed successfully', {
                totalLoadTime: `${result.totalLoadTime}ms`,
                domContentLoaded: `${result.domContentLoaded}ms`,
                firstPaint: `${result.firstPaint}ms`,
                firstContentfulPaint: `${result.firstContentfulPaint}ms`
            })

            return result
        } catch (error) {
            logger.error('Failed to analyze page performance', error)
            return null
        }
    }

    // Core Web Vitals 분석
    async analyzeCoreWebVitals(webView: WebContentsView): Promise<{
        lcp: number; // Largest Contentful Paint
        fid: number; // First Input Delay
        cls: number; // Cumulative Layout Shift
        fcp: number; // First Contentful Paint
        ttfb: number; // Time to First Byte
    } | null> {
        try {
            logger.debug('Analyzing Core Web Vitals...')

            const vitals = await webView.webContents.executeJavaScript(`
                (function() {
                    const vitals = {
                        lcp: 0,
                        fid: 0,
                        cls: 0,
                        fcp: 0,
                        ttfb: 0
                    };

                    // LCP (Largest Contentful Paint)
                    if (window.PerformanceObserver) {
                        const lcpObserver = new PerformanceObserver((list) => {
                            const entries = list.getEntries();
                            const lastEntry = entries[entries.length - 1];
                            vitals.lcp = lastEntry.startTime;
                        });
                        
                        try {
                            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                        } catch (e) {
                            // LCP may not be supported
                        }
                    }

                    // FCP (First Contentful Paint)
                    const fcpEntry = window.performance?.getEntriesByType('paint')
                        ?.find(entry => entry.name === 'first-contentful-paint');
                    vitals.fcp = fcpEntry?.startTime || 0;

                    // TTFB (Time to First Byte)
                    if (window.performance?.timing) {
                        const timing = window.performance.timing;
                        vitals.ttfb = timing.responseStart - timing.navigationStart;
                    }

                    // CLS는 실시간 측정이 어려우므로 기본값 반환
                    vitals.cls = 0;
                    vitals.fid = 0;

                    return vitals;
                })();
            `)

            logger.debug('Core Web Vitals analyzed', {
                lcp: `${vitals.lcp}ms`,
                fcp: `${vitals.fcp}ms`,
                ttfb: `${vitals.ttfb}ms`,
                cls: vitals.cls,
                fid: `${vitals.fid}ms`
            })

            return vitals
        } catch (error) {
            logger.error('Failed to analyze Core Web Vitals', error)
            return null
        }
    }

    // 성능 점수 계산
    calculatePerformanceScore(performance: SEOPerformance): number {
        let score = 100

        // 총 로딩 시간 평가 (3초 기준)
        if (performance.totalLoadTime > 3000) {
            score -= 30
        } else if (performance.totalLoadTime > 2000) {
            score -= 15
        } else if (performance.totalLoadTime > 1000) {
            score -= 5
        }

        // DOM 콘텐츠 로딩 시간 평가 (2초 기준)
        if (performance.domContentLoaded > 2000) {
            score -= 20
        } else if (performance.domContentLoaded > 1500) {
            score -= 10
        } else if (performance.domContentLoaded > 1000) {
            score -= 5
        }

        // First Contentful Paint 평가 (1.8초 기준)
        if (performance.firstContentfulPaint > 1800) {
            score -= 15
        } else if (performance.firstContentfulPaint > 1200) {
            score -= 8
        } else if (performance.firstContentfulPaint > 800) {
            score -= 3
        }

        return Math.max(score, 0)
    }

    // 성능 권장사항 생성
    generatePerformanceRecommendations(performance: SEOPerformance): string[] {
        const recommendations: string[] = []

        if (performance.totalLoadTime > 3000) {
            recommendations.push('총 로딩 시간이 3초를 초과합니다. 이미지 최적화, 코드 압축, CDN 사용을 고려하세요.')
        }

        if (performance.domContentLoaded > 2000) {
            recommendations.push('DOM 콘텐츠 로딩이 느립니다. JavaScript 최적화와 비동기 로딩을 고려하세요.')
        }

        if (performance.firstContentfulPaint > 1800) {
            recommendations.push('First Contentful Paint가 느립니다. 크리티컬 리소스 우선순위를 조정하세요.')
        }

        if (performance.firstPaint > 1200) {
            recommendations.push('First Paint가 느립니다. 인라인 CSS와 중요 리소스 우선 로딩을 고려하세요.')
        }

        if (recommendations.length === 0) {
            recommendations.push('성능이 양호합니다! 현재 최적화 상태를 유지하세요.')
        }

        return recommendations
    }

    // 리소스 타이밍 분석
    async analyzeResourceTiming(webView: WebContentsView): Promise<{
        resources: Array<{
            name: string;
            type: string;
            size: number;
            duration: number;
        }>;
        summary: {
            totalResources: number;
            totalSize: number;
            slowestResource: string;
            averageDuration: number;
        };
    } | null> {
        try {
            logger.debug('Analyzing resource timing...')

            const resourceData = await webView.webContents.executeJavaScript(`
                (function() {
                    const resources = window.performance?.getEntriesByType('resource') || [];
                    
                    const resourceInfo = resources.map(resource => ({
                        name: resource.name,
                        type: resource.initiatorType || 'unknown',
                        size: resource.transferSize || 0,
                        duration: resource.responseEnd - resource.startTime
                    }));

                    const totalSize = resourceInfo.reduce((sum, r) => sum + r.size, 0);
                    const totalDuration = resourceInfo.reduce((sum, r) => sum + r.duration, 0);
                    const slowestResource = resourceInfo.reduce((slowest, current) => 
                        current.duration > slowest.duration ? current : slowest, 
                        { name: '', duration: 0 }
                    );

                    return {
                        resources: resourceInfo,
                        summary: {
                            totalResources: resourceInfo.length,
                            totalSize: totalSize,
                            slowestResource: slowestResource.name,
                            averageDuration: resourceInfo.length > 0 ? totalDuration / resourceInfo.length : 0
                        }
                    };
                })();
            `)

            logger.debug('Resource timing analyzed', {
                totalResources: resourceData.summary.totalResources,
                totalSize: `${(resourceData.summary.totalSize / 1024).toFixed(2)} KB`,
                averageDuration: `${resourceData.summary.averageDuration.toFixed(2)}ms`
            })

            return resourceData
        } catch (error) {
            logger.error('Failed to analyze resource timing', error)
            return null
        }
    }

    // 성능 베이스라인 설정
    setPerformanceBaseline(baseline: {
        targetLoadTime: number;
        targetDOMContentLoaded: number;
        targetFirstContentfulPaint: number;
    }): void {
        logger.info('Performance baseline set', baseline)
        // 실제 구현에서는 이 값들을 저장하고 비교에 사용
    }

    // 성능 비교 (이전 측정과 비교)
    comparePerformance(current: SEOPerformance, previous: SEOPerformance): {
        improvements: string[];
        regressions: string[];
        changePercent: number;
    } {
        const improvements: string[] = []
        const regressions: string[] = []

        // 총 로딩 시간 비교
        const loadTimeChange = ((current.totalLoadTime - previous.totalLoadTime) / previous.totalLoadTime) * 100
        if (loadTimeChange < -5) {
            improvements.push(`로딩 시간이 ${Math.abs(loadTimeChange).toFixed(1)}% 개선되었습니다`)
        } else if (loadTimeChange > 5) {
            regressions.push(`로딩 시간이 ${loadTimeChange.toFixed(1)}% 느려졌습니다`)
        }

        // FCP 비교
        const fcpChange = ((current.firstContentfulPaint - previous.firstContentfulPaint) / previous.firstContentfulPaint) * 100
        if (fcpChange < -5) {
            improvements.push(`First Contentful Paint가 ${Math.abs(fcpChange).toFixed(1)}% 개선되었습니다`)
        } else if (fcpChange > 5) {
            regressions.push(`First Contentful Paint가 ${fcpChange.toFixed(1)}% 느려졌습니다`)
        }

        const changePercent = (loadTimeChange + fcpChange) / 2

        logger.info('Performance comparison completed', {
            improvements: improvements.length,
            regressions: regressions.length,
            overallChange: `${changePercent.toFixed(1)}%`
        })

        return { improvements, regressions, changePercent }
    }
}