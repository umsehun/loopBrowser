import { globalShortcut, BrowserWindow } from 'electron'
import { createModuleLogger } from '../../shared/logger'
import { TabManager } from '../managers/tabManager'

// GIGA-CHAD: 키보드 단축키 서비스
export class ShortcutService {
    private static instance: ShortcutService
    private static logger = createModuleLogger('ShortcutService')
    private registeredShortcuts: Set<string> = new Set()

    private constructor() { }

    static getInstance(): ShortcutService {
        if (!this.instance) {
            this.instance = new ShortcutService()
        }
        return this.instance
    }

    /**
     * 모든 단축키 등록
     */
    registerAllShortcuts(): void {
        ShortcutService.logger.info('Registering global shortcuts...')

        // 탭 관련 단축키
        this.registerShortcut('CommandOrControl+T', () => {
            this.createNewTab()
        })

        this.registerShortcut('CommandOrControl+W', () => {
            this.closeCurrentTab()
        })

        this.registerShortcut('CommandOrControl+Shift+T', () => {
            this.reopenClosedTab()
        })

        // 네비게이션 단축키
        this.registerShortcut('CommandOrControl+R', () => {
            this.reloadCurrentTab()
        })

        this.registerShortcut('CommandOrControl+Shift+R', () => {
            this.hardReloadCurrentTab()
        })

        this.registerShortcut('Alt+Left', () => {
            this.goBack()
        })

        this.registerShortcut('Alt+Right', () => {
            this.goForward()
        })

        // 개발자 도구
        this.registerShortcut('F12', () => {
            this.toggleDevTools()
        })

        this.registerShortcut('CommandOrControl+Shift+I', () => {
            this.toggleDevTools()
        })

        // 주소창 포커스
        this.registerShortcut('CommandOrControl+L', () => {
            this.focusAddressBar()
        })

        // 페이지 확대/축소
        this.registerShortcut('CommandOrControl+Plus', () => {
            this.zoomIn()
        })

        this.registerShortcut('CommandOrControl+-', () => {
            this.zoomOut()
        })

        this.registerShortcut('CommandOrControl+0', () => {
            this.resetZoom()
        })

        // 탭 전환
        this.registerShortcut('CommandOrControl+Tab', () => {
            this.switchToNextTab()
        })

        this.registerShortcut('CommandOrControl+Shift+Tab', () => {
            this.switchToPreviousTab()
        })

        ShortcutService.logger.info(`Registered ${this.registeredShortcuts.size} shortcuts`)
    }

    /**
     * 개별 단축키 등록
     */
    private registerShortcut(accelerator: string, callback: () => void): void {
        try {
            const success = globalShortcut.register(accelerator, callback)
            if (success) {
                this.registeredShortcuts.add(accelerator)
                ShortcutService.logger.debug(`Registered shortcut: ${accelerator}`)
            } else {
                ShortcutService.logger.warn(`Failed to register shortcut: ${accelerator}`)
            }
        } catch (error) {
            ShortcutService.logger.error(`Error registering shortcut ${accelerator}`, error)
        }
    }

    /**
     * 새 탭 생성
     */
    private async createNewTab(): Promise<void> {
        try {
            const tabManager = TabManager.getInstance()
            const newTab = await tabManager.createTab('https://www.google.com')
            await tabManager.activateTab(newTab.id)
            ShortcutService.logger.info('Created new tab via shortcut')
        } catch (error) {
            ShortcutService.logger.error('Failed to create new tab', error)
        }
    }

    /**
     * 현재 탭 닫기
     */
    private async closeCurrentTab(): Promise<void> {
        try {
            const tabManager = TabManager.getInstance()
            const activeTabId = tabManager.getActiveTabId()
            if (activeTabId) {
                await tabManager.closeTab(activeTabId)
                ShortcutService.logger.info('Closed current tab via shortcut')
            }
        } catch (error) {
            ShortcutService.logger.error('Failed to close current tab', error)
        }
    }

    /**
     * 닫힌 탭 다시 열기 (TODO: 구현 필요)
     */
    private reopenClosedTab(): void {
        ShortcutService.logger.info('Reopen closed tab requested (not implemented yet)')
        // TODO: 닫힌 탭 히스토리 관리 및 복원 기능 구현
    }

    /**
     * 현재 탭 새로고침
     */
    private async reloadCurrentTab(): Promise<void> {
        try {
            const tabManager = TabManager.getInstance()
            const activeTabId = tabManager.getActiveTabId()
            if (activeTabId) {
                await tabManager.reload(activeTabId)
                ShortcutService.logger.info('Reloaded current tab via shortcut')
            }
        } catch (error) {
            ShortcutService.logger.error('Failed to reload current tab', error)
        }
    }

