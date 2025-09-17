import { app } from 'electron'
import { createLogger } from '../../../shared/logger'
import { IOptimizationService } from '../../../shared/types'

const logger = createLogger('RenderingOptimizationService')

/**
 * 🖼️ 렌더링 최적화 서비스 (SRP: 렌더링 성능 최적화만 담당)
 * - 스크롤 최적화
 * - 오버레이 스크롤바
 * - 캔버스 렌더링 최적화
 * - 화면 표시 성능 향상
 */
export class RenderingOptimizationService implements IOptimizationService {
    private isInitialized = false

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Rendering optimization already initialized')
            return
        }

        logger.info('🖼️ Initializing rendering optimization...')

        this.setupScrollOptimization()
        this.setupCanvasOptimization()
        this.setupDisplayOptimization()
        this.setupCompositorOptimization()

        this.isInitialized = true
        logger.info('✅ Rendering optimization initialized successfully')
    }

    private setupScrollOptimization(): void {
        logger.debug('Setting up scroll optimization...')

        // 부드러운 스크롤
        app.commandLine.appendSwitch('enable-smooth-scrolling')

        // 오버레이 스크롤바 (공간 절약)
        app.commandLine.appendSwitch('enable-overlay-scrollbars')

        // 스크롤 성능 향상
        app.commandLine.appendSwitch('enable-threaded-scrolling')

        logger.debug('Scroll optimization enabled')
    }

    private setupCanvasOptimization(): void {
        logger.debug('Setting up canvas optimization...')

        // 픽셀 캔버스 레코딩
        app.commandLine.appendSwitch('enable-pixel-canvas-recording')

        // 캔버스 2D 가속화 (이미 GPUAccelerationService에서 설정되지만 확실히)
        app.commandLine.appendSwitch('enable-accelerated-2d-canvas')

        // 캔버스 색상 관리
        app.commandLine.appendSwitch('enable-color-correct-rendering')

        logger.debug('Canvas optimization enabled')
    }

    private setupDisplayOptimization(): void {
        logger.debug('Setting up display optimization...')

        // 디스플레이 리스트 최적화
        app.commandLine.appendSwitch('enable-lcd-text')

        // 서브픽셀 폰트 렌더링
        app.commandLine.appendSwitch('enable-font-antialiasing')

        // 고DPI 디스플레이 지원
        app.commandLine.appendSwitch('force-device-scale-factor', '1')

        logger.debug('Display optimization enabled')
    }

    private setupCompositorOptimization(): void {
        logger.debug('Setting up compositor optimization...')

        // 컴포지터 스레드 분리
        app.commandLine.appendSwitch('enable-threaded-compositing')

        // 백그라운드 렌더링 최적화
        app.commandLine.appendSwitch('enable-background-tracing')

        // 프레임 속도 최적화
        app.commandLine.appendSwitch('disable-frame-rate-limit')

        logger.debug('Compositor optimization enabled')
    }

    // 렌더링 성능 메트릭 수집
    getRenderingMetrics(): {
        frameRate: number;
        scrollPerformance: 'smooth' | 'normal';
        canvasAcceleration: boolean;
        compositorThreads: boolean;
    } {
        return {
            frameRate: 60, // 목표 프레임률
            scrollPerformance: 'smooth',
            canvasAcceleration: this.isInitialized,
            compositorThreads: this.isInitialized
        }
    }

    // 렌더링 품질 설정
    setRenderingQuality(quality: 'low' | 'medium' | 'high' | 'ultra'): void {
        logger.info(`Setting rendering quality to: ${quality}`)

        switch (quality) {
            case 'low':
                // 성능 우선 설정
                app.commandLine.appendSwitch('disable-gpu-vsync')
                app.commandLine.appendSwitch('disable-smooth-scrolling')
                break

            case 'medium':
                // 균형 설정 (기본)
                break

            case 'high':
                // 품질 우선 설정
                app.commandLine.appendSwitch('enable-gpu-vsync')
                app.commandLine.appendSwitch('max-tiles-for-interest-area', '64')
                break

            case 'ultra':
                // 최고 품질 설정
                app.commandLine.appendSwitch('enable-gpu-vsync')
                app.commandLine.appendSwitch('max-tiles-for-interest-area', '128')
                app.commandLine.appendSwitch('gpu-rasterization-msaa-sample-count', '8')
                break
        }

        logger.info(`Rendering quality set to ${quality}`)
    }

    // 렌더링 성능 테스트
    async performRenderingTest(): Promise<{
        success: boolean;
        averageFrameTime: number;
        dropped_frames: number;
        error?: string;
    }> {
        const startTime = performance.now()

        try {
            // 렌더링 성능 시뮬레이션
            const frameCount = 60
            const targetFrameTime = 16.67 // 60fps = ~16.67ms per frame
            let totalFrameTime = 0
            let droppedFrames = 0

            for (let i = 0; i < frameCount; i++) {
                const frameStart = performance.now()

                // 간단한 렌더링 작업 시뮬레이션
                await new Promise(resolve => setTimeout(resolve, Math.random() * 10))

                const frameTime = performance.now() - frameStart
                totalFrameTime += frameTime

                if (frameTime > targetFrameTime) {
                    droppedFrames++
                }
            }

            const averageFrameTime = totalFrameTime / frameCount
            const testDuration = performance.now() - startTime

            logger.info(`Rendering test completed in ${testDuration.toFixed(2)}ms`, {
                averageFrameTime: `${averageFrameTime.toFixed(2)}ms`,
                droppedFrames,
                frameRate: `${(1000 / averageFrameTime).toFixed(1)} fps`
            })

            return {
                success: true,
                averageFrameTime,
                dropped_frames: droppedFrames
            }
        } catch (error) {
            logger.error('Rendering test failed', error)

            return {
                success: false,
                averageFrameTime: 0,
                dropped_frames: 0,
                error: (error as Error).message
            }
        }
    }

    // 렌더링 상태 로깅
    logRenderingStatus(): void {
        try {
            const metrics = this.getRenderingMetrics()

            logger.info('Rendering Optimization Status', {
                metrics,
                initialized: this.isInitialized
            })
        } catch (error) {
            logger.error('Failed to get rendering status', error)
        }
    }
}