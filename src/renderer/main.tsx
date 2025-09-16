import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'

// GIGA-CHAD: React 앱 초기화
const container = document.getElementById('root')
if (!container) {
    throw new Error('Root container not found')
}

const root = createRoot(container)

// GIGA-CHAD: 성능 최적화를 위한 StrictMode
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)

// GIGA-CHAD: 개발 환경에서 HMR 지원
if (import.meta.hot) {
    import.meta.hot.accept()
}