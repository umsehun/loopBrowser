import { ipcMain, IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import { logger } from '../../shared/logger/index'
import { devToolsService } from '../services/DevToolsService'
import { tabService } from '../services/TabService'
import { settingsService } from '../services/SettingsService'
import { windowManager } from '../managers/WindowManager'

export class IpcHandlers {
    private static instance: IpcHandlers
    private isSetup = false

    constructor() {
        logger.info('IpcHandlers initialized')
    }

    static getInstance(): IpcHandlers {
        if (!IpcHandlers.instance) {
            IpcHandlers.instance = new IpcHandlers()
        }
        return IpcHandlers.instance
    }

    // IPC 핸들러 설정
    setupHandlers(): void {
        if (this.isSetup) {
            logger.warn('IPC handlers already setup')
            return
        }

        try {
            logger.info('Setting up IPC handlers...')

            this.setupWindowHandlers()
            this.setupTabHandlers()
            this.setupNavigationHandlers()
            this.setupDevToolsHandlers()
            this.setupSettingsHandlers()
            this.setupCaptureHandlers()

            this.isSetup = true
            logger.info('IPC handlers setup complete')
        } catch (error) {
            logger.error('Failed to setup IPC handlers', { error })
            throw error
        }
    }

    // 윈도우 관련 핸들러
    private setupWindowHandlers(): void {
        // 사이드바 토글
        ipcMain.on('toggle-sidebar', (event: IpcMainEvent) => {
            try {
                // 현재 사이드바 상태를 가져와서 토글
                const currentSettings = settingsService.getUISettings()
                const newSidebarState = !currentSettings.showSidebar

                // 설정 업데이트
                settingsService.setUISettings({
                    ...currentSettings,
                    showSidebar: newSidebarState
                })

                // 레이아웃 업데이트
                tabService.resizeActiveTab()

                // 모든 렌더러에 상태 변경 알림
                const mainWindow = windowManager.getMainWindow()
                if (mainWindow) {
                    mainWindow.webContents.send('sidebar-toggled', newSidebarState)

                    // 설정 변경도 브로드캐스트
                    const allSettings = settingsService.getAllSettings()
                    mainWindow.webContents.send('settings-changed', allSettings)
                }

                logger.debug('Sidebar toggled to:', newSidebarState)
            } catch (error) {
                logger.error('Failed to toggle sidebar', { error })
            }
        })

        // 레이아웃 업데이트 (Chrome 영역 계산용)
        ipcMain.on('update-layout', (event: IpcMainEvent, dimensions: { headerHeight: number; sidebarWidth: number }) => {
            try {
                logger.debug('Layout updated', { dimensions })
                tabService.updateLayoutDimensions(dimensions)
                tabService.resizeActiveTab()
            } catch (error) {
                logger.error('Failed to update layout', { error })
            }
        })

        // 윈도우 최소화
        ipcMain.on('minimize-window', () => {
            try {
                windowManager.minimizeWindow()
            } catch (error) {
                logger.error('Failed to minimize window', { error })
            }
        })

        // 윈도우 최대화/복원
        ipcMain.on('toggle-maximize-window', () => {
            try {
                windowManager.toggleMaximizeWindow()
            } catch (error) {
                logger.error('Failed to toggle maximize window', { error })
            }
        })

        // 윈도우 닫기
        ipcMain.on('close-window', () => {
            try {
                windowManager.closeWindow()
            } catch (error) {
                logger.error('Failed to close window', { error })
            }
        })

        // 전체화면 토글
        ipcMain.on('toggle-fullscreen', () => {
            try {
                windowManager.toggleFullScreen()
            } catch (error) {
                logger.error('Failed to toggle fullscreen', { error })
            }
        })

        // 윈도우 상태 확인
        ipcMain.handle('get-window-state', () => {
            try {
                return {
                    isMaximized: windowManager.isWindowMaximized(),
                    isMinimized: windowManager.isWindowMinimized(),
                    isFullScreen: windowManager.isWindowFullScreen(),
                    isFocused: windowManager.isWindowFocused(),
                    isVisible: windowManager.isWindowVisible()
                }
            } catch (error) {
                logger.error('Failed to get window state', { error })
                return null
            }
        })
    }

    // 탭 관련 핸들러
    private setupTabHandlers(): void {
        // 새 탭 생성
        ipcMain.handle('create-tab', (event: IpcMainInvokeEvent, url: string, section?: string) => {
            try {
                const tab = tabService.createTab(url, section as any)
                logger.info('Tab created via IPC', { id: tab.id, url, section })
                return {
                    id: tab.id,
                    title: tab.title,
                    url: tab.url,
                    section: tab.section,
                    isActive: tab.isActive,
                    isLoading: tab.isLoading,
                    canGoBack: tab.canGoBack,
                    canGoForward: tab.canGoForward
                }
            } catch (error) {
                logger.error('Failed to create tab via IPC', { error, url, section })
                return null
            }
        })

        // 탭 활성화
        ipcMain.handle('activate-tab', (event: IpcMainInvokeEvent, tabId: string) => {
            try {
                const result = tabService.activateTab(tabId)
                logger.debug('Tab activated via IPC', { tabId, success: result })
                return result
            } catch (error) {
                logger.error('Failed to activate tab via IPC', { error, tabId })
                return false
            }
        })

        // 탭 닫기
        ipcMain.handle('close-tab', (event: IpcMainInvokeEvent, tabId: string) => {
            try {
                const result = tabService.closeTab(tabId)
                logger.debug('Tab closed via IPC', { tabId, success: result })
                return result
            } catch (error) {
                logger.error('Failed to close tab via IPC', { error, tabId })
                return false
            }
        })

        // 모든 탭 가져오기
        ipcMain.handle('get-all-tabs', () => {
            try {
                const tabs = tabService.getAllTabs().map(tab => ({
                    id: tab.id,
                    title: tab.title,
                    url: tab.url,
                    section: tab.section,
                    isActive: tab.isActive,
                    isLoading: tab.isLoading,
                    canGoBack: tab.canGoBack,
                    canGoForward: tab.canGoForward,
                    favicon: tab.favicon
                }))
                logger.debug('Tabs retrieved via IPC', { count: tabs.length })
                return tabs
            } catch (error) {
                logger.error('Failed to get tabs via IPC', { error })
                return []
            }
        })

        // 활성 탭 가져오기
        ipcMain.handle('get-active-tab', () => {
            try {
                const activeTab = tabService.getActiveTab()
                if (activeTab) {
                    return {
                        id: activeTab.id,
                        title: activeTab.title,
                        url: activeTab.url,
                        section: activeTab.section,
                        isActive: activeTab.isActive,
                        isLoading: activeTab.isLoading,
                        canGoBack: activeTab.canGoBack,
                        canGoForward: activeTab.canGoForward,
                        favicon: activeTab.favicon
                    }
                }
                return null
            } catch (error) {
                logger.error('Failed to get active tab via IPC', { error })
                return null
            }
        })

        // 탭 이동
        ipcMain.handle('move-tab', (event: IpcMainInvokeEvent, tabId: string, targetSection: string) => {
            try {
                const result = tabService.moveTab(tabId, targetSection as any)
                logger.debug('Tab moved via IPC', { tabId, targetSection, success: result })
                return result
            } catch (error) {
                logger.error('Failed to move tab via IPC', { error, tabId, targetSection })
                return false
            }
        })
    }

    // 네비게이션 관련 핸들러
    private setupNavigationHandlers(): void {
        // URL로 이동
        ipcMain.on('navigate-to', (event: IpcMainEvent, url: string) => {
            try {
                const activeTab = tabService.getActiveTab()
                // Special internal pages (about:*) should be handled by renderer UI
                if (url.startsWith('about:')) {
                    const mainWindow = windowManager.getMainWindow()
                    if (mainWindow) {
                        if (url === 'about:preferences') {
                            // hide web contents view so renderer preferences page is visible
                            windowManager.hideWebContentsView()
                            mainWindow.webContents.send('show-preferences')
                        }
                        // other about: pages can be added here
                    }
                    return
                }

                if (activeTab && activeTab.view) {
                    let formattedUrl = url

                    // URL 포맷팅
                    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
                        // 검색어인지 URL인지 판단
                        if (url.includes('.') && !url.includes(' ')) {
                            formattedUrl = 'https://' + url
                        } else {
                            // 구글 검색
                            formattedUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`
                        }
                    }

                    activeTab.view.webContents.loadURL(formattedUrl)
                    // Ensure WebContentsView is visible when navigating normal pages
                    windowManager.showWebContentsView()
                    logger.info('Navigation requested via IPC', { originalUrl: url, formattedUrl })
                } else {
                    logger.warn('No active tab for navigation', { url })
                }
            } catch (error) {
                logger.error('Failed to navigate via IPC', { error, url })
            }
        })

        // 뒤로 가기
        ipcMain.on('go-back', () => {
            try {
                const activeTab = tabService.getActiveTab()
                if (activeTab && activeTab.view && activeTab.canGoBack) {
                    activeTab.view.webContents.navigationHistory.goBack()
                    logger.debug('Go back requested via IPC')
                }
            } catch (error) {
                logger.error('Failed to go back via IPC', { error })
            }
        })

        // 앞으로 가기
        ipcMain.on('go-forward', () => {
            try {
                const activeTab = tabService.getActiveTab()
                if (activeTab && activeTab.view && activeTab.canGoForward) {
                    activeTab.view.webContents.navigationHistory.goForward()
                    logger.debug('Go forward requested via IPC')
                }
            } catch (error) {
                logger.error('Failed to go forward via IPC', { error })
            }
        })

        // 새로고침
        ipcMain.on('reload', () => {
            try {
                const activeTab = tabService.getActiveTab()
                if (activeTab && activeTab.view) {
                    activeTab.view.webContents.reload()
                    logger.debug('Reload requested via IPC')
                }
            } catch (error) {
                logger.error('Failed to reload via IPC', { error })
            }
        })

        // 홈으로 이동
        ipcMain.on('go-home', () => {
            try {
                const activeTab = tabService.getActiveTab()
                if (activeTab && activeTab.view) {
                    activeTab.view.webContents.loadURL('https://www.google.com')
                    logger.debug('Go home requested via IPC')
                }
            } catch (error) {
                logger.error('Failed to go home via IPC', { error })
            }
        })
    }

    // DevTools 관련 핸들러
    private setupDevToolsHandlers(): void {
        // Chrome DevTools 열기
        ipcMain.on('open-devtools', (event: IpcMainEvent, mode?: string) => {
            try {
                devToolsService.openChromeDevTools(mode as any)
                logger.debug('DevTools opened via IPC', { mode })
            } catch (error) {
                logger.error('Failed to open DevTools via IPC', { error, mode })
            }
        })

        // DevTools 상태 확인
        ipcMain.handle('is-devtools-open', () => {
            try {
                return devToolsService.isDevToolsOpen()
            } catch (error) {
                logger.error('Failed to check DevTools state via IPC', { error })
                return false
            }
        })
    }

    // 설정 관련 핸들러
    private setupSettingsHandlers(): void {
        // 모든 설정 가져오기
        ipcMain.handle('get-settings', () => {
            try {
                const settings = settingsService.getAllSettings()
                logger.debug('Settings retrieved via IPC')
                return settings
            } catch (error) {
                logger.error('Failed to get settings via IPC', { error })
                return {}
            }
        })

        // UI 설정 가져오기/설정하기
        ipcMain.handle('get-ui-settings', () => {
            try {
                return settingsService.getUISettings()
            } catch (error) {
                logger.error('Failed to get UI settings via IPC', { error })
                return null
            }
        })

        ipcMain.handle('set-ui-settings', (event: IpcMainInvokeEvent, settings: any) => {
            try {
                settingsService.setUISettings(settings)

                // 설정 변경을 모든 렌더러 프로세스에 브로드캐스트
                const allSettings = settingsService.getAllSettings()
                const mainWindow = windowManager.getMainWindow()
                if (mainWindow) {
                    mainWindow.webContents.send('settings-changed', allSettings)
                }

                logger.debug('UI settings saved and broadcasted via IPC', { settings })
                return true
            } catch (error) {
                logger.error('Failed to set UI settings via IPC', { error, settings })
                return false
            }
        })

        // 브라우저 설정 가져오기/설정하기
        ipcMain.handle('get-browser-settings', () => {
            try {
                return settingsService.getBrowserSettings()
            } catch (error) {
                logger.error('Failed to get browser settings via IPC', { error })
                return null
            }
        })

        ipcMain.handle('set-browser-settings', (event: IpcMainInvokeEvent, settings: any) => {
            try {
                settingsService.setBrowserSettings(settings)

                // 설정 변경을 모든 렌더러 프로세스에 브로드캐스트
                const allSettings = settingsService.getAllSettings()
                const mainWindow = windowManager.getMainWindow()
                if (mainWindow) {
                    mainWindow.webContents.send('settings-changed', allSettings)
                }

                logger.debug('Browser settings saved and broadcasted via IPC', { settings })
                return true
            } catch (error) {
                logger.error('Failed to set browser settings via IPC', { error, settings })
                return false
            }
        })

        // User-Agent 설정
        ipcMain.handle('set-user-agent-preset', (event: IpcMainInvokeEvent, preset: string) => {
            try {
                settingsService.setUserAgentPreset(preset as any)

                // WindowManager의 User-Agent도 실시간 업데이트
                windowManager.updateUserAgent()

                logger.info('User-Agent preset updated via IPC', { preset })
                return true
            } catch (error) {
                logger.error('Failed to set User-Agent preset via IPC', { error, preset })
                return false
            }
        })

        // 설정 초기화
        ipcMain.handle('reset-settings', () => {
            try {
                settingsService.resetSettings()
                logger.info('Settings reset via IPC')
                return true
            } catch (error) {
                logger.error('Failed to reset settings via IPC', { error })
                return false
            }
        })
    }

    // 캡쳐 관련 핸들러
    private setupCaptureHandlers(): void {
        // 웹페이지 캡쳐
        ipcMain.handle('capture-page', async () => {
            try {
                const activeTab = tabService.getActiveTab()
                if (!activeTab || !activeTab.view) {
                    logger.warn('No active tab to capture')
                    return null
                }

                const image = await activeTab.view.webContents.capturePage()
                const buffer = image.toPNG()
                logger.info('Page captured successfully')
                return buffer
            } catch (error) {
                logger.error('Failed to capture page', { error })
                return null
            }
        })

        // 특정 탭 캡쳐
        ipcMain.handle('capture-tab', async (event: IpcMainInvokeEvent, tabId: string) => {
            try {
                const tab = tabService.getTab(tabId)
                if (!tab || !tab.view) {
                    logger.warn('Tab not found for capture', { tabId })
                    return null
                }

                const image = await tab.view.webContents.capturePage()
                const buffer = image.toPNG()
                logger.info('Tab captured successfully', { tabId })
                return buffer
            } catch (error) {
                logger.error('Failed to capture tab', { error, tabId })
                return null
            }
        })

        // 메모리 모니터링 창 토글
        ipcMain.on('toggle-memory-monitor', (event: IpcMainEvent) => {
            try {
                const mainWindow = windowManager.getMainWindow()
                if (mainWindow) {
                    mainWindow.webContents.send('toggle-memory-monitor')
                }
                logger.debug('Memory monitor toggle requested')
            } catch (error) {
                logger.error('Failed to toggle memory monitor', { error })
            }
        })

        // 메모리 모니터링 데이터 요청
        ipcMain.handle('get-memory-stats', async () => {
            try {
                const memoryService = (await import('../services/optimization/MemoryService')).memoryService
                return await memoryService.getMemoryStats()
            } catch (error) {
                logger.error('Failed to get memory stats', { error })
                return null
            }
        })
    }

    // 핸들러 정리
    cleanup(): void {
        try {
            ipcMain.removeAllListeners()
            this.isSetup = false
            logger.info('IPC handlers cleanup complete')
        } catch (error) {
            logger.error('Error during IPC handlers cleanup', { error })
        }
    }
}

// 싱글톤 인스턴스 내보내기
export const ipcHandlers = IpcHandlers.getInstance()
export default ipcHandlers