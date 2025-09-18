import { WebContents, app } from 'electron'
import { logger } from '../../../shared/logger/index'

export interface MemoryOptimizationConfig {
    enableMemoryMonitoring: boolean
    enableLeakDetection: boolean
    enableResourceCleanup: boolean
    memoryWarningThreshold: number // MB
    criticalMemoryThreshold: number // MB
    cleanupInterval: number // milliseconds
}

export interface MemoryStats {
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
    percentage: number
    timestamp: number
}

export class MemoryService {
    private static instance: MemoryService
    private config: MemoryOptimizationConfig = {
        enableMemoryMonitoring: true,
        enableLeakDetection: true,
        enableResourceCleanup: true,
        memoryWarningThreshold: 512, // 512MB
        criticalMemoryThreshold: 1024, // 1GB
        cleanupInterval: 30000 // 30초
    }
    private memoryHistory: MemoryStats[] = []
    private monitoringInterval: NodeJS.Timeout | null = null
    private cleanupInterval: NodeJS.Timeout | null = null

    constructor() {
        logger.info('MemoryService initialized')
    }

    static getInstance(): MemoryService {
        if (!MemoryService.instance) {
            MemoryService.instance = new MemoryService()
        }
        return MemoryService.instance
    }

    // 메모리 최적화 활성화
    async optimizeMemory(): Promise<void> {
        try {
            await this.setupMemoryMonitoring()
            await this.setupLeakDetection()
            await this.setupResourceCleanup()
            await this.startCleanupInterval()

            logger.info('Memory optimization applied successfully', this.config)
        } catch (error) {
            logger.error('Failed to apply memory optimization', { error })
            throw error
        }
    }

    // 메모리 모니터링 설정
    private async setupMemoryMonitoring(): Promise<void> {
        if (!this.config.enableMemoryMonitoring) return

        try {
            this.monitoringInterval = setInterval(() => {
                const stats = this.getMemoryStats()
                this.memoryHistory.push(stats)

                // 최근 100개 기록만 유지
                if (this.memoryHistory.length > 100) {
                    this.memoryHistory = this.memoryHistory.slice(-100)
                }

                // 메모리 임계치 검사
                this.checkMemoryThresholds(stats)

            }, 10000) // 10초마다 모니터링

            logger.debug('Memory monitoring enabled')
        } catch (error) {
            logger.error('Failed to setup memory monitoring', { error })
        }
    }

    // 메모리 누수 감지 설정
    private async setupLeakDetection(): Promise<void> {
        if (!this.config.enableLeakDetection) return

        try {
            // 메모리 증가 패턴 감지
            setInterval(() => {
                if (this.memoryHistory.length < 5) return

                const recent = this.memoryHistory.slice(-5)
                const trend = this.calculateMemoryTrend(recent)

                if (trend > 10) { // 10MB/분 이상 증가하면 경고
                    logger.warn('Potential memory leak detected', {
                        trend: `${trend.toFixed(2)}MB/min`,
                        currentMemory: `${recent[recent.length - 1].heapUsed}MB`
                    })
                }
            }, 60000) // 1분마다 검사

            logger.debug('Memory leak detection enabled')
        } catch (error) {
            logger.error('Failed to setup leak detection', { error })
        }
    }

    // 리소스 정리 설정
    private async setupResourceCleanup(): Promise<void> {
        if (!this.config.enableResourceCleanup) return

        try {
            // 앱 종료 시 정리
            app.on('before-quit', () => {
                this.cleanup()
            })

            logger.debug('Resource cleanup enabled')
        } catch (error) {
            logger.error('Failed to setup resource cleanup', { error })
        }
    }

    // 정리 주기 시작
    private async startCleanupInterval(): Promise<void> {
        try {
            this.cleanupInterval = setInterval(() => {
                this.performRoutineCleanup()
            }, this.config.cleanupInterval)

            logger.debug('Cleanup interval started', {
                interval: this.config.cleanupInterval
            })
        } catch (error) {
            logger.error('Failed to start cleanup interval', { error })
        }
    }

    // 메모리 통계 수집
    getMemoryStats(): MemoryStats {
        const memoryUsage = process.memoryUsage()
        const totalMemory = require('os').totalmem()

        return {
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
            external: Math.round(memoryUsage.external / 1024 / 1024), // MB
            rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
            percentage: Math.round((memoryUsage.rss / totalMemory) * 100),
            timestamp: Date.now()
        }
    }

    // 메모리 임계치 검사
    private checkMemoryThresholds(stats: MemoryStats): void {
        if (stats.heapUsed > this.config.criticalMemoryThreshold) {
            logger.error('Critical memory usage detected', {
                current: `${stats.heapUsed}MB`,
                threshold: `${this.config.criticalMemoryThreshold}MB`
            })

            // 긴급 정리 수행
            this.performEmergencyCleanup()
        } else if (stats.heapUsed > this.config.memoryWarningThreshold) {
            logger.warn('High memory usage detected', {
                current: `${stats.heapUsed}MB`,
                threshold: `${this.config.memoryWarningThreshold}MB`
            })

            // 일반 정리 수행
            this.performRoutineCleanup()
        }
    }

