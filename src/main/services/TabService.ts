import { WebContentsView, BrowserWindow } from 'electron'
import { logger } from '../../shared/logger/index'

// 탭 섹션 타입
export type TabSection = 'shortcuts' | 'persistent' | 'normal'

// 탭 인터페이스
export interface Tab {
  id: string
  title: string
  url: string
  favicon?: string
  isActive: boolean
  section: TabSection
  view?: WebContentsView
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  createdAt: Date
  lastActiveAt: Date
}

export class TabService {
  private tabs: Tab[] = []
  private activeTabId: string | null = null
  private mainWindow: BrowserWindow | null = null
  private static instance: TabService
  private layoutDimensions = {
    headerHeight: 60,
    sidebarWidth: 250
  }

  constructor() {
    logger.info('TabService initialized')
  }

  static getInstance(): TabService {
    if (!TabService.instance) {
      TabService.instance = new TabService()
    }
    return TabService.instance
  }

  // 메인 윈도우 설정
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  // 레이아웃 크기 업데이트
  updateLayoutDimensions(dimensions: { headerHeight: number; sidebarWidth: number }): void {
    this.layoutDimensions = { ...dimensions }
    logger.debug('Layout dimensions updated', { dimensions })
  }

  // 새 탭 생성
  createTab(url: string, section: TabSection = 'normal'): Tab {
    const tab: Tab = {
      id: this.generateTabId(),
      title: 'New Tab',
      url: url,
      isActive: false,
      section: section,
      isLoading: true,
      canGoBack: false,
      canGoForward: false,
      createdAt: new Date(),
      lastActiveAt: new Date()
    }

    // WebContentsView 생성 (BrowserView 대신)
    try {
      tab.view = new WebContentsView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true,
          sandbox: true // 보안 강화
        }
      })

      // User-Agent 설정 (봇 감지 방지)
      tab.view.webContents.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      // 이벤트 리스너 등록
      this.setupTabEvents(tab)

      // 최적화 적용 (WebContents 생성 후)
      if (tab.view?.webContents) {
        // 순환 참조 방지를 위해 지연 로딩
        import('./index').then(({ serviceManager }) => {
          serviceManager.optimizeWebContents(tab.view!.webContents)
        }).catch(error => {
          logger.error('Failed to apply WebContents optimization', { error })
        })
      }

      // URL 로드
      tab.view.webContents.loadURL(url)

      logger.info('Tab created', { id: tab.id, url, section })

    } catch (error) {
      logger.error('Failed to create tab view', { error })
    }

    this.tabs.push(tab)

    return tab
  }

  // 탭 이벤트 설정
  private setupTabEvents(tab: Tab): void {
    if (!tab.view) return

    const webContents = tab.view.webContents

    // 페이지 로딩 시작
    webContents.on('did-start-loading', () => {
      tab.isLoading = true
      tab.lastActiveAt = new Date()
      logger.debug('Tab loading started', { id: tab.id })
    })

    // 페이지 로딩 완료
    webContents.on('did-finish-load', () => {
      tab.isLoading = false
      tab.title = webContents.getTitle() || 'Untitled'
      tab.url = webContents.getURL()

      // 네비게이션 상태 업데이트
      tab.canGoBack = webContents.navigationHistory.canGoBack()
      tab.canGoForward = webContents.navigationHistory.canGoForward()

      logger.info('Tab loaded', { id: tab.id, title: tab.title, url: tab.url })
    })

    // 타이틀 변경
    webContents.on('page-title-updated', (event, title) => {
      tab.title = title
      logger.debug('Tab title updated', { id: tab.id, title })
    })

    // 네비게이션 상태 변경
    webContents.on('did-navigate', () => {
      tab.url = webContents.getURL()
      tab.canGoBack = webContents.navigationHistory.canGoBack()
      tab.canGoForward = webContents.navigationHistory.canGoForward()
      logger.debug('Tab navigated', { id: tab.id, url: tab.url })
    })

    // 새 창 요청 처리
    webContents.setWindowOpenHandler((details) => {
      // 새 탭으로 열기
      logger.info('New window request intercepted', { url: details.url })
      this.createTab(details.url, tab.section)
      return { action: 'deny' }
    })

    // 로딩 에러 처리
    webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      logger.error('Tab failed to load', {
        id: tab.id,
        errorCode,
        errorDescription,
        url: validatedURL
      })
      tab.isLoading = false
    })

    // 크래시 감지
    webContents.on('render-process-gone', (event, details) => {
      logger.error('Tab renderer process gone', {
        id: tab.id,
        reason: details.reason,
        exitCode: details.exitCode
      })
    })
  }

  // 탭 활성화
  activateTab(tabId: string): boolean {
    const tab = this.getTab(tabId)
    if (!tab || !tab.view || !this.mainWindow) {
      logger.warn('Cannot activate tab', { tabId, hasView: !!tab?.view, hasWindow: !!this.mainWindow })
      return false
    }

    try {
      // 이전 활성 탭 비활성화 및 제거
      if (this.activeTabId) {
        const previousTab = this.getTab(this.activeTabId)
        if (previousTab && previousTab.view) {
          // 이전 탭의 view를 윈도우에서 제거
          this.mainWindow.contentView.removeChildView(previousTab.view)
          previousTab.isActive = false
        }
      }

      // 새 탭 활성화
      tab.isActive = true
      tab.lastActiveAt = new Date()
      this.activeTabId = tabId

      // WebContentsView를 메인 윈도우에 추가 (React UI 아래에 위치)
      const bounds = this.mainWindow.getContentBounds()

      // Chrome 영역을 React UI 공간을 제외하고 설정
      // 사이드바(264px) + 헤더(60px) + 여백(20px) 고려
      const chromeX = 20 // 좌측 여백
      const chromeY = 80 // 상단 헤더 + 여백
      const chromeWidth = bounds.width - 284 // 사이드바 264px + 여백 20px
      const chromeHeight = bounds.height - 100 // 헤더 80px + 하단 여백 20px

      tab.view.setBounds({
        x: chromeX,
        y: chromeY,
        width: chromeWidth,
        height: chromeHeight
      })

      // contentView에 추가 (React UI 아래 레이어)
      this.mainWindow.contentView.addChildView(tab.view)

      logger.info('Tab activated', { id: tabId, title: tab.title })
      return true

    } catch (error) {
      logger.error('Failed to activate tab', { error, tabId })
      return false
    }
  }

  // 탭 닫기
  closeTab(tabId: string): boolean {
    const tabIndex = this.tabs.findIndex(t => t.id === tabId)
    if (tabIndex === -1) {
      logger.warn('Tab not found for closing', { tabId })
      return false
    }

    const tab = this.tabs[tabIndex]

    try {
      // WebContentsView 정리
      if (tab.view) {
        // WebContentsView 제거
        tab.view.webContents.close()
      }

      // 탭 배열에서 제거
      this.tabs.splice(tabIndex, 1)

      // 활성 탭이었다면 다른 탭 활성화
      if (this.activeTabId === tabId) {
        this.activeTabId = null

        // 다음 탭 찾기
        const nextTab = this.tabs[Math.min(tabIndex, this.tabs.length - 1)]
        if (nextTab) {
          this.activateTab(nextTab.id)
        }
      }

      logger.info('Tab closed', { id: tabId })
      return true

    } catch (error) {
      logger.error('Failed to close tab', { error, tabId })
      return false
    }
  }

  // 탭 검색
  getTab(tabId: string): Tab | undefined {
    return this.tabs.find(t => t.id === tabId)
  }

  // 활성 탭 가져오기
  getActiveTab(): Tab | undefined {
    if (!this.activeTabId) return undefined
    return this.getTab(this.activeTabId)
  }

  // 모든 탭 가져오기
  getAllTabs(): Tab[] {
    return [...this.tabs]
  }

  // 탭 이동
  moveTab(tabId: string, targetSection: TabSection): boolean {
    const tab = this.getTab(tabId)
    if (!tab) {
      logger.warn('Tab not found for moving', { tabId })
      return false
    }

    const oldSection = tab.section
    tab.section = targetSection
    logger.info('Tab moved', { id: tabId, from: oldSection, to: targetSection })
    return true
  }

  // 모든 탭 닫기
  closeAllTabs(): void {
    const tabIds = this.tabs.map(t => t.id)
    tabIds.forEach(id => this.closeTab(id))
    logger.info('All tabs closed')
  }

  // 탭 ID 생성
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 윈도우 크기 변경 시 처리
  resizeActiveTab(): void {
    if (!this.mainWindow || !this.activeTabId) {
      logger.debug('No active tab or window to resize')
      return
    }

    const activeTab = this.getTab(this.activeTabId)
    if (!activeTab || !activeTab.view) {
      logger.debug('Active tab not found or has no view')
      return
    }

    try {
      // 콘텐츠 영역 크기 가져오기
      const bounds = this.mainWindow.getContentBounds()

      // 동적 Chrome 영역 계산 (React UI 레이아웃 기반)
      const chromeX = this.layoutDimensions.sidebarWidth
      const chromeY = this.layoutDimensions.headerHeight
      const chromeWidth = bounds.width - this.layoutDimensions.sidebarWidth
      const chromeHeight = bounds.height - this.layoutDimensions.headerHeight

      // 탭 view 크기 조정
      activeTab.view.setBounds({
        x: chromeX,
        y: chromeY,
        width: chromeWidth,
        height: chromeHeight
      })

      logger.debug('Active tab resized with dynamic dimensions', {
        tabId: this.activeTabId,
        layoutDimensions: this.layoutDimensions,
        chromeArea: { x: chromeX, y: chromeY, width: chromeWidth, height: chromeHeight },
        chromeHeight
      })
    } catch (error) {
      logger.error('Failed to resize active tab', { error, tabId: this.activeTabId })
    }
  }

  // 모든 탭의 User-Agent 업데이트
  updateAllTabsUserAgent(userAgent: string): void {
    try {
      let updatedCount = 0
      for (const tab of this.tabs) {
        if (tab.view?.webContents) {
          tab.view.webContents.setUserAgent(userAgent)
          updatedCount++
        }
      }
      logger.info('User-Agent updated for all tabs', {
        userAgent,
        totalTabs: this.tabs.length,
        updatedTabs: updatedCount
      })
    } catch (error) {
      logger.error('Failed to update User-Agent for tabs', { error, userAgent })
    }
  }

  // 활성 탭 숨기기
  hideActiveTab(): void {
    const activeTab = this.getActiveTab()
    if (activeTab?.view && this.mainWindow) {
      try {
        this.mainWindow.contentView.removeChildView(activeTab.view)
        logger.debug('Active tab hidden')
      } catch (error) {
        logger.error('Failed to hide active tab', { error })
      }
    }
  }

  // 활성 탭 보이기
  showActiveTab(): void {
    const activeTab = this.getActiveTab()
    if (activeTab?.view && this.mainWindow) {
      try {
        this.mainWindow.contentView.addChildView(activeTab.view)
        this.resizeActiveTab() // 보이기 후 크기 조정
        logger.debug('Active tab shown')
      } catch (error) {
        logger.error('Failed to show active tab', { error })
      }
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const tabService = TabService.getInstance()
export default tabService