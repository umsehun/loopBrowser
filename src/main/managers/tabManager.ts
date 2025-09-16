import { WebContentsView, BaseWindow } from 'electron'
import { TabInfo } from '../../shared/types'
import { createModuleLogger } from '../../shared/logger'
import { ContextMenuService } from '../services/ContextMenuService'
import { WindowManager, LayeredWindow } from '../core/window'

/**
 * GIGA-CHAD: BaseWindow + WebContentsView 기반 탭 관리자
 */
export class TabManager {
    private static instance: TabManager
    private tabs: Map<string, TabInfo> = new Map()
    private webContentsViews: Map<string, WebContentsView> = new Map()
    private layeredWindow: LayeredWindow | null = null
    private activeTabId: string | null = null
    private logger = createModuleLogger('TabManager')

    private constructor() {
        this.logger.info('TabManager initialized')
    }

    static getInstance(): TabManager {
        if (!this.instance) {
            this.instance = new TabManager()
        }
        return this.instance
    }

    /**
     * GIGA-CHAD: LayeredWindow 설정
     */
    setLayeredWindow(layeredWindow: LayeredWindow): void {
        this.layeredWindow = layeredWindow
        this.logger.info('LayeredWindow set for ModernTabManager')
    }

    /**
     * GIGA-CHAD: 새 탭 생성 (WebContentsView 기반)
     */
    async createTab(url: string = 'https://www.google.com'): Promise<TabInfo> {
        if (!this.layeredWindow) {
            throw new Error('LayeredWindow not set')
        }

        const tabId = this.generateTabId()

        // GIGA-CHAD: 새로운 WebContentsView 생성 (브라우저 콘텐츠용)
        const webContentsView = new WebContentsView({
            webPreferences: {
                sandbox: true,
                contextIsolation: true,
                nodeIntegration: false,
                webSecurity: true,
                allowRunningInsecureContent: false,
                experimentalFeatures: false,
                backgroundThrottling: true,
                devTools: false, // 프로덕션에서 DevTools 비활성화
            }
        })

        // GIGA-CHAD: 탭 정보 생성
        const tabInfo: TabInfo = {
            id: tabId,
            title: 'New Tab',
            url: url,
            favicon: '',
            loading: false,
            canGoBack: false,
            canGoForward: false,
            isActive: false,
            suspended: false
        }

        // GIGA-CHAD: 탭과 뷰 등록
        this.tabs.set(tabId, tabInfo)
        this.webContentsViews.set(tabId, webContentsView)

        // GIGA-CHAD: WebContents 이벤트 핸들러 설정
        this.setupWebContentsEvents(tabId, webContentsView)

        // GIGA-CHAD: 컨텍스트 메뉴 등록 (TODO: ContextMenuService 메서드 확인 필요)
        // ContextMenuService.registerContextMenu(webContentsView.webContents)

        // GIGA-CHAD: URL 로드
        await webContentsView.webContents.loadURL(url)

        // GIGA-CHAD: 새 탭을 활성화
        await this.switchTab(tabId)

        this.logger.info(`Tab created - ${tabId}`)

        return tabInfo
    }

    /**
     * GIGA-CHAD: 탭 전환
     */
    async switchTab(tabId: string): Promise<void> {
        if (!this.layeredWindow) {
            throw new Error('LayeredWindow not set')
        }

        const tabInfo = this.tabs.get(tabId)
        const webContentsView = this.webContentsViews.get(tabId)

        if (!tabInfo || !webContentsView) {
            throw new Error(`Tab not found: ${tabId}`)
        }

        // GIGA-CHAD: 기존 활성 탭 비활성화
        if (this.activeTabId) {
            const previousTab = this.tabs.get(this.activeTabId)
            const previousView = this.webContentsViews.get(this.activeTabId)

            if (previousTab && previousView) {
                previousTab.isActive = false

                // 기존 뷰를 BaseWindow에서 제거
                this.layeredWindow.baseWindow.contentView.removeChildView(previousView)
            }
        }

        // GIGA-CHAD: 새 탭 활성화
        tabInfo.isActive = true
        this.activeTabId = tabId

        // GIGA-CHAD: 새 뷰를 BaseWindow에 추가 (browserView와 uiView 사이에)
        this.layeredWindow.baseWindow.contentView.removeChildView(this.layeredWindow.browserView)
        this.layeredWindow.baseWindow.contentView.addChildView(webContentsView) // 새 탭의 뷰
        this.layeredWindow.baseWindow.contentView.addChildView(this.layeredWindow.uiView) // UI는 항상 최상위

        // GIGA-CHAD: 뷰 크기를 전체 화면으로 설정
        const bounds = this.layeredWindow.baseWindow.getBounds()
        webContentsView.setBounds({
            x: 0,
            y: 0,
            width: bounds.width,
            height: bounds.height
        })

        this.logger.info(`🔄 GIGA-CHAD: Switched to tab - ${tabId}`)
    }

