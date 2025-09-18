"use strict";
const electron = require("electron");
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
  return LogLevel2;
})(LogLevel || {});
class LoggerService {
  constructor(processType = "main") {
    this.logLevel = 0;
    this.logs = [];
    this.maxLogs = 1e3;
    this.timers = /* @__PURE__ */ new Map();
    this.processType = processType;
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase();
    const debugMode = process.env.DEBUG === "true" || process.env.NODE_ENV === "development";
    if (debugMode || envLogLevel === "debug") {
      this.logLevel = 0;
    } else if (envLogLevel === "info") {
      this.logLevel = 1;
    } else if (envLogLevel === "warn") {
      this.logLevel = 2;
    } else if (envLogLevel === "error") {
      this.logLevel = 3;
    } else {
      this.logLevel = 0;
    }
    console.log(`🔥 [LOGGER] Logger initialized - Level: ${LogLevel[this.logLevel]}, Process: ${this.processType}, ENV: ${process.env.NODE_ENV}, DEBUG: ${process.env.DEBUG}`);
  }
  setLogLevel(level) {
    this.logLevel = level;
  }
  log(level, component, message, data) {
    if (level < this.logLevel) return;
    const entry = {
      level,
      component,
      message,
      data,
      timestamp: /* @__PURE__ */ new Date(),
      processType: this.processType
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    const timestamp = entry.timestamp.toISOString().slice(11, 23);
    const levelName = LogLevel[level];
    const processPrefix = `[${this.processType.toUpperCase()}]`;
    const componentPrefix = `[${component}]`;
    const prefix = `${processPrefix}${componentPrefix} ${levelName}`;
    const verboseMode = process.env.VERBOSE_LOGGING === "true";
    const shouldForceOutput = process.env.DEBUG === "true" || process.env.NODE_ENV === "development";
    if (level >= this.logLevel || shouldForceOutput) {
      const logMessage = `${timestamp} ${prefix}: ${message}`;
      const logData = verboseMode && data ? ` ${JSON.stringify(data)}` : "";
      switch (level) {
        case 0:
          console.debug(`🔍 ${logMessage}${logData}`);
          break;
        case 1:
          console.info(`ℹ️ ${logMessage}${logData}`);
          break;
        case 2:
          console.warn(`⚠️ ${logMessage}${logData}`);
          break;
        case 3:
          console.error(`❌ ${logMessage}${logData}`);
          break;
      }
    }
  }
  // 호환성을 위한 오버로드
  debug(componentOrMessage, message, data) {
    if (typeof message === "string") {
      this.log(0, componentOrMessage, message, data);
    } else if (message !== void 0) {
      this.log(0, "UNKNOWN", componentOrMessage, message);
    } else {
      this.log(0, "UNKNOWN", componentOrMessage);
    }
  }
  info(componentOrMessage, message, data) {
    if (typeof message === "string") {
      this.log(1, componentOrMessage, message, data);
    } else if (message !== void 0) {
      this.log(1, "UNKNOWN", componentOrMessage, message);
    } else {
      this.log(1, "UNKNOWN", componentOrMessage);
    }
  }
  warn(componentOrMessage, message, data) {
    if (typeof message === "string") {
      this.log(2, componentOrMessage, message, data);
    } else if (message !== void 0) {
      this.log(2, "UNKNOWN", componentOrMessage, message);
    } else {
      this.log(2, "UNKNOWN", componentOrMessage);
    }
  }
  error(componentOrMessage, message, data) {
    if (typeof message === "string") {
      this.log(3, componentOrMessage, message, data);
    } else if (message !== void 0) {
      this.log(3, "UNKNOWN", componentOrMessage, message);
    } else {
      this.log(3, "UNKNOWN", componentOrMessage);
    }
  }
  getLogs() {
    return [...this.logs];
  }
  clearLogs() {
    this.logs = [];
  }
  getLogsByComponent(component) {
    return this.logs.filter((log) => log.component === component);
  }
  getLogsByLevel(level) {
    return this.logs.filter((log) => log.level >= level);
  }
  // 🔥 Timer 기능
  time(label) {
    this.timers.set(label, performance.now());
    this.debug("TIMER", `Timer started: ${label}`);
  }
  timeEnd(label) {
    const startTime = this.timers.get(label);
    if (startTime === void 0) {
      this.warn("TIMER", `Timer not found: ${label}`);
      return;
    }
    const duration = performance.now() - startTime;
    this.timers.delete(label);
    this.info("TIMER", `Timer completed: ${label}`, { duration: `${duration.toFixed(3)}ms` });
  }
}
const mainLogger = new LoggerService("main");
const rendererLogger = new LoggerService("renderer");
const preloadLogger$1 = new LoggerService("preload");
class ModuleLogger {
  constructor(moduleName, processType) {
    this.moduleName = moduleName;
    switch (processType) {
      case "renderer":
        this.logger = rendererLogger;
        break;
      case "preload":
        this.logger = preloadLogger$1;
        break;
      default:
        this.logger = mainLogger;
    }
  }
  debug(message, data) {
    this.logger.debug(this.moduleName, message, data);
  }
  info(message, data) {
    this.logger.info(this.moduleName, message, data);
  }
  warn(message, data) {
    this.logger.warn(this.moduleName, message, data);
  }
  error(message, data) {
    this.logger.error(this.moduleName, message, data);
  }
  time(label) {
    this.logger.time(label);
  }
  timeEnd(label) {
    this.logger.timeEnd(label);
  }
}
function createModuleLogger(moduleName, processType = "main") {
  return new ModuleLogger(moduleName, processType);
}
const preloadLogger = createModuleLogger("Preload", "preload");
const api = {
  // 사이드바 토글
  toggleSidebar: () => electron.ipcRenderer.send("toggle-sidebar"),
  // 웹 페이지 네비게이션
  navigateTo: (url) => electron.ipcRenderer.send("navigate-to", url),
  // 창 제어 (커스텀 타이틀바용)
  minimizeWindow: () => electron.ipcRenderer.send("minimize-window"),
  maximizeWindow: () => electron.ipcRenderer.send("toggle-maximize-window"),
  closeWindow: () => electron.ipcRenderer.send("close-window"),
  toggleFullscreen: () => electron.ipcRenderer.send("toggle-fullscreen"),
  // 창 상태 확인
  getWindowState: () => electron.ipcRenderer.invoke("get-window-state"),
  // 웹페이지 캡쳐
  capturePage: () => electron.ipcRenderer.invoke("capture-page"),
  // 탭 캡쳐
  captureTab: (tabId) => electron.ipcRenderer.invoke("capture-tab", tabId),
  // 레이아웃 업데이트 (Chrome 영역 계산용)
  updateLayout: (dimensions) => electron.ipcRenderer.send("update-layout", dimensions),
  // 설정 관련 API
  getSettings: () => electron.ipcRenderer.invoke("get-settings"),
  getUISettings: () => electron.ipcRenderer.invoke("get-ui-settings"),
  setUISettings: (settings) => electron.ipcRenderer.invoke("set-ui-settings", settings),
  getBrowserSettings: () => electron.ipcRenderer.invoke("get-browser-settings"),
  setBrowserSettings: (settings) => electron.ipcRenderer.invoke("set-browser-settings", settings),
  setUserAgentPreset: (preset) => electron.ipcRenderer.invoke("set-user-agent-preset", preset),
  resetSettings: () => electron.ipcRenderer.invoke("reset-settings"),
  // 설정 변경 리스너 추가
  onSettingsChanged: (callback) => {
    electron.ipcRenderer.on("settings-changed", (_, settings) => callback(settings));
  },
  // 설정 리스너 제거
  removeSettingsListener: () => {
    electron.ipcRenderer.removeAllListeners("settings-changed");
  },
  // 사이드바 상태 변경 리스너
  onSidebarToggled: (callback) => {
    electron.ipcRenderer.on("sidebar-toggled", (_, isOpen) => callback(isOpen));
  },
  // 모든 리스너 제거
  removeAllListeners: () => {
    electron.ipcRenderer.removeAllListeners();
  },
  // 메모리 모니터링 API
  toggleMemoryMonitor: () => electron.ipcRenderer.send("toggle-memory-monitor"),
  getMemoryStats: () => electron.ipcRenderer.invoke("get-memory-stats"),
  // 메모리 모니터링 이벤트 리스너
  onToggleMemoryMonitor: (callback) => {
    electron.ipcRenderer.on("toggle-memory-monitor", () => callback());
  }
};
electron.contextBridge.exposeInMainWorld("electronAPI", api);
preloadLogger.info("Loop Browser preload script loaded successfully");
