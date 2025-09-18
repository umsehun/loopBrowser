import React, { useState, useEffect } from 'react';
import { createModuleLogger } from '../../../shared/logger/index';

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

    const resetSettings = async () => {
        try {
            if (window.electronAPI) {
                await window.electronAPI.resetSettings()
                // 설정 다시 로드
                const ui = await window.electronAPI.getUISettings()
                const browser = await window.electronAPI.getBrowserSettings()
                setUISettings(ui)
                setBrowserSettings(browser)
                rendererLogger.info('All settings reset to defaults')
            }
        } catch (error) {
            rendererLogger.error('Failed to reset settings:', { error })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">설정을 불러오는 중...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        설정
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Loop Browser의 설정을 조정하세요.
                    </p>
                </div>

                {/* UI 설정 섹션 */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            UI 설정
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* 사이드바 설정 */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    사이드바 표시
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    브라우저 사이드바를 표시합니다.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={uiSettings?.showSidebar || false}
                                onChange={(e) => handleUISettingChange('showSidebar', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>

                        {/* 사이드바 자동 숨김 */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    사이드바 자동 숨김
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    마우스가 벗어나면 사이드바를 자동으로 숨깁니다.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={uiSettings?.sidebarAutoHide || false}
                                onChange={(e) => handleUISettingChange('sidebarAutoHide', e.target.checked)}
                                disabled={!uiSettings?.showSidebar}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                            />
                        </div>

                        {/* 사이드바 너비 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                사이드바 너비: {uiSettings?.sidebarWidth || 250}px
                            </label>
                            <input
                                type="range"
                                min="200"
                                max="400"
                                value={uiSettings?.sidebarWidth || 250}
                                onChange={(e) => handleUISettingChange('sidebarWidth', parseInt(e.target.value))}
                                disabled={!uiSettings?.showSidebar}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-50"
                            />
                        </div>

                        {/* 헤더바 설정 */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    헤더바 표시
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    주소창과 탭이 포함된 헤더바를 표시합니다.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={uiSettings?.showHeaderBar || false}
                                onChange={(e) => handleUISettingChange('showHeaderBar', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>

                        {/* 테마 설정 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                테마
                            </label>
                            <select
                                value={uiSettings?.theme || 'auto'}
                                onChange={(e) => handleUISettingChange('theme', e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="auto">시스템 설정 따름</option>
                                <option value="light">라이트 모드</option>
                                <option value="dark">다크 모드</option>
                            </select>
                        </div>

                        {/* 컴팩트 모드 */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    컴팩트 모드
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    UI 요소들을 더 작게 표시합니다.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={uiSettings?.compactMode || false}
                                onChange={(e) => handleUISettingChange('compactMode', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>
                    </div>
                </div>

                {/* 브라우저 설정 섹션 */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            브라우저 설정
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* User-Agent 프리셋 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                User-Agent 프리셋
                            </label>
                            <select
                                value={browserSettings?.userAgentPreset || 'chrome'}
                                onChange={(e) => handleUserAgentPresetChange(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="chrome">Chrome</option>
                                <option value="firefox">Firefox</option>
                                <option value="safari">Safari</option>
                                <option value="edge">Edge</option>
                                <option value="custom">사용자 정의</option>
                            </select>
                        </div>

                        {/* 사용자 정의 User-Agent */}
                        {browserSettings?.userAgentPreset === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    사용자 정의 User-Agent
                                </label>
                                <textarea
                                    value={browserSettings?.userAgent || ''}
                                    onChange={(e) => handleBrowserSettingChange('userAgent', e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    rows={3}
                                    placeholder="사용자 정의 User-Agent 문자열을 입력하세요"
                                />
                            </div>
                        )}

                        {/* 현재 User-Agent 표시 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                현재 User-Agent
                            </label>
                            <div className="mt-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300 break-all">
                                {browserSettings?.userAgent || '로딩 중...'}
                            </div>
                        </div>

                        {/* 기본 검색 엔진 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                기본 검색 엔진
                            </label>
                            <input
                                type="url"
                                value={browserSettings?.defaultSearchEngine || ''}
                                onChange={(e) => handleBrowserSettingChange('defaultSearchEngine', e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="https://www.google.com/search?q="
                            />
                        </div>

                        {/* 홈페이지 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                홈페이지
                            </label>
                            <input
                                type="url"
                                value={browserSettings?.homePage || ''}
                                onChange={(e) => handleBrowserSettingChange('homePage', e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="https://www.google.com"
                            />
                        </div>

                        {/* 다운로드 경로 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                다운로드 경로
                            </label>
                            <input
                                type="text"
                                value={browserSettings?.downloadPath || ''}
                                onChange={(e) => handleBrowserSettingChange('downloadPath', e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="~/Downloads"
                            />
                        </div>

                        {/* 개발자 도구 활성화 */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    개발자 도구 활성화
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    개발자 도구에 접근할 수 있습니다.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={browserSettings?.enableDevTools || false}
                                onChange={(e) => handleBrowserSettingChange('enableDevTools', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>

                        {/* JavaScript 활성화 */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    JavaScript 활성화
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    웹 페이지에서 JavaScript를 실행합니다.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={browserSettings?.enableJavaScript || false}
                                onChange={(e) => handleBrowserSettingChange('enableJavaScript', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>
                    </div>
                </div>

                {/* 초기화 섹션 */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            설정 초기화
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                    모든 설정 초기화
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    모든 설정을 기본값으로 되돌립니다. 이 작업은 되돌릴 수 없습니다.
                                </p>
                            </div>
                            <button
                                onClick={resetSettings}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                초기화
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PreferencesPage