import { ipcMain, BrowserWindow } from 'electron'
import { TabManager } from '../managers/tabManager'
import { createModuleLogger } from '../../shared/logger'

// GIGA-CHAD: 탭 관련 이벤트 처리기
export class TabHandler {
    private static instance: TabHandler
    private tabManager: TabManager
    private logger = createModuleLogger('TabHandler')

    private constructor() {
        this.tabManager = TabManager.getInstance()
    }

    static getInstance(): TabHandler {
        if (!this.instance) {
            this.instance = new TabHandler()
        }
        return this.instance
    }

    /**
     * 탭 관련 IPC 핸들러 등록
     */
    register(): void {
        this.logger.info('Registering tab handlers...')

        // 새 탭 생성
        ipcMain.handle('tab:create', async (event, url: string) => {
            try {
                // GIGA-CHAD: ModernTabManager 사용
                const tabInfo = await this.tabManager.createTab(url || 'https://www.google.com')
                return tabInfo
            } catch (error) {
                this.logger.error('Failed to create tab:', error)
                throw error
            }
        })

        // 탭 닫기
        ipcMain.handle('tab:close', async (_, tabId: string) => {
            try {
                // GIGA-CHAD: ModernTabManager 사용
                await this.tabManager.closeTab(tabId)
                return { success: true }
            } catch (error) {
                this.logger.error('Failed to close tab:', error)
                throw error
            }
        })

        // 탭 전환
        ipcMain.handle('tab:switch', async (_, tabId: string) => {
            try {
                // GIGA-CHAD: ModernTabManager 사용
                await this.tabManager.switchTab(tabId)
                return { success: true }
            } catch (error) {
                this.logger.error('Failed to switch tab:', error)
                throw error
            }
        })

        // 모든 탭 정보 가져오기
        ipcMain.handle('tab:getAll', async () => {
            try {
                // GIGA-CHAD: ModernTabManager 사용
                return this.tabManager.getAllTabs()
            } catch (error) {
                this.logger.error('Failed to get all tabs:', error)
                return []
            }
        })

        // 탭 URL 업데이트
        ipcMain.handle('tab:updateUrl', async (_, tabId: string, url: string) => {
            try {
                await this.tabManager.updateTabUrl(tabId, url)
                return { success: true }
            } catch (error) {
                this.logger.error('Failed to update tab URL:', error)
                throw error
            }
        })

        // 활성 탭 정보 가져오기
        ipcMain.handle('tab:getActive', async () => {
            try {
                const activeTabId = this.tabManager.getActiveTabId()
                if (!activeTabId) return null

                return this.tabManager.getTab(activeTabId)
            } catch (error) {
                this.logger.error('Failed to get active tab:', error)
                return null
            }
        })

        // 탭 통계 가져오기
        ipcMain.handle('tab:getStats', async () => {
            try {
                return {
                    total: this.tabManager.getTabCount(),
                    active: this.tabManager.getActiveTabId() ? 1 : 0,
                    suspended: this.tabManager.getSuspendedTabCount()
                }
            } catch (error) {
                this.logger.error('Failed to get tab stats:', error)
                return { total: 0, active: 0, suspended: 0 }
            }
        })

        // GIGA-CHAD: 사이드바 상태 업데이트
        ipcMain.handle('ui:updateSidebarState', async (event, collapsed: boolean) => {
            try {
                const senderWindow = BrowserWindow.fromWebContents(event.sender)
                if (!senderWindow) {
                    throw new Error('Sender window not found')
                }

                // 활성 탭의 BrowserView bounds 재계산 - 오버레이 모드에서는 변경 불필요
                // TODO: 구 시스템 코드 - ModernWindowManager로 마이그레이션 필요
                // const activeTabId = this.tabManager.getActiveTabId()
                // if (activeTabId) {
                //     const browserView = this.tabManager.getBrowserView(activeTabId)
                //     if (browserView) {
                //         // 오버레이 모드에서는 BrowserView 크기가 변하지 않음 (항상 전체 화면)
                //         const bounds = WindowManager.calculateBrowserViewBounds(senderWindow, true)
                //         browserView.setBounds(bounds)

                //         this.logger.info(`🔧 GIGA-CHAD: Sidebar state updated`, {
                //             collapsed,
                //             activeTab: activeTabId,
                //             newBounds: bounds
                //         })
                //     }
                // }

                return { success: true }
            } catch (error) {
                this.logger.error('Failed to update sidebar state:', error)
                throw error
            }
        })

        this.logger.info('Tab handlers registered')
    }

    /**
     * 핸들러 해제
     */
    unregister(): void {
        ipcMain.removeHandler('tab:create')
        ipcMain.removeHandler('tab:close')
        ipcMain.removeHandler('tab:switch')
        ipcMain.removeHandler('tab:getAll')
        ipcMain.removeHandler('tab:updateUrl')
        ipcMain.removeHandler('tab:getActive')
        ipcMain.removeHandler('tab:getStats')
        ipcMain.removeHandler('ui:updateSidebarState')

        this.logger.info('Tab handlers unregistered')
    }
}