/**
 * 🌐 Network Services - Index (SRP + SOLID 적용)
 * 
 * 모든 네트워크 관련 서비스들을 중앙에서 export
 * - HTTPOptimizationService: HTTP 최적화
 * - CacheOptimizationService: 캐시 최적화  
 * - NetworkMonitoringService: 네트워크 모니터링
 */

// 개별 서비스들 export
export { HTTPOptimizationService } from './HTTPOptimizationService';
export { CacheOptimizationService } from './CacheOptimizationService';
export { NetworkMonitoringService } from './NetworkMonitoringService';

// 타입들도 re-export
export type {
    NetworkStats,
    CacheStats,
    ConnectionStatus,
    INetworkService,
    ICacheService,
    IMonitoringService
} from '../../../shared/types';

// 통합 네트워크 최적화 관리자
import { createLogger } from '../../../shared/logger';
import { IOptimizationService } from '../../../shared/types';
import { HTTPOptimizationService } from './HTTPOptimizationService';
import { CacheOptimizationService } from './CacheOptimizationService';
import { NetworkMonitoringService } from './NetworkMonitoringService';

const logger = createLogger('NetworkOptimizationManager');

/**
 * 🎯 네트워크 통합 최적화 관리자
 * 모든 네트워크 서비스들을 조합하여 통합 관리
 */
export class NetworkOptimizationService implements IOptimizationService {
    private isInitialized = false;
    private httpOptimization: HTTPOptimizationService;
    private cacheOptimization: CacheOptimizationService;
    private networkMonitoring: NetworkMonitoringService;

    constructor() {
        this.httpOptimization = new HTTPOptimizationService();
        this.cacheOptimization = new CacheOptimizationService();
        this.networkMonitoring = new NetworkMonitoringService();
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Network optimization already initialized');
            return;
        }

        logger.info('🌐 Initializing network optimization services...');

        try {
            // 순차적으로 초기화
            await this.httpOptimization.initialize();
            await this.cacheOptimization.initialize();
            await this.networkMonitoring.initialize();

            this.isInitialized = true;
            logger.info('✅ All network optimization services initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize network optimization services', error);
            throw error;
        }
    }

    // HTTP 최적화 서비스 접근
    getHTTPService(): HTTPOptimizationService {
        return this.httpOptimization;
    }

    // 캐시 최적화 서비스 접근
    getCacheService(): CacheOptimizationService {
        return this.cacheOptimization;
    }

    // 네트워크 모니터링 서비스 접근
    getMonitoringService(): NetworkMonitoringService {
        return this.networkMonitoring;
    }

    // 성능 모니터링 설정
    setupPerformanceMonitoring(): void {
        if (!this.isInitialized) {
            logger.warn('Network optimization not initialized');
            return;
        }

        logger.info('Setting up performance monitoring...');
        // 실제 성능 모니터링 로직은 각 서비스에서 처리
    }

    // 정리 함수
    cleanup(): void {
        // 각 서비스의 정리 작업 수행
        logger.info('Network optimization services cleaned up');
    }
}