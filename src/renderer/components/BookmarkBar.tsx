import React, { useState, useEffect } from 'react'
import { Star, Plus } from 'lucide-react'
import { BookmarkInfo } from '../../shared/types'
import { createModuleLogger } from '../../shared/logger'

// GIGA-CHAD: 북마크 바 컴포넌트
const logger = createModuleLogger('BookmarkBar')

const BookmarkBar: React.FC = () => {
    const [bookmarks, setBookmarks] = useState<BookmarkInfo[]>([])
    const [isVisible, setIsVisible] = useState(true)

    // GIGA-CHAD: 북마크 목록 로드
    useEffect(() => {
        const loadBookmarks = async () => {
            try {
                const bookmarkList = await window.gigaBrowser.bookmarks.getAll()
                setBookmarks(bookmarkList)
            } catch (error) {
                logger.error('북마크 로드 실패:', error)
            }
        }

        loadBookmarks()
    }, [])

    const handleBookmarkClick = (bookmark: BookmarkInfo) => {
        // 현재 활성 탭에서 북마크 URL 열기
        // 이 부분은 상위 컴포넌트에서 관리되어야 하지만, 
        // 여기서는 새 탭으로 열기
        window.gigaBrowser.tab.create(bookmark.url)
    }

    const handleAddBookmark = async () => {
        try {
            // 현재 페이지를 북마크에 추가하는 로직
            // 실제로는 현재 활성 탭의 URL과 제목을 가져와야 함
            const tabs = await window.gigaBrowser.tab.getAll()
            const activeTab = tabs.find(tab => tab.isActive)

            if (activeTab && activeTab.url !== 'about:blank') {
                await window.gigaBrowser.bookmarks.add(activeTab.url, activeTab.title || activeTab.url)

                // 북마크 목록 새로고침
                const updatedBookmarks = await window.gigaBrowser.bookmarks.getAll()
                setBookmarks(updatedBookmarks)
            }
        } catch (error) {
            logger.error('북마크 추가 실패:', error)
        }
    }

    if (!isVisible) {
        return null
    }

    return (
        <div className="flex items-center bg-gray-800 border-b border-gray-700 px-2 py-1 min-h-[32px]">
            {/* GIGA-CHAD: 북마크 목록 */}
            <div className="flex items-center space-x-1 flex-1 overflow-x-auto">
                {bookmarks.length === 0 ? (
                    <span className="text-xs text-gray-500 px-2">
                        북마크가 없습니다. 현재 페이지를 북마크에 추가해보세요.
                    </span>
                ) : (
                    bookmarks.map((bookmark, index) => (
                        <button
                            key={index}
                            className="bookmark-item flex-shrink-0"
                            onClick={() => handleBookmarkClick(bookmark)}
                            title={bookmark.url}
                        >
                            {bookmark.favicon ? (
                                <img
                                    src={bookmark.favicon}
                                    alt=""
                                    className="bookmark-favicon"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                    }}
                                />
                            ) : (
                                <Star size={14} className="w-4 h-4 mr-2 text-gray-400" />
                            )}
                            <span className="truncate max-w-32">
                                {bookmark.title || new URL(bookmark.url).hostname}
                            </span>
                        </button>
                    ))
                )}
            </div>

            {/* GIGA-CHAD: 북마크 추가 버튼 */}
            <button
                className="nav-button ml-2"
                onClick={handleAddBookmark}
                title="현재 페이지를 북마크에 추가 (Ctrl+D)"
            >
                <Plus size={14} />
            </button>

            {/* GIGA-CHAD: 북마크 바 숨기기 버튼 */}
            <button
                className="nav-button ml-1"
                onClick={() => setIsVisible(false)}
                title="북마크 바 숨기기"
            >
                <span className="text-xs">×</span>
            </button>
        </div>
    )
}

export default BookmarkBar