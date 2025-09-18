import { createModuleLogger } from '../../shared/logger/index';

// Security 로거 생성
const securityLogger = createModuleLogger('Security', 'main');

/**
 * Content Security Policy (CSP) 관리 클래스
 * 보안 정책 적용 및 관리를 담당
 */
export class SecurityManager {
    private static instance: SecurityManager;

    private constructor() { }

    static getInstance(): SecurityManager {
        if (!SecurityManager.instance) {
            SecurityManager.instance = new SecurityManager();
        }
        return SecurityManager.instance;
    }

    /**
     * CSP 헤더 생성
     */
    getCSPHeader(): string {
        return [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com http://localhost:5173",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com http://localhost:5173",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob: http://localhost:5173",
            "connect-src 'self' https: wss: http://localhost:5173 ws://localhost:5173",
            "media-src 'self' https: blob: http://localhost:5173",
            "object-src 'none'",
            "frame-src 'self' https: http://localhost:5173",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests"
        ].join('; ');
    }

    /**
     * CSP 적용
     */
    applyCSP(webContents: Electron.WebContents): void {
        const cspHeader = this.getCSPHeader();

        // 메인 윈도우에 CSP 헤더 설정
        webContents.session.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [cspHeader]
                }
            });
        });

        securityLogger.info('CSP (Content Security Policy) applied to webContents');
    }

    /**
     * 보안 검증
     */
    validateSecurity(url: string): boolean {
        try {
            // 기본적인 URL 검증
            const urlObj = new URL(url);

            // 허용되지 않은 프로토콜 차단
            const allowedProtocols = ['http:', 'https:', 'file:'];
            if (!allowedProtocols.includes(urlObj.protocol)) {
                securityLogger.warn('Blocked potentially unsafe protocol', { protocol: urlObj.protocol, url });
                return false;
            }

            // 추가적인 보안 검증 로직을 여기에 추가할 수 있음
            return true;
        } catch (error) {
            securityLogger.error('Security validation failed', { url, error });
            return false;
        }
    }
}

// 싱글톤 인스턴스 export
export const securityManager = SecurityManager.getInstance();