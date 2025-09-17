import React, { useState } from 'react'
import { TabBar } from './components/TabBar'
import { AddressBar } from './components/AddressBar'

interface Tab {
    id: string
    title: string
    url: string
    isActive: boolean
}

function App() {
    const [tabs, setTabs] = useState<Tab[]>([
        {
            id: '1',
            title: 'Welcome',
            url: 'about:blank',
            isActive: true
        }
    ])
    const [currentUrl, setCurrentUrl] = useState('about:blank')

    const activeTab = tabs.find(tab => tab.isActive)

    const handleTabClick = (tabId: string) => {
        setTabs(tabs.map(tab => ({
            ...tab,
            isActive: tab.id === tabId
        })))
        const tab = tabs.find(t => t.id === tabId)
        if (tab) {
            setCurrentUrl(tab.url)
        }
    }

    const handleTabClose = (tabId: string) => {
        const newTabs = tabs.filter(tab => tab.id !== tabId)
        if (newTabs.length === 0) {
            // 최소 하나의 탭 유지
            setTabs([{
                id: '1',
                title: 'New Tab',
                url: 'about:blank',
                isActive: true
            }])
            setCurrentUrl('about:blank')
        } else {
            const wasActive = tabs.find(tab => tab.id === tabId)?.isActive
            if (wasActive) {
                const firstTab = newTabs[0]
                firstTab.isActive = true
                setCurrentUrl(firstTab.url)
            }
            setTabs(newTabs)
        }
    }

    const handleNewTab = () => {
        const newTab: Tab = {
            id: Date.now().toString(),
            title: 'New Tab',
            url: 'about:blank',
            isActive: true
        }
        setTabs(tabs.map(tab => ({ ...tab, isActive: false })).concat(newTab))
        setCurrentUrl('about:blank')
    }

    const handleUrlChange = (url: string) => {
        setCurrentUrl(url)
        setTabs(tabs.map(tab =>
            tab.isActive ? { ...tab, url, title: url || 'New Tab' } : tab
        ))
    }

    const handleGo = () => {
        // URL로 이동하는 로직 (Electron IPC를 통해 구현)
        console.log('Navigate to:', currentUrl)
    }

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white">
            <TabBar
                tabs={tabs}
                activeTabId={activeTab?.id || ''}
                onTabClick={handleTabClick}
                onTabClose={handleTabClose}
                onNewTab={handleNewTab}
            />

            <AddressBar
                url={currentUrl}
                onUrlChange={handleUrlChange}
                onGo={handleGo}
                onBack={() => console.log('Back')}
                onForward={() => console.log('Forward')}
                onRefresh={() => console.log('Refresh')}
                canGoBack={false}
                canGoForward={false}
            />

            <main className="flex-1 bg-gray-800">
                {activeTab?.url === 'about:blank' ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-blue-400 mb-4">SEO Browser</h1>
                            <p className="text-gray-400 mb-8">Ultra-fast SEO-optimized browser</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
                                <div className="bg-gray-700 p-6 rounded-lg border border-gray-600">
                                    <h3 className="font-semibold text-blue-400 mb-2">🚀 Performance</h3>
                                    <p className="text-sm text-gray-300">GPU acceleration and V8 optimization</p>
                                </div>
                                <div className="bg-gray-700 p-6 rounded-lg border border-gray-600">
                                    <h3 className="font-semibold text-green-400 mb-2">🔍 SEO Analysis</h3>
                                    <p className="text-sm text-gray-300">Built-in metadata extraction</p>
                                </div>
                                <div className="bg-gray-700 p-6 rounded-lg border border-gray-600">
                                    <h3 className="font-semibold text-purple-400 mb-2">🛡️ Security</h3>
                                    <p className="text-sm text-gray-300">Advanced security policies</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <p>Web content will be displayed here</p>
                            <p className="text-sm mt-2">URL: {activeTab?.url}</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default App