// No top-level Node/Electron imports here to keep this module safe
// for use in renderer/preload contexts where `process` may be undefined.

// 🔥 기가차드 로거 시스템
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

export interface LogEntry {
    level: LogLevel;
    component: string;
    message: string;
    data?: unknown;
    timestamp: Date;
    processType: ProcessType;
}

type ProcessType = 'main' | 'renderer' | 'preload'

class LoggerService {
    private logLevel: LogLevel = LogLevel.DEBUG; // 🔥 강제로 DEBUG 레벨 활성화
    private logs: LogEntry[] = [];
    private maxLogs = 1000;
    private timers: Map<string, number> = new Map();
    private processType: ProcessType;

    constructor(processType: ProcessType = 'main') {
        this.processType = processType;

        // 🔥 환경변수 기반 로그 레벨 설정 (안전한 접근)
        const safeEnv = (typeof process !== 'undefined' && process.env) ? process.env : (typeof window !== 'undefined' ? (window as any).__env__ || {} : {});
        const envLogLevel = (safeEnv.LOG_LEVEL && String(safeEnv.LOG_LEVEL).toLowerCase()) || undefined;
        const debugMode = (safeEnv.DEBUG === 'true') || (safeEnv.NODE_ENV === 'development');

        if (debugMode || envLogLevel === 'debug') {
            this.logLevel = LogLevel.DEBUG;
        } else if (envLogLevel === 'info') {
            this.logLevel = LogLevel.INFO;
        } else if (envLogLevel === 'warn') {
            this.logLevel = LogLevel.WARN;
        } else if (envLogLevel === 'error') {
            this.logLevel = LogLevel.ERROR;
        } else {
            // 🔥 기본값: DEBUG 레벨
            this.logLevel = LogLevel.DEBUG;
        }

        // 안전한 초기화 로그 (process가 없을 수 있음)
        try {
            const nodeEnv = safeEnv.NODE_ENV || 'unknown'
            const debugFlag = safeEnv.DEBUG || 'false'
            // avoid referencing process directly
            // eslint-disable-next-line no-console
            console.log(`🔥 [LOGGER] Logger initialized - Level: ${LogLevel[this.logLevel]}, Process: ${this.processType}, ENV: ${nodeEnv}, DEBUG: ${debugFlag}`);
        } catch (e) {
            // swallow any console errors in exotic environments
        }
    }

    setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    private log(level: LogLevel, component: string, message: string, data?: unknown): void {
        if (level < this.logLevel) return;

        const entry: LogEntry = {
            level,
            component,
            message,
            data,
            timestamp: new Date(),
            processType: this.processType,
        };

        this.logs.push(entry);

        // 로그 개수 제한
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // 🔥 콘솔 출력 - 환경변수 기반 + 강제 출력 모드
        const timestamp = entry.timestamp.toISOString().slice(11, 23); // HH:MM:SS.mmm 형식
        const levelName = LogLevel[level];
        const processPrefix = `[${this.processType.toUpperCase()}]`;
        const componentPrefix = `[${component}]`;
        const prefix = `${processPrefix}${componentPrefix} ${levelName}`;
        const safeEnv = (typeof process !== 'undefined' && process.env) ? process.env : (typeof window !== 'undefined' ? (window as any).__env__ || {} : {});
        const verboseMode = safeEnv.VERBOSE_LOGGING === 'true';

        // 🔥 강제 출력: DEBUG 레벨도 항상 표시
        const shouldForceOutput = safeEnv.DEBUG === 'true' || safeEnv.NODE_ENV === 'development';

        if (level >= this.logLevel || shouldForceOutput) {
            const logMessage = `${timestamp} ${prefix}: ${message}`;
            const logData = verboseMode && data ? ` ${JSON.stringify(data)}` : '';

            switch (level) {
                case LogLevel.DEBUG:
                    console.debug(`🔍 ${logMessage}${logData}`);
                    break;
                case LogLevel.INFO:
                    console.info(`ℹ️ ${logMessage}${logData}`);
                    break;
                case LogLevel.WARN:
                    console.warn(`⚠️ ${logMessage}${logData}`);
                    break;
                case LogLevel.ERROR:
                    console.error(`❌ ${logMessage}${logData}`);
                    break;
            }
        }
    }

