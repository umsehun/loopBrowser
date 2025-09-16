// GIGA-CHAD: 중앙 집중식 로깅 시스템

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export interface LogEntry {
    timestamp: Date
    level: LogLevel
    module: string
    message: string
    data?: any
}

class GigaLogger {
    private static instance: GigaLogger
    private currentLevel: LogLevel = LogLevel.INFO
    private enableConsole: boolean = true
    private enableFile: boolean = false
    private logBuffer: LogEntry[] = []

    // GIGA-CHAD: 색상 코드
    private colors = {
        [LogLevel.DEBUG]: '\x1b[36m', // Cyan
        [LogLevel.INFO]: '\x1b[32m',  // Green
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.ERROR]: '\x1b[31m', // Red
        reset: '\x1b[0m',
        bold: '\x1b[1m',
        gigaChad: '\x1b[35m\x1b[1m' // Magenta Bold
    }

    // GIGA-CHAD: 이모지 맵핑
    private emojis = {
        [LogLevel.DEBUG]: '🔍',
        [LogLevel.INFO]: '💬',
        [LogLevel.WARN]: '⚠️',
        [LogLevel.ERROR]: '🚨'
    }

    private constructor() {
        // 환경에 따른 로그 레벨 설정
        if (process.env.NODE_ENV === 'development') {
            this.currentLevel = LogLevel.DEBUG
        } else if (process.env.NODE_ENV === 'production') {
            this.currentLevel = LogLevel.WARN
        }
    }

    static getInstance(): GigaLogger {
        if (!this.instance) {
            this.instance = new GigaLogger()
        }
        return this.instance
    }

    /**
     * 로그 레벨 설정
     */
    setLevel(level: LogLevel): void {
        this.currentLevel = level
    }

    /**
     * 콘솔 출력 토글
     */
    setConsoleOutput(enabled: boolean): void {
        this.enableConsole = enabled
    }

    /**
     * 파일 출력 토글
     */
    setFileOutput(enabled: boolean): void {
        this.enableFile = enabled
    }

    /**
     * 로그 출력
     */
    private log(level: LogLevel, module: string, message: string, data?: any): void {
        if (level < this.currentLevel) return

        const logEntry: LogEntry = {
            timestamp: new Date(),
            level,
            module,
            message,
            data
        }

        // 버퍼에 저장
        this.logBuffer.push(logEntry)
        if (this.logBuffer.length > 1000) {
            this.logBuffer.shift() // 오래된 로그 제거
        }

        // 콘솔 출력
        if (this.enableConsole) {
            this.outputToConsole(logEntry)
        }

        // 파일 출력 (추후 구현)
        if (this.enableFile) {
            this.outputToFile(logEntry)
        }
    }

    /**
     * 콘솔 출력 포맷팅
     */
    private outputToConsole(entry: LogEntry): void {
        const timestamp = entry.timestamp.toLocaleTimeString()
        const levelColor = this.colors[entry.level]
        const levelName = LogLevel[entry.level].padEnd(5)
        const emoji = this.emojis[entry.level]

        let output = `${this.colors.gigaChad}🦾 GIGA-CHAD${this.colors.reset} ` +
            `${levelColor}${emoji} ${levelName}${this.colors.reset} ` +
            `[${timestamp}] ` +
            `${this.colors.bold}${entry.module}${this.colors.reset}: ` +
            `${entry.message}`

        if (entry.data !== undefined) {
            output += `\n${this.colors.gigaChad}📊 Data:${this.colors.reset}`
        }

        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(output, entry.data || '')
                break
            case LogLevel.INFO:
                console.info(output, entry.data || '')
                break
            case LogLevel.WARN:
                console.warn(output, entry.data || '')
                break
            case LogLevel.ERROR:
                console.error(output, entry.data || '')
                break
        }
    }

    /**
     * 파일 출력 (추후 구현)
     */
    private outputToFile(entry: LogEntry): void {
        // TODO: 파일 시스템에 로그 저장
        // fs.appendFileSync('giga-browser.log', JSON.stringify(entry) + '\n')
    }

    /**
     * 로그 레벨별 메서드들
     */
    debug(module: string, message: string, data?: any): void {
        this.log(LogLevel.DEBUG, module, message, data)
    }

    info(module: string, message: string, data?: any): void {
        this.log(LogLevel.INFO, module, message, data)
    }

    warn(module: string, message: string, data?: any): void {
        this.log(LogLevel.WARN, module, message, data)
    }

    error(module: string, message: string, data?: any): void {
        this.log(LogLevel.ERROR, module, message, data)
    }

    /**
     * 성능 측정 시작
     */
    startTimer(module: string, label: string): void {
        const timerKey = `${module}:${label}`
        console.time(timerKey)
        this.debug(module, `⏱️ Timer started: ${label}`)
    }

    /**
     * 성능 측정 종료
     */
    endTimer(module: string, label: string): void {
        const timerKey = `${module}:${label}`
        console.timeEnd(timerKey)
        this.debug(module, `⏱️ Timer ended: ${label}`)
    }

    /**
     * 메모리 사용량 로그
     */
    logMemoryUsage(module: string): void {
        const memUsage = process.memoryUsage()
        const memInfo = {
            rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
            external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
        }

        this.info(module, '🧠 Memory usage', memInfo)
    }

    /**
     * 로그 버퍼 가져오기
     */
    getLogBuffer(): LogEntry[] {
        return [...this.logBuffer]
    }

    /**
     * 로그 버퍼 클리어
     */
    clearLogBuffer(): void {
        this.logBuffer = []
        this.info('Logger', '🗑️ Log buffer cleared')
    }

    /**
     * 시스템 정보 로그
     */
    logSystemInfo(module: string): void {
        const systemInfo = {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            electronVersion: process.versions.electron,
            chromeVersion: process.versions.chrome
        }

        this.info(module, '💻 System information', systemInfo)
    }
}

// 싱글톤 인스턴스 내보내기
export const Logger = GigaLogger.getInstance()

// 편의 함수들
export const createModuleLogger = (moduleName: string) => ({
    debug: (message: string, data?: any) => Logger.debug(moduleName, message, data),
    info: (message: string, data?: any) => Logger.info(moduleName, message, data),
    warn: (message: string, data?: any) => Logger.warn(moduleName, message, data),
    error: (message: string, data?: any) => Logger.error(moduleName, message, data),
    startTimer: (label: string) => Logger.startTimer(moduleName, label),
    endTimer: (label: string) => Logger.endTimer(moduleName, label),
    logMemory: () => Logger.logMemoryUsage(moduleName)
})

// 기본 로거 내보내기 (기존 console.log 대체용)
export default Logger