import { BrowserView, BrowserWindow, WebContents } from 'electron'
import { TabInfo } from '../../shared/types'
import { createModuleLogger } from '../../shared/logger'
import { ContextMenuService } from '../services/ContextMenuService'

// GIGA-CHAD: 탭 관리자 - Zen/Arc 스타일 최적화
export class TabManager {
    private static instance: TabManager
    private tabs: Map<string, TabInfo> = new Map()
    private browserViews: Map<string, BrowserView> = new Map()
    private mainWindow: BrowserWindow | null = null
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
     * 메인 윈도우 설정
     */
    setMainWindow(window: BrowserWindow): void {
        this.mainWindow = window
        this.logger.info('Main window set for TabManager')
    }

    /**
     * 새 탭 생성
     */
    async createTab(url: string = 'about:blank'): Promise<TabInfo> {
        if (!this.mainWindow) {
            throw new Error('Main window not set')
        }

        const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // TabInfo 생성
        const tabInfo: TabInfo = {
            id: tabId,
            url: url,
            title: url === 'about:blank' ? '새 탭' : '로딩 중...',
            favicon: '',
            loading: true,
            canGoBack: false,
            canGoForward: false,
            isActive: false,
            suspended: false
        }

        // BrowserView 생성 (GIGA-CHAD: 메모리 최적화)
        const browserView = new BrowserView({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                backgroundThrottling: true, // GIGA-CHAD: 백그라운드 최적화
                preload: __dirname + '/../../preload/preload.js'
            }
        })

        // 이벤트 리스너 설정
        this.setupBrowserViewEvents(browserView, tabInfo)

        // GIGA-CHAD: 컨텍스트 메뉴 등록
        ContextMenuService.getInstance().registerContextMenu(browserView.webContents)

        // 저장
        this.tabs.set(tabId, tabInfo)
        this.browserViews.set(tabId, browserView)

        // URL 로드
        if (url !== 'about:blank') {
            browserView.webContents.loadURL(url)
        }

