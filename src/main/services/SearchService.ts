// GIGA-CHAD: 검색 서비스 - Google 검색 및 제안 기능

interface SearchSuggestion {
    text: string
    type: 'search' | 'url' | 'bookmark'
    favicon?: string
}

interface CachedSuggestions {
    suggestions: SearchSuggestion[]
    timestamp: number
}

import { createModuleLogger } from '../../shared/logger'

export class SearchService {
    private static instance: SearchService
    private logger = createModuleLogger('SearchService')
    private suggestionCache = new Map<string, CachedSuggestions>()
    private readonly CACHE_EXPIRE_TIME = 5 * 60 * 1000 // 5분

    private constructor() { }

    static getInstance(): SearchService {
        if (!this.instance) {
            this.instance = new SearchService()
        }
        return this.instance
    }

    /**
     * Google 검색 URL 생성
     */
    createGoogleSearchUrl(query: string): string {
        const encodedQuery = encodeURIComponent(query.trim())
        return `https://www.google.com/search?q=${encodedQuery}`
    }

    /**
     * URL 검증 및 처리
     */
    processInput(input: string): { type: 'url' | 'search', url: string } {
        const trimmed = input.trim()

        // URL 패턴 확인
        if (this.isValidUrl(trimmed)) {
            let url = trimmed

            // 프로토콜이 없으면 https 추가
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = `https://${url}`
            }

            return { type: 'url', url }
        }

        // Google 검색으로 처리
        return {
            type: 'search',
            url: this.createGoogleSearchUrl(trimmed)
        }
    }

    /**
     * URL 유효성 검증
     */
    private isValidUrl(input: string): boolean {
        // 도메인 패턴 (점이 포함되고 공백이 없으면 URL로 간주)
        const urlPattern = /^[^\s]+\.[^\s]{2,}$/
        const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/
        const localhostPattern = /^localhost(:\d+)?$/

        return urlPattern.test(input) ||
            ipPattern.test(input) ||
            localhostPattern.test(input) ||
            input.startsWith('http://') ||
            input.startsWith('https://')
    }

    /**
     * 검색 제안 가져오기 (Google Suggest API 시뮬레이션)
     */
    async getSuggestions(query: string): Promise<SearchSuggestion[]> {
        if (!query || query.length < 2) {
            return []
        }

        const cacheKey = query.toLowerCase()

        // 캐시 확인
        if (this.suggestionCache.has(cacheKey)) {
            const cached = this.suggestionCache.get(cacheKey)
            if (cached && Date.now() - cached.timestamp < this.CACHE_EXPIRE_TIME) {
                return cached.suggestions
            }
        }

        try {
            // 실제로는 Google Suggest API를 호출하거나
            // 자체 제안 로직을 구현할 수 있음
            const suggestions = await this.fetchGoogleSuggestions(query)

            // 캐시에 저장
            this.suggestionCache.set(cacheKey, {
                suggestions,
                timestamp: Date.now()
            })

            return suggestions
        } catch (error) {
            this.logger.error('Failed to fetch suggestions:', error)
            return this.getFallbackSuggestions(query)
        }
    }

    /**
     * Google Suggest API 호출 (실제 구현)
     */
    private async fetchGoogleSuggestions(query: string): Promise<SearchSuggestion[]> {
        // CORS 문제로 인해 실제 Google Suggest API 사용이 어려울 수 있음
        // 여기서는 기본 제안을 반환
        return this.getFallbackSuggestions(query)
    }

    /**
     * 기본 검색 제안 생성
     */
    private getFallbackSuggestions(query: string): SearchSuggestion[] {
        const commonSearches = [
            'javascript tutorial',
            'react hooks',
            'typescript',
            'electron app',
            'node.js',
            'github',
            'stackoverflow',
            'mdn web docs',
            'visual studio code',
            'chrome developer tools'
        ]

        const suggestions = commonSearches
            .filter(search => search.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5)
            .map(text => ({
                text,
                type: 'search' as const,
                favicon: undefined
            }))

        // 입력된 쿼리 자체도 제안에 추가
        if (!suggestions.some(s => s.text === query)) {
            suggestions.unshift({
                text: query,
                type: 'search' as const,
                favicon: undefined
            })
        }

        return suggestions
    }

    /**
     * 북마크 기반 제안 (나중에 BookmarkManager와 연동)
     */
    async getBookmarkSuggestions(query: string): Promise<SearchSuggestion[]> {
        // TODO: BookmarkManager와 연동하여 북마크 기반 제안 구현
        return []
    }

    /**
     * 히스토리 기반 제안 (나중에 HistoryManager와 연동)
     */
    async getHistorySuggestions(query: string): Promise<SearchSuggestion[]> {
        // TODO: HistoryManager와 연동하여 히스토리 기반 제안 구현
        return []
    }

    /**
     * 통합 제안 (검색 + 북마크 + 히스토리)
     */
    async getUnifiedSuggestions(query: string): Promise<SearchSuggestion[]> {
        const [searchSuggestions, bookmarkSuggestions, historySuggestions] = await Promise.all([
            this.getSuggestions(query),
            this.getBookmarkSuggestions(query),
            this.getHistorySuggestions(query)
        ])

        // 제안 결합 및 중복 제거
        const allSuggestions = [
            ...searchSuggestions,
            ...bookmarkSuggestions,
            ...historySuggestions
        ]

        // 중복 제거 (텍스트 기준)
        const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) =>
            index === self.findIndex(s => s.text === suggestion.text)
        )

        return uniqueSuggestions.slice(0, 8) // 최대 8개 제안
    }

    /**
     * 캐시 정리
     */
    clearCache(): void {
        this.suggestionCache.clear()
        this.logger.info('🧹 GIGA-CHAD: Search suggestion cache cleared')
    }
}