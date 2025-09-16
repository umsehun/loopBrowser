// GIGA-CHAD: 공유 타입 정의

export interface TabInfo {
    id: string
    url: string
    title: string
    favicon?: string
    loading: boolean
    canGoBack: boolean
    canGoForward: boolean
    isActive: boolean
    suspended: boolean // 백그라운드 스로틀링 상태
}

export interface BookmarkInfo {
    url: string
    title: string
    favicon?: string
    dateAdded: number
}

export interface PerformanceMetrics {
    memory: {
        rss: number // MB
        heapUsed: number // MB
        external: number // MB
        total: number // MB
    }
    cpu: {
        percentCPUUsage: number
    }
    tabs: {
        total: number
        active: number
        suspended: number
    }
    uptime: number // seconds
}

export interface SearchSuggestion {
    text: string
    type: 'search' | 'url' | 'bookmark'
    favicon?: string
}

export interface GigaBrowserAPI {
    tab: {
        create: (url: string) => Promise<TabInfo>
        close: (tabId: string) => Promise<void>
        switch: (tabId: string) => Promise<void>
        getAll: () => Promise<TabInfo[]>
        updateUrl: (tabId: string, url: string) => Promise<void>
    }
    search: {
        google: (query: string) => Promise<string>
        getSuggestions: (query: string) => Promise<SearchSuggestion[]>
    }
    browser: {
        goBack: (tabId: string) => Promise<void>
        goForward: (tabId: string) => Promise<void>
        reload: (tabId: string) => Promise<void>
        stop: (tabId: string) => Promise<void>
    }
    bookmarks: {
        add: (url: string, title: string) => Promise<void>
        remove: (url: string) => Promise<void>
        getAll: () => Promise<BookmarkInfo[]>
    }
    performance: {
        getMemoryUsage: () => Promise<PerformanceMetrics>
        getCPUUsage: () => Promise<number>
        onMetricsUpdate: (callback: (metrics: PerformanceMetrics) => void) => void
    }
    ui: {
        updateSidebarState: (collapsed: boolean) => Promise<{ success: boolean }>
    }
    events: {
        onTabUpdate: (callback: (tabInfo: TabInfo) => void) => void
        onTabCreated: (callback: (tabInfo: TabInfo) => void) => void
        onTabClosed: (callback: (tabId: string) => void) => void
    }
}

// 글로벌 타입 확장
declare global {
    interface Window {
        gigaBrowser: GigaBrowserAPI
    }
}

// GIGA-CHAD: 설정 타입
export interface BrowserSettings {
    defaultSearchEngine: 'google' | 'bing' | 'duckduckgo'
    backgroundThrottling: boolean
    maxTabs: number
    memoryLimit: number // MB
    autoSuspendTabs: boolean
    suspendTimeoutMs: number
    enableAdBlock: boolean
}

// GIGA-CHAD: 윈도우 관리 타입
export interface WindowInfo {
    id: number
    bounds: {
        x: number
        y: number
        width: number
        height: number
    }
    isMaximized: boolean
    isMinimized: boolean
    isFullScreen: boolean
    tabCount: number
}