    /**
     * 현재 탭 강제 새로고침 (캐시 무시)
     */
    private async hardReloadCurrentTab(): Promise<void> {
        try {
            const tabManager = TabManager.getInstance()
            const activeTabId = tabManager.getActiveTabId()
            if (activeTabId) {
                const browserView = tabManager['browserViews'].get(activeTabId)
                if (browserView) {
                    browserView.webContents.reloadIgnoringCache()
                    ShortcutService.logger.info('Hard reloaded current tab via shortcut')
                }
            }
        } catch (error) {
            ShortcutService.logger.error('Failed to hard reload current tab', error)
        }
    }

    /**
     * 뒤로 가기
     */
    private async goBack(): Promise<void> {
        try {
            const tabManager = TabManager.getInstance()
            const activeTabId = tabManager.getActiveTabId()
            if (activeTabId) {
                await tabManager.goBack(activeTabId)
                ShortcutService.logger.info('Navigated back via shortcut')
            }
        } catch (error) {
            ShortcutService.logger.error('Failed to navigate back', error)
        }
    }

    /**
     * 앞으로 가기
     */
    private async goForward(): Promise<void> {
        try {
            const tabManager = TabManager.getInstance()
            const activeTabId = tabManager.getActiveTabId()
            if (activeTabId) {
                await tabManager.goForward(activeTabId)
                ShortcutService.logger.info('Navigated forward via shortcut')
            }
        } catch (error) {
            ShortcutService.logger.error('Failed to navigate forward', error)
        }
    }

    /**
     * 개발자 도구 토글
     */
    private toggleDevTools(): void {
        try {
            const tabManager = TabManager.getInstance()
            const activeTabId = tabManager.getActiveTabId()
            if (activeTabId) {
                const browserView = tabManager['browserViews'].get(activeTabId)
                if (browserView) {
                    browserView.webContents.toggleDevTools()
                    ShortcutService.logger.info('Toggled dev tools via shortcut')
                }
            }
        } catch (error) {
            ShortcutService.logger.error('Failed to toggle dev tools', error)
        }
    }

    /**
     * 주소창 포커스 (TODO: 구현 필요)
     */
    private focusAddressBar(): void {
        ShortcutService.logger.info('Focus address bar requested (not implemented yet)')
        // TODO: 메인 윈도우의 주소창에 포커스하는 IPC 메시지 전송
    }

    /**
     * 페이지 확대
     */
    private zoomIn(): void {
        try {
            const tabManager = TabManager.getInstance()
            const activeTabId = tabManager.getActiveTabId()
            if (activeTabId) {
                const browserView = tabManager['browserViews'].get(activeTabId)
                if (browserView) {
                    const currentZoom = browserView.webContents.getZoomLevel()
                    browserView.webContents.setZoomLevel(currentZoom + 0.5)
                    ShortcutService.logger.info('Zoomed in via shortcut')
                }
            }
        } catch (error) {
            ShortcutService.logger.error('Failed to zoom in', error)
        }
    }

    /**
     * 페이지 축소
     */
    private zoomOut(): void {
        try {
            const tabManager = TabManager.getInstance()
            const activeTabId = tabManager.getActiveTabId()
            if (activeTabId) {
                const browserView = tabManager['browserViews'].get(activeTabId)
                if (browserView) {
                    const currentZoom = browserView.webContents.getZoomLevel()
                    browserView.webContents.setZoomLevel(currentZoom - 0.5)
                    ShortcutService.logger.info('Zoomed out via shortcut')
                }
            }
        } catch (error) {
            ShortcutService.logger.error('Failed to zoom out', error)
        }
    }

    /**
     * 줌 레벨 리셋
     */
    private resetZoom(): void {
        try {
            const tabManager = TabManager.getInstance()
            const activeTabId = tabManager.getActiveTabId()
            if (activeTabId) {
                const browserView = tabManager['browserViews'].get(activeTabId)
                if (browserView) {
                    browserView.webContents.setZoomLevel(0)
                    ShortcutService.logger.info('Reset zoom via shortcut')
                }
            }
        } catch (error) {
            ShortcutService.logger.error('Failed to reset zoom', error)
        }
    }

    /**
     * 다음 탭으로 전환 (TODO: 구현 필요)
     */
    private switchToNextTab(): void {
        ShortcutService.logger.info('Switch to next tab requested (not implemented yet)')
        // TODO: 탭 순서 관리 및 전환 기능 구현
    }

    /**
     * 이전 탭으로 전환 (TODO: 구현 필요)
     */
    private switchToPreviousTab(): void {
        ShortcutService.logger.info('Switch to previous tab requested (not implemented yet)')
        // TODO: 탭 순서 관리 및 전환 기능 구현
    }

    /**
     * 모든 단축키 해제
     */
    unregisterAllShortcuts(): void {
        globalShortcut.unregisterAll()
        this.registeredShortcuts.clear()
        ShortcutService.logger.info('All shortcuts unregistered')
    }

    /**
     * 등록된 단축키 목록 가져오기
     */
    getRegisteredShortcuts(): string[] {
        return Array.from(this.registeredShortcuts)
    }
}