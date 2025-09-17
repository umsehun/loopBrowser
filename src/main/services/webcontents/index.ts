/**
 * 📱 WebContents Services - Index (SRP + SOLID 적용)
 * 
 * 모든 WebContents 관련 서비스들을 중앙에서 export
 * - WebContentsCreationService: WebContentsView 생성 및 관리
 * - WebContentsNavigationService: URL 로딩 및 네비게이션
 * - WebContentsSecurityService: 보안 정책 및 권한 관리
 * - WebContentsEventService: 이벤트 리스너 및 상태 관리
 */

// 개별 서비스들 export
export { WebContentsCreationService } from './WebContentsCreationService';
export { WebContentsNavigationService } from './WebContentsNavigationService';
export { WebContentsSecurityService } from './WebContentsSecurityService';
export { WebContentsEventService } from './WebContentsEventService';

// 타입들도 re-export
export type {
    WebViewBounds,
    WebViewConfig
} from './WebContentsCreationService';

export type {
    NavigationState,
    LoadOptions
} from './WebContentsNavigationService';

export type {
    SecurityPolicy,
    SecurityEvent
} from './WebContentsSecurityService';

export type {
    EventListener,
    LoadingState,
    PageInfo
} from './WebContentsEventService';

// 통합 WebContents 서비스 관리자
import { WebContentsView, BaseWindow } from 'electron';
import { createLogger } from '../../../shared/logger';
import { IOptimizationService } from '../../../shared/types';
import { WebContentsCreationService, WebViewBounds, WebViewConfig } from './WebContentsCreationService';
import { WebContentsNavigationService, LoadOptions } from './WebContentsNavigationService';
import { WebContentsSecurityService, SecurityPolicy } from './WebContentsSecurityService';
import { WebContentsEventService } from './WebContentsEventService';

const logger = createLogger('WebContentsService');

/**
 * 🎯 WebContents 통합 관리자
 * 모든 WebContents 서비스들을 조합하여 통합 관리
 * 
 * 이 클래스는 기존 WebContentsService.ts를 완전히 대체합니다.
 */
export class WebContentsService implements IOptimizationService {
    private isInitialized = false;
    private creationService: WebContentsCreationService;
    private navigationService: WebContentsNavigationService;
    private securityService: WebContentsSecurityService;
    private eventService: WebContentsEventService;

    constructor() {
        this.creationService = new WebContentsCreationService();
        this.navigationService = new WebContentsNavigationService();
        this.securityService = new WebContentsSecurityService();
        this.eventService = new WebContentsEventService();
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('WebContents service already initialized');
            return;
        }

        logger.info('📱 Initializing WebContents services...');

