/**
 * 🔍 SEO Optimization Services - Index (SRP + SOLID 적용)
 * 
 * SEO 최적화를 위한 모든 서비스들을 중앙에서 export
 * - MetadataExtractorService: 메타데이터 추출 및 분석
 * - StructuredDataService: 구조화 데이터 관리
 * - PerformanceAnalyzerService: 웹 성능 분석
 * - SEOReportService: SEO 리포트 생성 및 관리
 */

// 개별 SEO 서비스들 export
export { MetadataExtractorService } from './MetadataExtractorService';
export { StructuredDataService } from './StructuredDataService';
export { PerformanceAnalyzerService } from './PerformanceAnalyzerService';
export { SEOReportService } from './SEOReportService';

// 타입들 re-export
export type {
    IOptimizationService,
    SEOMetadata,
    SEOPerformance,
    SEOReport
} from '../../../shared/types';

// 통합 SEO 최적화 관리자
import { WebContentsView } from 'electron';
import { createLogger } from '../../../shared/logger';
import { IOptimizationService, SEOReport } from '../../../shared/types';
import { MetadataExtractorService } from './MetadataExtractorService';
import { StructuredDataService } from './StructuredDataService';
import { PerformanceAnalyzerService } from './PerformanceAnalyzerService';
import { SEOReportService } from './SEOReportService';

const logger = createLogger('SEOOptimizationManager');

/**
 * 🎯 SEO 통합 최적화 관리자
 * 모든 SEO 서비스들을 조합하여 통합 관리
 */
export class SEOOptimizationService implements IOptimizationService {
    private isInitialized = false;
    private metadataService: MetadataExtractorService;
    private structuredDataService: StructuredDataService;
    private performanceService: PerformanceAnalyzerService;
    private reportService: SEOReportService;

    constructor() {
        this.metadataService = new MetadataExtractorService();
        this.structuredDataService = new StructuredDataService();
        this.performanceService = new PerformanceAnalyzerService();
        this.reportService = new SEOReportService();
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('SEO optimization already initialized');
            return;
        }

        logger.info('🔍 Initializing SEO optimization...');

