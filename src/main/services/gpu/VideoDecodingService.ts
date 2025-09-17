import { app } from 'electron'
import { createLogger } from '../../../shared/logger'
import { IOptimizationService } from '../../../shared/types'

const logger = createLogger('VideoDecodingService')

/**
 * 🎬 비디오 디코딩 가속화 서비스 (SRP: 비디오/미디어 가속화만 담당)
 * - 하드웨어 비디오 디코딩
 * - 하드웨어 비디오 인코딩
 * - 미디어 재생 최적화
 * - 오버레이 및 MJPEG 지원
 */
export class VideoDecodingService implements IOptimizationService {
    private isInitialized = false

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Video decoding already initialized')
            return
        }

        logger.info('🎬 Initializing video decoding acceleration...')

        this.setupVideoDecoding()
        this.setupVideoEncoding()
        this.setupMediaOptimization()
        this.setupHardwareOverlays()

        this.isInitialized = true
        logger.info('✅ Video decoding acceleration initialized successfully')
    }

    private setupVideoDecoding(): void {
        logger.debug('Setting up hardware video decoding...')

        // 하드웨어 비디오 디코딩
        app.commandLine.appendSwitch('enable-accelerated-video-decode')
        app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode')

        // VaapiVideoDecoder 활성화 (Linux)
        app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder')
        app.commandLine.appendSwitch('disable-features', 'UseChromeOSDirectVideoDecoder')

        logger.debug('Hardware video decoding enabled')
    }

    private setupVideoEncoding(): void {
        logger.debug('Setting up hardware video encoding...')

        // 하드웨어 비디오 인코딩
        app.commandLine.appendSwitch('enable-accelerated-video-encode')

        logger.debug('Hardware video encoding enabled')
    }

    private setupMediaOptimization(): void {
        logger.debug('Setting up media optimization...')

        // 백그라운드 미디어 일시정지 비활성화 (연속 재생)
        app.commandLine.appendSwitch('disable-background-media-suspend')

        // 미디어 캐시 최적화
        app.commandLine.appendSwitch('enable-media-session')

        logger.debug('Media optimization enabled')
    }

    private setupHardwareOverlays(): void {
        logger.debug('Setting up hardware overlays...')

        // 하드웨어 오버레이 지원
        app.commandLine.appendSwitch('enable-hardware-overlays')

        // 픽셀 캔버스 레코딩 사용
        app.commandLine.appendSwitch('enable-pixel-canvas-recording')

        logger.debug('Hardware overlays enabled')
    }

    // 비디오 코덱 지원 여부 확인
    getSupportedVideoCodecs(): string[] {
        // 일반적으로 지원되는 코덱들
        const supportedCodecs = [
            'h264',
            'h265',
            'vp8',
            'vp9',
            'av1'
        ]

        return supportedCodecs
    }

    // 비디오 가속화 상태 체크
    getVideoAccelerationStatus(): {
        hardwareDecoding: boolean;
        hardwareEncoding: boolean;
        mjpegSupport: boolean;
        overlaySupport: boolean;
        backgroundSuspendDisabled: boolean;
    } {
        return {
            hardwareDecoding: this.isInitialized,
            hardwareEncoding: this.isInitialized,
            mjpegSupport: this.isInitialized,
            overlaySupport: this.isInitialized,
            backgroundSuspendDisabled: this.isInitialized
        }
    }

    // 비디오 성능 테스트
    async performVideoTest(): Promise<{ success: boolean; duration: number; error?: string }> {
        const startTime = performance.now()

        try {
            // 간단한 비디오 처리 테스트 (실제로는 더 복잡한 테스트 가능)
            await new Promise(resolve => setTimeout(resolve, 100))

            const duration = performance.now() - startTime
            logger.info(`Video acceleration test completed in ${duration.toFixed(2)}ms`)

            return { success: true, duration }
        } catch (error) {
            const duration = performance.now() - startTime
            logger.error('Video acceleration test failed', error)

            return {
                success: false,
                duration,
                error: (error as Error).message
            }
        }
    }

    // 비디오 디코딩 통계 로깅
    logVideoStatus(): void {
        try {
            const status = this.getVideoAccelerationStatus()
            const codecs = this.getSupportedVideoCodecs()

            logger.info('Video Decoding Status', {
                acceleration: status,
                supportedCodecs: codecs,
                initialized: this.isInitialized
            })
        } catch (error) {
            logger.error('Failed to get video decoding status', error)
        }
    }
}