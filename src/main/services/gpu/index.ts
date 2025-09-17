/**
 * 🎨 GPU Optimization Services - Index (SRP + SOLID 적용)
 * 
 * GPU 최적화를 위한 모든 서비스들을 중앙에서 export
 * - GPUAccelerationService: 기본 GPU 가속화
 * - VideoDecodingService: 비디오/미디어 가속화
 * - RenderingOptimizationService: 렌더링 성능 최적화
 * - WebGLOptimizationService: WebGL 및 3D 그래픽 최적화
 */

// 개별 GPU 서비스들 export
export { GPUAccelerationService } from './GPUAccelerationService';
export { VideoDecodingService } from './VideoDecodingService';
export { RenderingOptimizationService } from './RenderingOptimizationService';
export { WebGLOptimizationService } from './WebGLOptimizationService';

// 타입들 re-export
export type {
    IOptimizationService,
    GPUInfo
} from '../../../shared/types';

// 통합 GPU 최적화 관리자
import { createLogger } from '../../../shared/logger';
import { IOptimizationService } from '../../../shared/types';
import { GPUAccelerationService } from './GPUAccelerationService';
import { VideoDecodingService } from './VideoDecodingService';
import { RenderingOptimizationService } from './RenderingOptimizationService';
import { WebGLOptimizationService } from './WebGLOptimizationService';

const logger = createLogger('GPUOptimizationManager');

/**
 * 🎯 GPU 통합 최적화 관리자
 * 모든 GPU 서비스들을 조합하여 통합 관리
 */
export class GPUOptimizationService implements IOptimizationService {
    private isInitialized = false;
    private accelerationService: GPUAccelerationService;
    private videoService: VideoDecodingService;
    private renderingService: RenderingOptimizationService;
    private webglService: WebGLOptimizationService;

    constructor() {
        this.accelerationService = new GPUAccelerationService();
        this.videoService = new VideoDecodingService();
        this.renderingService = new RenderingOptimizationService();
        this.webglService = new WebGLOptimizationService();
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('GPU optimization already initialized');
            return;
        }

        logger.info('🎨 Initializing GPU acceleration...');

        try {
            // 순차적으로 초기화 (의존성 고려)
            await this.accelerationService.initialize();
            await this.videoService.initialize();
            await this.renderingService.initialize();
            await this.webglService.initialize();

            // 렌더링 품질을 높음으로 설정
            this.renderingService.setRenderingQuality('high');

            // WebGL GPU 메모리 최적화 (8GB)
            this.webglService.setGPUMemorySize(8192);

            this.isInitialized = true;
            logger.info('✅ GPU acceleration initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize GPU optimization', error);
            throw error;
        }
    }

    // GPU 상태 로깅
    logGPUStatus(): void {
        this.accelerationService.logGPUStatus();
        this.videoService.logVideoStatus();
        this.renderingService.logRenderingStatus();
        this.webglService.logWebGLStatus();
    }

    // GPU 전체 상태 가져오기
    async getGPUStatus() {
        if (!this.isInitialized) {
            return { initialized: false };
        }

        try {
            const [accelerationStatus, videoStatus, renderingMetrics, webglInfo] = await Promise.all([
                this.accelerationService.getAccelerationStatus(),
                this.videoService.getVideoAccelerationStatus(),
                this.renderingService.getRenderingMetrics(),
                this.webglService.getWebGLInfo()
            ]);

            return {
                initialized: true,
                acceleration: accelerationStatus,
                video: videoStatus,
                rendering: renderingMetrics,
                webgl: webglInfo
            };
        } catch (error) {
            logger.error('Failed to get GPU status', error);
            return { initialized: true, error: (error as Error).message };
        }
    }

    // GPU 성능 벤치마크 실행
    async runGPUBenchmark() {
        if (!this.isInitialized) {
            logger.warn('GPU optimization not initialized');
            return { error: 'Not initialized' };
        }

        try {
            logger.info('Starting comprehensive GPU benchmark...');

            const [videoTest, renderingTest, webglBenchmark] = await Promise.all([
                this.videoService.performVideoTest(),
                this.renderingService.performRenderingTest(),
                this.webglService.performWebGLBenchmark()
            ]);

            const results = {
                video: videoTest,
                rendering: renderingTest,
                webgl: webglBenchmark,
                overall: {
                    success: videoTest.success && renderingTest.success && webglBenchmark.success,
                    averagePerformance: (
                        (videoTest.success ? 100 : 0) +
                        (renderingTest.success ? 100 : 0) +
                        (webglBenchmark.success ? 100 : 0)
                    ) / 3
                }
            };

            logger.info('GPU benchmark completed', {
                overall: results.overall,
                details: {
                    video: `${videoTest.success ? 'PASS' : 'FAIL'}`,
                    rendering: `${renderingTest.success ? 'PASS' : 'FAIL'}`,
                    webgl: `${webglBenchmark.success ? 'PASS' : 'FAIL'}`
                }
            });

            return results;
        } catch (error) {
            logger.error('GPU benchmark failed', error);
            return { error: (error as Error).message };
        }
    }

    // GPU 최적화 설정 조정
    optimizeForUseCase(useCase: 'gaming' | 'video' | 'productivity' | 'development'): void {
        logger.info(`Optimizing GPU for ${useCase} use case`);

        switch (useCase) {
            case 'gaming':
                this.renderingService.setRenderingQuality('ultra');
                this.webglService.setGPUMemorySize(8192);
                break;

            case 'video':
                this.renderingService.setRenderingQuality('high');
                this.webglService.setGPUMemorySize(6144);
                break;

            case 'productivity':
                this.renderingService.setRenderingQuality('medium');
                this.webglService.setGPUMemorySize(4096);
                break;

            case 'development':
                this.renderingService.setRenderingQuality('high');
                this.webglService.setGPUMemorySize(4096);
                break;
        }

        logger.info(`GPU optimized for ${useCase}`);
    }
}