        try {
            // 순차적으로 초기화
            await this.metadataService.initialize();
            await this.structuredDataService.initialize();
            await this.performanceService.initialize();
            await this.reportService.initialize();

            this.isInitialized = true;
            logger.info('✅ SEO optimization initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize SEO optimization', error);
            throw error;
        }
    }

    // 종합 SEO 분석 실행
    async analyzePage(webView: WebContentsView, url: string): Promise<SEOReport> {
        if (!this.isInitialized) {
            throw new Error('SEO optimization not initialized');
        }

        logger.info('Starting comprehensive SEO analysis', { url });

        try {
            // 병렬로 데이터 수집
            const [metadata, structuredData, performance, pageAnalysis] = await Promise.all([
                this.metadataService.extractSEOMetadata(webView),
                this.structuredDataService.extractStructuredData(webView),
                this.performanceService.analyzePagePerformance(webView),
                this.analyzePageStructure(webView)
            ]);

            // SEO 리포트 생성
            const report = this.reportService.generateSEOReport(
                url,
                metadata,
                structuredData,
                performance,
                { pageAnalysis }
            );

            logger.info('SEO analysis completed successfully', {
                url,
                score: report.seoScore,
                hasMetadata: !!metadata.title,
                structuredDataCount: structuredData.length,
                hasPerformanceData: !!performance
            });

            return report;
        } catch (error) {
            logger.error('Failed to analyze page SEO', error);
            throw error;
        }
    }

    // 페이지 구조 분석 (기본적인 SEO 요소들)
    private async analyzePageStructure(webView: WebContentsView): Promise<any> {
        try {
            const analysis = await webView.webContents.executeJavaScript(`
                (function() {
                    const analysis = {
                        hasH1: false,
                        totalImages: 0,
                        imageAltTags: 0,
                        internalLinks: 0,
                        externalLinks: 0,
                        metaViewport: false,
                        headingStructure: []
                    };
                    
                    // H1 태그 확인
                    const h1Elements = document.querySelectorAll('h1');
                    analysis.hasH1 = h1Elements.length > 0;
                    
                    // 이미지 분석
                    const images = document.querySelectorAll('img');
                    analysis.totalImages = images.length;
                    analysis.imageAltTags = Array.from(images).filter(img => img.alt && img.alt.trim()).length;
                    
                    // 링크 분석
                    const links = document.querySelectorAll('a[href]');
                    links.forEach(link => {
                        const href = link.getAttribute('href');
                        if (href && href.startsWith('http')) {
                            if (href.includes(window.location.hostname)) {
                                analysis.internalLinks++;
                            } else {
                                analysis.externalLinks++;
                            }
                        } else if (href && (href.startsWith('/') || href.startsWith('.') || !href.includes(':'))) {
                            analysis.internalLinks++;
                        }
                    });
                    
                    // Viewport 메타 태그 확인
                    const viewport = document.querySelector('meta[name="viewport"]');
                    analysis.metaViewport = !!viewport;
                    
                    // 제목 구조 분석
                    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
                        const elements = document.querySelectorAll(tag);
                        if (elements.length > 0) {
                            analysis.headingStructure.push({
                                tag: tag.toUpperCase(),
                                count: elements.length
                            });
                        }
                    });
                    
                    return analysis;
                })();
            `);

            return analysis;
        } catch (error) {
            logger.error('Failed to analyze page structure', error);
            return {
                hasH1: false,
                totalImages: 0,
                imageAltTags: 0,
                internalLinks: 0,
                externalLinks: 0,
                metaViewport: false,
                headingStructure: []
            };
        }
    }

    // SEO 점수 계산 (간단한 버전)
    async calculateSEOScore(webView: WebContentsView): Promise<number> {
        if (!this.isInitialized) {
            throw new Error('SEO optimization not initialized');
        }

        try {
            const metadata = await this.metadataService.extractSEOMetadata(webView);
            const structuredData = await this.structuredDataService.extractStructuredData(webView);
            const pageAnalysis = await this.analyzePageStructure(webView);

            let score = 0;
            const maxScore = 100;

            // 메타데이터 점수 (50점)
            if (metadata.title) score += 20;
            if (metadata.description) score += 20;
            if (metadata.keywords) score += 5;
            if (metadata.ogTitle || metadata.ogDescription) score += 5;

            // 구조화 데이터 (20점)
            if (structuredData.length > 0) {
                score += Math.min(structuredData.length * 5, 20);
            }

            // 페이지 구조 (30점)
            if (pageAnalysis.hasH1) score += 10;
            if (pageAnalysis.totalImages > 0 && pageAnalysis.imageAltTags / pageAnalysis.totalImages > 0.8) {
                score += 10;
            }
            if (pageAnalysis.internalLinks > 0) score += 5;
            if (pageAnalysis.metaViewport) score += 5;

            const finalScore = Math.min(score, maxScore);

            logger.info('SEO score calculated', {
                score: `${finalScore}/${maxScore}`,
                metadata: !!metadata.title,
                structuredData: structuredData.length,
                pageStructure: pageAnalysis.hasH1
            });

            return finalScore;
        } catch (error) {
            logger.error('Failed to calculate SEO score', error);
            return 0;
        }
    }

    // SEO 트렌드 분석
    analyzeSEOTrends(url: string) {
        return this.reportService.analyzeSEOTrends(url);
    }

    // 리포트 히스토리 조회
    getReportHistory(url?: string, limit: number = 10) {
        return this.reportService.getReportHistory(url, limit);
    }

    // 메타데이터 검증
    async validateMetadata(webView: WebContentsView) {
        const metadata = await this.metadataService.extractSEOMetadata(webView);
        return this.metadataService.validateMetadata(metadata);
    }

    // 구조화 데이터 검증
    async validateStructuredData(webView: WebContentsView) {
        const structuredData = await this.structuredDataService.extractStructuredData(webView);
        return this.structuredDataService.validateStructuredData(structuredData);
    }

    // Core Web Vitals 분석
    async analyzeCoreWebVitals(webView: WebContentsView) {
        return this.performanceService.analyzeCoreWebVitals(webView);
    }

    // 성능 벤치마크 실행
    async runSEOBenchmark(webView: WebContentsView, url: string) {
        if (!this.isInitialized) {
            logger.warn('SEO optimization not initialized');
            return { error: 'Not initialized' };
        }

        try {
            logger.info('Starting comprehensive SEO benchmark...', { url });

            const [seoReport, coreWebVitals, resourceTiming] = await Promise.all([
                this.analyzePage(webView, url),
                this.performanceService.analyzeCoreWebVitals(webView),
                this.performanceService.analyzeResourceTiming(webView)
            ]);

            const results = {
                seoReport,
                coreWebVitals,
                resourceTiming,
                overall: {
                    seoScore: seoReport.seoScore,
                    performanceGrade: seoReport.seoScore >= 80 ? 'A' : seoReport.seoScore >= 60 ? 'B' : 'C',
                    recommendations: seoReport.recommendations
                }
            };

            logger.info('SEO benchmark completed', {
                url,
                seoScore: seoReport.seoScore,
                performanceGrade: results.overall.performanceGrade,
                recommendationCount: seoReport.recommendations.length
            });

            return results;
        } catch (error) {
            logger.error('SEO benchmark failed', error);
            return { error: (error as Error).message };
        }
    }

    // 리포트 내보내기
    exportReport(report: SEOReport, format: 'json' | 'summary' = 'summary'): string {
        return this.reportService.exportReport(report, format);
    }
}