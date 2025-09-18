import React, { forwardRef } from 'react';

interface SideBarProps {
    isOpen: boolean;
    onToggle: () => void;
    currentUrl: string;
    onUrlChange: (url: string) => void;
    onNavigate: (url: string) => void;
}

const SideBar = forwardRef<HTMLDivElement, SideBarProps>(({
    isOpen,
    onToggle,
    currentUrl,
    onUrlChange,
    onNavigate
}, ref) => {
    if (!isOpen) return null;

    return (
        <aside
            ref={ref}
            className="bg-gray-800 border-r border-gray-700 flex-shrink-0 w-64"
        >
            <div className="p-4 h-full overflow-y-auto">
                {/* 사이드바 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">Loop Browser</h2>
                    <button
                        onClick={onToggle}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                        title="사이드바 닫기"
                    >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* 북마크 섹션 */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">북마크</h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => {
                                onUrlChange('https://www.google.com');
                                onNavigate('https://www.google.com');
                            }}
                            className="w-full text-left p-2 text-sm hover:bg-gray-700 rounded flex items-center space-x-2 transition-colors"
                        >
                            <span>🌐</span>
                            <span>Google</span>
                        </button>
                        <button
                            onClick={() => {
                                onUrlChange('https://github.com');
                                onNavigate('https://github.com');
                            }}
                            className="w-full text-left p-2 text-sm hover:bg-gray-700 rounded flex items-center space-x-2 transition-colors"
                        >
                            <span>📚</span>
                            <span>GitHub</span>
                        </button>
                        <button
                            onClick={() => {
                                onUrlChange('https://stackoverflow.com');
                                onNavigate('https://stackoverflow.com');
                            }}
                            className="w-full text-left p-2 text-sm hover:bg-gray-700 rounded flex items-center space-x-2 transition-colors"
                        >
                            <span>💬</span>
                            <span>Stack Overflow</span>
                        </button>
                    </div>
                </div>

                {/* 최근 방문 섹션 */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">최근 방문</h3>
                    <div className="space-y-2">
                        <div className="text-xs text-gray-500 p-2 bg-gray-700 rounded">
                            최근 방문한 페이지가 여기에 표시됩니다
                        </div>
                    </div>
                </div>

                {/* 설정 섹션 */}
                <div className="border-t border-gray-700 pt-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">빠른 설정</h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => {
                                onUrlChange('about:preferences');
                            }}
                            className="w-full text-left p-2 text-sm hover:bg-gray-700 rounded flex items-center space-x-2 transition-colors"
                        >
                            <span>⚙️</span>
                            <span>설정</span>
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
});

SideBar.displayName = 'SideBar';

export default SideBar;