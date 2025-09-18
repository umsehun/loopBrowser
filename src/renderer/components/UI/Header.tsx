import React, { useRef, forwardRef } from 'react';

interface HeaderProps {
    isVisible: boolean;
    currentUrl: string;
    onUrlChange: (url: string) => void;
    onUrlSubmit: (e: React.FormEvent) => void;
    onSidebarToggle: () => void;
    onMemoryMonitorToggle: () => void;
    onCapturePage: () => void;
    onOpenPreferences: () => void;
}

const Header = forwardRef<HTMLDivElement, HeaderProps>(({
    isVisible,
    currentUrl,
    onUrlChange,
    onUrlSubmit,
    onSidebarToggle,
    onMemoryMonitorToggle,
    onCapturePage,
    onOpenPreferences
}, ref) => {
    if (!isVisible) return null;

    return (
        <header
            ref={ref}
            className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center space-x-4 flex-shrink-0"
        >
            {/* 사이드바 토글 */}
            <button
                onClick={onSidebarToggle}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                title="사이드바 토글"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* 네비게이션 버튼들 */}
            <div className="flex space-x-2">
                <button className="p-2 hover:bg-gray-700 rounded transition-colors" title="뒤로">
                    ←
                </button>
                <button className="p-2 hover:bg-gray-700 rounded transition-colors" title="앞으로">
                    →
                </button>
                <button className="p-2 hover:bg-gray-700 rounded transition-colors" title="새로고침">
                    ↻
                </button>
            </div>

            {/* URL 입력창 */}
            <form onSubmit={onUrlSubmit} className="flex-1 max-w-2xl">
                <input
                    type="text"
                    value={currentUrl}
                    onChange={(e) => onUrlChange(e.target.value)}
                    placeholder="주소를 입력하세요..."
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
            </form>

            {/* 도구 버튼들 */}
            <div className="flex items-center space-x-2">
                <button
                    onClick={onCapturePage}
                    className="p-2 hover:bg-gray-700 rounded transition-colors"
                    title="페이지 캡쳐"
                >
                    📸
                </button>
                <button className="p-2 hover:bg-gray-700 rounded transition-colors" title="새 탭">
                    +
                </button>
                <button
                    onClick={onMemoryMonitorToggle}
                    className="p-2 hover:bg-gray-700 rounded transition-colors"
                    title="메모리 모니터링"
                >
                    📊
                </button>
                <button
                    onClick={onOpenPreferences}
                    className="p-2 hover:bg-gray-700 rounded transition-colors"
                    title="설정"
                >
                    ⚙️
                </button>
            </div>
        </header>
    );
});

Header.displayName = 'Header';

export default Header;