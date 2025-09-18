// 공통 타입 내보내기
export * from './tab'
export * from './settings'

// 일반적인 유틸리티 타입
export interface Point {
    x: number
    y: number
}

export interface Size {
    width: number
    height: number
}

export interface Rect extends Point, Size { }

// IPC 이벤트 타입
export interface IPCEvent<T = any> {
    type: string
    payload: T
    timestamp: number
}

// 로그 레벨
export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

// 앱 상태
export type AppState = 'starting' | 'ready' | 'closing'

// Electron API 타입 정의 (preload에서 노출되는 API)
export interface ElectronAPI {
    // 사이드바 토글
    toggleSidebar: () => void

    // 웹 페이지 네비게이션
    navigateTo: (url: string) => void

    // 창 제어 (커스텀 타이틀바용)
    minimizeWindow: () => void
    maximizeWindow: () => void
    closeWindow: () => void
    toggleFullscreen: () => void

    // 창 상태 확인
    getWindowState: () => Promise<{ isMaximized: boolean; isFullscreen: boolean }>

    // 웹페이지 캡쳐
    capturePage: () => Promise<Buffer>

    // 탭 캡쳐
    captureTab: (tabId: string) => Promise<Buffer>

    // 레이아웃 업데이트 (Chrome 영역 계산용)
    updateLayout: (dimensions: { headerHeight: number; sidebarWidth: number }) => void

    // 설정 관련 API
    getSettings: () => Promise<any>
    getUISettings: () => Promise<any>
    setUISettings: (settings: any) => Promise<void>
    getBrowserSettings: () => Promise<any>
    setBrowserSettings: (settings: any) => Promise<void>
    setUserAgentPreset: (preset: string) => Promise<void>
    resetSettings: () => Promise<void>

    // 설정 변경 리스너 추가
    onSettingsChanged: (callback: (settings: any) => void) => void

    // 설정 리스너 제거
    removeSettingsListener: () => void

    // 사이드바 상태 변경 리스너
    onSidebarToggled: (callback: (isOpen: boolean) => void) => void

    // 모든 리스너 제거
    removeAllListeners: () => void
}

// Window 인터페이스 확장
declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}