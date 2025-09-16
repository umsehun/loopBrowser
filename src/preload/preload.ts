import { contextBridge, ipcRenderer } from 'electron'
import { createModuleLogger } from '../shared/logger'

const logger = createModuleLogger('Preload')

// GIGA-CHAD: 안전한 API 노출
const api = {
    // 탭 관리
    tab: {
        create: (url: string) => ipcRenderer.invoke('tab:create', url),
        close: (tabId: string) => ipcRenderer.invoke('tab:close', tabId),
        switch: (tabId: string) => ipcRenderer.invoke('tab:switch', tabId),
        getAll: () => ipcRenderer.invoke('tab:getAll'),
        updateUrl: (tabId: string, url: string) => ipcRenderer.invoke('tab:updateUrl', tabId, url)
    },

    // 검색 엔진
    search: {
        google: (query: string) => ipcRenderer.invoke('search:google', query),
        getSuggestions: (query: string) => ipcRenderer.invoke('search:suggestions', query)
    },

    // 브라우저 제어
    browser: {
        goBack: (tabId: string) => ipcRenderer.invoke('browser:goBack', tabId),
        goForward: (tabId: string) => ipcRenderer.invoke('browser:goForward', tabId),
        reload: (tabId: string) => ipcRenderer.invoke('browser:reload', tabId),
        stop: (tabId: string) => ipcRenderer.invoke('browser:stop', tabId)
    },

    // 북마크 관리
    bookmarks: {
        add: (url: string, title: string) => ipcRenderer.invoke('bookmarks:add', url, title),
        remove: (url: string) => ipcRenderer.invoke('bookmarks:remove', url),
        getAll: () => ipcRenderer.invoke('bookmarks:getAll')
    },

    // UI 상태 관리
    ui: {
        updateSidebarState: (collapsed: boolean) => ipcRenderer.invoke('ui:updateSidebarState', collapsed)
    },

    // 성능 모니터링
    performance: {
        getMemoryUsage: () => ipcRenderer.invoke('performance:getMemoryUsage'),
        getCPUUsage: () => ipcRenderer.invoke('performance:getCPUUsage'),
        onMetricsUpdate: (callback: (metrics: any) => void) => {
            ipcRenderer.on('performance:metrics', (_, metrics) => callback(metrics))
        }
    },

    // 이벤트 리스너 (탭 상태 변경 등)
    events: {
        onTabUpdate: (callback: (tabInfo: any) => void) => {
            ipcRenderer.on('tab:updated', (_, tabInfo) => callback(tabInfo))
        },
        onTabCreated: (callback: (tabInfo: any) => void) => {
            ipcRenderer.on('tab:created', (_, tabInfo) => callback(tabInfo))
        },
        onTabClosed: (callback: (tabId: string) => void) => {
            ipcRenderer.on('tab:closed', (_, tabId) => callback(tabId))
        }
    }
}

// GIGA-CHAD: contextBridge로 안전하게 API 노출
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('gigaBrowser', api)
    } catch (error) {
        logger.error('Failed to expose Giga Browser API:', error)
    }
} else {
    // Fallback for older Electron versions
    ; (window as any).gigaBrowser = api
}

// GIGA-CHAD: 백그라운드 스로틀링 최적화
document.addEventListener('DOMContentLoaded', () => {
    // 페이지 visibility 변경 감지
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // 백그라운드로 전환 시 미디어 일시정지
            document.querySelectorAll('video, audio').forEach((media: any) => {
                if (!media.paused) {
                    media.pause()
                    media.dataset.wasPlaying = 'true'
                }
            })

            // 타이머 최소화 (기본 브라우저 동작)
            logger.info('🔥 GIGA-CHAD: Background throttling activated')
        } else {
            // 포그라운드 복귀 시 미디어 재생 복구
            document.querySelectorAll('video, audio').forEach((media: any) => {
                if (media.dataset.wasPlaying === 'true') {
                    media.play().catch(() => {
                        // 자동 재생 실패 시 무시 (사용자 제스처 필요)
                    })
                    delete media.dataset.wasPlaying
                }
            })

            logger.info('🔥 GIGA-CHAD: Foreground restored')
        }
    })
})