        this.logger.info(`Tab created - ${tabId}`)
        return tabInfo
    }

    /**
     * BrowserView 이벤트 설정
     */
    private setupBrowserViewEvents(browserView: BrowserView, tabInfo: TabInfo): void {
        const webContents = browserView.webContents

        // 페이지 로딩 시작
        webContents.on('did-start-loading', () => {
            tabInfo.loading = true
            this.updateTab(tabInfo)
        })

        // 페이지 로딩 완료
        webContents.on('did-finish-load', () => {
            tabInfo.loading = false
            tabInfo.url = webContents.getURL()
            tabInfo.title = webContents.getTitle()
            tabInfo.canGoBack = webContents.navigationHistory.canGoBack()
            tabInfo.canGoForward = webContents.navigationHistory.canGoForward()
            this.updateTab(tabInfo)
        })

        // 타이틀 변경
        webContents.on('page-title-updated', (_, title) => {
            tabInfo.title = title
            this.updateTab(tabInfo)
        })

        // 페이지 파비콘 변경
        webContents.on('page-favicon-updated', (_, favicons) => {
            if (favicons.length > 0) {
                tabInfo.favicon = favicons[0]
                this.updateTab(tabInfo)
            }
        })

        // 네비게이션 이벤트
        webContents.on('did-navigate', (_, navigationUrl) => {
            tabInfo.url = navigationUrl
            tabInfo.canGoBack = webContents.navigationHistory.canGoBack()
            tabInfo.canGoForward = webContents.navigationHistory.canGoForward()
            this.updateTab(tabInfo)
        })

        // 네비게이션 실패
        webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL) => {
            this.logger.error(`⚠️ GIGA-CHAD: Navigation failed for ${tabInfo.id}: ${errorDescription}`)
            tabInfo.loading = false
            tabInfo.title = '페이지를 불러올 수 없습니다'
            this.updateTab(tabInfo)
        })
    }

    /**
     * 탭 활성화 (switchTab의 별칭)
     */
    async activateTab(tabId: string): Promise<void> {
        return this.switchTab(tabId)
    }

    /**
     * 탭 전환
     */
    async switchTab(tabId: string): Promise<void> {
        if (!this.mainWindow) {
            throw new Error('Main window not set')
        }

        const browserView = this.browserViews.get(tabId)
        const tabInfo = this.tabs.get(tabId)

        if (!browserView || !tabInfo) {
            throw new Error(`Tab not found: ${tabId}`)
        }

        // 이전 활성 탭 비활성화
        if (this.activeTabId) {
            const prevTab = this.tabs.get(this.activeTabId)
            if (prevTab) {
                prevTab.isActive = false
                this.updateTab(prevTab)
            }
        }

        // 새 탭 활성화
        tabInfo.isActive = true
        this.activeTabId = tabId
        this.updateTab(tabInfo)

        // BrowserView 설정 (GIGA-CHAD: 전체 영역 사용)
        this.mainWindow.setBrowserView(browserView)

        // 사이드바 너비를 고려한 BrowserView 크기 설정
        const sidebarWidth = 280 // 기본 사이드바 너비
        const headerHeight = 48  // 헤더 높이
        const titleBarHeight = 28 // Electron 타이틀바 높이
        const bounds = this.mainWindow.getBounds()

        browserView.setBounds({
            x: sidebarWidth,
            y: headerHeight + titleBarHeight,
            width: bounds.width - sidebarWidth,
            height: bounds.height - headerHeight - titleBarHeight
        })

        this.logger.info(`🔄 GIGA-CHAD: Switched to tab - ${tabId}`)
    }

    /**
     * 탭 닫기
     */
    async closeTab(tabId: string): Promise<void> {
        const browserView = this.browserViews.get(tabId)
        const tabInfo = this.tabs.get(tabId)

        if (!browserView || !tabInfo) {
            throw new Error(`Tab not found: ${tabId}`)
        }

        // BrowserView 정리
        if (this.mainWindow && this.activeTabId === tabId) {
            this.mainWindow.setBrowserView(null)
        }

        // GIGA-CHAD: 컨텍스트 메뉴 해제
        ContextMenuService.getInstance().unregisterContextMenu(browserView.webContents)

        // 메모리 정리 (GIGA-CHAD: 메모리 최적화)
        browserView.webContents.close()

        // 맵에서 제거
        this.tabs.delete(tabId)
        this.browserViews.delete(tabId)

        // 활성 탭이 닫혔으면 초기화
        if (this.activeTabId === tabId) {
            this.activeTabId = null
        }

        this.logger.info(`❌ GIGA-CHAD: Tab closed - ${tabId}`)
    }

    /**
     * 탭 네비게이션 (URL 업데이트)
     */
    async navigateTab(tabId: string, url: string): Promise<void> {
        return this.updateTabUrl(tabId, url)
    }

    /**
     * 탭 URL 업데이트
     */
    async updateTabUrl(tabId: string, url: string): Promise<void> {
        const browserView = this.browserViews.get(tabId)
        const tabInfo = this.tabs.get(tabId)

        if (!browserView || !tabInfo) {
            throw new Error(`Tab not found: ${tabId}`)
        }

        tabInfo.loading = true
        this.updateTab(tabInfo)

        await browserView.webContents.loadURL(url)
    }

    /**
     * 네비게이션 - 뒤로 가기
     */
    async goBack(tabId: string): Promise<void> {
        const browserView = this.browserViews.get(tabId)
        if (!browserView) {
            throw new Error(`Tab not found: ${tabId}`)
        }

        if (browserView.webContents.navigationHistory.canGoBack()) {
            browserView.webContents.navigationHistory.goBack()
        }
    }

    /**
     * 네비게이션 - 앞으로 가기
     */
    async goForward(tabId: string): Promise<void> {
        const browserView = this.browserViews.get(tabId)
        if (!browserView) {
            throw new Error(`Tab not found: ${tabId}`)
        }

        if (browserView.webContents.navigationHistory.canGoForward()) {
            browserView.webContents.navigationHistory.goForward()
        }
    }

    /**
     * 페이지 새로고침
     */
    async reload(tabId: string): Promise<void> {
        const browserView = this.browserViews.get(tabId)
        if (!browserView) {
            throw new Error(`Tab not found: ${tabId}`)
        }

        browserView.webContents.reload()
    }

    /**
     * 탭 정보 가져오기
     */
    getTab(tabId: string): TabInfo | undefined {
        return this.tabs.get(tabId)
    }

    /**
     * 모든 탭 가져오기
     */
    getAllTabs(): TabInfo[] {
        return Array.from(this.tabs.values())
    }

    /**
     * 활성 탭 ID 가져오기
     */
    getActiveTabId(): string | null {
        return this.activeTabId
    }

    /**
     * 탭 정보 업데이트 알림
     */
    private updateTab(tabInfo: TabInfo): void {
        // 렌더러 프로세스에 탭 업데이트 알림
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.send('tab:updated', tabInfo)
        }
    }

    /**
     * 윈도우 크기 변경 시 BrowserView 크기 조정
     */
    updateBrowserViewBounds(): void {
        if (!this.mainWindow || !this.activeTabId) return

        const browserView = this.browserViews.get(this.activeTabId)
        if (!browserView) return

        const sidebarWidth = 280
        const headerHeight = 48
        const titleBarHeight = 28
        const bounds = this.mainWindow.getBounds()

        browserView.setBounds({
            x: sidebarWidth,
            y: headerHeight + titleBarHeight,
            width: bounds.width - sidebarWidth,
            height: bounds.height - headerHeight - titleBarHeight
        })

        this.logger.info(`BrowserView bounds updated - ${bounds.width - sidebarWidth}x${bounds.height - headerHeight - titleBarHeight}`)
    }

    /**
     * 모든 탭 닫기
     */
    async closeAllTabs(): Promise<void> {
        this.logger.info('Closing all tabs...')

        for (const [tabId] of this.tabs) {
            await this.closeTab(tabId)
        }

        this.logger.info('All tabs closed')
    }

    /**
     * 탭 개수 가져오기
     */
    getTabCount(): number {
        return this.tabs.size
    }

    /**
     * 일시정지된 탭 개수 가져오기
     */
    getSuspendedTabCount(): number {
        return Array.from(this.tabs.values()).filter(tab => tab.suspended).length
    }

    /**
     * 모든 탭 정리 (앱 종료 시)
     */
    async cleanup(): Promise<void> {
        this.logger.info('🧹 GIGA-CHAD: Cleaning up TabManager...')

        for (const [tabId] of this.tabs) {
            await this.closeTab(tabId)
        }

        this.tabs.clear()
        this.browserViews.clear()
        this.activeTabId = null
        this.mainWindow = null

        this.logger.info('✅ GIGA-CHAD: TabManager cleanup completed')
    }
}