    // 메모리 증가 트렌드 계산
    private calculateMemoryTrend(stats: MemoryStats[]): number {
        if (stats.length < 2) return 0

        const first = stats[0]
        const last = stats[stats.length - 1]
        const timeDiff = (last.timestamp - first.timestamp) / 1000 / 60 // 분 단위
        const memoryDiff = last.heapUsed - first.heapUsed

        return timeDiff > 0 ? memoryDiff / timeDiff : 0
    }

    // 일반 정리 수행
    private performRoutineCleanup(): void {
        try {
            // 가비지 컬렉션 수행
            if (global.gc) {
                global.gc()
                logger.debug('Routine GC performed')
            }

            // 메모리 통계 로깅
            const stats = this.getMemoryStats()
            logger.debug('Routine cleanup completed', stats)
        } catch (error) {
            logger.error('Failed to perform routine cleanup', { error })
        }
    }

    // 긴급 정리 수행
    private performEmergencyCleanup(): void {
        try {
            // 강제 가비지 컬렉션
            if (global.gc) {
                for (let i = 0; i < 3; i++) {
                    global.gc()
                }
                logger.warn('Emergency GC performed (3 cycles)')
            }

            // 메모리 히스토리 정리
            this.memoryHistory = this.memoryHistory.slice(-50)

            const stats = this.getMemoryStats()
            logger.warn('Emergency cleanup completed', stats)
        } catch (error) {
            logger.error('Failed to perform emergency cleanup', { error })
        }
    }

    // WebContents별 메모리 최적화
    optimizeWebContents(webContents: WebContents): void {
        try {
            // 페이지 언로드 시 정리
            webContents.on('destroyed', () => {
                if (global.gc) {
                    global.gc()
                }
            })

            // DOM 최적화 주입
            webContents.on('dom-ready', () => {
                webContents.executeJavaScript(`
                    (function() {
                        // 메모리 최적화를 위한 DOM 정리
                        const optimizeDOM = () => {
                            // 사용하지 않는 이벤트 리스너 정리
                            const cleanupEventListeners = () => {
                                // AbortController를 사용한 이벤트 리스너 자동 정리
                                window.addEventListener('beforeunload', () => {
                                    // 페이지 이동 시 정리 작업
                                    const controllers = window._abortControllers || [];
                                    controllers.forEach(controller => controller.abort());
                                });
                            };

                            // 메모리 누수 방지
                            const preventMemoryLeaks = () => {
                                // DOM 노드 참조 정리
                                const orphanedNodes = document.querySelectorAll('*[data-removed]');
                                orphanedNodes.forEach(node => node.remove());

                                // 타이머 정리
                                const highestTimeoutId = setTimeout(() => {}, 0);
                                for (let i = 1; i < highestTimeoutId; i++) {
                                    clearTimeout(i);
                                }
                                clearTimeout(highestTimeoutId);
                            };

                            cleanupEventListeners();
                            preventMemoryLeaks();
                        };

                        // 메모리 사용량 모니터링
                        const monitorMemory = () => {
                            if (window.performance && window.performance.memory) {
                                const memory = window.performance.memory;
                                const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
                                const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
                                const limit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);

                                if (used > limit * 0.8) {
                                    logger.warn('High memory usage in WebContents:', {
                                        used: used + 'MB',
                                        total: total + 'MB',
                                        limit: limit + 'MB'
                                    });
                                }
                            }
                        };

                        optimizeDOM();
                        setInterval(monitorMemory, 30000); // 30초마다 모니터링

                        logger.debug('WebContents memory optimization applied');
                    })();
                `).catch(() => {
                    // JavaScript 실행 실패는 무시
                })
            })

            logger.debug('WebContents memory optimization applied')
        } catch (error) {
            logger.error('Failed to optimize WebContents memory', { error })
        }
    }

    // 메모리 보고서 생성
    generateMemoryReport(): any {
        const currentStats = this.getMemoryStats()
        const trend = this.memoryHistory.length > 1 ?
            this.calculateMemoryTrend(this.memoryHistory.slice(-10)) : 0

        return {
            current: currentStats,
            trend: `${trend.toFixed(2)}MB/min`,
            history: this.memoryHistory.slice(-20), // 최근 20개 기록
            thresholds: {
                warning: this.config.memoryWarningThreshold,
                critical: this.config.criticalMemoryThreshold
            },
            status: this.getMemoryStatus(currentStats)
        }
    }

