import { app } from 'electron'
import { join } from 'node:path'
import { promises as fs } from 'node:fs'
import { BrowserSettings } from '../../shared/types'
import { createModuleLogger } from '../../shared/logger'

// GIGA-CHAD: 설정 관리자 - 사용자 설정 저장 및 로드
export class SettingsManager {
    private static instance: SettingsManager
    private settings: BrowserSettings
    private settingsPath: string
    private saveTimer?: NodeJS.Timeout
    private logger = createModuleLogger('SettingsManager')

    // 기본 설정
    private readonly defaultSettings: BrowserSettings = {
        defaultSearchEngine: 'google',
        backgroundThrottling: true,
        maxTabs: 20,
        memoryLimit: 1000, // MB
        autoSuspendTabs: true,
        suspendTimeoutMs: 30000, // 30초
        enableAdBlock: true
    }

    private constructor() {
        this.settingsPath = join(app.getPath('userData'), 'settings.json')
        this.settings = { ...this.defaultSettings }
        this.logger = createModuleLogger('SettingsManager')
    }

    static getInstance(): SettingsManager {
        if (!this.instance) {
            this.instance = new SettingsManager()
        }
        return this.instance
    }

    /**
     * 설정 초기화 및 로드
     */
    async initialize(): Promise<void> {
        try {
            await this.loadSettings()
            this.logger.info('⚙️ GIGA-CHAD: Settings loaded successfully')
        } catch (error) {
            this.logger.warn('⚠️ GIGA-CHAD: Failed to load settings, using defaults:', error)
            await this.saveSettings()
        }
    }

    /**
     * 설정 파일 로드
     */
    private async loadSettings(): Promise<void> {
        try {
            const data = await fs.readFile(this.settingsPath, 'utf8')
            const loadedSettings = JSON.parse(data) as Partial<BrowserSettings>

            // 기본 설정과 병합 (새로운 설정 항목 대응)
            this.settings = {
                ...this.defaultSettings,
                ...loadedSettings
            }

            this.logger.info('📖 GIGA-CHAD: Settings loaded from disk')
        } catch (error) {
            if ((error as any).code !== 'ENOENT') {
                throw error
            }
            // 파일이 없으면 기본 설정 사용
            this.logger.info('📝 GIGA-CHAD: Settings file not found, using defaults')
        }
    }

    /**
     * 설정 파일 저장
     */
    private async saveSettings(): Promise<void> {
        try {
            const data = JSON.stringify(this.settings, null, 2)
            await fs.writeFile(this.settingsPath, data, 'utf8')
            this.logger.info('💾 GIGA-CHAD: Settings saved to disk')
        } catch (error) {
            this.logger.error('💥 GIGA-CHAD: Failed to save settings:', error)
        }
    }

