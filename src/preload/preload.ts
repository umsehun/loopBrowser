import { contextBridge, ipcRenderer } from 'electron'
import { createModuleLogger } from '../shared/logger/index'

// Preload 로거 생성
const preloadLogger = createModuleLogger('Preload', 'preload')

// UI와 메인 프로세스 간 안전한 통신을 위한 API
const api = {
    // 사이드바 토글
    toggleSidebar: () => ipcRenderer.send('toggle-sidebar'),

    // 웹 페이지 네비게이션
    navigateTo: (url: string) => ipcRenderer.send('navigate-to', url),

    // 창 제어 (커스텀 타이틀바용)
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('toggle-maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),

    // 창 상태 확인
    getWindowState: () => ipcRenderer.invoke('get-window-state'),

    // 웹페이지 캡쳐
    capturePage: () => ipcRenderer.invoke('capture-page'),

    // 탭 캡쳐
    captureTab: (tabId: string) => ipcRenderer.invoke('capture-tab', tabId),

    // 레이아웃 업데이트 (Chrome 영역 계산용)
    updateLayout: (dimensions: { headerHeight: number; sidebarWidth: number }) =>
        ipcRenderer.send('update-layout', dimensions),

    // 설정 관련 API
    getSettings: () => ipcRenderer.invoke('get-settings'),
    getUISettings: () => ipcRenderer.invoke('get-ui-settings'),
    setUISettings: (settings: any) => ipcRenderer.invoke('set-ui-settings', settings),
    getBrowserSettings: () => ipcRenderer.invoke('get-browser-settings'),
    setBrowserSettings: (settings: any) => ipcRenderer.invoke('set-browser-settings', settings),
    setUserAgentPreset: (preset: string) => ipcRenderer.invoke('set-user-agent-preset', preset),
    resetSettings: () => ipcRenderer.invoke('reset-settings'),

    // 설정 변경 리스너 추가
    onSettingsChanged: (callback: (settings: any) => void) => {
        ipcRenderer.on('settings-changed', (_, settings) => callback(settings))
    },

    // 설정 리스너 제거
    removeSettingsListener: () => {
        ipcRenderer.removeAllListeners('settings-changed')
    },

    // 사이드바 상태 변경 리스너
    onSidebarToggled: (callback: (isOpen: boolean) => void) => {
        ipcRenderer.on('sidebar-toggled', (_, isOpen) => callback(isOpen))
    },

    // 모든 리스너 제거
    removeAllListeners: () => {
        ipcRenderer.removeAllListeners()
    },

    // 메모리 모니터링 API
    toggleMemoryMonitor: () => ipcRenderer.send('toggle-memory-monitor'),
    getMemoryStats: () => ipcRenderer.invoke('get-memory-stats'),

    // 메모리 모니터링 이벤트 리스너
    onToggleMemoryMonitor: (callback: () => void) => {
        ipcRenderer.on('toggle-memory-monitor', () => callback())
    },
}

// 안전하게 API를 렌더러 프로세스에 노출
contextBridge.exposeInMainWorld('electronAPI', api)

// Preload 스크립트 로드 완료 로그
preloadLogger.info('Loop Browser preload script loaded successfully')
