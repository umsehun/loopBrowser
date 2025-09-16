import { BaseWindow, WebContentsView } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { createModuleLogger } from '@shared/logger'

export interface WindowConfig {
    width?: number
    height?: number
    minWidth?: number
    minHeight?: number
    show?: boolean
}

export interface LayeredWindow {
    baseWindow: BaseWindow
    browserView: WebContentsView
    uiView: WebContentsView
}

/**
 * GIGA-CHAD: Zen/Arc 스타일 BaseWindow + 멀티 WebContentsView 관리
 */
export class WindowManager {
    private static windows: Map<number, LayeredWindow> = new Map()
    private static logger = createModuleLogger('WindowManager')

    /**
     * GIGA-CHAD: BaseWindow + 듀얼 WebContentsView로 레이어드 윈도우 생성
     */
    static createLayeredWindow(config: WindowConfig = {}): LayeredWindow {
        const defaultConfig: WindowConfig = {
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            show: false, // ready-to-show까지 숨김
        }

        const finalConfig = { ...defaultConfig, ...config }

        // GIGA-CHAD: BaseWindow 생성 (타이틀바 없는 깔끔한 윈도우)
        const baseWindow = new BaseWindow({
            width: finalConfig.width,
            height: finalConfig.height,
            minWidth: finalConfig.minWidth,
            minHeight: finalConfig.minHeight,
            show: finalConfig.show,
            titleBarStyle: 'hidden', // 완전히 숨긴 타이틀바
            trafficLightPosition: { x: 16, y: 16 }, // macOS 트래픽 라이트 위치
        })

        // GIGA-CHAD: 브라우저 콘텐츠용 WebContentsView (하위 레이어)
        const browserView = new WebContentsView({
            webPreferences: {
                sandbox: true,
                contextIsolation: true,
                nodeIntegration: false,
                webSecurity: true,
                allowRunningInsecureContent: false,
                experimentalFeatures: false,
                enableBlinkFeatures: '',
                disableBlinkFeatures: 'Accelerated2dCanvas,AcceleratedSmallCanvases',
                backgroundThrottling: true, // GIGA-CHAD: 백그라운드 최적화
                devTools: false, // 프로덕션에서 DevTools 비활성화
            }
        })

        // GIGA-CHAD: React UI용 WebContentsView (상위 레이어, 투명 배경)
        const uiView = new WebContentsView({
            webPreferences: {
                preload: join(__dirname, '../preload/preload.js'),
                sandbox: false,
                contextIsolation: true,
                nodeIntegration: false,
                webSecurity: true,
                backgroundThrottling: false, // UI는 항상 활성
                devTools: is.dev, // 개발 시에만 DevTools
            }
        })

        // GIGA-CHAD: 레이어 순서 설정 (중요: 브라우저 → UI 순서)
        baseWindow.contentView.addChildView(browserView) // 하위 레이어
        baseWindow.contentView.addChildView(uiView)      // 상위 레이어

        // GIGA-CHAD: 디버그용 UI 뷰 배경색 설정 (임시)
        if (is.dev) {
            // 완전 불투명 빨간색으로 UI 레이어 디버그
            (uiView as any).setBackgroundColor('#FF0000')
            this.logger.info('🎨 GIGA-CHAD: UI view debug background applied (SOLID RED)')

            // UI 뷰 상태 상세 로깅
            setTimeout(() => {
                const uiBounds = uiView.getBounds()
                const browserBounds = browserView.getBounds()
                this.logger.info('📊 GIGA-CHAD: WebContentsView bounds check', {
                    uiView: uiBounds,
                    browserView: browserBounds,
                    uiVisible: !uiView.webContents.isDestroyed(),
                    uiLoaded: uiView.webContents.getURL()
                })
            }, 2000)
        }

        // GIGA-CHAD: 초기 레이아웃 설정
        this.setupInitialLayout(baseWindow, browserView, uiView)

        // GIGA-CHAD: 이벤트 핸들러 설정
        this.setupEventHandlers(baseWindow, browserView, uiView)

        const layeredWindow: LayeredWindow = {
            baseWindow,
            browserView,
            uiView
        }

        this.windows.set(baseWindow.id, layeredWindow)

        this.logger.info(`🎭 GIGA-CHAD: Layered window created (ID: ${baseWindow.id})`)

        return layeredWindow
    }

