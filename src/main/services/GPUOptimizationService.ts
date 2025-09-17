import { app } from 'electron'
import { createLogger } from '../../shared/logger'

const logger = createLogger('GPUOptimizationService')

/**
 * 🎨 GPU 가속화 최적화 서비스
 * 하드웨어 가속, 비디오 디코딩, WebGL 최적화
 */
export class GPUOptimizationService {
    private isInitialized = false

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('GPU optimization already initialized')
            return
        }

        logger.info('🎨 Initializing GPU acceleration...')

        // GPU 가속화 Chromium 플래그들
        this.setupGPUAcceleration()
        this.setupVideoAcceleration()
        this.setupRenderingOptimization()
        this.setupWebGLOptimization()

        this.isInitialized = true
        logger.info('🎨 GPU acceleration initialized successfully')
    }

    private setupGPUAcceleration(): void {
        logger.info('Setting up GPU acceleration flags...')

        // 핵심 GPU 가속화
        app.commandLine.appendSwitch('enable-gpu-acceleration')
        app.commandLine.appendSwitch('enable-gpu-rasterization')
        app.commandLine.appendSwitch('enable-zero-copy')

        // GPU 컴포지팅
        app.commandLine.appendSwitch('enable-gpu-compositing')
        app.commandLine.appendSwitch('enable-accelerated-2d-canvas')

        // 고성능 GPU 사용 강제
        app.commandLine.appendSwitch('force-high-performance-gpu-switching')

        // 개발 환경에서는 GPU 샌드박스 비활성화 (성능 향상)
        if (process.env.NODE_ENV === 'development') {
            app.commandLine.appendSwitch('disable-gpu-sandbox')
        }
    }

    private setupVideoAcceleration(): void {
        logger.info('Setting up video acceleration...')

        // 하드웨어 비디오 디코딩
        app.commandLine.appendSwitch('enable-accelerated-video-decode')
        app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode')
        app.commandLine.appendSwitch('enable-hardware-overlays')

        // 비디오 최적화
        app.commandLine.appendSwitch('enable-accelerated-video-encode')
        app.commandLine.appendSwitch('disable-background-media-suspend')
    }

    private setupRenderingOptimization(): void {
        logger.info('Setting up rendering optimization...')

        // 렌더링 최적화
        app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder')
        app.commandLine.appendSwitch('disable-features', 'UseChromeOSDirectVideoDecoder')

        // 스크롤 최적화
        app.commandLine.appendSwitch('enable-smooth-scrolling')
        app.commandLine.appendSwitch('enable-overlay-scrollbars')

        // 픽셀 캔버스 레코딩 사용
        app.commandLine.appendSwitch('enable-pixel-canvas-recording')
    }

    private setupWebGLOptimization(): void {
        logger.info('Setting up WebGL optimization...')

        // WebGL 최적화
        app.commandLine.appendSwitch('enable-webgl2-compute-context')
        app.commandLine.appendSwitch('enable-accelerated-webgl2')

        // GPU 메모리 최적화 (4GB)
        app.commandLine.appendSwitch('force-gpu-mem-available-mb', '4096')

        // GPU 프로세스 최적화
        app.commandLine.appendSwitch('max_old_space_size', '8192')
    }

    // GPU 상태 확인
    getGPUInfo(): Electron.GPUFeatureStatus {
        return app.getGPUFeatureStatus()
    }

    // GPU 메모리 정보 (개발용)
    logGPUStatus(): void {
        try {
            const gpuInfo = this.getGPUInfo()
            logger.info(`GPU Status: ${JSON.stringify(gpuInfo, null, 2)}`)
        } catch (error) {
            logger.error(`Failed to get GPU info: ${error}`)
        }
    }
}