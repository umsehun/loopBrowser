import { createLogger } from '../../shared/logger'
import { SecurityPolicy, SecurityEvent } from '../../shared/types'

const logger = createLogger('SecurityManager')

/**
 * 🔒 중앙 보안 관리자 (SRP: 보안 정책 중앙 관리)
 * - 보안 정책 통합 관리
 * - 보안 이벤트 모니터링
 * - CSP 정책 적용
 */
export class SecurityManager {
    private isInitialized = false
    private globalSecurityPolicy: SecurityPolicy
    private securityEvents: SecurityEvent[] = []
    private maxEvents = 1000

    constructor() {
        this.globalSecurityPolicy = this.createDefaultPolicy()
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.warn('Security manager already initialized')
            return
        }

        logger.info('🔒 Initializing security manager...')

        // 보안 이벤트 리스너 설정
        this.setupSecurityEventListeners()

        this.isInitialized = true
        logger.info('✅ Security manager initialized successfully')
    }

    // 기본 보안 정책 생성
    private createDefaultPolicy(): SecurityPolicy {
        return {
            allowedDomains: [],
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
    }

    // 보안 이벤트 리스너 설정
    private setupSecurityEventListeners(): void {
        // IPC를 통한 보안 이벤트 수신
        // 구현 예정
        logger.debug('Security event listeners setup')
    }

    // 글로벌 보안 정책 설정
    setGlobalSecurityPolicy(policy: Partial<SecurityPolicy>): void {
        this.globalSecurityPolicy = { ...this.globalSecurityPolicy, ...policy }
        logger.info('Global security policy updated', { policy })
    }

    // 글로벌 보안 정책 가져오기
    getGlobalSecurityPolicy(): SecurityPolicy {
        return { ...this.globalSecurityPolicy }
    }

    // 보안 이벤트 기록
    recordSecurityEvent(event: SecurityEvent): void {
        this.securityEvents.push(event)

        if (this.securityEvents.length > this.maxEvents) {
            this.securityEvents.shift()
        }

        logger.debug('Security event recorded', { type: event.type, url: event.url })
    }

    // 보안 이벤트 조회
    getSecurityEvents(limit = 100): SecurityEvent[] {
        return this.securityEvents.slice(-limit)
    }

    // 보안 통계
    getSecurityStats(): {
        totalEvents: number
        blockedRequests: number
        permissionRequests: number
        certificateErrors: number
        loginRequests: number
    } {
        return {
            totalEvents: this.securityEvents.length,
            blockedRequests: this.securityEvents.filter(e => e.type === 'blocked-request').length,
            permissionRequests: this.securityEvents.filter(e => e.type === 'permission-request').length,
            certificateErrors: this.securityEvents.filter(e => e.type === 'certificate-error').length,
            loginRequests: this.securityEvents.filter(e => e.type === 'login-request').length
        }
    }

    // 도메인 검증
    validateDomain(url: string): { isAllowed: boolean; reason?: string } {
        try {
            const urlObj = new URL(url)
            const domain = urlObj.hostname

            // 블랙리스트 확인
            if (this.globalSecurityPolicy.blockedDomains?.includes(domain)) {
                return { isAllowed: false, reason: 'domain-blocked' }
            }

            // 화이트리스트 확인
            if (this.globalSecurityPolicy.allowedDomains && this.globalSecurityPolicy.allowedDomains.length > 0) {
                const isWhitelisted = this.globalSecurityPolicy.allowedDomains.includes(domain)
                return { isAllowed: isWhitelisted, reason: isWhitelisted ? undefined : 'domain-not-whitelisted' }
            }

            return { isAllowed: true }
        } catch (error) {
            logger.error('Domain validation failed', { url, error })
            return { isAllowed: false, reason: 'invalid-url' }
        }
    }

    // 권한 검증
    validatePermission(url: string, permission: string): boolean {
        const domainValidation = this.validateDomain(url)
        if (!domainValidation.isAllowed) {
            return false
        }

        // 권한별 추가 검증 로직
        switch (permission) {
            case 'media':
            case 'camera':
            case 'microphone':
                return this.isDomainTrusted(url)

            case 'geolocation':
                return this.isDomainTrusted(url)

            case 'notifications':
                return true

            default:
                logger.warn('Unknown permission requested', { permission, url })
                return false
        }
    }

    // 신뢰할 수 있는 도메인 확인
    private isDomainTrusted(url: string): boolean {
        try {
            const urlObj = new URL(url)
            const domain = urlObj.hostname

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

    // 정리
    cleanup(): void {
        this.securityEvents = []
        logger.info('Security manager cleaned up')
    }
}

// 싱글톤 인스턴스
export const securityManager = new SecurityManager()