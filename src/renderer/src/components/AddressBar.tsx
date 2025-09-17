import React, { useState } from 'react'

interface AddressBarProps {
    url: string
    onUrlChange: (url: string) => void
    onGo: () => void
    onBack: () => void
    onForward: () => void
    onRefresh: () => void
    canGoBack: boolean
    canGoForward: boolean
}

export const AddressBar: React.FC<AddressBarProps> = ({
    url,
    onUrlChange,
    onGo,
    onBack,
    onForward,
    onRefresh,
    canGoBack,
    canGoForward
}) => {
    const [inputValue, setInputValue] = useState(url)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onUrlChange(inputValue)
        onGo()
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
    }

    return (
        <div className="flex items-center bg-gray-800 border-b border-gray-700 px-4 py-2">
            <div className="flex items-center space-x-2">
                <button
                    className={`p-2 rounded hover:bg-gray-700 transition-colors ${canGoBack ? 'text-gray-300' : 'text-gray-600 cursor-not-allowed'
                        }`}
                    onClick={onBack}
                    disabled={!canGoBack}
                >
                    ←
                </button>
                <button
                    className={`p-2 rounded hover:bg-gray-700 transition-colors ${canGoForward ? 'text-gray-300' : 'text-gray-600 cursor-not-allowed'
                        }`}
                    onClick={onForward}
                    disabled={!canGoForward}
                >
                    →
                </button>
                <button
                    className="p-2 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                    onClick={onRefresh}
                >
                    ↻
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 mx-4">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search or enter URL..."
                />
            </form>

            <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-300 rounded hover:bg-gray-700 transition-colors">
                    ⚙️
                </button>
            </div>
        </div>
    )
}