        try {
            // 순차적으로 초기화
            await this.creationService.initialize();
            await this.navigationService.initialize();
            await this.securityService.initialize();
            await this.eventService.initialize();

            this.isInitialized = true;
            logger.info('✅ All WebContents services initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize WebContents services', error);
            throw error;
        }
    }

    // === 통합 WebView 생성 메서드 ===
    createWebView(
        parentWindow: BaseWindow,
        bounds: WebViewBounds,
        config?: WebViewConfig,
        securityPolicy?: string
    ): WebContentsView {
        if (!this.isInitialized) {
            throw new Error('WebContents service not initialized');
        }

        logger.info('Creating integrated WebView', { bounds, securityPolicy });

        // 1. WebView 생성
        const { webView, viewId } = this.creationService.createWebView(parentWindow, bounds, config);

        // 2. 보안 설정 적용
        this.securityService.applySecuritySettings(webView, securityPolicy);

        // 3. 이벤트 리스너 설정
        this.eventService.setupEventListeners(webView);

        logger.info('Integrated WebView created successfully', { viewId });

        return webView;
    }

    // === 네비게이션 메서드들 (기존 API 호환성 유지) ===
    async loadUrl(webView: WebContentsView, url: string, options?: LoadOptions): Promise<void> {
        return this.navigationService.loadUrl(webView, url, options);
    }

    canGoBack(webView: WebContentsView): boolean {
        return this.navigationService.canGoBack(webView);
    }

    canGoForward(webView: WebContentsView): boolean {
        return this.navigationService.canGoForward(webView);
    }

    async goBack(webView: WebContentsView): Promise<void> {
        const success = await this.navigationService.goBack(webView);
        if (!success) {
            throw new Error('Cannot go back');
        }
    }

    async goForward(webView: WebContentsView): Promise<void> {
        const success = await this.navigationService.goForward(webView);
        if (!success) {
            throw new Error('Cannot go forward');
        }
    }

    async reload(webView: WebContentsView): Promise<void> {
        return this.navigationService.reload(webView);
    }

    // === 리사이징 메서드 (기존 API 호환성 유지) ===
    resizeWebView(webView: WebContentsView, bounds: WebViewBounds): void {
        this.creationService.resizeWebViewDirect(webView, bounds);
    }

    // === 고급 기능들 ===

    // 보안 정책 설정
    setSecurityPolicy(name: string, policy: SecurityPolicy): void {
        this.securityService.setSecurityPolicy(name, policy);
    }

    // 보안 상태 검증
    validateSecurity(webView: WebContentsView): {
        isSecure: boolean;
        issues: string[];
        recommendations: string[];
        score: number;
    } {
        return this.securityService.validateSecurityState(webView);
    }

    // 네비게이션 상태 조회
    getNavigationState(webView: WebContentsView) {
        return this.navigationService.getNavigationState(webView);
    }

    // 페이지 정보 조회
    getPageInfo(webView: WebContentsView) {
        const viewId = this.getViewId(webView);
        return this.eventService.getPageInfo(viewId);
    }

    // 로딩 상태 조회
    getLoadingState(webView: WebContentsView) {
        const viewId = this.getViewId(webView);
        return this.eventService.getLoadingState(viewId);
    }

    // 이벤트 리스너 추가
    addEventListener(webView: WebContentsView, eventName: string, callback: Function, once: boolean = false): void {
        const viewId = this.getViewId(webView);
        this.eventService.addEventListener(viewId, eventName, callback, once);
    }

    // 이벤트 리스너 제거
    removeEventListener(webView: WebContentsView, eventName: string, callback: Function): void {
        const viewId = this.getViewId(webView);
        this.eventService.removeEventListener(viewId, eventName, callback);
    }

    // WebView 제거
    removeWebView(webView: WebContentsView): boolean {
        const viewId = this.getViewId(webView);

        // 모든 서비스에서 정리
        this.eventService.removeAllEventListeners(viewId);

        return this.creationService.removeWebView(viewId);
    }

    // === 서비스 접근자들 ===
    getCreationService(): WebContentsCreationService {
        return this.creationService;
    }

    getNavigationService(): WebContentsNavigationService {
        return this.navigationService;
    }

    getSecurityService(): WebContentsSecurityService {
        return this.securityService;
    }

    getEventService(): WebContentsEventService {
        return this.eventService;
    }

    // === 통계 및 디버그 ===
    getServiceStats(): {
        webViewCount: number;
        totalEventListeners: number;
        securityEvents: number;
        isInitialized: boolean;
    } {
        const webViewCount = this.creationService.getWebViewCount();

        // 모든 WebView의 이벤트 리스너 수 합계
        const allWebViews = this.creationService.getAllWebViews();
        let totalEventListeners = 0;
        let securityEvents = 0;

        for (const [viewId] of allWebViews) {
            const eventStats = this.eventService.getEventStats(viewId);
            totalEventListeners += eventStats.totalListeners;

            const securityStats = this.securityService.getSecurityStats(viewId);
            securityEvents += securityStats.totalEvents;
        }

        return {
            webViewCount,
            totalEventListeners,
            securityEvents,
            isInitialized: this.isInitialized
        };
    }

    // WebView ID 가져오기
    private getViewId(webView: WebContentsView): string {
        return `view-${webView.webContents.id}`;
    }

    // 전체 상태 리포트
    generateStatusReport(): {
        service: string;
        status: 'healthy' | 'warning' | 'error';
        details: any;
    } {
        try {
            const stats = this.getServiceStats();

            let status: 'healthy' | 'warning' | 'error' = 'healthy';

            if (!this.isInitialized) {
                status = 'error';
            } else if (stats.webViewCount > 10) {
                status = 'warning'; // 너무 많은 WebView
            } else if (stats.securityEvents > 50) {
                status = 'warning'; // 너무 많은 보안 이벤트
            }

            return {
                service: 'WebContentsService',
                status,
                details: {
                    ...stats,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                service: 'WebContentsService',
                status: 'error',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        }
    }

    // 정리 함수
    cleanup(): void {
        logger.info('Cleaning up WebContents services...');

        // 모든 서비스 정리
        this.creationService.cleanup();
        this.navigationService.cleanup();
        this.securityService.cleanup();
        this.eventService.cleanup();

        this.isInitialized = false;
        logger.info('WebContents services cleaned up');
    }
}