import React from 'react'
import { Plus, X } from 'lucide-react'
import { TabInfo } from '../../shared/types'

interface TabBarProps {
    tabs: TabInfo[]
    activeTabId: string
    onCreateTab: () => void
    onCloseTab: (tabId: string) => void
    onSwitchTab: (tabId: string) => void
}

// GIGA-CHAD: 탭 바 컴포넌트
const TabBar: React.FC<TabBarProps> = ({
    tabs,
    activeTabId,
    onCreateTab,
    onCloseTab,
    onSwitchTab
}) => {
    return (
        <div className="tab-bar">
            {/* GIGA-CHAD: 탭 목록 */}
            <div className="flex flex-1 overflow-x-auto">
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
                        onClick={() => onSwitchTab(tab.id)}
                    >
                        {/* 파비콘 */}
                        {tab.favicon ? (
                            <img
                                src={tab.favicon}
                                alt=""
                                className="w-4 h-4 mr-2 flex-shrink-0"
                                onError={(e) => {
                                    // 파비콘 로딩 실패 시 기본 아이콘으로 대체
                                    e.currentTarget.style.display = 'none'
                                }}
                            />
                        ) : (
                            <div className="w-4 h-4 mr-2 bg-gray-500 rounded-sm flex-shrink-0"></div>
                        )}

                        {/* 로딩 스피너 또는 제목 */}
                        {tab.loading ? (
                            <div className="loading-spinner mr-2"></div>
                        ) : null}

                        <span className="tab-title" title={tab.title || tab.url}>
                            {tab.title || tab.url || '새 탭'}
                        </span>

                        {/* 일시정지 표시 */}
                        {tab.suspended && (
                            <span className="text-xs text-yellow-400 mr-2" title="백그라운드에서 일시정지됨">
                                ⏸
                            </span>
                        )}

                        {/* 닫기 버튼 */}
                        <button
                            className="tab-close"
                            onClick={(e) => {
                                e.stopPropagation()
                                onCloseTab(tab.id)
                            }}
                            title="탭 닫기"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>

            {/* GIGA-CHAD: 새 탭 버튼 */}
            <button
                className="nav-button ml-1"
                onClick={onCreateTab}
                title="새 탭 (Ctrl+T)"
            >
                <Plus size={16} />
            </button>
        </div>
    )
}

export default TabBar