    /**
     * GIGA-CHAD: 초기 레이아웃 설정
     */
    private static setupInitialLayout(
        baseWindow: BaseWindow,
        browserView: WebContentsView,
        uiView: WebContentsView
    ): void {
        const bounds = baseWindow.getBounds()

        // 브라우저 뷰: 일부 영역만 차지 (디버그용)
        if (is.dev) {
            browserView.setBounds({
                x: 300,
                y: 100,
                width: bounds.width - 400,
                height: bounds.height - 200
            })
        } else {
            browserView.setBounds({
                x: 0,
                y: 0,
                width: bounds.width,
                height: bounds.height
            })
        }

        // UI 뷰: 전체 화면 차지 (투명 배경으로 오버레이)
        uiView.setBounds({
            x: 0,
            y: 0,
            width: bounds.width,
            height: bounds.height
        })

        this.logger.info(`📐 GIGA-CHAD: Initial layout set`, {
            windowSize: `${bounds.width}x${bounds.height}`,
            browserViewBounds: '0,0 full-screen',
            uiViewBounds: '0,0 overlay'
        })
    }

    /**
     * GIGA-CHAD: 이벤트 핸들러 설정
     */
    private static setupEventHandlers(
        baseWindow: BaseWindow,
        browserView: WebContentsView,
        uiView: WebContentsView
    ): void {
        // 리사이즈 이벤트 핸들링
        let resizeTimeout: NodeJS.Timeout

        const handleResize = () => {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout)
            }

