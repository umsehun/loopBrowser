// 탭 관련 타입
export interface Tab {
    id: string
    title: string
    url: string
    favicon?: string
    isActive: boolean
    isLoading: boolean
    isDevTools?: boolean
    isPersistent?: boolean // 영구 보존 탭
}

// 탭 섹션 타입
export interface TabSection {
    id: string
    name: string
    type: 'shortcuts' | 'persistent' | 'normal'
    tabs: Tab[]
    isCollapsed?: boolean
}

export type TabEventType =
    | 'tab-created'
    | 'tab-activated'
    | 'tab-closed'
    | 'tab-updated'
    | 'tab-moved'