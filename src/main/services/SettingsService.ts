import Store, { Schema } from 'electron-store'
import { logger } from '../../shared/logger/index'
import { AppSettings, UISettings, BrowserSettings, DeveloperSettings, ShortcutSettings, USER_AGENT_PRESETS } from '../../shared/types/settings'

export class SettingsService {
    private store: Store<AppSettings>
    private static instance: SettingsService

    private defaultSettings: AppSettings = {
        ui: {
            // 사이드바 설정
            showSidebar: true,
            sidebarAutoHide: false,
            sidebarWidth: 250,

            // 헤더바 설정
            showHeaderBar: true,
            headerAutoHide: false,
            headerHeight: 60,

            // 테마 설정
            theme: 'dark',
            compactMode: false
        },
        browser: {
            // User-Agent 설정
            userAgent: USER_AGENT_PRESETS.chrome,
            userAgentPreset: 'chrome',

            // 기본 브라우저 설정
            defaultSearchEngine: 'https://www.google.com/search?q=%s',
            homePage: 'https://www.google.com',
            downloadPath: '',
            enableDevTools: true,
            enableJavaScript: true
        },
        developer: {
            devToolsEnabled: true,
            consoleLogLevel: 'info',
            enableExperimentalFeatures: false
        },
        shortcuts: {
            toggleSidebar: 'CommandOrControl+B',
            toggleHeaderBar: 'CommandOrControl+Shift+B',
            newTab: 'CommandOrControl+T',
            closeTab: 'CommandOrControl+W',
            toggleDevTools: 'F12',
            focusAddressBar: 'CommandOrControl+L',
            openPreferences: 'CommandOrControl+,'
        },
        version: '1.0.0'
    }

    private schema: Schema<AppSettings> = {
        ui: {
            type: 'object',
            properties: {
                showSidebar: { type: 'boolean', default: true },
                sidebarAutoHide: { type: 'boolean', default: false },
                sidebarWidth: { type: 'number', minimum: 200, maximum: 500, default: 250 },
                showHeaderBar: { type: 'boolean', default: true },
                headerAutoHide: { type: 'boolean', default: false },
                headerHeight: { type: 'number', minimum: 40, maximum: 100, default: 60 },
                theme: { type: 'string', enum: ['dark', 'light', 'auto'], default: 'dark' },
                compactMode: { type: 'boolean', default: false }
            },
            required: ['showSidebar', 'sidebarWidth', 'showHeaderBar', 'headerHeight', 'theme'],
            default: this.defaultSettings.ui
        },
        browser: {
            type: 'object',
            properties: {
                userAgent: { type: 'string', default: USER_AGENT_PRESETS.chrome },
                userAgentPreset: { type: 'string', enum: ['chrome', 'firefox', 'safari', 'edge', 'custom'], default: 'chrome' },
                defaultSearchEngine: { type: 'string', default: 'https://www.google.com/search?q=%s' },
                homePage: { type: 'string', default: 'https://www.google.com' },
                downloadPath: { type: 'string', default: '' },
                enableDevTools: { type: 'boolean', default: true },
                enableJavaScript: { type: 'boolean', default: true }
            },
            required: ['userAgent', 'userAgentPreset', 'defaultSearchEngine', 'homePage'],
            default: this.defaultSettings.browser
        },
        developer: {
            type: 'object',
            properties: {
                devToolsEnabled: { type: 'boolean', default: true },
                consoleLogLevel: { type: 'string', enum: ['debug', 'info', 'warn', 'error'], default: 'info' },
                enableExperimentalFeatures: { type: 'boolean', default: false }
            },
            required: ['devToolsEnabled', 'consoleLogLevel'],
            default: this.defaultSettings.developer
        },
        shortcuts: {
            type: 'object',
            properties: {
                toggleSidebar: { type: 'string', default: 'CommandOrControl+B' },
                toggleHeaderBar: { type: 'string', default: 'CommandOrControl+Shift+B' },
                newTab: { type: 'string', default: 'CommandOrControl+T' },
                closeTab: { type: 'string', default: 'CommandOrControl+W' },
                toggleDevTools: { type: 'string', default: 'F12' },
                focusAddressBar: { type: 'string', default: 'CommandOrControl+L' },
                openPreferences: { type: 'string', default: 'CommandOrControl+,' }
            },
            required: ['toggleSidebar', 'newTab', 'closeTab'],
            default: this.defaultSettings.shortcuts
        },
        version: {
            type: 'string',
            default: '1.0.0'
        }
    }

