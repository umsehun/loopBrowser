import React from 'react'

interface Tab {
    id: string
    title: string
    url: string
    isActive: boolean
}

interface TabBarProps {
    tabs: Tab[]
    activeTabId: string
    onTabClick: (tabId: string) => void
    onTabClose: (tabId: string) => void
    onNewTab: () => void
}

export const TabBar: React.FC<TabBarProps> = ({
    tabs,
    activeTabId,
    onTabClick,
    onTabClose,
    onNewTab
}) => {
    return (
        <div className="flex items-center bg-gray-800 border-b border-gray-700 px-2">
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    className={`flex items-center px-4 py-2 border-r border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${tab.isActive ? 'bg-gray-700 border-b-2 border-blue-400' : 'bg-gray-800'
                        }`}
                    onClick={() => onTabClick(tab.id)}
                >
                    <span className="text-sm text-gray-300 truncate max-w-32">
                        {tab.title || 'New Tab'}
                    </span>
                    <button
                        className="ml-2 text-gray-500 hover:text-gray-300"
                        onClick={(e) => {
                            e.stopPropagation()
                            onTabClose(tab.id)
                        }}
                    >
                        ×
                    </button>
                </div>
            ))}
            <button
                className="px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
                onClick={onNewTab}
            >
                +
            </button>
        </div>
    )
}