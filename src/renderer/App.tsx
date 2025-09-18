import React, { useState, useEffect, useRef } from 'react';
import PreferencesPage from './PreferencesPage';

const App: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [currentUrl, setCurrentUrl] = useState('https://www.google.com');
    const [isMemoryMonitorOpen, setIsMemoryMonitorOpen] = useState(false);
    const [memoryStats, setMemoryStats] = useState<any>(null);
    const [layoutDimensions, setLayoutDimensions] = useState({
        headerHeight: 60,
        sidebarWidth: 250
    });

    const headerRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // about: URL인지 확인
    const isAboutUrl = currentUrl.startsWith('about:');
    const isPreferencesPage = currentUrl === 'about:preferences';

    // 레이아웃 크기 측정 및 전달
    useEffect(() => {
        const updateDimensions = () => {
            const headerHeight = headerRef.current?.offsetHeight || 60;
            const sidebarWidth = isSidebarOpen ? (sidebarRef.current?.offsetWidth || 250) : 0;

            const newDimensions = { headerHeight, sidebarWidth };
            setLayoutDimensions(newDimensions);

            // IPC로 메인 프로세스에 레이아웃 정보 전달
            if (window.electronAPI) {
                window.electronAPI.updateLayout(newDimensions);
            }
        };

        // 초기 측정
        updateDimensions();

        // 창 크기 변경 감지
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (headerRef.current) resizeObserver.observe(headerRef.current);
        if (sidebarRef.current) resizeObserver.observe(sidebarRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [isSidebarOpen]);

    // 설정 변경 실시간 동기화
    useEffect(() => {
        if (window.electronAPI) {
            // 설정 변경 리스너
            const handleSettingsUpdate = (settings: any) => {
                console.log('Settings updated:', settings);

                // UI 설정 즉시 반영
                if (settings.ui) {
                    if (typeof settings.ui.showSidebar === 'boolean') {
                        setIsSidebarOpen(settings.ui.showSidebar);
                    }
                    if (typeof settings.ui.showHeaderBar === 'boolean') {
                        setIsHeaderVisible(settings.ui.showHeaderBar);
                    }
                    if (typeof settings.ui.sidebarWidth === 'number') {
                        setLayoutDimensions(prev => ({
                            ...prev,
                            sidebarWidth: settings.ui.sidebarWidth
                        }));
                    }
                    if (typeof settings.ui.headerHeight === 'number') {
                        setLayoutDimensions(prev => ({
                            ...prev,
                            headerHeight: settings.ui.headerHeight
                        }));
                    }
                }
            };

            window.electronAPI.onSettingsChanged(handleSettingsUpdate);

            // 초기 설정 로드
            window.electronAPI.getSettings().then((settings: any) => {
                if (settings?.ui) {
                    setIsSidebarOpen(settings.ui.showSidebar ?? true);
                    setIsHeaderVisible(settings.ui.showHeaderBar ?? true);
                    setLayoutDimensions({
                        headerHeight: settings.ui.headerHeight ?? 60,
                        sidebarWidth: settings.ui.sidebarWidth ?? 250
                    });
                }
            }).catch(console.error);
        }

        return () => {
            if (window.electronAPI) {
                window.electronAPI.removeSettingsListener();
            }
        };
    }, []);

    // 사이드바 상태 동기화
    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.onSidebarToggled((isOpen: boolean) => {
                setIsSidebarOpen(isOpen);
            });
        }

        return () => {
            if (window.electronAPI) {
                window.electronAPI.removeAllListeners();
            }
        };
    }, []);

    // 메모리 모니터링 토글 핸들러
    const handleMemoryMonitorToggle = () => {
        if (window.electronAPI) {
            window.electronAPI.toggleMemoryMonitor();
        }
    };

    // 메모리 모니터링 창 토글 이벤트 리스너
    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.onToggleMemoryMonitor(() => {
                setIsMemoryMonitorOpen(prev => !prev);
            });
        }

        return () => {
            if (window.electronAPI) {
                window.electronAPI.removeAllListeners();
            }
        };
    }, []);

    // 메모리 통계 업데이트
    useEffect(() => {
        if (!isMemoryMonitorOpen) return;

        const updateMemoryStats = async () => {
            if (window.electronAPI) {
                try {
                    const stats = await window.electronAPI.getMemoryStats();
                    setMemoryStats(stats);
                } catch (error) {
                    console.error('Failed to get memory stats:', error);
                }
            }
        };

        // 초기 로드
        updateMemoryStats();

        // 1초마다 업데이트
        const interval = setInterval(updateMemoryStats, 1000);

        return () => clearInterval(interval);
    }, [isMemoryMonitorOpen]);

    const handleSidebarToggle = () => {
        if (window.electronAPI) {
            window.electronAPI.toggleSidebar();
        }
    };

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (window.electronAPI && currentUrl.trim()) {
            window.electronAPI.navigateTo(currentUrl.trim());
        }
    };

    const handleCapturePage = async () => {
        if (window.electronAPI) {
            try {
                const imageBuffer = await window.electronAPI.capturePage();
                if (imageBuffer) {
                    const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/png' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `capture_${Date.now()}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            } catch (error) {
                console.error('Failed to capture page:', error);
            }
        }
    };

    // 설정 페이지 열기
    const handleOpenPreferences = () => {
        setCurrentUrl('about:preferences');
        // 실제로는 설정 페이지를 렌더러에서 보여주므로 메인 프로세스 네비게이션은 불필요
    };

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white">
            {/* 헤더바 (조건부 렌더링) */}
            {isHeaderVisible && (
                <header
                    ref={headerRef}
                    className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center space-x-4 flex-shrink-0"
                    style={{ height: `${layoutDimensions.headerHeight}px` }}
                >
                    {/* 사이드바 토글 */}
                    <button
                        onClick={handleSidebarToggle}
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
                    <form onSubmit={handleUrlSubmit} className="flex-1 max-w-2xl">
                        <input
                            type="text"
                            value={currentUrl}
                            onChange={(e) => setCurrentUrl(e.target.value)}
                            placeholder="주소를 입력하세요..."
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </form>

                    {/* 도구 버튼들 */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleCapturePage}
                            className="p-2 hover:bg-gray-700 rounded transition-colors"
                            title="페이지 캡쳐"
                        >
                            📸
                        </button>
                        <button className="p-2 hover:bg-gray-700 rounded transition-colors" title="새 탭">
                            +
                        </button>
                        <button
                            onClick={handleOpenPreferences}
                            className="p-2 hover:bg-gray-700 rounded transition-colors"
                            title="설정"
                        >
                            ⚙️
                        </button>
                        <button
                            onClick={handleMemoryMonitorToggle}
                            className="p-2 hover:bg-gray-700 rounded transition-colors"
                            title="메모리 모니터링"
                        >
                            📊
                        </button>
                    </div>
                </header>
            )}

            {/* 메인 콘텐츠 영역 */}
            <div className="flex-1 flex overflow-hidden">
                {/* 사이드바 */}
                {isSidebarOpen && (
                    <aside
                        ref={sidebarRef}
                        className="bg-gray-800 border-r border-gray-700 flex-shrink-0"
                        style={{ width: `${layoutDimensions.sidebarWidth}px` }}
                    >
                        <div className="p-4 h-full overflow-y-auto">
                            {/* 북마크 섹션 */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-400 mb-3">북마크</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => {
                                            setCurrentUrl('https://www.google.com')
                                            if (window.electronAPI) {
                                                window.electronAPI.navigateTo('https://www.google.com')
                                            }
                                        }}
                                        className="w-full text-left p-2 text-sm hover:bg-gray-700 rounded flex items-center space-x-2"
                                    >
                                        <span>🌐</span>
                                        <span>Google</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCurrentUrl('https://github.com')
                                            if (window.electronAPI) {
                                                window.electronAPI.navigateTo('https://github.com')
                                            }
                                        }}
                                        className="w-full text-left p-2 text-sm hover:bg-gray-700 rounded flex items-center space-x-2"
                                    >
                                        <span>🐙</span>
                                        <span>GitHub</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCurrentUrl('https://stackoverflow.com')
                                            if (window.electronAPI) {
                                                window.electronAPI.navigateTo('https://stackoverflow.com')
                                            }
                                        }}
                                        className="w-full text-left p-2 text-sm hover:bg-gray-700 rounded flex items-center space-x-2"
                                    >
                                        <span>💬</span>
                                        <span>Stack Overflow</span>
                                    </button>
                                    <button
                                        onClick={handleOpenPreferences}
                                        className="w-full text-left p-2 text-sm hover:bg-gray-700 rounded flex items-center space-x-2"
                                    >
                                        <span>⚙️</span>
                                        <span>설정</span>
                                    </button>
                                </div>
                            </div>

                            {/* 탭 섹션 */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-3">열린 탭</h3>
                                <div className="space-y-2">
                                    <div className="bg-gray-700 px-3 py-2 rounded flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs">
                                                {isPreferencesPage ? '⚙️' : '🌐'}
                                            </span>
                                            <span className="text-sm truncate">
                                                {isPreferencesPage ? '설정' : 'Google'}
                                            </span>
                                        </div>
                                        <button className="text-gray-400 hover:text-white text-sm">×</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                )}

                {/* Chrome 콘텐츠 영역 또는 about: 페이지 */}
                <main className="flex-1">
                    {isPreferencesPage ? (
                        // about:preferences 페이지
                        <PreferencesPage />
                    ) : isAboutUrl ? (
                        // 다른 about: 페이지들
                        <div className="h-full flex items-center justify-center bg-gray-100 text-gray-600">
                            <div className="text-center">
                                <div className="text-6xl mb-4">❓</div>
                                <h2 className="text-xl font-semibold mb-2">알 수 없는 페이지</h2>
                                <p className="text-sm">'{currentUrl}' 페이지를 찾을 수 없습니다.</p>
                            </div>
                        </div>
                    ) : (
                        // 일반 웹 페이지 (WebContentsView가 여기에 렌더링됨)
                        <div className="h-full flex items-center justify-center bg-gray-100 text-gray-600">
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
                        </div>
                    )}
                </main>
            </div>

            {/* 메모리 모니터링 창 */}
            {isMemoryMonitorOpen && (
                <div className="fixed top-4 right-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 min-w-80 z-50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">메모리 모니터링</h3>
                        <button
                            onClick={() => setIsMemoryMonitorOpen(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {memoryStats ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-700 p-3 rounded">
                                    <div className="text-sm text-gray-400">사용 메모리</div>
                                    <div className="text-xl font-bold text-blue-400">
                                        {(memoryStats.used / 1024 / 1024).toFixed(1)} MB
                                    </div>
                                </div>
                                <div className="bg-gray-700 p-3 rounded">
                                    <div className="text-sm text-gray-400">총 메모리</div>
                                    <div className="text-xl font-bold text-green-400">
                                        {(memoryStats.total / 1024 / 1024).toFixed(1)} MB
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-700 p-3 rounded">
                                <div className="text-sm text-gray-400 mb-2">메모리 사용률</div>
                                <div className="w-full bg-gray-600 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${memoryStats.percentage}%` }}
                                    ></div>
                                </div>
                                <div className="text-right text-sm text-gray-300 mt-1">
                                    {memoryStats.percentage.toFixed(1)}%
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-400">외부 메모리</div>
                                    <div className="text-white">{(memoryStats.external / 1024 / 1024).toFixed(1)} MB</div>
                                </div>
                                <div>
                                    <div className="text-gray-400">힙 사용량</div>
                                    <div className="text-white">{(memoryStats.heapUsed / 1024 / 1024).toFixed(1)} MB</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-8">
                            메모리 정보를 불러오는 중...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default App;