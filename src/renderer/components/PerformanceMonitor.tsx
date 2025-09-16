import React from 'react'
import { PerformanceMetrics } from '../../shared/types'

interface PerformanceMonitorProps {
    metrics: PerformanceMetrics
}

// GIGA-CHAD: 성능 모니터 컴포넌트 (개발 전용)
const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ metrics }) => {
    const formatBytes = (bytes: number): string => {
        return `${Math.round(bytes)}MB`
    }

    const formatUptime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = Math.floor(seconds % 60)

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`
        } else {
            return `${secs}s`
        }
    }

    const getMemoryUsageColor = (): string => {
        const totalMB = metrics.memory.total
        if (totalMB > 800) return 'text-red-400'
        if (totalMB > 500) return 'text-yellow-400'
        return 'text-green-400'
    }

    const getCPUUsageColor = (): string => {
        const cpu = metrics.cpu.percentCPUUsage
        if (cpu > 80) return 'text-red-400'
        if (cpu > 50) return 'text-yellow-400'
        return 'text-green-400'
    }

    return (
        <div className="bg-gray-800 border-t border-gray-700 p-2">
            <div className="flex items-center space-x-4 text-xs">
                <div className="performance-indicator">
                    🚀 Giga Browser
                </div>

                <div className={`performance-indicator ${getMemoryUsageColor()}`}>
                    🧠 RAM: {formatBytes(metrics.memory.total)}
                    <span className="text-gray-500 ml-1">
                        (RSS: {formatBytes(metrics.memory.rss)})
                    </span>
                </div>

                <div className={`performance-indicator ${getCPUUsageColor()}`}>
                    ⚡ CPU: {metrics.cpu.percentCPUUsage.toFixed(1)}%
                </div>

                <div className="performance-indicator">
                    📑 탭: {metrics.tabs.total}개
                    <span className="text-yellow-400 ml-1">
                        (활성: {metrics.tabs.active}, 일시정지: {metrics.tabs.suspended})
                    </span>
                </div>

                <div className="performance-indicator">
                    ⏱️ 실행시간: {formatUptime(metrics.uptime)}
                </div>

                {/* 메모리 사용량 바 */}
                <div className="flex-1 max-w-32">
                    <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${metrics.memory.total > 800 ? 'bg-red-500' :
                                    metrics.memory.total > 500 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                            style={{
                                width: `${Math.min((metrics.memory.total / 1000) * 100, 100)}%`
                            }}
                        />
                    </div>
                    <div className="text-center text-xs text-gray-500 mt-1">
                        목표: &lt;1GB
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PerformanceMonitor