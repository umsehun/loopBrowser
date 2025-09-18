import { BrowserWindow, WebContentsView, screen } from 'electron'
import { logger } from '../../shared/logger/index'
import { devToolsService } from '../services/DevToolsService'
import { tabService } from '../services/TabService'
import { settingsService } from '../services/SettingsService'
import { UI_CONSTANTS } from '../../shared/constants'

export class WindowManager {
    private static instance: WindowManager
    private mainWindow: BrowserWindow | null = null
    private isWindowReady = false

    constructor() {
        logger.info('WindowManager initialized')
    }

    static getInstance(): WindowManager {
        if (!WindowManager.instance) {
            WindowManager.instance = new WindowManager()
        }
        return WindowManager.instance
    }

    // 메인 윈도우 생성
    async createMainWindow(): Promise<BrowserWindow> {
        if (this.mainWindow) {
            logger.warn('Main window already exists')
            return this.mainWindow
        }

        try {
            logger.info('Creating main window...')

            // 화면 크기 가져오기
            const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

            // 윈도우 크기 계산 (화면의 80%)
            const windowWidth = Math.floor(screenWidth * 0.8)
            const windowHeight = Math.floor(screenHeight * 0.8)

            // 콘텐츠 영역 크기 계산 (테두리/타이틀바 고려)
            // 1200x800 → 1180x780 (좌우 10px, 상하 10px 여백)
            const contentWidth = windowWidth - 20 // 좌우 테두리 10px씩
            const contentHeight = windowHeight - 20 // 상하 테두리 10px씩

            // 메인 윈도우 생성 (기본 프레임 사용)
            this.mainWindow = new BrowserWindow({
                width: windowWidth,
                height: windowHeight,
                minWidth: 800,
                minHeight: 600,
                show: false,
                autoHideMenuBar: true,
                frame: true, // 기본 프레임 사용 (창 컨트롤 버튼 포함)
                titleBarStyle: 'default', // 기본 타이틀바
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    webSecurity: true,
                    preload: require('path').join(__dirname, '../preload/preload.js')
                }
            })

            // User-Agent 설정 (설정 서비스에서 가져오기)
            const userAgent = settingsService.getUserAgent()
            this.mainWindow.webContents.setUserAgent(userAgent)
            logger.info('User-Agent set from settings', { userAgent })

            // 서비스들에 메인 윈도우 설정
            devToolsService.setMainWindow(this.mainWindow)
            tabService.setMainWindow(this.mainWindow)

            // 윈도우 이벤트 설정
            this.setupWindowEvents()

            // 화면 중앙에 위치
            this.mainWindow.center()

            // UI 로드 (React)
            await this.loadUI()

            // CSP 적용
            this.applyCSP()

            logger.info('Main window created successfully', {
                width: windowWidth,
                height: windowHeight
            })

            return this.mainWindow

        } catch (error) {
            logger.error('Failed to create main window', { error })
            throw error
        }
    }

    // CSP (Content Security Policy) 적용
    private applyCSP(): void {
        if (!this.mainWindow) return

        const cspHeader = this.getCSPHeader()

        // 메인 윈도우에 CSP 헤더 설정
        this.mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [cspHeader]
                }
            })
        })

        logger.info('CSP (Content Security Policy) applied to main window')
    }

    // CSP 헤더 생성
    private getCSPHeader(): string {
        return [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https: wss:",
            "media-src 'self' https: blob:",
            "object-src 'none'",
            "frame-src 'self' https:",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests"
        ].join('; ')
    }

    // 윈도우 이벤트 설정
    private setupWindowEvents(): void {
        if (!this.mainWindow) return

        // 윈도우 준비 완료
        this.mainWindow.on('ready-to-show', () => {
            if (this.isWindowReady) {
                logger.debug('Window already ready, skipping ready-to-show handler')
                return
            }

            logger.info('Main window ready to show')
            this.mainWindow?.show()

            // 개발 모드에서는 DevTools 자동 열기
            if (process.env.NODE_ENV === 'development') {
                this.mainWindow?.webContents.openDevTools({ mode: 'detach' })
            }

            // 기본 탭 생성
            this.createDefaultTab()

            this.isWindowReady = true
        })

        // 윈도우 크기 변경
        this.mainWindow.on('resize', () => {
            logger.debug('Window resized')
            tabService.resizeActiveTab()
        })

        // 윈도우 포커스
        this.mainWindow.on('focus', () => {
            logger.debug('Window focused')
        })

        // 윈도우 포커스 해제
        this.mainWindow.on('blur', () => {
            logger.debug('Window blurred')
        })

        // 윈도우 닫기
        this.mainWindow.on('closed', () => {
            logger.info('Main window closed')
            this.cleanup()
        })

        // 웹 콘텐츠 충돌 감지
        this.mainWindow.webContents.on('render-process-gone', (event, details) => {
            logger.error('Renderer process gone', {
                reason: details.reason,
                exitCode: details.exitCode
            })
        })

        // 응답하지 않는 페이지 감지
        this.mainWindow.webContents.on('unresponsive', () => {
            logger.warn('WebContents became unresponsive')
        })

        // 응답 복구
        this.mainWindow.webContents.on('responsive', () => {
            logger.info('WebContents became responsive again')
        })
    }

    // UI 로드
    private async loadUI(): Promise<void> {
        if (!this.mainWindow) return

        try {
            if (process.env.NODE_ENV === 'development') {
                await this.mainWindow.loadURL('http://localhost:5173')
                logger.info('Loaded development UI')
            } else {
                await this.mainWindow.loadFile(require('path').join(__dirname, '../renderer/index.html'))
                logger.info('Loaded production UI')
            }
        } catch (error) {
            logger.error('Failed to load UI', { error })
            throw error
        }
    }

    // 기본 탭 생성
    private createDefaultTab(): void {
        try {
            // 이미 탭이 존재하는지 확인
            const existingTabs = tabService.getAllTabs()
            if (existingTabs.length > 0) {
                logger.debug('Tabs already exist, skipping default tab creation')
                return
            }

            const defaultTab = tabService.createTab('https://www.google.com', 'normal')
            tabService.activateTab(defaultTab.id)
            logger.info('Default tab created and activated', { id: defaultTab.id })
        } catch (error) {
            logger.error('Failed to create default tab', { error })
        }
    }

    // 메인 윈도우 가져오기
    getMainWindow(): BrowserWindow | null {
        return this.mainWindow
    }

    // 윈도우 표시 여부 확인
    isWindowVisible(): boolean {
        return this.mainWindow?.isVisible() || false
    }

    // 윈도우 포커스 여부 확인
    isWindowFocused(): boolean {
        return this.mainWindow?.isFocused() || false
    }

    // 윈도우 최소화 여부 확인
    isWindowMinimized(): boolean {
        return this.mainWindow?.isMinimized() || false
    }

    // 윈도우 최대화 여부 확인
    isWindowMaximized(): boolean {
        return this.mainWindow?.isMaximized() || false
    }

    // 윈도우 전체화면 여부 확인
    isWindowFullScreen(): boolean {
        return this.mainWindow?.isFullScreen() || false
    }

    // 윈도우 보이기
    showWindow(): void {
        if (this.mainWindow) {
            this.mainWindow.show()
            this.mainWindow.focus()
            logger.debug('Window shown and focused')
        }
    }

    // 윈도우 숨기기
    hideWindow(): void {
        if (this.mainWindow) {
            this.mainWindow.hide()
            logger.debug('Window hidden')
        }
    }

    // 윈도우 최소화
    minimizeWindow(): void {
        if (this.mainWindow) {
            this.mainWindow.minimize()
            logger.debug('Window minimized')
        }
    }

    // 윈도우 최대화/복원
    toggleMaximizeWindow(): void {
        if (this.mainWindow) {
            if (this.mainWindow.isMaximized()) {
                this.mainWindow.unmaximize()
                logger.debug('Window unmaximized')
            } else {
                this.mainWindow.maximize()
                logger.debug('Window maximized')
            }
        }
    }

    // 전체화면 토글
    toggleFullScreen(): void {
        if (this.mainWindow) {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
            logger.debug('Window fullscreen toggled', {
                isFullScreen: this.mainWindow.isFullScreen()
            })
        }
    }

    // 윈도우 닫기
    closeWindow(): void {
        if (this.mainWindow) {
            this.mainWindow.close()
            logger.debug('Window close requested')
        }
    }

    // User-Agent 동적 업데이트
    updateUserAgent(userAgent?: string): void {
        try {
            if (!this.mainWindow) {
                logger.warn('Cannot update User-Agent: main window not available')
                return
            }

            const newUserAgent = userAgent || settingsService.getUserAgent()
            this.mainWindow.webContents.setUserAgent(newUserAgent)
            logger.info('User-Agent updated', { userAgent: newUserAgent })

            // TabService를 통해 모든 탭의 User-Agent 업데이트
            tabService.updateAllTabsUserAgent(newUserAgent)
        } catch (error) {
            logger.error('Failed to update User-Agent', { error, userAgent })
        }
    }

    // 정리 작업
    cleanup(): void {
        try {
            if (this.mainWindow) {
                // 서비스 정리
                devToolsService.unregisterShortcuts()
                tabService.closeAllTabs()

                this.mainWindow = null
                this.isWindowReady = false
                logger.info('WindowManager cleanup complete')
            }
        } catch (error) {
            logger.error('Error during WindowManager cleanup', { error })
        }
    }
}

// 싱글톤 인스턴스 내보내기
export const windowManager = WindowManager.getInstance()
export default windowManager