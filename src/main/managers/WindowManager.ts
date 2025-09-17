import { BrowserWindow } from 'electron'
import { createLogger } from '../../shared/logger'
import { CoreWindowService, WindowConfig, SecurityConfig } from '../core/window'

const logger = createLogger('WindowManager')

interface WindowManagerConfig extends WindowConfig {
    show?: boolean
}

/**
 * 창 관리자 - CoreWindowService를 사용한 고급 창 관리
 * SRP: 창 생성, 관리, 메모리 정리만 담당
 * 
 * CoreWindowService와 협력하여:
 * - frame: true, ready-to-show: false 설정
 * - 강화된 보안 정책
 * - 성능 최적화 적용
 */
export class WindowManager {
    private windows = new Map<string, BrowserWindow>()
    private windowIdCounter = 0
    private coreWindowService: CoreWindowService

    constructor() {
        this.coreWindowService = new CoreWindowService()
    }

    createWindow(config: WindowManagerConfig = {}, security?: Partial<SecurityConfig>): BrowserWindow {
        const windowId = `win-${++this.windowIdCounter}`

        logger.info('Creating advanced window', { windowId, config })

        // CoreWindowService를 사용하여 창 생성 (frame: true, ready-to-show: false 자동 적용)
        const window = this.coreWindowService.createWindow(config, security)

        // 성능 최적화 적용
        this.coreWindowService.applyPerformanceOptimizations(window)

        // 보안 검증
        const securityValidation = this.coreWindowService.validateSecuritySettings(window)
        if (!securityValidation.isSecure) {
            logger.warn('Security issues detected', {
                windowId,
                issues: securityValidation.issues
            })
        }

        // 메모리 관리 - 중요!
        window.on('closed', () => {
            this.windows.delete(windowId)
            logger.info('Window cleaned up', { windowId })
        })

        // ready-to-show 이벤트 처리 (CoreWindowService에서 자동 처리됨)
        // show 설정이 true인 경우에만 강제로 표시
        if (config.show === true) {
            window.once('ready-to-show', () => {
                window.show()
                logger.info('Window force shown', { windowId })
            })
        }

        this.windows.set(windowId, window)
        logger.info('Advanced window created successfully', {
            windowId,
            id: window.id,
            security: securityValidation.isSecure ? 'secure' : 'has-issues'
        })

        return window
    }

    // 보안 강화된 창 생성 (추천)
    createSecureWindow(config: WindowManagerConfig = {}): BrowserWindow {
        const securityConfig: Partial<SecurityConfig> = {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            experimentalFeatures: false,
            sandbox: false // preload 스크립트 허용
        }

        return this.createWindow(config, securityConfig)
    }

    // 개발자 모드 창 생성 (개발 환경용)
    createDevWindow(config: WindowManagerConfig = {}): BrowserWindow {
        if (process.env.NODE_ENV !== 'development') {
            logger.warn('Dev window creation attempted in production')
            return this.createSecureWindow(config)
        }

        const devConfig = {
            ...config,
            show: true // 개발 모드에서는 즉시 표시
        }

        const securityConfig: Partial<SecurityConfig> = {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false, // 개발 편의를 위해 완화
            allowRunningInsecureContent: true,
            experimentalFeatures: true,
            sandbox: false
        }

        const window = this.createWindow(devConfig, securityConfig)

        // DevTools 자동 열기
        window.webContents.openDevTools()

        logger.info('Development window created with relaxed security')

        return window
    }

    getActiveWindow(): BrowserWindow | null {
        // 포커스된 창 찾기
        for (const window of this.windows.values()) {
            if (!window.isDestroyed() && window.isFocused()) {
                return window
            }
        }

        // 포커스된 창이 없으면 가장 최근 창 반환
        const windows = Array.from(this.windows.values()).filter(w => !w.isDestroyed())
        return windows[windows.length - 1] || null
    }

    getAllWindows(): BrowserWindow[] {
        return Array.from(this.windows.values()).filter(w => !w.isDestroyed())
    }

    getWindowById(windowId: string): BrowserWindow | undefined {
        const window = this.windows.get(windowId)
        return window && !window.isDestroyed() ? window : undefined
    }

    getWindowCount(): number {
        return Array.from(this.windows.values()).filter(w => !w.isDestroyed()).length
    }

    // 모든 창 보안 검증
    validateAllWindowsSecurity(): {
        totalWindows: number
        secureWindows: number
        issues: { windowId: string, issues: string[] }[]
    } {
        const issues: { windowId: string, issues: string[] }[] = []
        let secureWindows = 0

        for (const [windowId, window] of this.windows) {
            if (window.isDestroyed()) continue

            const validation = this.coreWindowService.validateSecuritySettings(window)
            if (validation.isSecure) {
                secureWindows++
            } else {
                issues.push({ windowId, issues: validation.issues })
            }
        }

        return {
            totalWindows: this.getWindowCount(),
            secureWindows,
            issues
        }
    }

    // 창 상태 리포트
    generateWindowReport(): {
        totalWindows: number
        activeWindows: number
        focusedWindow: string | null
        windowStates: any[]
    } {
        const windowStates = []
        let focusedWindow: string | null = null
        let activeWindows = 0

        for (const [windowId, window] of this.windows) {
            if (window.isDestroyed()) continue

            activeWindows++
            const state = this.coreWindowService.getWindowState(window)

            if (state.isFocused) {
                focusedWindow = windowId
            }

            windowStates.push({
                windowId,
                ...state
            })
        }

        return {
            totalWindows: this.windows.size,
            activeWindows,
            focusedWindow,
            windowStates
        }
    }

    closeAllWindows(): void {
        logger.info('Closing all windows...', { count: this.windows.size })

        for (const [windowId, window] of this.windows) {
            if (!window.isDestroyed()) {
                try {
                    window.close()
                    logger.debug('Window closed', { windowId })
                } catch (error) {
                    logger.error('Failed to close window', { windowId, error })
                }
            }
        }

        // 강제 정리
        this.windows.clear()
        logger.info('All windows closed and cleaned up')
    }

    // CoreWindowService 접근자
    getCoreWindowService(): CoreWindowService {
        return this.coreWindowService
    }
}