    constructor() {
        this.store = new Store<AppSettings>({
            name: 'loop-browser-settings',
            defaults: this.defaultSettings,
            schema: this.schema
        })

        logger.info('SettingsService initialized')
    }

    static getInstance(): SettingsService {
        if (!SettingsService.instance) {
            SettingsService.instance = new SettingsService()
        }
        return SettingsService.instance
    }

    // 초기화
    async initialize(): Promise<void> {
        try {
            // 마이그레이션 로직 (필요시)
            await this.migrateSettings()
            logger.info('SettingsService initialized successfully')
        } catch (error) {
            logger.error('Failed to initialize SettingsService', { error })
            throw error
        }
    }

    // 설정 마이그레이션
    private async migrateSettings(): Promise<void> {
        // 버전별 마이그레이션 로직
        const currentVersion = this.store.get('version', '1.0.0')
        logger.info(`Migrating settings from version ${currentVersion}`)

        // 필요시 마이그레이션 로직 추가
        this.store.set('version', this.defaultSettings.version)
    }

    // 전체 설정 가져오기
    getAllSettings(): AppSettings {
        return this.store.store
    }

    // UI 설정 관련 메서드
    getUISettings(): UISettings {
        return this.store.get('ui')
    }

    setUISettings(settings: Partial<UISettings>): void {
        const current = this.store.get('ui')
        this.store.set('ui', { ...current, ...settings })
        logger.debug('UI settings updated', { settings })
    }

    // 브라우저 설정 관련 메서드
    getBrowserSettings(): BrowserSettings {
        return this.store.get('browser')
    }

    setBrowserSettings(settings: Partial<BrowserSettings>): void {
        const current = this.store.get('browser')
        this.store.set('browser', { ...current, ...settings })
        logger.debug('Browser settings updated', { settings })
    }

    // 개발자 설정 관련 메서드
    getDeveloperSettings(): DeveloperSettings {
        return this.store.get('developer')
    }

    setDeveloperSettings(settings: Partial<DeveloperSettings>): void {
        const current = this.store.get('developer')
        this.store.set('developer', { ...current, ...settings })
        logger.debug('Developer settings updated', { settings })
    }

    // 단축키 설정 관련 메서드
    getShortcutSettings(): ShortcutSettings {
        return this.store.get('shortcuts')
    }

    setShortcutSettings(settings: Partial<ShortcutSettings>): void {
        const current = this.store.get('shortcuts')
        this.store.set('shortcuts', { ...current, ...settings })
        logger.debug('Shortcut settings updated', { settings })
    }

    // User-Agent 관련 메서드
    getUserAgent(): string {
        return this.store.get('browser.userAgent')
    }

    setUserAgent(userAgent: string, preset?: keyof typeof USER_AGENT_PRESETS): void {
        this.store.set('browser.userAgent', userAgent)
        if (preset) {
            this.store.set('browser.userAgentPreset', preset)
        }
        logger.info('User-Agent updated', { userAgent, preset })
    }

    setUserAgentPreset(preset: keyof typeof USER_AGENT_PRESETS): void {
        const userAgent = USER_AGENT_PRESETS[preset]
        this.setUserAgent(userAgent, preset)
    }

    // 개별 설정 가져오기/설정하기
    get<T extends keyof AppSettings>(key: T): AppSettings[T] {
        return this.store.get(key)
    }

    set<T extends keyof AppSettings>(key: T, value: AppSettings[T]): void {
        this.store.set(key, value)
        logger.debug('Setting updated', { key, value })
    }

    // 설정 초기화
    resetSettings(): void {
        this.store.clear()
        this.store.store = this.defaultSettings
        logger.info('Settings reset to defaults')
    }

    // 설정 내보내기
    exportSettings(): AppSettings {
        return this.store.store
    }

    // 설정 가져오기
    importSettings(settings: Partial<AppSettings>): void {
        // 기존 설정과 병합
        const current = this.store.store
        this.store.store = { ...current, ...settings }
        logger.info('Settings imported')
    }

    // 설정 파일 경로 가져오기
    getSettingsPath(): string {
        return this.store.path
    }
}

// 싱글톤 인스턴스 내보내기
export const settingsService = SettingsService.getInstance()
export default settingsService