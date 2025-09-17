import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron'
import { createLogger } from '../../shared/logger'

const logger = createLogger('CoreWindow')

export interface WindowConfig {
    width?: number
    height?: number
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
    title?: string
    icon?: string
    center?: boolean
    resizable?: boolean
    movable?: boolean
    minimizable?: boolean
    maximizable?: boolean
    fullscreenable?: boolean
    alwaysOnTop?: boolean
    skipTaskbar?: boolean
    transparent?: boolean
    opacity?: number
    backgroundColor?: string
}

export interface SecurityConfig {
    nodeIntegration?: boolean
    contextIsolation?: boolean
    webSecurity?: boolean
    allowRunningInsecureContent?: boolean
    experimentalFeatures?: boolean
    enableBlinkFeatures?: string
    disableBlinkFeatures?: string
    sandbox?: boolean
    preload?: string
}

/**
 * 🖼️ Core Window Configuration Service
 * 
 * Electron 윈도우의 기본 설정과 보안 정책을 관리합니다.
 * - frame: true (창 테두리 표시)
 * - ready-to-show: false (준비되기 전까지 숨김)
 * - 강화된 보안 설정
 * - 기본 이벤트 핸들러
 */
export class CoreWindowService {
    private defaultWindowConfig: WindowConfig = {
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'Seo',
        center: true,
        resizable: true,
        movable: true,
        minimizable: true,
        maximizable: true,
        fullscreenable: true,
        alwaysOnTop: false,
        skipTaskbar: false,
        transparent: false,
        opacity: 1.0,
        backgroundColor: '#ffffff'
    }

    private defaultSecurityConfig: SecurityConfig = {
        nodeIntegration: false,        // 보안 필수! Node.js API 비활성화
        contextIsolation: true,        // 보안 필수! 컨텍스트 격리
        webSecurity: true,             // 웹 보안 활성화
        allowRunningInsecureContent: false,  // HTTP 콘텐츠 차단
        experimentalFeatures: false,   // 실험적 기능 비활성화
        sandbox: false,               // preload 스크립트 허용
        // preload는 필요시 설정
    }

    // 기본 Electron 윈도우 옵션 생성
    createWindowOptions(config?: Partial<WindowConfig>, security?: Partial<SecurityConfig>): BrowserWindowConstructorOptions {
        const windowConfig = { ...this.defaultWindowConfig, ...config }
        const securityConfig = { ...this.defaultSecurityConfig, ...security }

        logger.info('Creating window options', {
            size: `${windowConfig.width}x${windowConfig.height}`,
            security: {
                nodeIntegration: securityConfig.nodeIntegration,
                contextIsolation: securityConfig.contextIsolation,
                webSecurity: securityConfig.webSecurity
            }
        })

        const options: BrowserWindowConstructorOptions = {
            // === 크기 및 위치 설정 ===
            width: windowConfig.width,
            height: windowConfig.height,
            minWidth: windowConfig.minWidth,
            minHeight: windowConfig.minHeight,
            maxWidth: windowConfig.maxWidth,
            maxHeight: windowConfig.maxHeight,

            // === 기본 윈도우 속성 ===
            title: windowConfig.title,
            icon: windowConfig.icon,
            center: windowConfig.center,
            resizable: windowConfig.resizable,
            movable: windowConfig.movable,
            minimizable: windowConfig.minimizable,
            maximizable: windowConfig.maximizable,
            fullscreenable: windowConfig.fullscreenable,
            alwaysOnTop: windowConfig.alwaysOnTop,
            skipTaskbar: windowConfig.skipTaskbar,

            // === 시각적 효과 ===
            transparent: windowConfig.transparent,
            opacity: windowConfig.opacity,
            backgroundColor: windowConfig.backgroundColor,

            // 🎯 핵심 Electron 설정
            frame: true,                 // 창 테두리 표시 (사용자 요구사항)
            show: false,                 // ready-to-show: false 효과
            titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',

            // === 웹 보안 설정 ===
            webPreferences: {
                nodeIntegration: securityConfig.nodeIntegration,
                contextIsolation: securityConfig.contextIsolation,
                webSecurity: securityConfig.webSecurity,
                allowRunningInsecureContent: securityConfig.allowRunningInsecureContent,
                experimentalFeatures: securityConfig.experimentalFeatures,
                sandbox: securityConfig.sandbox,

                // 성능 최적화 설정
                backgroundThrottling: true, // 백그라운드 스로틀링 활성화 (GIGA 브라우저 핵심)

                // Preload 스크립트 (필요시)
                ...(securityConfig.preload && { preload: securityConfig.preload }),

                // 추가 보안 강화
                plugins: false,             // 플러그인 비활성화
                javascript: true,           // JavaScript는 허용
                images: true,              // 이미지 허용
                webgl: true,               // WebGL 허용 (GPU 가속용)

                // Blink 기능 제어
                ...(securityConfig.enableBlinkFeatures && {
                    enableBlinkFeatures: securityConfig.enableBlinkFeatures
                }),
                ...(securityConfig.disableBlinkFeatures && {
                    disableBlinkFeatures: securityConfig.disableBlinkFeatures
                }),
            }
        }

        logger.debug('Window options created', {
            dimensions: `${options.width}x${options.height}`,
            frame: options.frame,
            show: options.show,
            webPreferences: {
                nodeIntegration: options.webPreferences?.nodeIntegration,
                contextIsolation: options.webPreferences?.contextIsolation,
                backgroundThrottling: options.webPreferences?.backgroundThrottling
            }
        })

        return options
    }

