import { WebContentsView } from 'electron'
import { createLogger } from '../../../shared/logger'
import { IOptimizationService, SEOMetadata } from '../../../shared/types'

const logger = createLogger('MetadataExtractorService')

/**
 * 📄 메타데이터 추출 서비스 (SRP: 메타데이터 추출만 담당)
 * - 페이지 제목 추출
 * - 메타 태그 분석
 * - Open Graph 데이터 추출
 * - 캐노니컬 URL 확인
 */
export class MetadataExtractorService implements IOptimizationService {
    private isInitialized = false

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Metadata extractor already initialized')
            return
        }

        logger.info('📄 Initializing metadata extractor...')

        this.isInitialized = true
        logger.info('✅ Metadata extractor initialized successfully')
    }

    // 페이지 SEO 메타데이터 추출
    async extractSEOMetadata(webView: WebContentsView): Promise<SEOMetadata> {
        if (!this.isInitialized) {
            throw new Error('Metadata extractor not initialized')
        }

        try {
            logger.debug('Extracting SEO metadata...')

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
                    
                    // 캐노니컬 URL
                    const canonical = document.querySelector('link[rel="canonical"]');
                    if (canonical) {
                        metadata.canonicalUrl = canonical.getAttribute('href');
                    }
                    
                    return metadata;
                })();
            `)

            logger.debug('SEO metadata extracted successfully', {
                hasTitle: !!result.title,
                hasDescription: !!result.description,
                hasKeywords: !!result.keywords,
                hasOgData: !!(result.ogTitle || result.ogDescription || result.ogImage),
                hasCanonical: !!result.canonicalUrl
            })

            return result as SEOMetadata
        } catch (error) {
            logger.error('Failed to extract SEO metadata', error)
            return {}
        }
    }

    // 메타데이터 품질 검사
    validateMetadata(metadata: SEOMetadata): {
        score: number;
        issues: string[];
        recommendations: string[];
    } {
        const issues: string[] = []
        const recommendations: string[] = []
        let score = 0

        // 제목 검사
        if (!metadata.title) {
            issues.push('Missing page title')
            recommendations.push('Add a descriptive page title')
        } else {
            score += 20
            if (metadata.title.length < 30) {
                recommendations.push('Consider a longer, more descriptive title (30-60 characters)')
            } else if (metadata.title.length > 60) {
                recommendations.push('Title may be too long (should be under 60 characters)')
            }
        }

        // 설명 검사
        if (!metadata.description) {
            issues.push('Missing meta description')
            recommendations.push('Add a meta description (150-160 characters)')
        } else {
            score += 20
            if (metadata.description.length < 120) {
                recommendations.push('Meta description could be longer (120-160 characters)')
            } else if (metadata.description.length > 160) {
                recommendations.push('Meta description may be too long (should be under 160 characters)')
            }
        }

        // 키워드 검사
        if (!metadata.keywords || metadata.keywords.length === 0) {
            recommendations.push('Consider adding relevant keywords')
        } else {
            score += 10
        }

        // Open Graph 검사
        if (metadata.ogTitle || metadata.ogDescription || metadata.ogImage) {
            score += 15
        } else {
            recommendations.push('Add Open Graph tags for better social media sharing')
        }

        // 캐노니컬 URL 검사
        if (metadata.canonicalUrl) {
            score += 10
        } else {
            recommendations.push('Add canonical URL to prevent duplicate content issues')
        }

        // 구조화된 데이터 권장사항
        recommendations.push('Consider adding JSON-LD structured data')

        logger.debug('Metadata validation completed', {
            score: `${score}/75`,
            issueCount: issues.length,
            recommendationCount: recommendations.length
        })

        return { score, issues, recommendations }
    }

    // 메타데이터 비교 (A/B 테스트용)
    compareMetadata(original: SEOMetadata, modified: SEOMetadata): {
        changes: string[];
        improvements: string[];
        concerns: string[];
    } {
        const changes: string[] = []
        const improvements: string[] = []
        const concerns: string[] = []

        // 제목 비교
        if (original.title !== modified.title) {
            changes.push(`Title changed from "${original.title}" to "${modified.title}"`)

            if (modified.title && modified.title.length >= 30 && modified.title.length <= 60) {
                improvements.push('New title length is optimal')
            } else if (modified.title && (modified.title.length < 30 || modified.title.length > 60)) {
                concerns.push('New title length may not be optimal')
            }
        }

        // 설명 비교
        if (original.description !== modified.description) {
            changes.push('Meta description changed')

            if (modified.description && modified.description.length >= 120 && modified.description.length <= 160) {
                improvements.push('New description length is optimal')
            }
        }

        // Open Graph 비교
        const originalOg = !!(original.ogTitle || original.ogDescription || original.ogImage)
        const modifiedOg = !!(modified.ogTitle || modified.ogDescription || modified.ogImage)

        if (!originalOg && modifiedOg) {
            improvements.push('Added Open Graph data')
        } else if (originalOg && !modifiedOg) {
            concerns.push('Removed Open Graph data')
        }

        logger.info('Metadata comparison completed', {
            changes: changes.length,
            improvements: improvements.length,
            concerns: concerns.length
        })

        return { changes, improvements, concerns }
    }
}