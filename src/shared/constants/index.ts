// UI 관련 상수
export const UI_CONSTANTS = {
    SIDEBAR_DEFAULT_WIDTH: 250,
    SIDEBAR_MIN_WIDTH: 200,
    SIDEBAR_MAX_WIDTH: 400,
    HEADER_HEIGHT: 60,
    TAB_HEIGHT: 40,
    ANIMATION_DURATION: 300,
} as const

// 브라우저 관련 상수
export const BROWSER_CONSTANTS = {
    DEFAULT_USER_AGENT: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    DEFAULT_HOME_PAGE: 'https://www.google.com',
    DEFAULT_SEARCH_ENGINE: 'https://www.google.com/search?q=',
    MAX_TABS: 50,
} as const

// 단축키 기본값
export const DEFAULT_SHORTCUTS = {
    toggleSidebar: 'CmdOrCtrl+B',
    newTab: 'CmdOrCtrl+T',
    closeTab: 'CmdOrCtrl+W',
    toggleDevTools: 'F12',
    focusAddressBar: 'CmdOrCtrl+L',
    nextTab: 'CmdOrCtrl+Tab',
    prevTab: 'CmdOrCtrl+Shift+Tab',
} as const

// IPC 채널 상수
export const IPC_CHANNELS = {
    // 탭 관련
    TAB_CREATE: 'tab:create',
    TAB_CLOSE: 'tab:close',
    TAB_ACTIVATE: 'tab:activate',
    TAB_UPDATE: 'tab:update',

    // UI 관련
    SIDEBAR_TOGGLE: 'ui:sidebar-toggle',
    HEADER_TOGGLE: 'ui:header-toggle',
    THEME_CHANGE: 'ui:theme-change',

    // 설정 관련
    SETTINGS_GET: 'settings:get',
    SETTINGS_SET: 'settings:set',
    SETTINGS_RESET: 'settings:reset',

    // DevTools 관련
    DEVTOOLS_TOGGLE: 'devtools:toggle',
    DEVTOOLS_OPEN_TAB: 'devtools:open-tab',

    // 네비게이션 관련
    NAVIGATE_TO: 'navigate:to',
    NAVIGATE_BACK: 'navigate:back',
    NAVIGATE_FORWARD: 'navigate:forward',
    NAVIGATE_RELOAD: 'navigate:reload',
} as const

// 로그 관련 상수
export const LOG_CONSTANTS = {
    MAX_LOG_FILES: 5,
    MAX_LOG_SIZE: '10m',
    LOG_DATE_PATTERN: 'YYYY-MM-DD-HH',
} as const