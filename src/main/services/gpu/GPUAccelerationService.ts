import { app } from 'electron'
import { createLogger } from '../../../shared/logger'
import { IOptimizationService } from '../../../shared/types'

const logger = createLogger('GPUAccelerationService')

/**
 * ⚡ GPU 가속화 서비스 (SRP: 기본 GPU 가속화만 담당)
 * - 핵심 GPU 가속화 활성화
 * - GPU 컴포지팅 최적화
 * - 고성능 GPU 사용 강제
 * - GPU 샌드박스 관리
 */
export class GPUAccelerationService implements IOptimizationService {
    private isInitialized = false

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('GPU acceleration already initialized')
            return
        }

        logger.info('⚡ Initializing GPU acceleration...')

        this.setupCoreAcceleration()
        this.setupGPUCompositing()
        this.setupHighPerformanceMode()
        this.manageSandbox()

        this.isInitialized = true
        logger.info('✅ GPU acceleration initialized successfully')
    }

    private setupCoreAcceleration(): void {
        logger.debug('Setting up core GPU acceleration...')

        // 핵심 GPU 가속화
        app.commandLine.appendSwitch('enable-gpu-acceleration')
        app.commandLine.appendSwitch('enable-gpu-rasterization')
        app.commandLine.appendSwitch('enable-zero-copy')

        logger.debug('Core GPU acceleration enabled')
    }

    private setupGPUCompositing(): void {
        logger.debug('Setting up GPU compositing...')

        // GPU 컴포지팅
        app.commandLine.appendSwitch('enable-gpu-compositing')
        app.commandLine.appendSwitch('enable-accelerated-2d-canvas')

        logger.debug('GPU compositing enabled')
    }

    private setupHighPerformanceMode(): void {
        logger.debug('Setting up high performance GPU mode...')

        // 고성능 GPU 사용 강제
        app.commandLine.appendSwitch('force-high-performance-gpu-switching')

        logger.debug('High performance GPU mode enabled')
    }

    private manageSandbox(): void {
        // 개발 환경에서는 GPU 샌드박스 비활성화 (성능 향상)
        if (process.env.NODE_ENV === 'development') {
            logger.debug('Disabling GPU sandbox for development...')
            app.commandLine.appendSwitch('disable-gpu-sandbox')
            logger.debug('GPU sandbox disabled for development')
        } else {
            logger.debug('GPU sandbox enabled for production')
        }
    }

    // GPU 상태 확인
    getGPUInfo(): Electron.GPUFeatureStatus {
        return app.getGPUFeatureStatus()
    }

    // GPU 가속화 상태 체크
    getAccelerationStatus(): {
        coreAcceleration: boolean;
        compositing: boolean;
        highPerformance: boolean;
        sandboxDisabled: boolean;
    } {
        const gpuInfo = this.getGPUInfo()

        return {
            coreAcceleration: typeof gpuInfo.gpu_compositing === 'string' && gpuInfo.gpu_compositing.includes('enabled'),
            compositing: typeof gpuInfo.gpu_compositing === 'string' && gpuInfo.gpu_compositing.includes('enabled'),
            highPerformance: this.isInitialized,
            sandboxDisabled: process.env.NODE_ENV === 'development'
        }
    }

    // GPU 정보 로깅
    logGPUStatus(): void {
        try {
            const gpuInfo = this.getGPUInfo()
            const status = this.getAccelerationStatus()

            logger.info('GPU Acceleration Status', {
                coreAcceleration: status.coreAcceleration,
                compositing: status.compositing,
                highPerformance: status.highPerformance,
                sandboxDisabled: status.sandboxDisabled,
                gpuFeatures: gpuInfo
            })
        } catch (error) {
            logger.error('Failed to get GPU acceleration status', error)
        }
    }
}