    // 윈도우 생성 및 기본 이벤트 핸들러 설정
    createWindow(config?: Partial<WindowConfig>, security?: Partial<SecurityConfig>): BrowserWindow {
        const options = this.createWindowOptions(config, security)
        const window = new BrowserWindow(options)

        // 기본 이벤트 핸들러 설정
        this.setupDefaultEventHandlers(window)

        logger.info('Window created successfully', {
            id: window.id,
            title: window.getTitle()
        })

        return window
    }

    // 기본 이벤트 핸들러 설정
    private setupDefaultEventHandlers(window: BrowserWindow): void {
        // ready-to-show 이벤트: 윈도우가 준비되면 표시
        window.once('ready-to-show', () => {
            logger.info('Window ready to show', { id: window.id })
            window.show()

            // 개발 환경에서는 DevTools 자동 열기
            if (process.env.NODE_ENV === 'development') {
                window.webContents.openDevTools()
                logger.debug('DevTools opened for development')
            }
        })

        // 윈도우 닫기 이벤트
        window.on('closed', () => {
            logger.info('Window closed', { id: window.id })
        })

        // 윈도우 숨기기 이벤트 (macOS)
        window.on('hide', () => {
            logger.debug('Window hidden', { id: window.id })
        })

        // 윈도우 보이기 이벤트
        window.on('show', () => {
            logger.debug('Window shown', { id: window.id })
        })

        // 윈도우 최소화 이벤트
        window.on('minimize', () => {
            logger.debug('Window minimized', { id: window.id })
        })

        // 윈도우 복원 이벤트
        window.on('restore', () => {
            logger.debug('Window restored', { id: window.id })
        })

        // 윈도우 최대화 이벤트
        window.on('maximize', () => {
            logger.debug('Window maximized', { id: window.id })
        })

        // 윈도우 최대화 해제 이벤트
        window.on('unmaximize', () => {
            logger.debug('Window unmaximized', { id: window.id })
        })

        // 윈도우 포커스 이벤트
        window.on('focus', () => {
            logger.debug('Window focused', { id: window.id })
        })

        // 윈도우 포커스 해제 이벤트
        window.on('blur', () => {
            logger.debug('Window blurred', { id: window.id })
        })

        // 윈도우 리사이즈 이벤트
        window.on('resize', () => {
            const [width, height] = window.getSize()
            logger.debug('Window resized', {
                id: window.id,
                size: `${width}x${height}`
            })
        })

        // 윈도우 이동 이벤트
        window.on('move', () => {
            const [x, y] = window.getPosition()
            logger.debug('Window moved', {
                id: window.id,
                position: `${x},${y}`
            })
        })

        // 응답하지 않는 상태 이벤트
        window.webContents.on('unresponsive', () => {
            logger.warn('Window became unresponsive', { id: window.id })
        })

        // 응답 재개 이벤트
        window.webContents.on('responsive', () => {
            logger.info('Window became responsive again', { id: window.id })
        })

        // 렌더 프로세스 충돌 이벤트
        window.webContents.on('render-process-gone', (event, details) => {
            logger.error('Render process gone', {
                id: window.id,
                reason: details.reason,
                exitCode: details.exitCode
            })
        })

        // 메모리 부족 경고
        window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            logger.error('Failed to load content', {
                id: window.id,
                errorCode,
                errorDescription
            })
        })
    }

    // 보안 설정 검증
    validateSecuritySettings(window: BrowserWindow): {
        isSecure: boolean
        issues: string[]
        recommendations: string[]
    } {
        const issues: string[] = []
        const recommendations: string[] = []

        try {
            // WebPreferences를 직접 가져올 수 없으므로 생성 시 설정을 기반으로 검증
            const url = window.webContents.getURL()

            // 기본적인 보안 검증
            if (url && !url.startsWith('https://') && !url.startsWith('file://') && url !== 'about:blank') {
                issues.push('안전하지 않은 프로토콜을 사용하고 있습니다')
                recommendations.push('HTTPS 프로토콜을 사용하세요')
            }

            // 윈도우 상태 기반 검증
            if (window.isDestroyed()) {
                issues.push('윈도우가 파괴된 상태입니다')
                recommendations.push('새로운 윈도우를 생성하세요')
            }

        } catch (error) {
            issues.push('보안 설정을 확인할 수 없습니다')
            recommendations.push('윈도우 상태를 확인하세요')
        }

        const isSecure = issues.length === 0

        logger.info('Security validation completed', {
            id: window.id,
            isSecure,
            issueCount: issues.length
        })

        return { isSecure, issues, recommendations }
    }

    // 성능 최적화 설정 적용
    applyPerformanceOptimizations(window: BrowserWindow): void {
        logger.info('Applying performance optimizations', { id: window.id })

        try {
            // 백그라운드 스로틀링은 생성 시에 이미 설정됨
            logger.info('Background throttling enabled during window creation')

            // 기본 User-Agent 설정 (GIGA 브라우저 식별)
            const userAgent = `${window.webContents.getUserAgent()} GigaBrowser/1.0`
            window.webContents.setUserAgent(userAgent)

            // 세션 캐시 설정 (사용 가능한 API 사용)
            window.webContents.session.clearCache()

            logger.info('Performance optimizations applied', {
                id: window.id,
                userAgent: 'GigaBrowser/1.0',
                cacheCleared: true
            })

        } catch (error) {
            logger.error('Failed to apply performance optimizations', {
                id: window.id,
                error
            })
        }
    }    // 윈도우 상태 조회
    getWindowState(window: BrowserWindow): {
        id: number
        title: string
        size: { width: number, height: number }
        position: { x: number, y: number }
        isVisible: boolean
        isMinimized: boolean
        isMaximized: boolean
        isFullScreen: boolean
        isFocused: boolean
        isDestroyed: boolean
    } {
        try {
            const [width, height] = window.getSize()
            const [x, y] = window.getPosition()

            return {
                id: window.id,
                title: window.getTitle(),
                size: { width, height },
                position: { x, y },
                isVisible: window.isVisible(),
                isMinimized: window.isMinimized(),
                isMaximized: window.isMaximized(),
                isFullScreen: window.isFullScreen(),
                isFocused: window.isFocused(),
                isDestroyed: window.isDestroyed()
            }
        } catch (error) {
            logger.error('Failed to get window state', { id: window.id, error })
            return {
                id: window.id,
                title: '',
                size: { width: 0, height: 0 },
                position: { x: 0, y: 0 },
                isVisible: false,
                isMinimized: false,
                isMaximized: false,
                isFullScreen: false,
                isFocused: false,
                isDestroyed: true
            }
        }
    }

    // 기본 설정 조회
    getDefaultWindowConfig(): WindowConfig {
        return { ...this.defaultWindowConfig }
    }

    getDefaultSecurityConfig(): SecurityConfig {
        return { ...this.defaultSecurityConfig }
    }

    // 설정 업데이트
    updateDefaultWindowConfig(config: Partial<WindowConfig>): void {
        this.defaultWindowConfig = { ...this.defaultWindowConfig, ...config }
        logger.info('Default window config updated', { config })
    }

    updateDefaultSecurityConfig(config: Partial<SecurityConfig>): void {
        this.defaultSecurityConfig = { ...this.defaultSecurityConfig, ...config }
        logger.info('Default security config updated', { config })
    }
}