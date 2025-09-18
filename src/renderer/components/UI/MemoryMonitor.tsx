import React from 'react';

interface MemoryStats {
    used: number;
    total: number;
    percentage: number;
    external: number;
    heapUsed: number;
}

interface MemoryMonitorProps {
    isOpen: boolean;
    memoryStats: MemoryStats | null;
    onClose: () => void;
}

const MemoryMonitor: React.FC<MemoryMonitorProps> = ({ isOpen, memoryStats, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed top-4 right-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 min-w-80 z-50">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">메모리 모니터링</h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    ✕
                </button>
            </div>

            {memoryStats ? (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-700 p-3 rounded">
                            <div className="text-sm text-gray-400">사용 메모리</div>
                            <div className="text-xl font-bold text-blue-400">
                                {(memoryStats.used / 1024 / 1024).toFixed(1)} MB
                            </div>
                        </div>
                        <div className="bg-gray-700 p-3 rounded">
                            <div className="text-sm text-gray-400">총 메모리</div>
                            <div className="text-xl font-bold text-green-400">
                                {(memoryStats.total / 1024 / 1024).toFixed(1)} MB
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-700 p-3 rounded">
                        <div className="text-sm text-gray-400 mb-2">메모리 사용률</div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${memoryStats.percentage}%` }}
                            ></div>
                        </div>
                        <div className="text-right text-sm text-gray-300 mt-1">
                            {memoryStats.percentage.toFixed(1)}%
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-gray-400">외부 메모리</div>
                            <div className="text-white">{(memoryStats.external / 1024 / 1024).toFixed(1)} MB</div>
                        </div>
                        <div>
                            <div className="text-gray-400">힙 사용량</div>
                            <div className="text-white">{(memoryStats.heapUsed / 1024 / 1024).toFixed(1)} MB</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-400 py-8">
                    메모리 정보를 불러오는 중...
                </div>
            )}
        </div>
    );
};

export default MemoryMonitor;