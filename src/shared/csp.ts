import { WebContentsView } from 'electron'
import { createLogger } from './logger'

const logger = createLogger('CSPManager')

/**
 * 🛡️ Content Security Policy 관리자
 * - CSP 헤더 설정 및 관리
 * - 보안 정책 적용
 */
export class CSPManager {
    private static instance: CSPManager
    private defaultCSP: string

    private constructor() {
        this.defaultCSP = this.createDefaultCSP()
    }

    static getInstance(): CSPManager {
        if (!CSPManager.instance) {
            CSPManager.instance = new CSPManager()
        }
        return CSPManager.instance
    }

    // 기본 CSP 정책 생성
    private createDefaultCSP(): string {
        return [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https:",
            "media-src 'self' https:",
            "object-src 'none'",
            "frame-src 'self' https:",
            "base-uri 'self'",
            "form-action 'self'"
        ].join('; ')
    }

    // CSP 헤더 설정
    setContentSecurityPolicy(webView: WebContentsView, csp?: string): void {
        const policy = csp || this.defaultCSP

        webView.webContents.session.webRequest.onHeadersReceived((details, callback) => {
            if (details.responseHeaders) {
                details.responseHeaders['Content-Security-Policy'] = [policy]
            }
            callback({ responseHeaders: details.responseHeaders })
        })

        logger.info('CSP policy set', { viewId: this.getViewId(webView), csp: policy })
    }

    // 커스텀 CSP 정책 생성
    createCustomCSP(options: {
        allowInlineScripts?: boolean
        allowInlineStyles?: boolean
        allowEval?: boolean
        allowExternalImages?: boolean
        allowExternalFonts?: boolean
        allowExternalMedia?: boolean
        allowExternalConnect?: boolean
        allowFrames?: boolean
    }): string {
        const policies = ["default-src 'self'"]

        // 스크립트 정책
        const scriptPolicies = ["'self'"]
        if (options.allowInlineScripts) scriptPolicies.push("'unsafe-inline'")
        if (options.allowEval) scriptPolicies.push("'unsafe-eval'")
        policies.push(`script-src ${scriptPolicies.join(' ')}`)

        // 스타일 정책
        const stylePolicies = ["'self'"]
        if (options.allowInlineStyles) stylePolicies.push("'unsafe-inline'")
        policies.push(`style-src ${stylePolicies.join(' ')}`)

        // 이미지 정책
        const imgPolicies = ["'self'"]
        if (options.allowExternalImages) imgPolicies.push("https:")
        policies.push(`img-src ${imgPolicies.join(' ')}`)

        // 폰트 정책
        const fontPolicies = ["'self'"]
        if (options.allowExternalFonts) fontPolicies.push("data:")
        policies.push(`font-src ${fontPolicies.join(' ')}`)

        // 연결 정책
        const connectPolicies = ["'self'"]
        if (options.allowExternalConnect) connectPolicies.push("https:")
        policies.push(`connect-src ${connectPolicies.join(' ')}`)

        // 미디어 정책
        const mediaPolicies = ["'self'"]
        if (options.allowExternalMedia) mediaPolicies.push("https:")
        policies.push(`media-src ${mediaPolicies.join(' ')}`)

        // 기타 보안 정책
        policies.push("object-src 'none'")
        if (options.allowFrames) {
            policies.push("frame-src 'self' https:")
        } else {
            policies.push("frame-src 'none'")
        }
        policies.push("base-uri 'self'")
        policies.push("form-action 'self'")

        return policies.join('; ')
    }

    // CSP 검증
    validateCSP(csp: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        // 기본 검증
        if (!csp || csp.trim().length === 0) {
            errors.push('CSP cannot be empty')
        }

        // 위험한 정책 검출
        if (csp.includes("'unsafe-inline'") && csp.includes("'unsafe-eval'")) {
            errors.push('Both unsafe-inline and unsafe-eval are enabled - high security risk')
        }

        if (csp.includes("data:") && !csp.includes("img-src")) {
            errors.push('data: scheme allowed without img-src restriction')
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }

    // WebView ID 가져오기
    private getViewId(webView: WebContentsView): string {
        return `view-${webView.webContents.id}`
    }
}

// 싱글톤 인스턴스
export const cspManager = CSPManager.getInstance()