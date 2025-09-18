import React from 'react';
import PreferencesPage from '../../PreferencesPage';

interface MainContentProps {
    isAboutUrl: boolean;
    isPreferencesPage: boolean;
    currentUrl: string;
    layoutDimensions: {
        headerHeight: number;
        sidebarWidth: number;
    };
}

const MainContent: React.FC<MainContentProps> = ({
    isAboutUrl,
    isPreferencesPage,
    currentUrl,
    layoutDimensions
}) => {
    if (isPreferencesPage) {
        // about:preferences 페이지
        return (
            <main className="flex-1 overflow-hidden">
                <PreferencesPage />
            </main>
        );
    }

    if (isAboutUrl) {
        // 다른 about: 페이지들
        return (
            <main className="flex-1 flex items-center justify-center bg-gray-100 text-gray-600">
                <div className="text-center">
                    <div className="text-6xl mb-4">❓</div>
                    <h2 className="text-xl font-semibold mb-2">알 수 없는 페이지</h2>
                    <p className="text-sm">'{currentUrl}' 페이지를 찾을 수 없습니다.</p>
                </div>
            </main>
        );
    }

    // 일반 웹 페이지 (WebContentsView가 여기에 렌더링됨)
    return (
        <main className="flex-1 flex items-center justify-center bg-gray-100 text-gray-600">
            <div className="text-center">
                <div className="text-6xl mb-4">🌐</div>
                <h2 className="text-xl font-semibold mb-2">Chrome 콘텐츠 영역</h2>
                <p className="text-sm mb-4">WebContentsView가 이 영역에 렌더링됩니다</p>
                <div className="text-xs bg-white px-3 py-2 rounded border">
                    <p>헤더 높이: {layoutDimensions.headerHeight}px</p>
                    <p>사이드바 너비: {layoutDimensions.sidebarWidth}px</p>
                    <p>현재 URL: {currentUrl}</p>
                </div>
            </div>
        </main>
    );
};

export default MainContent;