import { Application } from './core/Application'
import { WindowManager } from './managers/WindowManager'
import { WebContentsService } from './services/webcontents'
import { GPUOptimizationService } from './services/gpu'
import { V8OptimizationService } from './services/v8'
import { NetworkOptimizationService } from './services/network'
import { SEOOptimizationService } from './services/seo'
import { PerformanceDashboard } from './services/performance'
import { ResizeHandler } from './handlers/ResizeHandler'
import { createLogger } from '../shared/logger'

const logger = createLogger('Main')

async function main(): Promise<void> {
    try {
        logger.info('Starting SEO Browser with all optimizations...')

        // 1. 최적화 서비스들 먼저 초기화
        const gpuOptimization = new GPUOptimizationService()
        await gpuOptimization.initialize()

        const v8Optimization = new V8OptimizationService()
        await v8Optimization.initialize()

        const seoOptimization = new SEOOptimizationService()
        await seoOptimization.initialize()

        // 성능 대시보드 초기화
        const performanceDashboard = new PerformanceDashboard()
        await performanceDashboard.initialize()

        // 2. 애플리케이션 초기화
        const app = new Application()
        await app.initialize()

        // 2.1. 앱 준비 후 네트워크 최적화 (중요!)
        const networkOptimization = new NetworkOptimizationService()
        await networkOptimization.initialize()

        // 3. 핵심 서비스들 초기화
        const windowManager = new WindowManager()
        const webContentsService = new WebContentsService()
        await webContentsService.initialize()
        const resizeHandler = new ResizeHandler()

        // 4. 보안 강화된 브라우저 창 생성 (frame: true, ready-to-show: false 자동 적용)
        const mainWindow = windowManager.createSecureWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            title: 'Giga Browser - Ultra Low Memory'
        })

        // 5. WebContentsView 생성 (통합 보안 및 이벤트 처리)
        const webView = webContentsService.createWebView(mainWindow, {
            x: 0, y: 0,
            width: 1200,
            height: 800
        })

        // 6. 동적 리사이징 설정
        resizeHandler.setupAutoResize(mainWindow, webView, 0)

        // 7. 네트워크 성능 모니터링 설정
        networkOptimization.setupPerformanceMonitoring()

        // 8. 초기 페이지 로딩
        try {
            await webContentsService.loadUrl(webView, 'https://www.google.com')

            // SEO 분석 실행
            webView.webContents.on('did-finish-load', async () => {
                setTimeout(async () => {
                    try {
                        const seoReport = await seoOptimization.analyzePage(webView, webView.webContents.getURL())
                        if (seoReport) {
                            logger.info(`SEO Score: ${seoReport.seoScore}/100`)
                        }
                    } catch (error) {
                        logger.error(`SEO analysis failed: ${error}`)
                    }
                }, 2000)
            })
        } catch (error) {
            logger.error(`Failed to load initial page: ${error}`)
            await webContentsService.loadUrl(webView, 'about:blank')
        }

        // 9. 창 표시
        mainWindow.show()

        // 10. 개발용 상태 로깅 및 성능 모니터링
        if (process.env.NODE_ENV === 'development') {
            gpuOptimization.logGPUStatus()
            v8Optimization.logMemoryStats()

            // 성능 스냅샷 출력
            const perfSnapshot = performanceDashboard.getCurrentPerformanceSnapshot()
            logger.info('📊 Initial performance snapshot', perfSnapshot)

            // 5초마다 메모리 상태 로깅
            setInterval(() => {
                v8Optimization.logMemoryStats()
            }, 5000)
        }

        logger.info('SEO Browser started successfully!')

    } catch (error) {
        logger.error(`Failed to start SEO Browser: ${error}`)
        process.exit(1)
    }
}

main().catch((error) => {
    logger.error(`Unhandled error: ${error}`)
    process.exit(1)
})