    // 호환성을 위한 오버로드
    debug(componentOrMessage: string, message?: string | unknown, data?: unknown): void {
        if (typeof message === 'string') {
            // component, message, data 패턴
            this.log(LogLevel.DEBUG, componentOrMessage, message, data);
        } else if (message !== undefined) {
            // message, data 패턴 (component 없이)
            this.log(LogLevel.DEBUG, 'UNKNOWN', componentOrMessage, message);
        } else {
            // message만 패턴
            this.log(LogLevel.DEBUG, 'UNKNOWN', componentOrMessage);
        }
    }

    info(componentOrMessage: string, message?: string | unknown, data?: unknown): void {
        if (typeof message === 'string') {
            // component, message, data 패턴
            this.log(LogLevel.INFO, componentOrMessage, message, data);
        } else if (message !== undefined) {
            // message, data 패턴 (component 없이)
            this.log(LogLevel.INFO, 'UNKNOWN', componentOrMessage, message);
        } else {
            // message만 패턴
            this.log(LogLevel.INFO, 'UNKNOWN', componentOrMessage);
        }
    }

    warn(componentOrMessage: string, message?: string | unknown, data?: unknown): void {
        if (typeof message === 'string') {
            // component, message, data 패턴
            this.log(LogLevel.WARN, componentOrMessage, message, data);
        } else if (message !== undefined) {
            // message, data 패턴 (component 없이)
            this.log(LogLevel.WARN, 'UNKNOWN', componentOrMessage, message);
        } else {
            // message만 패턴
            this.log(LogLevel.WARN, 'UNKNOWN', componentOrMessage);
        }
    }

    error(componentOrMessage: string, message?: string | unknown, data?: unknown): void {
        if (typeof message === 'string') {
            // component, message, data 패턴
            this.log(LogLevel.ERROR, componentOrMessage, message, data);
        } else if (message !== undefined) {
            // message, data 패턴 (component 없이)
            this.log(LogLevel.ERROR, 'UNKNOWN', componentOrMessage, message);
        } else {
            // message만 패턴
            this.log(LogLevel.ERROR, 'UNKNOWN', componentOrMessage);
        }
    }

    getLogs(): LogEntry[] {
        return [...this.logs];
    }

    clearLogs(): void {
        this.logs = [];
    }

    getLogsByComponent(component: string): LogEntry[] {
        return this.logs.filter(log => log.component === component);
    }

    getLogsByLevel(level: LogLevel): LogEntry[] {
        return this.logs.filter(log => log.level >= level);
    }

    // 🔥 Timer 기능
    time(label: string): void {
        const now = (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
        this.timers.set(label, now);
        this.debug('TIMER', `Timer started: ${label}`);
    }

    timeEnd(label: string): void {
        const startTime = this.timers.get(label);
        if (startTime === undefined) {
            this.warn('TIMER', `Timer not found: ${label}`);
            return;
        }

        const now = (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
        const duration = now - startTime;
        this.timers.delete(label);
        this.info('TIMER', `Timer completed: ${label}`, { duration: `${duration.toFixed(3)}ms` });
    }
}

// 프로세스별 로거 인스턴스
const mainLogger = new LoggerService('main');
const rendererLogger = new LoggerService('renderer');
const preloadLogger = new LoggerService('preload');

// 모듈별 로거 클래스
class ModuleLogger {
    private moduleName: string;
    private logger: LoggerService;

    constructor(moduleName: string, processType: ProcessType) {
        this.moduleName = moduleName;
        switch (processType) {
            case 'renderer':
                this.logger = rendererLogger;
                break;
            case 'preload':
                this.logger = preloadLogger;
                break;
            default:
                this.logger = mainLogger;
        }
    }

    debug(message: string, data?: unknown): void {
        this.logger.debug(this.moduleName, message, data);
    }

    info(message: string, data?: unknown): void {
        this.logger.info(this.moduleName, message, data);
    }

    warn(message: string, data?: unknown): void {
        this.logger.warn(this.moduleName, message, data);
    }

    error(message: string, data?: unknown): void {
        this.logger.error(this.moduleName, message, data);
    }

    time(label: string): void {
        this.logger.time(label);
    }

    timeEnd(label: string): void {
        this.logger.timeEnd(label);
    }
}

// 모듈 로거 생성 함수 (지침 준수)
export function createModuleLogger(moduleName: string, processType: ProcessType = 'main'): ModuleLogger {
    return new ModuleLogger(moduleName, processType);
}

// 기본 로거 내보내기
export { mainLogger as logger, rendererLogger, preloadLogger, LoggerService, ModuleLogger }
export default mainLogger