    // 메모리 상태 판단
    private getMemoryStatus(stats: MemoryStats): string {
        if (stats.heapUsed > this.config.criticalMemoryThreshold) {
            return 'critical'
        } else if (stats.heapUsed > this.config.memoryWarningThreshold) {
            return 'warning'
        } else {
            return 'normal'
        }
    }

    // 설정 업데이트
    updateConfig(newConfig: Partial<MemoryOptimizationConfig>): void {
        this.config = { ...this.config, ...newConfig }
        logger.info('MemoryService configuration updated', this.config)
    }

    // 정리 작업
    cleanup(): void {
        try {
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval)
                this.monitoringInterval = null
            }

            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval)
                this.cleanupInterval = null
            }

            // 최종 정리
            this.performEmergencyCleanup()

            logger.info('MemoryService cleanup completed')
        } catch (error) {
            logger.error('Error during MemoryService cleanup', { error })
        }
    }

    // 실시간 메모리 모니터링 UI 컴포넌트
    private createMemoryMonitorUI(): void {
        // 메모리 모니터링 UI를 위한 새로운 창 생성
        const { BrowserWindow } = require('electron')
        const monitorWindow = new BrowserWindow({
            width: 400,
            height: 300,
            show: false,
            frame: false,
            alwaysOnTop: true,
            resizable: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        })

        // 메모리 모니터링 HTML 생성
        const monitorHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Memory Monitor</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0;
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    border-radius: 8px;
                }
                .memory-bar {
                    width: 100%;
                    height: 20px;
                    background: #333;
                    border-radius: 10px;
                    overflow: hidden;
                    margin: 5px 0;
                }
                .memory-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #4CAF50, #FFC107, #F44336);
                    transition: width 0.3s ease;
                }
                .memory-text {
                    font-size: 12px;
                    text-align: center;
                    margin: 5px 0;
                }
                .memory-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 5px;
                    font-size: 11px;
                }
                .stat-item {
                    display: flex;
                    justify-content: space-between;
                }
            </style>
        </head>
        <body>
            <div id="memory-monitor">
                <div class="memory-bar">
                    <div class="memory-fill" id="memory-fill"></div>
                </div>
                <div class="memory-text" id="memory-text">Initializing...</div>
                <div class="memory-stats" id="memory-stats"></div>
            </div>
            <script>
                const { ipcRenderer } = require('electron')

                function updateMemoryDisplay(stats) {
                    const percentage = stats.percentage
                    const fill = document.getElementById('memory-fill')
                    const text = document.getElementById('memory-text')
                    const statsDiv = document.getElementById('memory-stats')

                    // 메모리 바 업데이트
                    fill.style.width = percentage + '%'

                    // 색상 변경 (녹색 -> 노란색 -> 빨간색)
                    if (percentage < 60) {
                        fill.style.background = '#4CAF50'
                    } else if (percentage < 80) {
                        fill.style.background = '#FFC107'
                    } else {
                        fill.style.background = '#F44336'
                    }

                    // 텍스트 업데이트
                    text.textContent = \`\${percentage.toFixed(1)}% (\${(stats.heapUsed / 1024).toFixed(1)}MB)\`

                    // 상세 통계 업데이트
                    statsDiv.innerHTML = \`
                        <div class="stat-item"><span>Heap Used:</span><span>\${(stats.heapUsed / 1024).toFixed(1)}MB</span></div>
                        <div class="stat-item"><span>Heap Total:</span><span>\${(stats.heapTotal / 1024).toFixed(1)}MB</span></div>
                        <div class="stat-item"><span>RSS:</span><span>\${(stats.rss / 1024 / 1024).toFixed(1)}MB</span></div>
                        <div class="stat-item"><span>External:</span><span>\${(stats.external / 1024).toFixed(1)}MB</span></div>
                    \`
                }

                // 메모리 통계 수신
                ipcRenderer.on('memory-stats-update', (event, stats) => {
                    updateMemoryDisplay(stats)
                })
            </script>
        </body>
        </html>`

        monitorWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(monitorHTML))
    }

    // 실시간 모니터링 시작
    startRealtimeMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval)
        }

        this.monitoringInterval = setInterval(() => {
            const stats = this.getMemoryStats()
            if (stats) {
                // IPC를 통해 메모리 통계 전송
                const { BrowserWindow } = require('electron')
                BrowserWindow.getAllWindows().forEach((win: Electron.BrowserWindow) => {
                    win.webContents.send('memory-stats-update', stats)
                })
            }
        }, 1000) // 1초마다 업데이트

        logger.debug('Realtime memory monitoring enabled')
    }

    // 실시간 모니터링 중지
    stopRealtimeMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval)
            this.monitoringInterval = null
        }
        logger.debug('Realtime memory monitoring disabled')
    }
}

export const memoryService = MemoryService.getInstance()
export default memoryService