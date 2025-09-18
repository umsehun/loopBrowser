import React, { useState, useEffect } from 'react';
import { createModuleLogger } from '../shared/logger/index';

// Renderer 로거 생성
const rendererLogger = createModuleLogger('PreferencesPage', 'renderer')

interface UISettings {
    showSidebar: boolean
    sidebarAutoHide: boolean
    sidebarWidth: number
    showHeaderBar: boolean
    headerAutoHide: boolean
    headerHeight: number
    theme: 'dark' | 'light' | 'auto'
    compactMode: boolean
}

interface BrowserSettings {
    userAgent: string
    userAgentPreset: 'chrome' | 'firefox' | 'safari' | 'edge' | 'custom'
    defaultSearchEngine: string
    homePage: string
    downloadPath: string
    enableDevTools: boolean
    enableJavaScript: boolean
}

const PreferencesPage: React.FC = () => {
    const [uiSettings, setUISettings] = useState<UISettings | null>(null)
    const [browserSettings, setBrowserSettings] = useState<BrowserSettings | null>(null)
    const [loading, setLoading] = useState(true)

    // 설정 로드
    useEffect(() => {
        const loadSettings = async () => {
            try {
                if (window.electronAPI) {
                    const ui = await window.electronAPI.getUISettings()
                    const browser = await window.electronAPI.getBrowserSettings()
                    setUISettings(ui)
                    setBrowserSettings(browser)
                }
            } catch (error) {
                rendererLogger.error('Failed to load settings:', { error })
            } finally {
                setLoading(false)
            }
        }

        loadSettings()
    }, [])

    const handleUISettingChange = async (key: keyof UISettings, value: any) => {
        if (!uiSettings) return

        const newSettings = { ...uiSettings, [key]: value }
        setUISettings(newSettings)

        try {
            if (window.electronAPI) {
                // 전체 설정을 저장 (부분 업데이트 대신)
                await window.electronAPI.setUISettings(newSettings)
                rendererLogger.info(`UI setting ${key} changed to:`, { value })
            }
        } catch (error) {
            rendererLogger.error('Failed to save UI setting:', { error })
            // 실패시 이전 상태로 롤백
            setUISettings(uiSettings)
        }
    }

    const handleBrowserSettingChange = async (key: keyof BrowserSettings, value: any) => {
        if (!browserSettings) return

        const newSettings = { ...browserSettings, [key]: value }
        setBrowserSettings(newSettings)

        try {
            if (window.electronAPI) {
                // 전체 설정을 저장 (부분 업데이트 대신)
                await window.electronAPI.setBrowserSettings(newSettings)
                rendererLogger.info(`Browser setting ${key} changed to:`, { value })
            }
        } catch (error) {
            rendererLogger.error('Failed to save browser setting:', { error })
            // 실패시 이전 상태로 롤백
            setBrowserSettings(browserSettings)
        }
    }

    const handleUserAgentPresetChange = async (preset: string) => {
        try {
            if (window.electronAPI) {
                await window.electronAPI.setUserAgentPreset(preset)
                // 설정 다시 로드
                const browser = await window.electronAPI.getBrowserSettings()
                setBrowserSettings(browser)
            }
        } catch (error) {
            rendererLogger.error('Failed to change User-Agent preset:', { error })
        }
    }

    const handleResetSettings = async () => {
        if (confirm('모든 설정을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            try {
                if (window.electronAPI) {
                    await window.electronAPI.resetSettings()
                    // 설정 다시 로드
                    const ui = await window.electronAPI.getUISettings()
                    const browser = await window.electronAPI.getBrowserSettings()
                    setUISettings(ui)
                    setBrowserSettings(browser)
                }
            } catch (error) {
                rendererLogger.error('Failed to reset settings:', { error })
            }
        }
    }

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="text-4xl mb-4">⚙️</div>
                    <h2 className="text-xl font-semibold text-gray-600">설정 로딩 중...</h2>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full bg-gray-50 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6">
                {/* 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">설정</h1>
                    <p className="text-gray-600">Loop Browser의 설정을 관리하세요</p>
                </div>

                {/* UI 설정 섹션 */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">사용자 인터페이스</h2>
                        <p className="text-gray-600 mt-1">브라우저 UI 관련 설정</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* 사이드바 설정 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={uiSettings?.showSidebar || false}
                                        onChange={(e) => handleUISettingChange('showSidebar', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">사이드바 표시</span>
                                </label>
                            </div>

                            <div>
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={uiSettings?.showHeaderBar || false}
                                        onChange={(e) => handleUISettingChange('showHeaderBar', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">헤더바 표시</span>
                                </label>
                            </div>
                        </div>

                        {/* 테마 설정 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">테마</label>
                            <select
                                value={uiSettings?.theme || 'dark'}
                                onChange={(e) => handleUISettingChange('theme', e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="dark">다크</option>
                                <option value="light">라이트</option>
                                <option value="auto">시스템 설정 따름</option>
                            </select>
                        </div>

                        {/* 사이드바 너비 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                사이드바 너비: {uiSettings?.sidebarWidth || 250}px
                            </label>
                            <input
                                type="range"
                                min="200"
                                max="500"
                                value={uiSettings?.sidebarWidth || 250}
                                onChange={(e) => handleUISettingChange('sidebarWidth', parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* 브라우저 설정 섹션 */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">브라우저</h2>
                        <p className="text-gray-600 mt-1">브라우저 동작 관련 설정</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* User-Agent 설정 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">User-Agent</label>
                            <select
                                value={browserSettings?.userAgentPreset || 'chrome'}
                                onChange={(e) => handleUserAgentPresetChange(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="chrome">Chrome (권장)</option>
                                <option value="firefox">Firefox</option>
                                <option value="safari">Safari</option>
                                <option value="edge">Microsoft Edge</option>
                                <option value="custom">사용자 정의</option>
                            </select>
                            {browserSettings?.userAgentPreset === 'custom' && (
                                <textarea
                                    value={browserSettings?.userAgent || ''}
                                    onChange={(e) => handleBrowserSettingChange('userAgent', e.target.value)}
                                    className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                                    rows={3}
                                    placeholder="사용자 정의 User-Agent 입력..."
                                />
                            )}
                        </div>

                        {/* 홈페이지 설정 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">홈페이지</label>
                            <input
                                type="url"
                                value={browserSettings?.homePage || ''}
                                onChange={(e) => handleBrowserSettingChange('homePage', e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://www.google.com"
                            />
                        </div>

                        {/* 검색 엔진 설정 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">기본 검색 엔진</label>
                            <input
                                type="url"
                                value={browserSettings?.defaultSearchEngine || ''}
                                onChange={(e) => handleBrowserSettingChange('defaultSearchEngine', e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://www.google.com/search?q=%s"
                            />
                            <p className="mt-1 text-xs text-gray-500">%s는 검색어로 치환됩니다</p>
                        </div>

                        {/* 개발자 도구 설정 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={browserSettings?.enableDevTools || false}
                                        onChange={(e) => handleBrowserSettingChange('enableDevTools', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">개발자 도구 활성화</span>
                                </label>
                            </div>

                            <div>
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={browserSettings?.enableJavaScript || false}
                                        onChange={(e) => handleBrowserSettingChange('enableJavaScript', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">JavaScript 활성화</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 위험한 작업 섹션 */}
                <div className="bg-white rounded-lg shadow-sm border border-red-200">
                    <div className="p-6 border-b border-red-200">
                        <h2 className="text-xl font-semibold text-red-600">위험한 작업</h2>
                        <p className="text-red-500 mt-1">주의해서 사용하세요</p>
                    </div>

                    <div className="p-6">
                        <button
                            onClick={handleResetSettings}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            모든 설정 초기화
                        </button>
                        <p className="mt-2 text-xs text-gray-600">
                            모든 설정이 기본값으로 되돌아갑니다. 이 작업은 되돌릴 수 없습니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PreferencesPage