    /**
     * GIGA-CHAD: 탭 닫기
     */
    async closeTab(tabId: string): Promise<void> {
        const tabInfo = this.tabs.get(tabId)
        const webContentsView = this.webContentsViews.get(tabId)

        if (!tabInfo || !webContentsView) {
            this.logger.warn(`⚠️ GIGA-CHAD: Attempted to close non-existent tab: ${tabId}`)
            return
        }

        // GIGA-CHAD: 컨텍스트 메뉴 해제 (TODO: ContextMenuService 메서드 확인 필요)
        // ContextMenuService.unregisterContextMenu(webContentsView.webContents)

        // GIGA-CHAD: 활성 탭이었다면 다른 탭으로 전환
        if (this.activeTabId === tabId) {
            const remainingTabs = Array.from(this.tabs.values()).filter(tab => tab.id !== tabId)
            if (remainingTabs.length > 0) {
                const nextTab = remainingTabs[remainingTabs.length - 1]
                await this.switchTab(nextTab.id)
            } else {
                this.activeTabId = null
                // 모든 탭이 닫혔으면 기본 browserView 표시
                if (this.layeredWindow) {
                    this.layeredWindow.baseWindow.contentView.removeChildView(webContentsView)
                    this.layeredWindow.baseWindow.contentView.addChildView(this.layeredWindow.browserView)
                    this.layeredWindow.baseWindow.contentView.addChildView(this.layeredWindow.uiView)
                }
            }
        } else {
            // 비활성 탭이면 그냥 제거
            if (this.layeredWindow) {
                this.layeredWindow.baseWindow.contentView.removeChildView(webContentsView)
            }
        }

        // GIGA-CHAD: WebContents 정리
        try {
            if (!webContentsView.webContents.isDestroyed()) {
                webContentsView.webContents.close()
            }
        } catch (error) {
            this.logger.error('Error closing WebContents:', error)
        }

        // GIGA-CHAD: 맵에서 제거
        this.tabs.delete(tabId)
        this.webContentsViews.delete(tabId)

        this.logger.info(`❌ GIGA-CHAD: Tab closed - ${tabId}`)
    }

    /**
     * GIGA-CHAD: 탭 URL 업데이트
     */
    async updateTabUrl(tabId: string, url: string): Promise<void> {
        const tabInfo = this.tabs.get(tabId)
        const webContentsView = this.webContentsViews.get(tabId)

        if (!tabInfo || !webContentsView) {
            this.logger.warn(`⚠️ GIGA-CHAD: Attempted to update URL for non-existent tab: ${tabId}`)
            return
        }

        // URL 업데이트 및 로드
        tabInfo.url = url
        await webContentsView.webContents.loadURL(url)

        this.logger.info(`🌐 GIGA-CHAD: Tab URL updated - ${tabId}: ${url}`)
    }

    /**
     * GIGA-CHAD: WebContents 이벤트 핸들러 설정
     */
    private setupWebContentsEvents(tabId: string, webContentsView: WebContentsView): void {
        const webContents = webContentsView.webContents
        const tabInfo = this.tabs.get(tabId)
        if (!tabInfo) return

        // 페이지 제목 변경
        webContents.on('page-title-updated', (_, title) => {
            tabInfo.title = title
            this.logger.info(`📄 GIGA-CHAD: Tab title updated - ${tabId}: ${title}`)
        })

        // 네비게이션 완료
        webContents.on('did-finish-load', () => {
            tabInfo.loading = false
            tabInfo.canGoBack = webContents.navigationHistory.canGoBack()
            tabInfo.canGoForward = webContents.navigationHistory.canGoForward()
            this.logger.info(`✅ GIGA-CHAD: Tab finished loading - ${tabId}`)
        })

        // 네비게이션 시작
        webContents.on('did-start-loading', () => {
            tabInfo.loading = true
            this.logger.info(`⏳ GIGA-CHAD: Tab started loading - ${tabId}`)
        })

        // URL 변경
        webContents.on('will-navigate', (_, navigationUrl) => {
            tabInfo.url = navigationUrl
            this.logger.info(`🧭 GIGA-CHAD: Tab navigating - ${tabId}: ${navigationUrl}`)
        })

        // 파비콘 업데이트
        webContents.on('page-favicon-updated', (_, favicons) => {
            if (favicons.length > 0) {
                tabInfo.favicon = favicons[0]
            }
        })
    }

    /**
     * GIGA-CHAD: 유니크한 탭 ID 생성
     */
    private generateTabId(): string {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 15)
        return `tab_${timestamp}_${random}`
    }

    /**
     * 활성 탭 ID 가져오기
     */
    getActiveTabId(): string | null {
        return this.activeTabId
    }

    /**
     * 모든 탭 정보 가져오기
     */
    getAllTabs(): TabInfo[] {
        return Array.from(this.tabs.values())
    }

    /**
     * 특정 탭 정보 가져오기
     */
    getTab(tabId: string): TabInfo | undefined {
        return this.tabs.get(tabId)
    }

    /**
     * 탭의 WebContentsView 가져오기
     */
    getWebContentsView(tabId: string): WebContentsView | undefined {
        return this.webContentsViews.get(tabId)
    }

    /**
     * 활성 탭의 웹 네비게이션
     */
    async goBack(): Promise<void> {
        if (!this.activeTabId) return

        const webContentsView = this.webContentsViews.get(this.activeTabId)
        if (webContentsView && webContentsView.webContents.navigationHistory.canGoBack()) {
            webContentsView.webContents.goBack()
        }
    }

    async goForward(): Promise<void> {
        if (!this.activeTabId) return

        const webContentsView = this.webContentsViews.get(this.activeTabId)
        if (webContentsView && webContentsView.webContents.navigationHistory.canGoForward()) {
            webContentsView.webContents.goForward()
        }
    }

    async reload(): Promise<void> {
        if (!this.activeTabId) return

        const webContentsView = this.webContentsViews.get(this.activeTabId)
        if (webContentsView) {
            webContentsView.webContents.reload()
        }
    }

    /**
     * 탭 카운트 메서드들 (레거시 호환성)
     */
    getTabCount(): number {
        return this.tabs.size
    }

    getSuspendedTabCount(): number {
        return Array.from(this.tabs.values()).filter(tab => tab.suspended).length
    }
}