            resizeTimeout = setTimeout(() => {
                const newBounds = baseWindow.getBounds()

                // 두 뷰 모두 전체 화면으로 리사이즈
                const fullScreenBounds = {
                    x: 0,
                    y: 0,
                    width: newBounds.width,
                    height: newBounds.height
                }

                browserView.setBounds(fullScreenBounds)
                uiView.setBounds(fullScreenBounds)

                this.logger.info(`🔄 GIGA-CHAD: Views resized`, {
                    newSize: `${newBounds.width}x${newBounds.height}`
                })
            }, 16) // 60fps throttle
        }

        baseWindow.on('resize', handleResize)
        baseWindow.on('resized', handleResize)

        // 윈도우 준비 완료 (BaseWindow는 ready-to-show 이벤트가 없음)
        setTimeout(() => {
            baseWindow.show()
            this.logger.info(`✨ GIGA-CHAD: Layered window ready to show (ID: ${baseWindow.id})`)
        }, 100)

        // 리소스 정리
        baseWindow.on('closed', () => {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout)
            }

            // WebContents 수동 정리 (메모리 리크 방지)
            try {
                if (!browserView.webContents.isDestroyed()) {
                    browserView.webContents.close()
                }
                if (!uiView.webContents.isDestroyed()) {
                    uiView.webContents.close()
                }
            } catch (error) {
                this.logger.error('Error closing WebContents:', error)
            }

            this.windows.delete(baseWindow.id)
            this.logger.info(`🗑️ GIGA-CHAD: Layered window closed and cleaned up (ID: ${baseWindow.id})`)
        })
    }

    /**
     * GIGA-CHAD: UI 뷰에 React 앱 로드
     */
    static loadUIContent(layeredWindow: LayeredWindow): void {
        const isDev = is.dev && process.env['ELECTRON_RENDERER_URL']
        const loadUrl = isDev ? process.env['ELECTRON_RENDERER_URL'] : join(__dirname, '../renderer/index.html')

        this.logger.info(`🚀 GIGA-CHAD: Loading UI content`, {
            isDev,
            loadUrl,
            webContentsId: layeredWindow.uiView.webContents.id
        })

        // UI 로딩 이벤트 리스너 추가
        layeredWindow.uiView.webContents.on('did-finish-load', () => {
            this.logger.info(`✅ GIGA-CHAD: UI content finished loading`, {
                finalUrl: layeredWindow.uiView.webContents.getURL(),
                title: layeredWindow.uiView.webContents.getTitle()
            })
        })

        layeredWindow.uiView.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            this.logger.error(`❌ GIGA-CHAD: UI content failed to load`, {
                errorCode,
                errorDescription
            })
        })

        if (isDev) {
            layeredWindow.uiView.webContents.loadURL(process.env['ELECTRON_RENDERER_URL']!)
        } else {
            layeredWindow.uiView.webContents.loadFile(join(__dirname, '../renderer/index.html'))
        }

        this.logger.info(`🚀 GIGA-CHAD: UI content load initiated`)
    }

    /**
     * GIGA-CHAD: 브라우저 뷰에 웹 페이지 로드
     */
    static loadBrowserContent(layeredWindow: LayeredWindow, url: string = 'https://www.google.com'): void {
        layeredWindow.browserView.webContents.loadURL(url)

        this.logger.info(`🌐 GIGA-CHAD: Browser content loaded`, { url })
    }

    /**
     * GIGA-CHAD: 마우스 이벤트 투과 설정
     */
    static setUIMouseTransparency(layeredWindow: LayeredWindow, transparent: boolean): void {
        // UI 뷰의 마우스 이벤트 투과 설정
        if (transparent) {
            layeredWindow.baseWindow.setIgnoreMouseEvents(true, { forward: true })
        } else {
            layeredWindow.baseWindow.setIgnoreMouseEvents(false)
        }

        this.logger.info(`🖱️ GIGA-CHAD: UI mouse transparency set`, { transparent })
    }

    /**
     * GIGA-CHAD: 호버 시스템 구현 - UI 표시/숨김
     */
    static enableHoverSystem(layeredWindow: LayeredWindow): void {
        let hoverTimeout: NodeJS.Timeout | null = null
        let isUIVisible = true

        const showUI = () => {
            if (!isUIVisible) {
                // UI 배경색을 원래대로 복원 (투명하게)
                if (is.dev) {
                    (layeredWindow.uiView as any).setBackgroundColor('rgba(255, 0, 0, 0.3)')
                } else {
                    (layeredWindow.uiView as any).setBackgroundColor('transparent')
                }
                isUIVisible = true
                this.logger.info('👁️ GIGA-CHAD: UI shown on hover')
            }
        }

        const hideUI = () => {
            if (isUIVisible) {
                // UI를 완전히 투명하게 (마우스 이벤트는 통과)
                (layeredWindow.uiView as any).setBackgroundColor('transparent')
                this.setUIMouseTransparency(layeredWindow, true)
                isUIVisible = false
                this.logger.info('🫥 GIGA-CHAD: UI hidden on leave')
            }
        }

        // 마우스 진입 감지 - uiView의 WebContents 이벤트 사용
        layeredWindow.uiView.webContents.on('cursor-changed', () => {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout)
                hoverTimeout = null
            }
            showUI()
            this.setUIMouseTransparency(layeredWindow, false)
        })

        // 윈도우 포커스 이탈 시 UI 숨김
        layeredWindow.baseWindow.on('blur', () => {
            hoverTimeout = setTimeout(() => {
                hideUI()
            }, 1000) // 1초 후 숨김
        })

        // 윈도우 포커스 시 UI 표시
        layeredWindow.baseWindow.on('focus', () => {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout)
                hoverTimeout = null
            }
            showUI()
            this.setUIMouseTransparency(layeredWindow, false)
        })

        // 초기 상태: UI 표시
        showUI()

        this.logger.info('🖱️ GIGA-CHAD: Hover system enabled')
    }

    /**
     * 윈도우 가져오기
     */
    static getWindow(id: number): LayeredWindow | undefined {
        return this.windows.get(id)
    }

    /**
     * 모든 윈도우 가져오기
     */
    static getAllWindows(): LayeredWindow[] {
        return Array.from(this.windows.values())
    }
}