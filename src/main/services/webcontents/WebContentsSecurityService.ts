import { WebContentsView, ipcMain } from 'electron'
import { createLogger } from '../../../shared/logger'
import { IOptimizationService } from '../../../shared/types'
import { cspManager } from '../../../shared/csp'

const logger = createLogger('WebContentsSecurityService')

export interface SecurityPolicy {
    allowedDomains?: string[]
    blockedDomains?: string[]
    allowPopups?: boolean
    allowDevTools?: boolean
    allowFileAccess?: boolean
    maxRedirects?: number
    enableCSP?: boolean
    strictSSL?: boolean
}

export interface SecurityEvent {
    type: 'permission-request' | 'certificate-error' | 'login-request' | 'blocked-request'
    url: string
    details: any
    timestamp: number
}

/**
 * 🔒 WebContents 보안 서비스 (SRP: 보안 설정 및 권한 관리만 담당)
 * - 보안 정책 관리
 * - 권한 요청 처리
 * - 도메인 화이트리스트/블랙리스트
 * - 인증서 검증
 */
export class WebContentsSecurityService implements IOptimizationService {
    private isInitialized = false
    private securityPolicies = new Map<string, SecurityPolicy>()
    private securityEvents = new Map<string, SecurityEvent[]>()
    private blockedRequests = new Set<string>()

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('WebContents security service already initialized')
            return
        }

        logger.info('🔒 Initializing WebContents security service...')

        // 기본 보안 정책 설정
        this.setupDefaultSecurityPolicy()

        this.isInitialized = true
        logger.info('✅ WebContents security service initialized successfully')
    }

    // 기본 보안 정책 설정
    private setupDefaultSecurityPolicy(): void {
        const defaultPolicy: SecurityPolicy = {
            allowedDomains: [], // 기본적으로 모든 도메인 허용
            blockedDomains: [
                'malicious-site.com',
                'phishing-example.com'
            ],
            allowPopups: false,
            allowDevTools: process.env.NODE_ENV === 'development',
            allowFileAccess: false,
            maxRedirects: 5,
            enableCSP: true,
            strictSSL: true
        }

        this.securityPolicies.set('default', defaultPolicy)
        logger.info('Default security policy established', { policy: defaultPolicy })
    }

    // WebView에 보안 설정 적용
    applySecuritySettings(webView: WebContentsView, policyName: string = 'default'): void {
        if (!this.isInitialized) {
            throw new Error('WebContents security service not initialized')
        }

        const policy = this.securityPolicies.get(policyName)
        if (!policy) {
            logger.warn('Security policy not found, using default', { policyName })
            return this.applySecuritySettings(webView, 'default')
        }

        const viewId = this.getViewId(webView)
        logger.info('Applying security settings', { viewId, policyName })

        try {
            // 권한 요청 핸들러 설정
            this.setupPermissionHandlers(webView, policy)

            // 네비게이션 검증 설정
            this.setupNavigationHandlers(webView, policy)

            // 인증서 오류 핸들러 설정
            this.setupCertificateHandlers(webView, policy)

            // 새 창 핸들러 설정
            this.setupNewWindowHandlers(webView, policy)

            // DevTools 제어
            this.setupDevToolsControl(webView, policy)

            logger.info('Security settings applied successfully', { viewId, policyName })
        } catch (error) {
            logger.error('Failed to apply security settings', { viewId, error })
            throw error
        }
    }

    // 권한 요청 핸들러 설정
    private setupPermissionHandlers(webView: WebContentsView, policy: SecurityPolicy): void {
        webView.webContents.session.setPermissionRequestHandler((webContents, permission, callback, details) => {
            const viewId = this.getViewId(webView)

            logger.info('Permission request received', {
                viewId,
                permission,
                origin: details.requestingUrl
            })

            // 도메인 검증
            const isAllowed = this.isPermissionAllowed(details.requestingUrl, permission, policy)

            // 보안 이벤트 기록
            this.recordSecurityEvent(viewId, {
                type: 'permission-request',
                url: details.requestingUrl,
                details: { permission, granted: isAllowed },
                timestamp: Date.now()
            })

            callback(isAllowed)
        })
    }

    // 네비게이션 검증 핸들러 설정
    private setupNavigationHandlers(webView: WebContentsView, policy: SecurityPolicy): void {
        let redirectCount = 0

        webView.webContents.on('will-navigate', (event, navigationUrl) => {
            const viewId = this.getViewId(webView)

            // 도메인 검증
            if (!this.isDomainAllowed(navigationUrl, policy)) {
                logger.warn('Navigation blocked: domain not allowed', { viewId, url: navigationUrl })
                event.preventDefault()

                this.recordSecurityEvent(viewId, {
                    type: 'blocked-request',
                    url: navigationUrl,
                    details: { reason: 'domain-blocked' },
                    timestamp: Date.now()
                })
                return
            }

            // 리다이렉트 횟수 제한
            if (policy.maxRedirects && redirectCount >= policy.maxRedirects) {
                logger.warn('Navigation blocked: too many redirects', { viewId, count: redirectCount })
                event.preventDefault()

                this.recordSecurityEvent(viewId, {
                    type: 'blocked-request',
                    url: navigationUrl,
                    details: { reason: 'max-redirects-exceeded', count: redirectCount },
                    timestamp: Date.now()
                })
                return
            }

            redirectCount++
            logger.debug('Navigation allowed', { viewId, url: navigationUrl, redirectCount })
        })

        // 네비게이션 완료 시 리다이렉트 카운터 리셋
        webView.webContents.on('did-navigate', () => {
            redirectCount = 0
        })
    }

    // 인증서 오류 핸들러 설정
    private setupCertificateHandlers(webView: WebContentsView, policy: SecurityPolicy): void {
        webView.webContents.on('certificate-error', (event, url, error, certificate, callback) => {
            const viewId = this.getViewId(webView)

            logger.warn('Certificate error encountered', {
                viewId,
                url,
                error,
                fingerprint: certificate.fingerprint
            })

            // 보안 이벤트 기록
            this.recordSecurityEvent(viewId, {
                type: 'certificate-error',
                url,
                details: { error, fingerprint: certificate.fingerprint },
                timestamp: Date.now()
            })

            // Strict SSL 정책에 따라 처리
            if (policy.strictSSL) {
                event.preventDefault()
                callback(false) // 인증서 오류 거부
            } else {
                callback(true) // 인증서 오류 허용 (개발 환경 등)
            }
        })
    }

    // 새 창 핸들러 설정
    private setupNewWindowHandlers(webView: WebContentsView, policy: SecurityPolicy): void {
        webView.webContents.setWindowOpenHandler((details) => {
            const viewId = this.getViewId(webView)

            logger.info('New window request', { viewId, url: details.url })

            if (!policy.allowPopups) {
                logger.warn('Popup blocked by policy', { viewId, url: details.url })
                return { action: 'deny' }
            }

            // 도메인 검증
            if (!this.isDomainAllowed(details.url, policy)) {
                logger.warn('New window blocked: domain not allowed', { viewId, url: details.url })
                return { action: 'deny' }
            }

            return { action: 'allow' }
        })
    }

    // DevTools 제어 설정
    private setupDevToolsControl(webView: WebContentsView, policy: SecurityPolicy): void {
        if (!policy.allowDevTools) {
            // DevTools 열기 차단
            webView.webContents.on('before-input-event', (event, input) => {
                // F12 또는 Ctrl+Shift+I 차단
                if ((input.key === 'F12') ||
                    (input.control && input.shift && input.key === 'I')) {
                    event.preventDefault()
                }
            })

            // 우클릭 컨텍스트 메뉴에서 DevTools 제거
            webView.webContents.on('context-menu', (event) => {
                // 컨텍스트 메뉴 커스터마이징 로직
                event.preventDefault()
            })
        }
    }

    // 도메인 허용 여부 확인
    private isDomainAllowed(url: string, policy: SecurityPolicy): boolean {
        try {
            const urlObj = new URL(url)
            const domain = urlObj.hostname

            // 블랙리스트 확인
            if (policy.blockedDomains?.includes(domain)) {
                return false
            }

            // 화이트리스트가 설정된 경우 화이트리스트 확인
            if (policy.allowedDomains && policy.allowedDomains.length > 0) {
                return policy.allowedDomains.includes(domain)
            }

            // 화이트리스트가 비어있으면 기본적으로 허용 (블랙리스트만 체크)
            return true
        } catch (error) {
            logger.error('Failed to validate domain', { url, error })
            return false
        }
    }

    // 권한 허용 여부 확인
    private isPermissionAllowed(url: string, permission: string, policy: SecurityPolicy): boolean {
        // 도메인 검증
        if (!this.isDomainAllowed(url, policy)) {
            return false
        }

        // 권한별 세부 정책 (확장 가능)
        switch (permission) {
            case 'media':
            case 'camera':
            case 'microphone':
                // 미디어 권한은 신중하게 처리
                return this.isDomainTrusted(url)

            case 'geolocation':
                // 위치 정보는 더욱 신중하게
                return this.isDomainTrusted(url)

            case 'notifications':
                // 알림은 상대적으로 안전
                return true

            default:
                // 알 수 없는 권한은 거부
                logger.warn('Unknown permission requested', { permission, url })
                return false
        }
    }

    // 신뢰할 수 있는 도메인 확인
    private isDomainTrusted(url: string): boolean {
        try {
            const urlObj = new URL(url)
            const domain = urlObj.hostname

            // 일반적으로 신뢰할 수 있는 도메인들
            const trustedDomains = [
                'localhost',
                '127.0.0.1',
                'github.com',
                'google.com',
                'youtube.com',
                'microsoft.com'
            ]

            return trustedDomains.some(trusted =>
                domain === trusted || domain.endsWith(`.${trusted}`)
            )
        } catch {
            return false
        }
    }

    // 보안 이벤트 기록
    private recordSecurityEvent(viewId: string, event: SecurityEvent): void {
        if (!this.securityEvents.has(viewId)) {
            this.securityEvents.set(viewId, [])
        }

        const events = this.securityEvents.get(viewId)!
        events.push(event)

        // 이벤트 개수 제한 (최대 100개)
        if (events.length > 100) {
            events.splice(0, events.length - 100)
        }

        logger.debug('Security event recorded', { viewId, type: event.type })
    }

    // WebView ID 가져오기
    private getViewId(webView: WebContentsView): string {
        return `view-${webView.webContents.id}`
    }

    // 보안 정책 설정
    setSecurityPolicy(name: string, policy: SecurityPolicy): void {
        this.securityPolicies.set(name, policy)
        logger.info('Security policy updated', { name, policy })
    }

    // 보안 정책 가져오기
    getSecurityPolicy(name: string): SecurityPolicy | undefined {
        return this.securityPolicies.get(name)
    }

    // 보안 이벤트 조회
    getSecurityEvents(viewId: string): SecurityEvent[] {
        return this.securityEvents.get(viewId) || []
    }

    // 보안 통계
    getSecurityStats(viewId: string): {
        totalEvents: number;
        blockedRequests: number;
        permissionRequests: number;
        certificateErrors: number;
        loginRequests: number;
    } {
        const events = this.getSecurityEvents(viewId)

        return {
            totalEvents: events.length,
            blockedRequests: events.filter(e => e.type === 'blocked-request').length,
            permissionRequests: events.filter(e => e.type === 'permission-request').length,
            certificateErrors: events.filter(e => e.type === 'certificate-error').length,
            loginRequests: events.filter(e => e.type === 'login-request').length
        }
    }

    // CSP 헤더 설정 (cspManager 위임)
    setContentSecurityPolicy(webView: WebContentsView, csp?: string): void {
        cspManager.setContentSecurityPolicy(webView, csp)
    }

    // 보안 상태 검증
    validateSecurityState(webView: WebContentsView): {
        isSecure: boolean;
        issues: string[];
        recommendations: string[];
        score: number;
    } {
        const issues: string[] = []
        const recommendations: string[] = []
        let score = 100

        try {
            const url = webView.webContents.getURL()

            // HTTPS 확인
            if (url && !url.startsWith('https://') && !url.startsWith('file://') && url !== 'about:blank') {
                issues.push('HTTPS를 사용하지 않습니다')
                recommendations.push('HTTPS 사이트를 사용하세요')
                score -= 20
            }

            // 보안 이벤트 확인
            const viewId = this.getViewId(webView)
            const stats = this.getSecurityStats(viewId)

            if (stats.blockedRequests > 0) {
                issues.push(`${stats.blockedRequests}개의 요청이 차단되었습니다`)
                score -= Math.min(stats.blockedRequests * 5, 30)
            }

            if (stats.certificateErrors > 0) {
                issues.push(`${stats.certificateErrors}개의 인증서 오류가 발생했습니다`)
                recommendations.push('신뢰할 수 있는 사이트만 방문하세요')
                score -= Math.min(stats.certificateErrors * 10, 40)
            }

        } catch (error) {
            issues.push('보안 상태 검증 중 오류가 발생했습니다')
            score -= 10
        }

        const isSecure = issues.length === 0 && score >= 80

        return {
            isSecure,
            issues,
            recommendations,
            score: Math.max(0, score)
        }
    }

    // 정리 함수
    cleanup(): void {
        this.securityPolicies.clear()
        this.securityEvents.clear()
        this.blockedRequests.clear()
        logger.info('WebContents security service cleaned up')
    }
}