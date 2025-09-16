import { ipcMain, BrowserWindow } from 'electron'
import { TabManager } from '../managers/tabManager'
import { createModuleLogger } from '../../shared/logger'

// GIGA-CHAD: 네비게이션 관련 이벤트 처리기
export class NavigationHandler {
    private static instance: NavigationHandler
    private tabManager: TabManager
    private logger = createModuleLogger('NavigationHandler')

    private constructor() {
        this.tabManager = TabManager.getInstance()
    }

    static getInstance(): NavigationHandler {
        if (!this.instance) {
            this.instance = new NavigationHandler()
        }
        return this.instance
    }

    /**
     * 네비게이션 관련 IPC 핸들러 등록
     */
    register(): void {
        this.logger.info('🧭 GIGA-CHAD: Registering navigation handlers...')

        // 뒤로 가기
        ipcMain.handle('browser:goBack', async (_, tabId: string) => {
            try {
                const tab = this.tabManager.getTab(tabId)
                if (!tab) {
                    throw new Error(`Tab not found: ${tabId}`)
                }

                // TabManager에서 BrowserView에 접근하여 뒤로 가기 실행
                // 실제 구현에서는 TabManager에 goBack 메서드를 추가해야 함
                return { success: true }
            } catch (error) {
                this.logger.error('Failed to go back:', error)
                throw error
            }
        })

        // 앞으로 가기
        ipcMain.handle('browser:goForward', async (_, tabId: string) => {
            try {
                const tab = this.tabManager.getTab(tabId)
                if (!tab) {
                    throw new Error(`Tab not found: ${tabId}`)
                }

                // TabManager에서 BrowserView에 접근하여 앞으로 가기 실행
                return { success: true }
            } catch (error) {
                this.logger.error('Failed to go forward:', error)
                throw error
            }
        })

        // 새로고침
        ipcMain.handle('browser:reload', async (_, tabId: string) => {
            try {
                const tab = this.tabManager.getTab(tabId)
                if (!tab) {
                    throw new Error(`Tab not found: ${tabId}`)
                }

                // TabManager에서 BrowserView에 접근하여 새로고침 실행
                return { success: true }
            } catch (error) {
                this.logger.error('Failed to reload:', error)
                throw error
            }
        })

        // 중지
        ipcMain.handle('browser:stop', async (_, tabId: string) => {
            try {
                const tab = this.tabManager.getTab(tabId)
                if (!tab) {
                    throw new Error(`Tab not found: ${tabId}`)
                }

                // TabManager에서 BrowserView에 접근하여 중지 실행
                return { success: true }
            } catch (error) {
                this.logger.error('Failed to stop:', error)
                throw error
            }
        })

        // 홈페이지로 이동
        ipcMain.handle('browser:goHome', async (_, tabId: string) => {
            try {
                await this.tabManager.navigateTab(tabId, 'https://www.google.com')
                return { success: true }
            } catch (error) {
                this.logger.error('Failed to go home:', error)
                throw error
            }
        })

        // 현재 페이지 정보 가져오기
        ipcMain.handle('browser:getPageInfo', async (_, tabId: string) => {
            try {
                const tab = this.tabManager.getTab(tabId)
                if (!tab) {
                    throw new Error(`Tab not found: ${tabId}`)
                }

                return {
                    url: tab.url,
                    title: tab.title,
                    canGoBack: tab.canGoBack,
                    canGoForward: tab.canGoForward,
                    loading: tab.loading
                }
            } catch (error) {
                this.logger.error('Failed to get page info:', error)
                throw error
            }
        })

        // 페이지 스크린샷 캡처
        ipcMain.handle('browser:captureScreenshot', async (_, tabId: string) => {
            try {
                // TODO: TabManager에서 BrowserView에 접근하여 스크린샷 캡처
                // const screenshot = await browserView.webContents.capturePage()
                // return screenshot.toDataURL()

                this.logger.info(`📸 GIGA-CHAD: Screenshot requested for tab ${tabId}`)
                return null // 임시로 null 반환
            } catch (error) {
                this.logger.error('Failed to capture screenshot:', error)
                throw error
            }
        })

        // 페이지 내 검색
        ipcMain.handle('browser:findInPage', async (_, tabId: string, searchTerm: string) => {
            try {
                // TODO: TabManager에서 BrowserView에 접근하여 페이지 내 검색
                this.logger.info(`🔍 GIGA-CHAD: Find in page requested for tab ${tabId}: ${searchTerm}`)
                return { success: true }
            } catch (error) {
                this.logger.error('Failed to find in page:', error)
                throw error
            }
        })

        this.logger.info('✅ GIGA-CHAD: Navigation handlers registered')
    }

    /**
     * 핸들러 해제
     */
    unregister(): void {
        ipcMain.removeHandler('browser:goBack')
        ipcMain.removeHandler('browser:goForward')
        ipcMain.removeHandler('browser:reload')
        ipcMain.removeHandler('browser:stop')
        ipcMain.removeHandler('browser:goHome')
        ipcMain.removeHandler('browser:getPageInfo')
        ipcMain.removeHandler('browser:captureScreenshot')
        ipcMain.removeHandler('browser:findInPage')

        this.logger.info('🧭 GIGA-CHAD: Navigation handlers unregistered')
    }
}