import React, { useState } from 'react'
import {
    X,
    Plus,
    ChevronDown,
    Bookmark,
    Clock,
    Folder,
    Globe
} from 'lucide-react'
import { TabInfo } from '../../shared/types'

interface SideBarProps {
    tabs: TabInfo[]
    activeTabId: string
    onCreateTab: () => void
    onCloseTab: (tabId: string) => void
    onSwitchTab: (tabId: string) => void
    isCollapsed: boolean
    onToggleCollapse: () => void
    isVisible?: boolean // GIGA-CHAD: 자동 숨김을 위한 prop
}

interface TabGroupProps {
    title: string
    tabs: TabInfo[]
    activeTabId: string
    onSwitchTab: (tabId: string) => void
    onCloseTab: (tabId: string) => void
    isCollapsed?: boolean
}

// GIGA-CHAD: 탭 그룹 컴포넌트
const TabGroup: React.FC<TabGroupProps> = ({
    title,
    tabs,
    activeTabId,
    onSwitchTab,
    onCloseTab,
    isCollapsed = false
}) => {
    const [isGroupCollapsed, setIsGroupCollapsed] = useState(false)

    return (
        <div className="tab-group">
            <div
                className="tab-group-header"
                onClick={() => setIsGroupCollapsed(!isGroupCollapsed)}
            >
                <ChevronDown
                    size={14}
                    className={`tab-group-chevron ${isGroupCollapsed ? 'collapsed' : ''}`}
                />
                <span className="tab-group-title">{title}</span>
                <span className="tab-group-count">{tabs.length}</span>
            </div>

            {!isGroupCollapsed && (
                <div className="tab-group-content">
                    {tabs.map((tab) => (
                        <div
                            key={tab.id}
                            className={`sidebar-tab ${tab.id === activeTabId ? 'active' : ''}`}
                            onClick={() => onSwitchTab(tab.id)}
                        >
                            <div className="sidebar-tab-content">
                                <div className="sidebar-tab-favicon">
                                    <Globe size={14} />
                                </div>
                                {!isCollapsed && (
                                    <>
                                        <div className="sidebar-tab-info">
                                            <span className="sidebar-tab-title">{tab.title}</span>
                                            <span className="sidebar-tab-url">{tab.url}</span>
                                        </div>
                                        <button
                                            className="sidebar-tab-close"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onCloseTab(tab.id)
                                            }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </>
                                )}
                            </div>
                            {tab.loading && (
                                <div className="sidebar-tab-loading">
                                    <div className="loading-spinner"></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// GIGA-CHAD: Zen/Arc 스타일 사이드바
export const SideBar: React.FC<SideBarProps> = ({
    tabs,
    activeTabId,
    onCreateTab,
    onCloseTab,
    onSwitchTab,
    isCollapsed,
    onToggleCollapse,
    isVisible = true // GIGA-CHAD: 기본값은 표시
}) => {
    const [activeSection, setActiveSection] = useState<'tabs' | 'bookmarks' | 'history'>('tabs')

    // 탭을 Today, Yesterday, Older로 그룹화 (Arc 스타일)
    const groupTabs = (tabs: TabInfo[]) => {
        const today = new Date().toDateString()
        const yesterday = new Date(Date.now() - 86400000).toDateString()

        return {
            today: tabs.filter(() => true), // 임시로 모든 탭을 today에
            yesterday: [],
            older: []
        }
    }

    const groupedTabs = groupTabs(tabs)

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${!isVisible ? 'auto-hide' : ''}`}>
            {/* 사이드바 헤더 */}
            <div className="sidebar-header">
                {!isCollapsed && (
                    <div className="sidebar-sections">
                        <button
                            className={`sidebar-section-button ${activeSection === 'tabs' ? 'active' : ''}`}
                            onClick={() => setActiveSection('tabs')}
                        >
                            <span>탭</span>
                        </button>
                        <button
                            className={`sidebar-section-button ${activeSection === 'bookmarks' ? 'active' : ''}`}
                            onClick={() => setActiveSection('bookmarks')}
                        >
                            <Bookmark size={14} />
                            <span>북마크</span>
                        </button>
                        <button
                            className={`sidebar-section-button ${activeSection === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveSection('history')}
                        >
                            <Clock size={14} />
                            <span>히스토리</span>
                        </button>
                    </div>
                )}

                <button
                    className="sidebar-toggle"
                    onClick={onToggleCollapse}
                    title={isCollapsed ? '사이드바 확장' : '사이드바 축소'}
                >
                    <ChevronDown size={16} className={isCollapsed ? 'rotate-90' : 'rotate-180'} />
                </button>
            </div>

            {/* 새 탭 버튼 */}
            <div className="sidebar-new-tab">
                <button
                    className="new-tab-button"
                    onClick={onCreateTab}
                    title="새 탭"
                >
                    <Plus size={16} />
                    {!isCollapsed && <span>새 탭</span>}
                </button>
            </div>

            {/* 탭 섹션 */}
            {activeSection === 'tabs' && (
                <div className="sidebar-content">
                    {groupedTabs.today.length > 0 && (
                        <TabGroup
                            title="오늘"
                            tabs={groupedTabs.today}
                            activeTabId={activeTabId}
                            onSwitchTab={onSwitchTab}
                            onCloseTab={onCloseTab}
                            isCollapsed={isCollapsed}
                        />
                    )}

                    {groupedTabs.yesterday.length > 0 && (
                        <TabGroup
                            title="어제"
                            tabs={groupedTabs.yesterday}
                            activeTabId={activeTabId}
                            onSwitchTab={onSwitchTab}
                            onCloseTab={onCloseTab}
                            isCollapsed={isCollapsed}
                        />
                    )}

                    {groupedTabs.older.length > 0 && (
                        <TabGroup
                            title="이전"
                            tabs={groupedTabs.older}
                            activeTabId={activeTabId}
                            onSwitchTab={onSwitchTab}
                            onCloseTab={onCloseTab}
                            isCollapsed={isCollapsed}
                        />
                    )}
                </div>
            )}

            {/* 북마크 섹션 */}
            {activeSection === 'bookmarks' && !isCollapsed && (
                <div className="sidebar-content">
                    <div className="sidebar-section-content">
                        <div className="sidebar-placeholder">
                            <Folder size={24} />
                            <span>북마크가 없습니다</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 히스토리 섹션 */}
            {activeSection === 'history' && !isCollapsed && (
                <div className="sidebar-content">
                    <div className="sidebar-section-content">
                        <div className="sidebar-placeholder">
                            <Clock size={24} />
                            <span>히스토리가 없습니다</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 사이드바 푸터 */}
            <div className="sidebar-footer">
                {!isCollapsed && (
                    <div className="sidebar-stats">
                        <span>{tabs.length}개 탭</span>
                    </div>
                )}
            </div>
        </div>
    )
}