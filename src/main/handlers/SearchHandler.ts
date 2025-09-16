import { ipcMain } from 'electron'
import { SearchService } from '../services/SearchService'
import { createModuleLogger } from '../../shared/logger'

// GIGA-CHAD: 검색 관련 이벤트 처리기
export class SearchHandler {
    private static instance: SearchHandler
    private searchService: SearchService
    private logger = createModuleLogger('SearchHandler')

    private constructor() {
        this.searchService = SearchService.getInstance()
    }

    static getInstance(): SearchHandler {
        if (!this.instance) {
            this.instance = new SearchHandler()
        }
        return this.instance
    }

    /**
     * 검색 관련 IPC 핸들러 등록
     */
    register(): void {
        this.logger.info('🔍 GIGA-CHAD: Registering search handlers...')

        // Google 검색 처리
        ipcMain.handle('search:google', async (_, query: string) => {
            try {
                const result = this.searchService.processInput(query)
                return result.url
            } catch (error) {
                this.logger.error('Search failed:', error)
                throw error
            }
        })

        // 검색 제안 가져오기
        ipcMain.handle('search:suggestions', async (_, query: string) => {
            try {
                return await this.searchService.getUnifiedSuggestions(query)
            } catch (error) {
                this.logger.error('Failed to get suggestions:', error)
                return []
            }
        })

        // 검색 입력 처리 (URL vs 검색어 판별)
        ipcMain.handle('search:processInput', async (_, input: string) => {
            try {
                return this.searchService.processInput(input)
            } catch (error) {
                this.logger.error('Failed to process input:', error)
                throw error
            }
        })

        // 검색 캐시 정리
        ipcMain.handle('search:clearCache', async () => {
            try {
                this.searchService.clearCache()
                return { success: true }
            } catch (error) {
                this.logger.error('Failed to clear search cache:', error)
                throw error
            }
        })

        this.logger.info('✅ GIGA-CHAD: Search handlers registered')
    }

    /**
     * 핸들러 해제
     */
    unregister(): void {
        ipcMain.removeHandler('search:google')
        ipcMain.removeHandler('search:suggestions')
        ipcMain.removeHandler('search:processInput')
        ipcMain.removeHandler('search:clearCache')

        this.logger.info('🔍 GIGA-CHAD: Search handlers unregistered')
    }
}