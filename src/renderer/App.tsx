import React, { useState, useEffect, useRef } from 'react';
import Frame from './components/UI/Frame';
import Header from './components/UI/Header';
import SideBar from './components/UI/SideBar';
import MainContent from './components/UI/MainContent';
import MemoryMonitor from './components/UI/MemoryMonitor';
import { useMemoryMonitor } from './hooks/useMemoryMonitor';

const App: React.FC = () => {
    // 중앙 상태 관리
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [currentUrl, setCurrentUrl] = useState('https://www.google.com');
    const [layoutDimensions, setLayoutDimensions] = useState({
        headerHeight: 60,
        sidebarWidth: 250
    });

    // Refs
    const headerRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // 메모리 모니터링 훅
    const { isMemoryMonitorOpen, memoryStats, handleMemoryMonitorToggle, setIsMemoryMonitorOpen } = useMemoryMonitor();

    // URL 관련 계산
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

    // 이벤트 핸들러들
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

    const handleOpenPreferences = () => {
        setCurrentUrl('about:preferences');
    };

    // Listen for show-preferences event from main
    useEffect(() => {
        if (window.electronAPI && window.electronAPI.onShowPreferences) {
            window.electronAPI.onShowPreferences(() => {
                setCurrentUrl('about:preferences')
            })
        }
    }, [])

    return (
        <Frame>
            <div className="h-full flex flex-col">
                {/* 헤더 컴포넌트 */}
                <Header
                    ref={headerRef}
                    isVisible={isHeaderVisible}
                    currentUrl={currentUrl}
                    onUrlChange={setCurrentUrl}
                    onUrlSubmit={handleUrlSubmit}
                    onSidebarToggle={handleSidebarToggle}
                    onMemoryMonitorToggle={handleMemoryMonitorToggle}
                    onCapturePage={handleCapturePage}
                    onOpenPreferences={handleOpenPreferences}
                />

                {/* 메인 콘텐츠 영역 */}
                <div className="flex-1 flex overflow-hidden">
                    {/* 사이드바 컴포넌트 */}
                    <SideBar
                        ref={sidebarRef}
                        isOpen={isSidebarOpen}
                        currentUrl={currentUrl}
                        onUrlChange={setCurrentUrl}
                        onNavigate={(url) => {
                            if (window.electronAPI) {
                                window.electronAPI.navigateTo(url);
                            }
                        }}
                        onToggle={handleSidebarToggle}
                    />

                    {/* 메인 콘텐츠 컴포넌트 */}
                    <MainContent
                        isAboutUrl={isAboutUrl}
                        isPreferencesPage={isPreferencesPage}
                        currentUrl={currentUrl}
                        layoutDimensions={layoutDimensions}
                    />
                </div>

                {/* 메모리 모니터링 컴포넌트 */}
                <MemoryMonitor
                    isOpen={isMemoryMonitorOpen}
                    memoryStats={memoryStats}
                    onClose={() => setIsMemoryMonitorOpen(false)}
                />
            </div>
        </Frame>
    );
};

export default App;