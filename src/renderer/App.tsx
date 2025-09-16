import React, { useState, useEffect } from 'react'
import { HeaderBar } from './components/HeaderBar'
import { SideBar } from './components/SideBar'
import PerformanceMonitor from './components/PerformanceMonitor'
import { TabInfo, PerformanceMetrics } from '../shared/types'
import Logger, { createModuleLogger } from '../shared/logger'

const logger = createModuleLogger('App')

// GIGA-CHAD: Zen/Arc 스타일 메인 브라우저 앱
const App: React.FC = () => {
    const [tabs, setTabs] = useState<TabInfo[]>([])
    const [activeTabId, setActiveTabId] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    // GIGA-CHAD: 앱 초기화
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // 기존 탭 로드
                const existingTabs = await window.gigaBrowser.tab.getAll()
                setTabs(existingTabs)

                if (existingTabs.length === 0) {
                    // 첫 실행 시 기본 탭 생성
                    const newTab = await window.gigaBrowser.tab.create('https://www.google.com')
                    setTabs([newTab])
                    setActiveTabId(newTab.id)
                } else {
                    // 활성 탭 찾기
                    const activeTab = existingTabs.find(tab => tab.isActive)
                    if (activeTab) {
                        setActiveTabId(activeTab.id)
                    }
                }

                setIsLoading(false)
            } catch (error) {
                logger.error('앱 초기화 실패:', error)
                setIsLoading(false)
            }
        }

        initializeApp()
    }, [])

    // GIGA-CHAD: 성능 메트릭 수집
    useEffect(() => {
        const collectMetrics = async () => {
            try {
                // const metrics = await window.gigaBrowser.system.getPerformanceMetrics()
                // setPerformanceMetrics(metrics)

                // 임시 더미 데이터
                setPerformanceMetrics({
                    memory: {
                        rss: Math.random() * 200 + 100,
                        heapUsed: Math.random() * 150 + 50,
                        external: Math.random() * 50 + 10,
                        total: 1024
                    },
                    cpu: {
                        percentCPUUsage: Math.random() * 30 + 10
                    },
                    tabs: {
                        total: tabs.length,
                        active: 1,
                        suspended: 0
                    },
                    uptime: Date.now() / 1000
                })
            } catch (error) {
                logger.error('성능 메트릭 수집 실패:', error)
            }
        }

        // 초기 수집
        collectMetrics()

        // 5초마다 메트릭 업데이트
        const interval = setInterval(collectMetrics, 5000)
        return () => clearInterval(interval)
    }, [tabs.length])

    // GIGA-CHAD: 새 탭 생성
    const handleCreateTab = async () => {
        try {
            const newTab = await window.gigaBrowser.tab.create('https://www.google.com')
            setTabs(prevTabs => [...prevTabs, newTab])
            setActiveTabId(newTab.id)
        } catch (error) {
            logger.error('탭 생성 실패:', error)
        }
    }

    // GIGA-CHAD: 탭 닫기
    const handleCloseTab = async (tabId: string) => {
        try {
            await window.gigaBrowser.tab.close(tabId)
            setTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId))

            // 활성 탭이 닫혔으면 다른 탭 활성화
            if (activeTabId === tabId) {
                const remainingTabs = tabs.filter(tab => tab.id !== tabId)
                if (remainingTabs.length > 0) {
                    const newActiveTab = remainingTabs[remainingTabs.length - 1]
                    setActiveTabId(newActiveTab.id)
                    await window.gigaBrowser.tab.switch(newActiveTab.id)
                } else {
                    setActiveTabId('')
                }
            }
        } catch (error) {
            logger.error('탭 닫기 실패:', error)
        }
    }

    // GIGA-CHAD: 탭 전환
    const handleSwitchTab = async (tabId: string) => {
        try {
            await window.gigaBrowser.tab.switch(tabId)
            setActiveTabId(tabId)
        } catch (error) {
            logger.error('탭 전환 실패:', error)
        }
    }

    // GIGA-CHAD: 네비게이션 핸들러
    const handleNavigateBack = async () => {
        try {
            if (activeTabId) {
                await window.gigaBrowser.browser.goBack(activeTabId)
            }
        } catch (error) {
            logger.error('뒤로 가기 실패:', error)
        }
    }

    const handleNavigateForward = async () => {
        try {
            if (activeTabId) {
                await window.gigaBrowser.browser.goForward(activeTabId)
            }
        } catch (error) {
            logger.error('앞으로 가기 실패:', error)
        }
    }

    const handleReload = async () => {
        try {
            if (activeTabId) {
                await window.gigaBrowser.browser.reload(activeTabId)
            }
        } catch (error) {
            logger.error('새로고침 실패:', error)
        }
    }

    const handleHome = async () => {
        try {
            if (activeTabId) {
                // goHome이 없으므로 기본 홈 페이지로 이동
                await window.gigaBrowser.tab.updateUrl(activeTabId, 'https://www.google.com')
            }
        } catch (error) {
            logger.error('홈으로 가기 실패:', error)
        }
    }

    const handleSearch = async (query: string) => {
        try {
            if (activeTabId) {
                // URL인지 검색어인지 판단
                const isUrl = query.includes('.') || query.startsWith('http')
                const url = isUrl ? (query.startsWith('http') ? query : `https://${query}`) : `https://www.google.com/search?q=${encodeURIComponent(query)}`

                await window.gigaBrowser.tab.updateUrl(activeTabId, url)
            }
        } catch (error) {
            logger.error('검색/네비게이션 실패:', error)
        }
    }

    // 현재 활성 탭 정보
    const activeTab = tabs.find(tab => tab.id === activeTabId)

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Giga Browser 로딩 중...</p>
            </div>
        )
    }

    return (
        <div className="app">
            {/* GIGA-CHAD: 상단 HeaderBar */}
            <HeaderBar
                activeTab={activeTab}
                onNavigateBack={handleNavigateBack}
                onNavigateForward={handleNavigateForward}
                onReload={handleReload}
                onHome={handleHome}
                onSearch={handleSearch}
                canGoBack={activeTab?.canGoBack || false}
                canGoForward={activeTab?.canGoForward || false}
            />

            {/* GIGA-CHAD: 메인 레이아웃 */}
            <div className="main-layout">
                {/* 왼쪽 SideBar */}
                <SideBar
                    tabs={tabs}
                    activeTabId={activeTabId}
                    onCreateTab={handleCreateTab}
                    onCloseTab={handleCloseTab}
                    onSwitchTab={handleSwitchTab}
                    isCollapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                />

                {/* 오른쪽 브라우저 뷰 영역 - BrowserView가 이 영역에 표시됨 */}
                <div className="browser-view-container">
                    {/* 탭이 없을 때만 시작 화면 표시 */}
                    {tabs.length === 0 ? (
                        <div className="start-screen">
                            <h1>Sao에 오신 것을 환영합니다!</h1>
                            <p>새 탭을 만들어 브라우징을 시작하세요.</p>
                            <button onClick={handleCreateTab} className="start-button">
                                새 탭 만들기
                            </button>
                        </div>
                    ) : (
                        // 탭이 있을 때는 투명한 영역 - BrowserView가 여기에 표시됨
                        <div className="web-content-area">
                            {/* BrowserView가 이 영역에 정확히 오버레이됩니다 */}
                        </div>
                    )}
                </div>
            </div>

            {/* GIGA-CHAD: 성능 모니터 */}
            {performanceMetrics && (
                <PerformanceMonitor
                    metrics={performanceMetrics}
                />
            )}
        </div>
    )
}

export default App