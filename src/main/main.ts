/**
 * 🔍 SEO Browser - 메인 진입점
        logger.info('🔍 Starting SEO Browser...')

        // 1. 최적화 서비스들 먼저 초기화 (중요!)
        gpuOptimization = new GPUOptimizationService()
        await gpuOptimization.initialize()

        v8Optimization = new V8OptimizationService()
        await v8Optimization.initialize()

        networkOptimization = new NetworkOptimizationService()
        await networkOptimization.initialize()

        seoOptimization = new SEOOptimizationService()
        await seoOptimization.initialize()

        // 2. 애플리케이션 초기화
        app = new Application()
        await app.initialize()

        // 3. 핵심 서비스들 초기화
        windowManager = new WindowManager()
        webContentsService = new WebContentsService()
        resizeHandler = new ResizeHandler() 연구 및 Electron 공식 문서 기반 아키텍처
 * SRP: 진입점 역할만 담당, 모든 로직은 별도 클래스에 위임
 */

import { Application } from './core/Application'
import { WindowManager } from './managers/WindowManager'
import { WebContentsService } from './services/WebContentsService'
import { GPUOptimizationService } from './services/GPUOptimizationService'
import { V8OptimizationService } from './services/V8OptimizationService'
import { NetworkOptimizationService } from './services/NetworkOptimizationService'
import { SEOOptimizationService } from './services/SEOOptimizationService'
import { ResizeHandler } from './handlers/ResizeHandler'
import { createLogger } from '../shared/logger'

const logger = createLogger('Main')

// 전역 서비스 인스턴스들
let app: Application
let windowManager: WindowManager
let webContentsService: WebContentsService
let gpuOptimization: GPUOptimizationService
let v8Optimization: V8OptimizationService
let networkOptimization: NetworkOptimizationService
let seoOptimization: SEOOptimizationService
let resizeHandler: ResizeHandler

async function main(): Promise<void> {
    try {
        logger.info('� Starting SEO Browser...')

        // 1. 애플리케이션 초기화
        app = new Application()
        await app.initialize()

        // 2. 서비스들 초기화
        windowManager = new WindowManager()
        webContentsService = new WebContentsService()
        resizeHandler = new ResizeHandler()

        // 4. 브라우저 창 생성
        const mainWindow = windowManager.createWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600
        })

        // 5. WebContentsView 생성
        const webView = webContentsService.createWebView(mainWindow, {
            x: 0, y: 0,
            width: 1200,
            height: 800
        })

        // 6. 동적 리사이징 설정
        resizeHandler.setupAutoResize(mainWindow, webView, 0)

        // 7. 초기 페이지 로딩 (안전하게)
        try {
            await webContentsService.loadUrl(webView, 'https://www.google.com')
            
            // 페이지 로딩 후 SEO 분석 실행
            webView.webContents.on('did-finish-load', async () => {
                logger.info('🔍 Page loaded - Starting SEO analysis...')
                
                // SEO 분석 실행
                setTimeout(async () => {
                    try {
                        const seoReport = await seoOptimization.generateSEOReport(webView, webView.webContents.getURL())
                        logger.info(`📊 SEO Analysis Complete - Score: ${seoReport?.seoScore}/100`)
                    } catch (error) {
                        logger.error(`SEO analysis failed: ${error}`)
                    }
                }, 2000) // 2초 후 분석 시작
            })
        } catch (error) {
            logger.error(`Failed to load initial page: ${error}`)
            // 폴백: 빈 페이지
            await webContentsService.loadUrl(webView, 'about:blank')
        }

        // 8. 성능 모니터링 설정
        networkOptimization.setupPerformanceMonitoring()

        // 9. 창 표시
        mainWindow.show()

        // 10. GPU 상태 로깅 (개발용)
        if (process.env.NODE_ENV === 'development') {
            gpuOptimization.logGPUStatus()
            v8Optimization.logMemoryStats()
        }

        logger.info('✅ SEO Browser started successfully!')

    } catch (error) {
        logger.error(`💥 Failed to start browser: ${error}`)
        process.exit(1)
    }
}

// 앱 시작
main().catch((error) => {
    logger.error(`💥 Unhandled error: ${error}`)
    process.exit(1)
})