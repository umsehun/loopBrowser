import React, { useState, useEffect } from 'react'
import {
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    Home,
    Search,
    Menu,
    Plus,
    Settings
} from 'lucide-react'
import { TabInfo } from '../../shared/types'

interface HeaderBarProps {
    activeTab?: TabInfo
    onNavigateBack: () => void
    onNavigateForward: () => void
    onReload: () => void
    onHome: () => void
    onSearch: (query: string) => void
    canGoBack: boolean
    canGoForward: boolean
    isVisible?: boolean // GIGA-CHAD: 자동 숨김을 위한 prop
}

// GIGA-CHAD: Zen/Arc 스타일 상단 HeaderBar
export const HeaderBar: React.FC<HeaderBarProps> = ({
    activeTab,
    onNavigateBack,
    onNavigateForward,
    onReload,
    onHome,
    onSearch,
    canGoBack,
    canGoForward,
    isVisible = true // GIGA-CHAD: 기본값은 표시
}) => {
    const [addressValue, setAddressValue] = useState('')
    const [isSearchFocused, setIsSearchFocused] = useState(false)

    useEffect(() => {
        if (activeTab?.url && activeTab.url !== 'about:blank') {
            setAddressValue(activeTab.url)
        }
    }, [activeTab?.url])

    const handleAddressSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (addressValue.trim()) {
            onSearch(addressValue.trim())
        }
    }

    return (
        <div className={`header-bar ${!isVisible ? 'auto-hide' : ''}`}>
            {/* 왼쪽: 네비게이션 버튼들 */}
            <div className="header-nav-section">
                <button
                    className={`nav-button ${!canGoBack ? 'disabled' : ''}`}
                    onClick={onNavigateBack}
                    disabled={!canGoBack}
                    title="뒤로 가기"
                >
                    <ChevronLeft size={16} />
                </button>

                <button
                    className={`nav-button ${!canGoForward ? 'disabled' : ''}`}
                    onClick={onNavigateForward}
                    disabled={!canGoForward}
                    title="앞으로 가기"
                >
                    <ChevronRight size={16} />
                </button>

                <button
                    className="nav-button"
                    onClick={onReload}
                    title="새로고침"
                >
                    <RotateCcw size={16} />
                </button>

                <button
                    className="nav-button"
                    onClick={onHome}
                    title="홈"
                >
                    <Home size={16} />
                </button>
            </div>

            {/* 중앙: 주소창 */}
            <div className="header-address-section">
                <form onSubmit={handleAddressSubmit} className="address-form">
                    <div className={`address-input-container ${isSearchFocused ? 'focused' : ''}`}>
                        <Search size={16} className="address-search-icon" />
                        <input
                            type="text"
                            className="address-input"
                            placeholder="주소를 입력하거나 검색하세요..."
                            value={addressValue}
                            onChange={(e) => setAddressValue(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                        />
                    </div>
                </form>
            </div>

            {/* 오른쪽: 메뉴 버튼들 */}
            <div className="header-menu-section">
                <button
                    className="nav-button"
                    title="새 탭"
                >
                    <Plus size={16} />
                </button>

                <button
                    className="nav-button"
                    title="메뉴"
                >
                    <Menu size={16} />
                </button>

                <button
                    className="nav-button"
                    title="설정"
                >
                    <Settings size={16} />
                </button>
            </div>
        </div>
    )
}