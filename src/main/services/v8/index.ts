/**
 * ⚡ V8 Engine Optimization Services - Index (SRP + SOLID 적용)
 * 
 * V8 엔진 최적화를 위한 모든 서비스들을 중앙에서 export
 * - MemoryOptimizationService: 메모리 관리 및 압축
 * - JITOptimizationService: JIT 컴파일러 최적화
 * - GarbageCollectionService: 가비지 컬렉션 최적화
 * - ConcurrencyOptimizationService: 동시성 및 병렬 처리
 */

// 개별 V8 서비스들 export
export { MemoryOptimizationService } from './MemoryOptimizationService';
export { JITOptimizationService } from './JITOptimizationService';
export { GarbageCollectionService } from './GarbageCollectionService';
export { ConcurrencyOptimizationService } from './ConcurrencyOptimizationService';

// 타입들 re-export
export type {
    IOptimizationService,
    MemoryStats,
    PerformanceSnapshot
} from '../../../shared/types';

// 통합 V8 최적화 관리자
import { createLogger } from '../../../shared/logger';
import { IOptimizationService } from '../../../shared/types';
import { MemoryOptimizationService } from './MemoryOptimizationService';
import { JITOptimizationService } from './JITOptimizationService';
import { GarbageCollectionService } from './GarbageCollectionService';
import { ConcurrencyOptimizationService } from './ConcurrencyOptimizationService';

const logger = createLogger('V8OptimizationManager');

/**
 * 🎯 V8 통합 최적화 관리자
 * 모든 V8 서비스들을 조합하여 통합 관리
 */
export class V8OptimizationService implements IOptimizationService {
    private isInitialized = false;
    private memoryService: MemoryOptimizationService;
    private jitService: JITOptimizationService;
    private gcService: GarbageCollectionService;
    private concurrencyService: ConcurrencyOptimizationService;

    constructor() {
        this.memoryService = new MemoryOptimizationService();
        this.jitService = new JITOptimizationService();
        this.gcService = new GarbageCollectionService();
        this.concurrencyService = new ConcurrencyOptimizationService();
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('V8 optimization already initialized');
            return;
        }

        logger.info('⚡ Initializing V8 engine optimization...');

        try {
            // 순차적으로 초기화 (의존성 고려)
            await this.memoryService.initialize();
            await this.jitService.initialize();
            await this.gcService.initialize();
            await this.concurrencyService.initialize();

            // 개발 모드에서 성능 모니터링 활성화
            this.jitService.enablePerformanceMonitoring();

            // GC 임계값 설정 (80%)
            this.gcService.setGCThreshold(80);

            this.isInitialized = true;
            logger.info('✅ V8 optimization initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize V8 optimization', error);
            throw error;
        }
    }

    // 통합 메모리 통계
    logMemoryStats(): void {
        this.memoryService.logMemoryStats();
    }

    // 강제 가비지 컬렉션
    forceGC(): void {
        const result = this.gcService.forceGarbageCollection();
        if (result.success) {
            logger.info(`Garbage collection freed ${(result.beforeMB - result.afterMB).toFixed(2)} MB`);
        }
    }

    // V8 전체 상태 가져오기
    async getV8Status() {
        if (!this.isInitialized) {
            return { initialized: false };
        }

        try {
            const [memoryPressure, jitStatus, gcStats, concurrencyStatus, cpuUsage] = await Promise.all([
                this.memoryService.checkMemoryPressure(),
                this.jitService.getJITStatus(),
                this.gcService.getGCStats(),
                this.concurrencyService.getConcurrencyStatus(),
                this.concurrencyService.getCPUUsage()
            ]);

            return {
                initialized: true,
                memory: {
                    pressure: memoryPressure,
                    heapUsed: gcStats.heapUsed,
                    heapTotal: gcStats.heapTotal
                },
                jit: jitStatus,
                gc: { ...gcStats },
                concurrency: concurrencyStatus,
                cpu: cpuUsage
            };
        } catch (error) {
            logger.error('Failed to get V8 status', error);
            return { initialized: true, error: (error as Error).message };
        }
    }
}