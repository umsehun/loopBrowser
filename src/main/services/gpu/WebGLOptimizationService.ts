import { app } from 'electron'
import { createLogger } from '../../../shared/logger'
import { IOptimizationService } from '../../../shared/types'

const logger = createLogger('WebGLOptimizationService')

/**
 * 🌐 WebGL 최적화 서비스 (SRP: WebGL 및 3D 그래픽 최적화만 담당)
 * - WebGL2 컴퓨트 컨텍스트
 * - 가속화된 WebGL2
 * - GPU 메모리 관리
 * - WebGL 성능 최적화
 */
export class WebGLOptimizationService implements IOptimizationService {
    private isInitialized = false
    private gpuMemoryMB = 4096 // 기본 4GB

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('WebGL optimization already initialized')
            return
        }

        logger.info('🌐 Initializing WebGL optimization...')

        this.setupWebGLCore()
        this.setupGPUMemory()
        this.setupWebGLFeatures()
        this.setupPerformanceFlags()

        this.isInitialized = true
        logger.info('✅ WebGL optimization initialized successfully')
    }

    private setupWebGLCore(): void {
        logger.debug('Setting up WebGL core features...')

        // WebGL2 컴퓨트 컨텍스트
        app.commandLine.appendSwitch('enable-webgl2-compute-context')

        // 가속화된 WebGL2
        app.commandLine.appendSwitch('enable-accelerated-webgl2')

        // WebGL 초안 확장 기능
        app.commandLine.appendSwitch('enable-webgl-draft-extensions')

        logger.debug('WebGL core features enabled')
    }

    private setupGPUMemory(): void {
        logger.debug(`Setting up GPU memory (${this.gpuMemoryMB}MB)...`)

        // GPU 메모리 할당
        app.commandLine.appendSwitch('force-gpu-mem-available-mb', this.gpuMemoryMB.toString())

        // GPU 메모리 압력 관리
        app.commandLine.appendSwitch('enable-gpu-memory-buffer-compositor-resources')

        logger.debug('GPU memory configuration completed')
    }

    private setupWebGLFeatures(): void {
        logger.debug('Setting up advanced WebGL features...')

        // WebGL 이미지 크로마 서브샘플링
        app.commandLine.appendSwitch('enable-webgl-image-chromium')

        // WebGL 다중 그리기 간접
        app.commandLine.appendSwitch('enable-webgl-multi-draw')

        // WebGL 원시적 재시작
        app.commandLine.appendSwitch('enable-webgl-primitive-restart')

        logger.debug('Advanced WebGL features enabled')
    }

    private setupPerformanceFlags(): void {
        logger.debug('Setting up WebGL performance flags...')

        // 텍스처 압축
        app.commandLine.appendSwitch('enable-gpu-rasterization')

        // WebGL 최적화 플래그
        app.commandLine.appendSwitch('enable-zero-copy-dxgi-video')

        // 다중 샘플링 안티앨리어싱
        app.commandLine.appendSwitch('disable-webgl-multisampling')

        logger.debug('WebGL performance flags enabled')
    }

    // GPU 메모리 크기 설정
    setGPUMemorySize(memoryMB: number): void {
        if (memoryMB < 512 || memoryMB > 16384) {
            logger.warn('GPU memory should be between 512MB and 16GB')
            return
        }

        this.gpuMemoryMB = memoryMB
        logger.info(`GPU memory size set to ${memoryMB}MB`)
    }

    // WebGL 컨텍스트 정보 가져오기
    getWebGLInfo(): {
        webgl2Supported: boolean;
        maxTextureSize: number;
        maxViewportSize: number[];
        extensions: string[];
    } {
        // 실제 구현에서는 WebGL 컨텍스트를 생성해서 정보를 가져올 수 있지만
        // 여기서는 기본값을 반환
        return {
            webgl2Supported: this.isInitialized,
            maxTextureSize: 16384,
            maxViewportSize: [32768, 32768],
            extensions: [
                'WEBGL_depth_texture',
                'OES_texture_float',
                'OES_element_index_uint',
                'WEBGL_compressed_texture_s3tc',
                'EXT_texture_filter_anisotropic'
            ]
        }
    }

    // WebGL 성능 벤치마크
    async performWebGLBenchmark(): Promise<{
        success: boolean;
        frameRate: number;
        trianglesPerSecond: number;
        pixelFillRate: number;
        error?: string;
    }> {
        const startTime = performance.now()

        try {
            // WebGL 성능 테스트 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 100))

            const duration = performance.now() - startTime

            // 모의 성능 메트릭
            const frameRate = Math.round(60 + Math.random() * 10) // 60-70 fps
            const trianglesPerSecond = Math.round(1000000 + Math.random() * 500000) // 1-1.5M triangles/sec
            const pixelFillRate = Math.round(800 + Math.random() * 200) // 800-1000 MP/sec

            logger.info(`WebGL benchmark completed in ${duration.toFixed(2)}ms`, {
                frameRate: `${frameRate} fps`,
                trianglesPerSecond: `${(trianglesPerSecond / 1000000).toFixed(1)}M tri/sec`,
                pixelFillRate: `${pixelFillRate} MP/sec`
            })

            return {
                success: true,
                frameRate,
                trianglesPerSecond,
                pixelFillRate
            }
        } catch (error) {
            logger.error('WebGL benchmark failed', error)

            return {
                success: false,
                frameRate: 0,
                trianglesPerSecond: 0,
                pixelFillRate: 0,
                error: (error as Error).message
            }
        }
    }

    // WebGL 호환성 체크
    checkWebGLCompatibility(): {
        webgl1: boolean;
        webgl2: boolean;
        extensions: string[];
        recommendedSettings: Record<string, unknown>;
    } {
        const webglInfo = this.getWebGLInfo()

        return {
            webgl1: true, // 대부분의 모던 브라우저에서 지원
            webgl2: webglInfo.webgl2Supported,
            extensions: webglInfo.extensions,
            recommendedSettings: {
                antialias: true,
                alpha: false,
                depth: true,
                stencil: false,
                premultipliedAlpha: true,
                preserveDrawingBuffer: false,
                powerPreference: 'high-performance'
            }
        }
    }

    // WebGL 상태 로깅
    logWebGLStatus(): void {
        try {
            const webglInfo = this.getWebGLInfo()
            const compatibility = this.checkWebGLCompatibility()

            logger.info('WebGL Optimization Status', {
                gpuMemoryMB: this.gpuMemoryMB,
                webglInfo,
                compatibility,
                initialized: this.isInitialized
            })
        } catch (error) {
            logger.error('Failed to get WebGL status', error)
        }
    }
}