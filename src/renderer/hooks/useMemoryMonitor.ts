import { useState, useEffect } from 'react';

interface MemoryStats {
    used: number;
    total: number;
    percentage: number;
    external: number;
    heapUsed: number;
}

export const useMemoryMonitor = () => {
    const [isMemoryMonitorOpen, setIsMemoryMonitorOpen] = useState(false);
    const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);

    // 메모리 모니터링 토글 핸들러
    const handleMemoryMonitorToggle = () => {
        if (window.electronAPI) {
            window.electronAPI.toggleMemoryMonitor();
        }
    };

    // 메모리 모니터링 창 토글 이벤트 리스너
    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.onToggleMemoryMonitor(() => {
                setIsMemoryMonitorOpen(prev => !prev);
            });
        }

        return () => {
            if (window.electronAPI) {
                window.electronAPI.removeAllListeners();
            }
        };
    }, []);

    // 메모리 통계 업데이트
    useEffect(() => {
        if (!isMemoryMonitorOpen) return;

        const updateMemoryStats = async () => {
            if (window.electronAPI) {
                try {
                    const stats = await window.electronAPI.getMemoryStats();
                    setMemoryStats(stats);
                } catch (error) {
                    console.error('Failed to get memory stats:', error);
                }
            }
        };

        // 초기 로드
        updateMemoryStats();

        // 1초마다 업데이트
        const interval = setInterval(updateMemoryStats, 1000);

        return () => clearInterval(interval);
    }, [isMemoryMonitorOpen]);

    return {
        isMemoryMonitorOpen,
        memoryStats,
        handleMemoryMonitorToggle,
        setIsMemoryMonitorOpen
    };
};