    /**
     * 지연된 저장 (성능 최적화)
     */
    private scheduleSave(): void {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer)
        }

        this.saveTimer = setTimeout(() => {
            this.saveSettings()
            this.saveTimer = undefined
        }, 1000) // 1초 후 저장
    }

    /**
     * 설정 값 가져오기
     */
    get<K extends keyof BrowserSettings>(key: K): BrowserSettings[K] {
        return this.settings[key]
    }

    /**
     * 설정 값 설정하기
     */
    set<K extends keyof BrowserSettings>(key: K, value: BrowserSettings[K]): void {
        const oldValue = this.settings[key]
        this.settings[key] = value

        this.logger.info(`⚙️ GIGA-CHAD: Setting changed - ${key}: ${oldValue} → ${value}`)

        // 지연된 저장
        this.scheduleSave()

        // 설정 변경 이벤트 발생
        this.onSettingChanged(key, value, oldValue)
    }

    /**
     * 여러 설정 한번에 업데이트
     */
    update(updates: Partial<BrowserSettings>): void {
        const changes: Array<{ key: keyof BrowserSettings; oldValue: any; newValue: any }> = []

        for (const [key, value] of Object.entries(updates) as Array<[keyof BrowserSettings, any]>) {
            const oldValue = this.settings[key]

            if (oldValue !== value) {
                changes.push({ key, oldValue, newValue: value })
                // @ts-ignore - TypeScript 제한으로 인한 우회
                this.settings[key] = value
            }
        }

        if (changes.length > 0) {
            this.logger.info(`⚙️ GIGA-CHAD: Multiple settings changed:`, changes)
            this.scheduleSave()

            // 변경된 설정들에 대해 이벤트 발생
            for (const change of changes) {
                this.onSettingChanged(change.key, change.newValue, change.oldValue)
            }
        }
    }

    /**
     * 모든 설정 가져오기
     */
    getAll(): BrowserSettings {
        return { ...this.settings }
    }

    /**
     * 설정 초기화
     */
    async reset(): Promise<void> {
        this.settings = { ...this.defaultSettings }
        await this.saveSettings()
        this.logger.info('🔄 GIGA-CHAD: Settings reset to defaults')
    }

    /**
     * 설정 변경 이벤트 처리
     */
    private onSettingChanged<K extends keyof BrowserSettings>(
        key: K,
        newValue: BrowserSettings[K],
        oldValue: BrowserSettings[K]
    ): void {
        // 특정 설정 변경에 대한 즉시 반응
        switch (key) {
            case 'backgroundThrottling':
                // 백그라운드 스로틀링 설정 변경시 즉시 적용
                this.logger.info(`🔄 GIGA-CHAD: Background throttling ${newValue ? 'enabled' : 'disabled'}`)
                break

            case 'maxTabs':
                // 최대 탭 수 변경시 체크
                this.logger.info(`📑 GIGA-CHAD: Max tabs limit set to ${newValue}`)
                break

            case 'memoryLimit':
                // 메모리 제한 변경시 체크
                this.logger.info(`🧠 GIGA-CHAD: Memory limit set to ${newValue}MB`)
                break

            case 'enableAdBlock':
                // 광고 차단 설정 변경시
                this.logger.info(`🚫 GIGA-CHAD: Ad blocking ${newValue ? 'enabled' : 'disabled'}`)
                break
        }

        // TODO: IPC를 통해 렌더러 프로세스에 설정 변경 알림
    }

    /**
     * 설정 유효성 검증
     */
    validateSettings(): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        // 메모리 제한 검증
        if (this.settings.memoryLimit < 100 || this.settings.memoryLimit > 8000) {
            errors.push('Memory limit must be between 100MB and 8000MB')
        }

        // 최대 탭 수 검증
        if (this.settings.maxTabs < 1 || this.settings.maxTabs > 100) {
            errors.push('Max tabs must be between 1 and 100')
        }

        // 일시정지 타임아웃 검증
        if (this.settings.suspendTimeoutMs < 1000 || this.settings.suspendTimeoutMs > 300000) {
            errors.push('Suspend timeout must be between 1 second and 5 minutes')
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }

    /**
     * 설정 내보내기
     */
    export(): string {
        return JSON.stringify(this.settings, null, 2)
    }

    /**
     * 설정 가져오기
     */
    async import(jsonData: string): Promise<void> {
        try {
            const importedSettings = JSON.parse(jsonData) as Partial<BrowserSettings>

            // 유효성 검증 후 적용
            const tempSettings = { ...this.defaultSettings, ...importedSettings }
            const previousSettings = this.settings
            this.settings = tempSettings

            const validation = this.validateSettings()
            if (!validation.isValid) {
                this.settings = previousSettings
                throw new Error(`Invalid settings: ${validation.errors.join(', ')}`)
            }

            await this.saveSettings()
            this.logger.info('📥 GIGA-CHAD: Settings imported successfully')
        } catch (error) {
            this.logger.error('💥 GIGA-CHAD: Failed to import settings:', error)
            throw error
        }
    }

    /**
     * 정리 작업
     */
    cleanup(): void {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer)
            // 마지막으로 저장
            this.saveSettings()
        }
    }
}