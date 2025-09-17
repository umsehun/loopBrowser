import { WebContentsView } from 'electron'
import { createLogger } from '../../../shared/logger'
import { IOptimizationService } from '../../../shared/types'

const logger = createLogger('StructuredDataService')

/**
 * 🏗️ 구조화 데이터 서비스 (SRP: 구조화 데이터 분석만 담당)
 * - JSON-LD 스키마 추출
 * - 마이크로데이터 분석
 * - Rich Snippets 검증
 * - 구조화 데이터 품질 검사
 */
export class StructuredDataService implements IOptimizationService {
    private isInitialized = false

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Structured data service already initialized')
            return
        }

        logger.info('🏗️ Initializing structured data service...')

        this.isInitialized = true
        logger.info('✅ Structured data service initialized successfully')
    }

    // 구조화 데이터 추출
    async extractStructuredData(webView: WebContentsView): Promise<unknown[]> {
        if (!this.isInitialized) {
            throw new Error('Structured data service not initialized')
        }

        try {
            logger.debug('Extracting structured data...')

            const result = await webView.webContents.executeJavaScript(`
                (function() {
                    const structuredData = [];
                    
                    // JSON-LD 추출
                    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
                    jsonLdScripts.forEach(script => {
                        try {
                            const data = JSON.parse(script.textContent || '');
                            structuredData.push({
                                type: 'JSON-LD',
                                data: data
                            });
                        } catch (e) {
                            console.warn('Invalid JSON-LD found:', e);
                        }
                    });
                    
                    // 마이크로데이터 추출
                    const itemScopes = document.querySelectorAll('[itemscope]');
                    itemScopes.forEach(element => {
                        const microdata = {
                            type: 'Microdata',
                            itemType: element.getAttribute('itemtype'),
                            properties: {}
                        };
                        
                        const props = element.querySelectorAll('[itemprop]');
                        props.forEach(prop => {
                            const name = prop.getAttribute('itemprop');
                            const content = prop.getAttribute('content') || 
                                          prop.textContent || 
                                          prop.getAttribute('href') || 
                                          prop.getAttribute('src');
                            
                            if (name && content) {
                                microdata.properties[name] = content;
                            }
                        });
                        
                        if (Object.keys(microdata.properties).length > 0) {
                            structuredData.push(microdata);
                        }
                    });
                    
                    // Open Graph 데이터도 구조화 데이터로 간주
                    const ogData = {};
                    const ogTags = document.querySelectorAll('meta[property^="og:"]');
                    ogTags.forEach(tag => {
                        const property = tag.getAttribute('property');
                        const content = tag.getAttribute('content');
                        if (property && content) {
                            ogData[property] = content;
                        }
                    });
                    
                    if (Object.keys(ogData).length > 0) {
                        structuredData.push({
                            type: 'Open Graph',
                            data: ogData
                        });
                    }
                    
                    return structuredData;
                })();
            `)

            logger.debug('Structured data extracted successfully', {
                count: result.length,
                types: result.map((item: any) => item.type)
            })

            return result
        } catch (error) {
            logger.error('Failed to extract structured data', error)
            return []
        }
    }

    // 구조화 데이터 검증
    validateStructuredData(structuredData: unknown[]): {
        score: number;
        validSchemas: number;
        invalidSchemas: number;
        recommendations: string[];
        errors: string[];
    } {
        const recommendations: string[] = []
        const errors: string[] = []
        let validSchemas = 0
        let invalidSchemas = 0
        let score = 0

        structuredData.forEach((item: any) => {
            try {
                switch (item.type) {
                    case 'JSON-LD':
                        if (this.validateJsonLd(item.data)) {
                            validSchemas++
                            score += 10
                        } else {
                            invalidSchemas++
                            errors.push('Invalid JSON-LD schema found')
                        }
                        break

                    case 'Microdata':
                        if (this.validateMicrodata(item)) {
                            validSchemas++
                            score += 8
                        } else {
                            invalidSchemas++
                            errors.push('Invalid Microdata found')
                        }
                        break

                    case 'Open Graph':
                        if (this.validateOpenGraph(item.data)) {
                            validSchemas++
                            score += 6
                        } else {
                            invalidSchemas++
                            errors.push('Incomplete Open Graph data')
                        }
                        break
                }
            } catch (error) {
                invalidSchemas++
                errors.push(`Schema validation error: ${(error as Error).message}`)
            }
        })

        // 권장사항 생성
        if (validSchemas === 0) {
            recommendations.push('Add structured data to improve search engine understanding')
        }

        if (validSchemas < 3) {
            recommendations.push('Consider adding more structured data types (Organization, Product, Article, etc.)')
        }

        if (invalidSchemas > 0) {
            recommendations.push('Fix invalid structured data schemas')
        }

        logger.debug('Structured data validation completed', {
            score: `${score}/100`,
            validSchemas,
            invalidSchemas,
            totalRecommendations: recommendations.length,
            totalErrors: errors.length
        })

        return { score, validSchemas, invalidSchemas, recommendations, errors }
    }

    // JSON-LD 검증
    private validateJsonLd(data: any): boolean {
        // 기본 JSON-LD 구조 검증
        if (!data || typeof data !== 'object') {
            return false
        }

        // @context가 있는지 확인
        if (!data['@context']) {
            return false
        }

        // @type이 있는지 확인
        if (!data['@type']) {
            return false
        }

        // 일반적인 schema.org 타입들 확인
        const validTypes = [
            'Organization', 'Person', 'Product', 'Article', 'BlogPosting',
            'WebSite', 'WebPage', 'LocalBusiness', 'Event', 'Recipe',
            'Course', 'JobPosting', 'Review', 'FAQ', 'BreadcrumbList'
        ]

        const type = Array.isArray(data['@type']) ? data['@type'][0] : data['@type']
        return validTypes.includes(type)
    }

    // 마이크로데이터 검증
    private validateMicrodata(item: any): boolean {
        if (!item.itemType) {
            return false
        }

        if (!item.properties || Object.keys(item.properties).length === 0) {
            return false
        }

        // schema.org URL 검증
        return item.itemType.includes('schema.org')
    }

    // Open Graph 검증
    private validateOpenGraph(data: any): boolean {
        // 필수 OG 태그들
        const requiredTags = ['og:title', 'og:type', 'og:url', 'og:image']

        return requiredTags.some(tag => data[tag])
    }

    // 스키마 타입 분석
    analyzeSchemaTypes(structuredData: unknown[]): {
        types: Record<string, number>;
        coverage: string[];
        missing: string[];
    } {
        const types: Record<string, number> = {}
        const coverage: string[] = []

        // 발견된 타입들 집계
        structuredData.forEach((item: any) => {
            let schemaType = 'unknown'

            if (item.type === 'JSON-LD' && item.data['@type']) {
                schemaType = Array.isArray(item.data['@type']) ? item.data['@type'][0] : item.data['@type']
            } else if (item.type === 'Microdata' && item.itemType) {
                schemaType = item.itemType.split('/').pop() || 'unknown'
            } else if (item.type === 'Open Graph') {
                schemaType = 'OpenGraph'
            }

            types[schemaType] = (types[schemaType] || 0) + 1
            if (!coverage.includes(schemaType)) {
                coverage.push(schemaType)
            }
        })

        // 권장되는 스키마 타입들
        const recommendedTypes = [
            'Organization', 'WebSite', 'WebPage', 'BreadcrumbList', 'OpenGraph'
        ]

        const missing = recommendedTypes.filter(type => !coverage.includes(type))

        logger.info('Schema type analysis completed', {
            totalTypes: Object.keys(types).length,
            coverage: coverage.length,
            missing: missing.length
        })

        return { types, coverage, missing }
    }

    // 구조화 데이터 품질 점수
    calculateQualityScore(structuredData: unknown[]): number {
        if (structuredData.length === 0) {
            return 0
        }

        const validation = this.validateStructuredData(structuredData)
        const analysis = this.analyzeSchemaTypes(structuredData)

        let qualityScore = 0

        // 기본 점수 (유효한 스키마당)
        qualityScore += validation.validSchemas * 10

        // 다양성 보너스
        if (analysis.coverage.length >= 3) {
            qualityScore += 20
        } else if (analysis.coverage.length >= 2) {
            qualityScore += 10
        }

        // 필수 스키마 보너스
        if (analysis.coverage.includes('Organization')) qualityScore += 10
        if (analysis.coverage.includes('WebSite')) qualityScore += 10
        if (analysis.coverage.includes('OpenGraph')) qualityScore += 5

        // 오류 페널티
        qualityScore -= validation.invalidSchemas * 5

        return Math.min(Math.max(qualityScore, 0), 100)
    }
}