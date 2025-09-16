import { Menu, MenuItem, MenuItemConstructorOptions, BrowserWindow, WebContents } from 'electron'
import { createModuleLogger } from '../../shared/logger'
import { TabManager } from '../managers/tabManager'

// GIGA-CHAD: 컨텍스트 메뉴 서비스
export class ContextMenuService {
    private static instance: ContextMenuService
    private static logger = createModuleLogger('ContextMenuService')

    private constructor() { }

    static getInstance(): ContextMenuService {
        if (!this.instance) {
            this.instance = new ContextMenuService()
        }
        return this.instance
    }

    /**
     * 웹 콘텐츠에 컨텍스트 메뉴 등록
     */
    registerContextMenu(webContents: WebContents): void {
        webContents.on('context-menu', (event, params) => {
            this.showContextMenu(webContents, params)
        })

        ContextMenuService.logger.info(`Context menu registered for WebContents ${webContents.id}`)
    }

    /**
     * 컨텍스트 메뉴 표시
     */
    private showContextMenu(webContents: WebContents, params: Electron.ContextMenuParams): void {
        const template: MenuItemConstructorOptions[] = []

        // 링크 컨텍스트
        if (params.linkURL) {
            template.push(
                {
                    label: '링크 열기',
                    click: () => {
                        this.openLinkInNewTab(params.linkURL)
                    }
                },
                {
                    label: '링크 복사',
                    click: () => {
                        this.copyToClipboard(params.linkURL)
                    }
                },
                { type: 'separator' }
            )
        }

        // 이미지 컨텍스트
        if (params.hasImageContents) {
            template.push(
                {
                    label: '이미지 복사',
                    click: () => {
                        webContents.copyImageAt(params.x, params.y)
                    }
                },
                {
                    label: '이미지 다른 이름으로 저장',
                    click: () => {
                        webContents.downloadURL(params.srcURL)
                    }
                },
                { type: 'separator' }
            )
        }

        // 텍스트 편집 컨텍스트
        if (params.isEditable) {
            template.push(
                {
                    label: '실행 취소',
                    role: 'undo',
                    enabled: params.editFlags.canUndo
                },
                {
                    label: '다시 실행',
                    role: 'redo',
                    enabled: params.editFlags.canRedo
                },
                { type: 'separator' },
                {
                    label: '잘라내기',
                    role: 'cut',
                    enabled: params.editFlags.canCut
                },
                {
                    label: '복사',
                    role: 'copy',
                    enabled: params.editFlags.canCopy
                },
                {
                    label: '붙여넣기',
                    role: 'paste',
                    enabled: params.editFlags.canPaste
                },
                {
                    label: '모두 선택',
                    role: 'selectAll',
                    enabled: params.editFlags.canSelectAll
                },
                { type: 'separator' }
            )
        } else if (params.selectionText) {
            // 텍스트가 선택된 경우
            template.push(
                {
                    label: '복사',
                    role: 'copy'
                },
                {
                    label: '선택한 텍스트로 검색',
                    click: () => {
                        this.searchSelectedText(params.selectionText)
                    }
                },
                { type: 'separator' }
            )
        }

        // 기본 네비게이션 메뉴
        template.push(
            {
                label: '뒤로 가기',
                enabled: webContents.navigationHistory.canGoBack(),
                click: () => {
                    webContents.navigationHistory.goBack()
                }
            },
            {
                label: '앞으로 가기',
                enabled: webContents.navigationHistory.canGoForward(),
                click: () => {
                    webContents.navigationHistory.goForward()
                }
            },
            {
                label: '새로 고침',
                click: () => {
                    webContents.reload()
                }
            },
            { type: 'separator' }
        )

        // 페이지 관련 메뉴
        template.push(
            {
                label: '페이지 소스 보기',
                click: () => {
                    this.viewPageSource(webContents)
                }
            },
            {
                label: '개발자 도구',
                click: () => {
                    webContents.toggleDevTools()
                }
            }
        )

        const menu = Menu.buildFromTemplate(template)
        const window = BrowserWindow.fromWebContents(webContents)

        if (window) {
            menu.popup({ window })
        }
    }

    /**
     * 새 탭에서 링크 열기
     */
    private async openLinkInNewTab(url: string): Promise<void> {
        try {
            const tabManager = TabManager.getInstance()
            const newTab = await tabManager.createTab(url)
            await tabManager.switchTab(newTab.id)

            ContextMenuService.logger.info(`Opened link in new tab: ${url}`)
        } catch (error) {
            ContextMenuService.logger.error('Failed to open link in new tab', error)
        }
    }

    /**
     * 클립보드에 복사
     */
    private copyToClipboard(text: string): void {
        const { clipboard } = require('electron')
        clipboard.writeText(text)
        ContextMenuService.logger.info(`Copied to clipboard: ${text.substring(0, 50)}...`)
    }

    /**
     * 선택된 텍스트로 검색
     */
    private async searchSelectedText(text: string): Promise<void> {
        try {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(text)}`
            const tabManager = TabManager.getInstance()
            const newTab = await tabManager.createTab(searchUrl)
            await tabManager.switchTab(newTab.id)

            ContextMenuService.logger.info(`Searching for: ${text}`)
        } catch (error) {
            ContextMenuService.logger.error('Failed to search selected text', error)
        }
    }

    /**
     * 페이지 소스 보기
     */
    private viewPageSource(webContents: WebContents): void {
        const sourceWindow = new BrowserWindow({
            width: 800,
            height: 600,
            title: 'Page Source',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        })

        webContents.executeJavaScript('document.documentElement.outerHTML')
            .then(source => {
                const escapedSource = source.replace(/</g, '&lt;').replace(/>/g, '&gt;')
                const html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Page Source</title>
                        <style>
                            body { font-family: monospace; white-space: pre-wrap; margin: 20px; }
                        </style>
                    </head>
                    <body>${escapedSource}</body>
                    </html>
                `
                sourceWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
            })
            .catch(error => {
                ContextMenuService.logger.error('Failed to get page source', error)
            })
    }

    /**
     * 컨텍스트 메뉴 해제
     */
    unregisterContextMenu(webContents: WebContents): void {
        webContents.removeAllListeners('context-menu')
        ContextMenuService.logger.info(`Context menu unregistered for WebContents ${webContents.id}`)
    }
}