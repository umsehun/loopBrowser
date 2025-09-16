import React, { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, RotateCw, X, Search } from 'lucide-react'
import { SearchSuggestion } from '../../shared/types'
import { createModuleLogger } from '../../shared/logger'

interface AddressBarProps {
    currentUrl: string
    loading: boolean
    canGoBack: boolean
    canGoForward: boolean
    onNavigate: (url: string) => void
    activeTabId: string
}

// GIGA-CHAD: 주소 표시줄 컴포넌트
const logger = createModuleLogger('AddressBar')
const AddressBar: React.FC<AddressBarProps> = ({
    currentUrl,
    loading,
    canGoBack,
    canGoForward,
    onNavigate,
    activeTabId
}) => {
    const [inputValue, setInputValue] = useState('')
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isInputFocused, setIsInputFocused] = useState(false)

    // GIGA-CHAD: URL 변경 시 입력값 동기화
    useEffect(() => {
        if (!isInputFocused) {
            setInputValue(currentUrl)
        }
    }, [currentUrl, isInputFocused])

    // GIGA-CHAD: 검색 제안 가져오기
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (inputValue.length > 1 && isInputFocused) {
                try {
                    const suggestions = await window.gigaBrowser.search.getSuggestions(inputValue)
                    setSuggestions(suggestions)
                    setShowSuggestions(true)
                } catch (error) {
                    logger.error('검색 제안 가져오기 실패:', error)
                }
            } else {
                setShowSuggestions(false)
            }
        }

        const debounceTimer = setTimeout(fetchSuggestions, 300)
        return () => clearTimeout(debounceTimer)
    }, [inputValue, isInputFocused])

    // GIGA-CHAD: 네비게이션 핸들러
    const handleGoBack = async () => {
        try {
            await window.gigaBrowser.browser.goBack(activeTabId)
        } catch (error) {
            logger.error('뒤로 가기 실패:', error)
        }
    }

    const handleGoForward = async () => {
        try {
            await window.gigaBrowser.browser.goForward(activeTabId)
        } catch (error) {
            logger.error('앞으로 가기 실패:', error)
        }
    }

    const handleReload = async () => {
        try {
            await window.gigaBrowser.browser.reload(activeTabId)
        } catch (error) {
            logger.error('새로고침 실패:', error)
        }
    }

    const handleStop = async () => {
        try {
            await window.gigaBrowser.browser.stop(activeTabId)
        } catch (error) {
            logger.error('중지 실패:', error)
        }
    }

    // GIGA-CHAD: URL 검증 및 Google 검색 처리
    const processInput = (input: string): string => {
        const trimmed = input.trim()

        // URL인지 확인
        if (trimmed.includes('.') && !trimmed.includes(' ')) {
            // 프로토콜이 없으면 https 추가
            if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
                return `https://${trimmed}`
            }
            return trimmed
        }

        // Google 검색
        return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const processedUrl = processInput(inputValue)
        onNavigate(processedUrl)
        setShowSuggestions(false)
        setIsInputFocused(false)
    }

    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        const url = suggestion.type === 'url'
            ? suggestion.text
            : `https://www.google.com/search?q=${encodeURIComponent(suggestion.text)}`

        onNavigate(url)
        setInputValue(suggestion.text)
        setShowSuggestions(false)
        setIsInputFocused(false)
    }

    return (
        <div className="address-bar relative">
            {/* GIGA-CHAD: 네비게이션 버튼들 */}
            <button
                className="nav-button"
                onClick={handleGoBack}
                disabled={!canGoBack}
                title="뒤로 (Alt+←)"
            >
                <ArrowLeft size={16} />
            </button>

            <button
                className="nav-button"
                onClick={handleGoForward}
                disabled={!canGoForward}
                title="앞으로 (Alt+→)"
            >
                <ArrowRight size={16} />
            </button>

            {loading ? (
                <button
                    className="nav-button"
                    onClick={handleStop}
                    title="중지 (Esc)"
                >
                    <X size={16} />
                </button>
            ) : (
                <button
                    className="nav-button"
                    onClick={handleReload}
                    title="새로고침 (Ctrl+R)"
                >
                    <RotateCw size={16} />
                </button>
            )}

            {/* GIGA-CHAD: 주소/검색 입력창 */}
            <form onSubmit={handleSubmit} className="flex-1 relative">
                <div className="relative">
                    <input
                        type="text"
                        className="address-input pl-10"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => {
                            // 약간의 지연을 주어 제안 클릭이 가능하도록 함
                            setTimeout(() => {
                                setIsInputFocused(false)
                                setShowSuggestions(false)
                            }, 150)
                        }}
                        placeholder="주소를 입력하거나 Google에서 검색"
                        autoComplete="off"
                    />

                    {/* 검색 아이콘 */}
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />

                    {/* 로딩 표시 */}
                    {loading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="loading-spinner"></div>
                        </div>
                    )}
                </div>

                {/* GIGA-CHAD: 검색 제안 드롭다운 */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded-b shadow-lg z-50 max-h-64 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                            <div
                                key={index}
                                className="flex items-center p-3 hover:bg-gray-600 cursor-pointer giga-transition"
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                {suggestion.type === 'search' && (
                                    <Search size={14} className="text-gray-400 mr-3" />
                                )}
                                {suggestion.favicon && (
                                    <img
                                        src={suggestion.favicon}
                                        alt=""
                                        className="w-4 h-4 mr-3"
                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                )}
                                <span className="text-sm">{suggestion.text}</span>
                                <span className="text-xs text-gray-400 ml-auto">
                                    {suggestion.type === 'search' ? 'Google 검색' :
                                        suggestion.type === 'bookmark' ? '북마크' : 'URL'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </form>
        </div>
    )
}

export default AddressBar