import { app, shell } from 'electron'
import { createModuleLogger } from '../../shared/logger'

const logger = createModuleLogger('SecurityManager')

// GIGA-CHAD: 보안 설정 관리 모듈
export class SecurityManager {
    /**
     * 앱 수준 보안 설정 초기화
     */
    static initialize(): void {
        logger.info('🔒 GIGA-CHAD: Initializing security settings...')

        this.setupWebContentsSecurity()
        this.setupPermissionHandlers()
        this.setupNavigationSecurity()

        logger.info('✅ GIGA-CHAD: Security settings initialized')
    }

    /**
     * 웹 콘텐츠 보안 설정
     */
    private static setupWebContentsSecurity(): void {
        // GIGA-CHAD: 새로 생성되는 모든 웹 콘텐츠에 보안 정책 적용
        app.on('web-contents-created', (_, contents) => {
            // 외부 네비게이션 제한
            contents.on('will-navigate', (event, navigationUrl) => {
                const parsedUrl = new URL(navigationUrl)

                // 외부 프로토콜 차단
                if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
                    logger.warn(`🚫 GIGA-CHAD: Blocked navigation to: ${parsedUrl.protocol}`)
                    event.preventDefault()
                }
            })

            // 새 윈도우 열기 제한  
            contents.setWindowOpenHandler(({ url }) => {
                logger.info(`🔗 GIGA-CHAD: Opening external URL: ${url}`)
                shell.openExternal(url)
                return { action: 'deny' }
            })

            // 기본 웹 요청 필터링
            this.setupRequestFiltering(contents.session)

            logger.info(`🛡️ GIGA-CHAD: Security applied to web contents ID: ${contents.id}`)
        })
    }

    /**
     * 권한 요청 핸들러 설정
     */
    private static setupPermissionHandlers(): void {
        // 권한 요청 차단 (필요한 것만 허용)
        app.on('web-contents-created', (_, contents) => {
            contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
                const allowedPermissions = [
                    'clipboard-read',
                    'clipboard-write',
                    'fullscreen',
                    'notifications'
                ]

                if (allowedPermissions.includes(permission)) {
                    logger.info(`✅ GIGA-CHAD: Permission granted: ${permission}`)
                    callback(true)
                } else {
                    logger.info(`🚫 GIGA-CHAD: Permission denied: ${permission}`)
                    callback(false)
                }
            })
        })
    }

    /**
     * 네비게이션 보안 설정
     */
    private static setupNavigationSecurity(): void {
        // 파일 프로토콜 접근 제한
        app.on('web-contents-created', (_, contents) => {
            contents.on('will-navigate', (event, navigationUrl) => {
                if (navigationUrl.startsWith('file://')) {
                    logger.warn(`🚫 GIGA-CHAD: Blocked file protocol access: ${navigationUrl}`)
                    event.preventDefault()
                }
            })
        })
    }

    /**
     * 요청 필터링 설정 (광고 차단 등)
     */
    private static setupRequestFiltering(session: Electron.Session): void {
        session.webRequest.onBeforeRequest((details, callback) => {
            const { url } = details

            // 기본적인 광고/트래커 차단
            const blockedDomains = [
                'doubleclick.net',
                'googletagmanager.com',
                'facebook.com/tr',
                'google-analytics.com',
                'googlesyndication.com',
                'scorecardresearch.com'
            ]

            const isBlocked = blockedDomains.some(domain => url.includes(domain))

            if (isBlocked) {
                logger.warn(`🚫 GIGA-CHAD: Blocked request: ${url}`)
                callback({ cancel: true })
            } else {
                callback({ cancel: false })
            }
        })
    }

    /**
     * CSP (Content Security Policy) 설정
     */
    static setupCSP(): void {
        app.on('web-contents-created', (_, contents) => {
            contents.session.webRequest.onHeadersReceived((details, callback) => {
                callback({
                    responseHeaders: {
                        ...details.responseHeaders,
                        'Content-Security-Policy': [
                            "default-src 'self'; " +
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
                            "style-src 'self' 'unsafe-inline' https:; " +
                            "img-src 'self' data: https:; " +
                            "connect-src 'self' https: wss:; " +
                            "font-src 'self' https:; " +
                            "media-src 'self' https:;"
                        ]
                    }
                })
            })
        })

        logger.info('🛡️ GIGA-CHAD: CSP policies applied')
    }
}