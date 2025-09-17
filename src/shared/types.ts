/**
 * 🎯 SEO Browser - 공통 타입 정의
 * 
 * SOLID 원칙 적용:
 * - SRP: 타입 정의만 담당
 * - ISP: 인터페이스 분리
 * - DIP: 의존성 역전 (구체적 구현이 아닌 추상화에 의존)
 */

// ==================== 로그 관련 타입 ====================
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

export interface LogEntry {
    level: LogLevel;
    component: string;
    message: string;
    data?: unknown;
    timestamp: Date;
}

// ==================== 네트워크 관련 타입 ====================
export interface NetworkStats {
    totalRequests: number;
    errorRequests: number;
    slowRequests: number;
    errorRate: number;
}

export interface CacheStats {
    size: number;
    sizeFormatted: string;
}

export interface ConnectionStatus {
    online: boolean;
    userAgent: string;
}

// ==================== SEO 관련 타입 ====================
export interface SEOMetadata {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
}

export interface SEOPerformance {
    totalLoadTime: number;
    domContentLoaded: number;
    firstPaint: number;
    firstContentfulPaint: number;
}

export interface SEOReport {
    url: string;
    metadata: SEOMetadata;
    structuredData: unknown[];
    performance: SEOPerformance;
    seoScore: number;
    recommendations: string[];
    timestamp: Date;
}

// ==================== 성능 관련 타입 ====================
export interface MemoryStats {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    heapUsagePercent?: number;
    timestamp?: Date;
}

export interface PerformanceSnapshot {
    uptime: string;
    memory: MemoryStats;
    logCount: number;
    timestamp: string;
}

export interface GPUInfo {
    renderer: string;
    vendor: string;
    version: string;
    hardwareAcceleration: boolean;
}

// ==================== 윈도우 관련 타입 ====================
export interface WindowConfig {
    width: number;
    height: number;
    minWidth?: number;
    minHeight?: number;
    resizable?: boolean;
    maximizable?: boolean;
    minimizable?: boolean;
}

export interface ViewConfig {
    x: number;
    y: number;
    width: number;
    height: number;
}

// ==================== 서비스 인터페이스 (DIP 적용) ====================
export interface IOptimizationService {
    initialize(): Promise<void>;
}

export interface IMonitoringService extends IOptimizationService {
    getStats(): unknown;
    resetStats(): void;
}

export interface ICacheService extends IOptimizationService {
    clearCache(): Promise<void>;
    getCacheStats(): Promise<CacheStats>;
}

export interface INetworkService extends IOptimizationService {
    checkConnectionStatus(): boolean;
    getUserAgent(): string;
}

// ==================== 에러 관련 타입 ====================
export interface ServiceError {
    service: string;
    operation: string;
    error: Error;
    timestamp: Date;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

// ==================== 이벤트 관련 타입 ====================
export interface ServiceEvent {
    type: 'initialized' | 'error' | 'warning' | 'info';
    service: string;
    message: string;
    data?: unknown;
    timestamp: Date;
}

// ==================== 상수 정의 ====================
export const PERFORMANCE_THRESHOLDS = {
    SLOW_REQUEST_MS: 2000,
    HIGH_MEMORY_USAGE_PERCENT: 80,
    MAX_LOG_ENTRIES: 1000,
    CACHE_MAX_AGE_STATIC: 31536000, // 1년
    CACHE_MAX_AGE_API: 300, // 5분
} as const;

export const SERVICE_NAMES = {
    GPU: 'GPUOptimizationService',
    V8: 'V8OptimizationService',
    NETWORK: 'NetworkOptimizationService',
    SEO: 'SEOOptimizationService',
    PERFORMANCE: 'PerformanceDashboard',
    HTTP: 'HTTPOptimizationService',
    CACHE: 'CacheOptimizationService',
    MONITORING: 'NetworkMonitoringService',
} as const;
