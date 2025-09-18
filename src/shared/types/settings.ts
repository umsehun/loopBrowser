// 설정 관련 타입
export interface UISettings {
    // 사이드바 설정
    showSidebar: boolean
    sidebarAutoHide: boolean
    sidebarWidth: number

    // 헤더바 설정
    showHeaderBar: boolean
    headerAutoHide: boolean
    headerHeight: number

    // 테마 설정
    theme: 'dark' | 'light' | 'auto'
    compactMode: boolean
}

export interface BrowserSettings {
    // User-Agent 설정
    userAgent: string
    userAgentPreset: 'chrome' | 'firefox' | 'safari' | 'edge' | 'custom'

    // 기본 브라우저 설정
    defaultSearchEngine: string
    homePage: string
    downloadPath: string
    enableDevTools: boolean
    enableJavaScript: boolean
}

export interface DeveloperSettings {
    devToolsEnabled: boolean
    consoleLogLevel: 'debug' | 'info' | 'warn' | 'error'
    enableExperimentalFeatures: boolean
}

export interface ShortcutSettings {
    toggleSidebar: string
    toggleHeaderBar: string
    newTab: string
    closeTab: string
    toggleDevTools: string
    focusAddressBar: string
    openPreferences: string
}

export interface AppSettings {
    ui: UISettings
    browser: BrowserSettings
    developer: DeveloperSettings
    shortcuts: ShortcutSettings
    version: string
}

// User-Agent 프리셋
export const USER_AGENT_PRESETS = {
    chrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    firefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:142.0) Gecko/20100101 Firefox/142.0',
    safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
    edge: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
    custom: ''
} as const

export type SettingsEventType =
    | 'settings-updated'
    | 'settings-reset'
    | 'theme-changed'
    | 'user-agent-changed'
    | 'ui-layout-changed'