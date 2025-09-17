import { WebContentsView } from 'electron'
import { createLogger } from '../../../shared/logger'
import { IOptimizationService, SEOReport, SEOMetadata, SEOPerformance } from '../../../shared/types'

const logger = createLogger('SEOReportService')

/**
 * 📊 SEO 리포트 서비스 (SRP: SEO 리포트 생성 및 관리만 담당)
 * - 종합 SEO 점수 계산
 * - SEO 리포트 생성
 * - 개선 권장사항 제공
 * - 리포트 히스토리 관리
 */
export class SEOReportService implements IOptimizationService {
    private isInitialized = false
    private reportHistory: SEOReport[] = []

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('SEO report service already initialized')
            return
        }

        logger.info('📊 Initializing SEO report service...')

        this.isInitialized = true
        logger.info('✅ SEO report service initialized successfully')
    }

    // 종합 SEO 리포트 생성
    generateSEOReport(
        url: string,
        metadata: SEOMetadata,
        structuredData: unknown[],
        performance: SEOPerformance | null,
        additionalData?: {
            pageAnalysis?: any;
            technicalSEO?: any;
        }
    ): SEOReport {
        if (!this.isInitialized) {
            throw new Error('SEO report service not initialized')
        }

        logger.debug('Generating comprehensive SEO report...', { url })

        // SEO 점수 계산
        const seoScore = this.calculateComprehensiveSEOScore(
            metadata,
            structuredData,
            performance,
            additionalData?.pageAnalysis
        )

        // 권장사항 생성
        const recommendations = this.generateRecommendations(
            metadata,
            structuredData,
            performance,
            additionalData?.pageAnalysis
        )

        const report: SEOReport = {
            url,
            metadata,
            structuredData,
            performance: performance || {
                totalLoadTime: 0,
                domContentLoaded: 0,
                firstPaint: 0,
                firstContentfulPaint: 0
            },
            seoScore,
            recommendations,
            timestamp: new Date()
        }

        // 리포트 히스토리에 추가
        this.reportHistory.push(report)

        // 최대 100개 리포트만 유지
        if (this.reportHistory.length > 100) {
            this.reportHistory = this.reportHistory.slice(-100)
        }

        logger.info('SEO report generated successfully', {
            url,
            score: seoScore,
            recommendationCount: recommendations.length
        })

        return report
    }

    // 종합 SEO 점수 계산
    private calculateComprehensiveSEOScore(
        metadata: SEOMetadata,
        structuredData: unknown[],
        performance: SEOPerformance | null,
        pageAnalysis?: any
    ): number {
        let totalScore = 0
        let maxScore = 0

        // 메타데이터 점수 (40점 만점)
        maxScore += 40
        if (metadata.title) totalScore += 15
        if (metadata.description) totalScore += 15
        if (metadata.keywords) totalScore += 5
        if (metadata.ogTitle || metadata.ogDescription) totalScore += 5

        // 구조화 데이터 점수 (20점 만점)
        maxScore += 20
        if (structuredData.length > 0) {
            totalScore += Math.min(structuredData.length * 5, 20)
        }

        // 성능 점수 (25점 만점)
        maxScore += 25
        if (performance) {
            if (performance.totalLoadTime < 3000) totalScore += 10
            if (performance.firstContentfulPaint < 1800) totalScore += 8
            if (performance.domContentLoaded < 2000) totalScore += 7
        }

        // 페이지 분석 점수 (15점 만점)
        maxScore += 15
        if (pageAnalysis) {
            if (pageAnalysis.hasH1) totalScore += 5
            if (pageAnalysis.imageAltTags && pageAnalysis.totalImages > 0) {
                const altRatio = pageAnalysis.imageAltTags / pageAnalysis.totalImages
                totalScore += Math.round(altRatio * 5)
            }
            if (pageAnalysis.internalLinks > 0) totalScore += 3
            if (pageAnalysis.metaViewport) totalScore += 2
        }

        const finalScore = Math.round((totalScore / maxScore) * 100)

        logger.debug('SEO score calculated', {
            totalScore,
            maxScore,
            finalScore: `${finalScore}/100`
        })

        return finalScore
    }

    // SEO 권장사항 생성
    private generateRecommendations(
        metadata: SEOMetadata,
        structuredData: unknown[],
        performance: SEOPerformance | null,
        pageAnalysis?: any
    ): string[] {
        const recommendations: string[] = []

        // 메타데이터 권장사항
        if (!metadata.title) {
            recommendations.push('페이지 제목을 추가하세요 (30-60자 권장)')
        } else if (metadata.title.length < 30) {
            recommendations.push('페이지 제목이 너무 짧습니다. 더 구체적인 제목을 사용하세요')
        } else if (metadata.title.length > 60) {
            recommendations.push('페이지 제목이 너무 깁니다. 60자 이내로 줄이세요')
        }

        if (!metadata.description) {
            recommendations.push('메타 설명을 추가하세요 (150-160자 권장)')
        } else if (metadata.description.length < 120) {
            recommendations.push('메타 설명이 너무 짧습니다. 더 자세한 설명을 추가하세요')
        } else if (metadata.description.length > 160) {
            recommendations.push('메타 설명이 너무 깁니다. 160자 이내로 줄이세요')
        }

        if (!metadata.keywords) {
            recommendations.push('관련 키워드를 추가하세요')
        }

        if (!metadata.ogTitle && !metadata.ogDescription) {
            recommendations.push('소셜 미디어 공유를 위해 Open Graph 태그를 추가하세요')
        }

        if (!metadata.canonicalUrl) {
            recommendations.push('중복 콘텐츠 방지를 위해 캐노니컬 URL을 설정하세요')
        }

        // 구조화 데이터 권장사항
        if (structuredData.length === 0) {
            recommendations.push('검색 엔진 이해도 향상을 위해 구조화 데이터를 추가하세요')
        } else if (structuredData.length < 2) {
            recommendations.push('더 다양한 구조화 데이터 타입을 추가하는 것을 고려하세요')
        }

        // 성능 권장사항
        if (performance) {
            if (performance.totalLoadTime > 3000) {
                recommendations.push('페이지 로딩 시간을 3초 이내로 단축하세요')
            }
            if (performance.firstContentfulPaint > 1800) {
                recommendations.push('First Contentful Paint를 1.8초 이내로 개선하세요')
            }
            if (performance.domContentLoaded > 2000) {
                recommendations.push('DOM 콘텐츠 로딩 시간을 2초 이내로 단축하세요')
            }
        }

        // 페이지 분석 권장사항
        if (pageAnalysis) {
            if (!pageAnalysis.hasH1) {
                recommendations.push('페이지에 H1 제목 태그를 추가하세요')
            }
            if (pageAnalysis.totalImages > 0 && pageAnalysis.imageAltTags === 0) {
                recommendations.push('모든 이미지에 alt 속성을 추가하세요')
            }
            if (pageAnalysis.internalLinks === 0) {
                recommendations.push('내부 링크를 추가하여 사이트 탐색을 개선하세요')
            }
            if (!pageAnalysis.metaViewport) {
                recommendations.push('모바일 최적화를 위해 viewport 메타 태그를 추가하세요')
            }
        }

        return recommendations
    }

    // SEO 트렌드 분석
    analyzeSEOTrends(url: string): {
        scoreHistory: number[];
        averageScore: number;
        trend: 'improving' | 'declining' | 'stable';
        recommendations: string[];
    } {
        const urlReports = this.reportHistory
            .filter(report => report.url === url)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

        if (urlReports.length < 2) {
            return {
                scoreHistory: urlReports.map(r => r.seoScore),
                averageScore: urlReports[0]?.seoScore || 0,
                trend: 'stable',
                recommendations: ['더 많은 데이터가 필요합니다. 정기적으로 SEO 분석을 실행하세요.']
            }
        }

        const scoreHistory = urlReports.map(r => r.seoScore)
        const averageScore = scoreHistory.reduce((sum, score) => sum + score, 0) / scoreHistory.length

        // 트렌드 계산 (최근 3개 리포트 기준)
        const recentScores = scoreHistory.slice(-3)
        const trend = this.calculateTrend(recentScores)

        const recommendations = this.generateTrendRecommendations(trend, scoreHistory)

        logger.info('SEO trend analysis completed', {
            url,
            reportCount: urlReports.length,
            averageScore: averageScore.toFixed(1),
            trend
        })

        return { scoreHistory, averageScore, trend, recommendations }
    }

    // 트렌드 계산
    private calculateTrend(scores: number[]): 'improving' | 'declining' | 'stable' {
        if (scores.length < 2) return 'stable'

        const firstHalf = scores.slice(0, Math.ceil(scores.length / 2))
        const secondHalf = scores.slice(Math.floor(scores.length / 2))

        const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length

        const difference = secondAvg - firstAvg

        if (difference > 5) return 'improving'
        if (difference < -5) return 'declining'
        return 'stable'
    }

    // 트렌드 기반 권장사항
    private generateTrendRecommendations(trend: string, scoreHistory: number[]): string[] {
        const recommendations: string[] = []

        switch (trend) {
            case 'improving':
                recommendations.push('SEO 점수가 개선되고 있습니다! 현재 전략을 계속 유지하세요.')
                recommendations.push('좋은 성과를 내고 있는 요소들을 다른 페이지에도 적용해보세요.')
                break

            case 'declining':
                recommendations.push('SEO 점수가 하락하고 있습니다. 최근 변경사항을 검토하세요.')
                recommendations.push('콘텐츠 품질과 기술적 SEO 요소들을 점검하세요.')
                recommendations.push('경쟁사 분석을 통해 개선점을 찾아보세요.')
                break

            case 'stable':
                if (scoreHistory[scoreHistory.length - 1] < 70) {
                    recommendations.push('점수가 안정적이지만 개선의 여지가 있습니다.')
                    recommendations.push('새로운 SEO 전략을 시도해보세요.')
                } else {
                    recommendations.push('좋은 SEO 점수를 안정적으로 유지하고 있습니다.')
                    recommendations.push('현재 상태를 유지하면서 세부적인 최적화를 진행하세요.')
                }
                break
        }

        return recommendations
    }

    // 리포트 히스토리 조회
    getReportHistory(url?: string, limit: number = 10): SEOReport[] {
        let reports = this.reportHistory

        if (url) {
            reports = reports.filter(report => report.url === url)
        }

        return reports
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit)
    }

    // 리포트 비교
    compareReports(report1: SEOReport, report2: SEOReport): {
        scoreChange: number;
        metadataChanges: string[];
        performanceChanges: string[];
        recommendations: string[];
    } {
        const scoreChange = report2.seoScore - report1.seoScore
        const metadataChanges: string[] = []
        const performanceChanges: string[] = []
        const recommendations: string[] = []

        // 메타데이터 변경사항
        if (report1.metadata.title !== report2.metadata.title) {
            metadataChanges.push('페이지 제목이 변경되었습니다')
        }
        if (report1.metadata.description !== report2.metadata.description) {
            metadataChanges.push('메타 설명이 변경되었습니다')
        }

        // 성능 변경사항
        if (report1.performance && report2.performance) {
            const loadTimeChange = report2.performance.totalLoadTime - report1.performance.totalLoadTime
            if (Math.abs(loadTimeChange) > 500) {
                performanceChanges.push(
                    `로딩 시간이 ${loadTimeChange > 0 ? '증가' : '감소'}했습니다 (${Math.abs(loadTimeChange)}ms)`
                )
            }
        }

        // 권장사항
        if (scoreChange > 0) {
            recommendations.push('SEO 점수가 개선되었습니다!')
        } else if (scoreChange < 0) {
            recommendations.push('SEO 점수가 하락했습니다. 원인을 분석해보세요.')
        }

        logger.info('Report comparison completed', {
            scoreChange,
            metadataChanges: metadataChanges.length,
            performanceChanges: performanceChanges.length
        })

        return { scoreChange, metadataChanges, performanceChanges, recommendations }
    }

    // 리포트 내보내기
    exportReport(report: SEOReport, format: 'json' | 'summary' = 'summary'): string {
        if (format === 'json') {
            return JSON.stringify(report, null, 2)
        }

        // 요약 형태로 리포트 생성
        const summary = `
SEO 분석 리포트
===============

URL: ${report.url}
분석 일시: ${report.timestamp.toLocaleString()}
SEO 점수: ${report.seoScore}/100

메타데이터:
- 제목: ${report.metadata.title || '없음'}
- 설명: ${report.metadata.description || '없음'}
- 키워드: ${report.metadata.keywords || '없음'}

성능:
- 총 로딩 시간: ${report.performance.totalLoadTime}ms
- DOM 콘텐츠 로딩: ${report.performance.domContentLoaded}ms
- First Contentful Paint: ${report.performance.firstContentfulPaint}ms

구조화 데이터: ${report.structuredData.length}개

개선 권장사항:
${report.recommendations.map(rec => `- ${rec}`).join('\n')}
        `.trim()

        return summary
    }
}