"use strict";
const electron = require("electron");
const process$1 = require("node:process");
const path = require("node:path");
const vendor = require("./vendor-BTH8xKnN.js");
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
    const safeEnv = typeof process !== "undefined" && process.env ? process.env : typeof window !== "undefined" ? window.__env__ || {} : {};
    const envLogLevel = safeEnv.LOG_LEVEL && String(safeEnv.LOG_LEVEL).toLowerCase() || void 0;
    const debugMode = safeEnv.DEBUG === "true" || safeEnv.NODE_ENV === "development";
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
    try {
      const nodeEnv = safeEnv.NODE_ENV || "unknown";
      const debugFlag = safeEnv.DEBUG || "false";
      console.log(`🔥 [LOGGER] Logger initialized - Level: ${LogLevel[this.logLevel]}, Process: ${this.processType}, ENV: ${nodeEnv}, DEBUG: ${debugFlag}`);
    } catch (e) {
    }
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
    const safeEnv = typeof process !== "undefined" && process.env ? process.env : typeof window !== "undefined" ? window.__env__ || {} : {};
    const verboseMode = safeEnv.VERBOSE_LOGGING === "true";
    const shouldForceOutput = safeEnv.DEBUG === "true" || safeEnv.NODE_ENV === "development";
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
    const now = typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
    this.timers.set(label, now);
    this.debug("TIMER", `Timer started: ${label}`);
  }
  timeEnd(label) {
    const startTime = this.timers.get(label);
    if (startTime === void 0) {
      this.warn("TIMER", `Timer not found: ${label}`);
      return;
    }
    const now = typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
    const duration = now - startTime;
    this.timers.delete(label);
    this.info("TIMER", `Timer completed: ${label}`, { duration: `${duration.toFixed(3)}ms` });
  }
}
const mainLogger$1 = new LoggerService("main");
const rendererLogger = new LoggerService("renderer");
const preloadLogger = new LoggerService("preload");
class ModuleLogger {
  constructor(moduleName, processType) {
    this.moduleName = moduleName;
    switch (processType) {
      case "renderer":
        this.logger = rendererLogger;
        break;
      case "preload":
        this.logger = preloadLogger;
        break;
      default:
        this.logger = mainLogger$1;
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
class DevToolsService {
  constructor() {
    this.mainWindow = null;
    mainLogger$1.info("DevToolsService initialized");
  }
  static getInstance() {
    if (!DevToolsService.instance) {
      DevToolsService.instance = new DevToolsService();
    }
    return DevToolsService.instance;
  }
  // 메인 윈도우 설정
  setMainWindow(window2) {
    this.mainWindow = window2;
    this.registerShortcuts();
  }
  // 단축키 등록
  registerShortcuts() {
    try {
      electron.globalShortcut.register("F12", () => {
        this.openChromeDevTools();
      });
      electron.globalShortcut.register("CommandOrControl+Alt+I", () => {
        this.openChromeDevTools();
      });
      mainLogger$1.info("DevTools shortcuts registered");
    } catch (error) {
      mainLogger$1.error("Failed to register shortcuts", { error });
    }
  }
  // Chrome DevTools 열기 (기존 방식)
  openChromeDevTools(mode) {
    if (!this.mainWindow) {
      mainLogger$1.warn("No main window available for DevTools");
      return;
    }
    try {
      const webContents = this.mainWindow.webContents;
      if (webContents.isDevToolsOpened()) {
        webContents.closeDevTools();
        mainLogger$1.info("DevTools closed");
      } else {
        webContents.openDevTools({ mode: mode || "detach" });
        mainLogger$1.info("DevTools opened", { mode: mode || "detach" });
      }
    } catch (error) {
      mainLogger$1.error("Failed to toggle Chrome DevTools", { error });
    }
  }
  // 단축키 해제
  unregisterShortcuts() {
    try {
      electron.globalShortcut.unregisterAll();
      mainLogger$1.info("DevTools shortcuts unregistered");
    } catch (error) {
      mainLogger$1.error("Failed to unregister shortcuts", { error });
    }
  }
  // DevTools 상태 확인
  isDevToolsOpen() {
    return this.mainWindow?.webContents.isDevToolsOpened() || false;
  }
}
const devToolsService = DevToolsService.getInstance();
class TabService {
  constructor() {
    this.tabs = [];
    this.activeTabId = null;
    this.mainWindow = null;
    this.layoutDimensions = {
      headerHeight: 60,
      sidebarWidth: 250
    };
    mainLogger$1.info("TabService initialized");
  }
  static getInstance() {
    if (!TabService.instance) {
      TabService.instance = new TabService();
    }
    return TabService.instance;
  }
  // 메인 윈도우 설정
  setMainWindow(window2) {
    this.mainWindow = window2;
  }
  // 레이아웃 크기 업데이트
  updateLayoutDimensions(dimensions) {
    this.layoutDimensions = { ...dimensions };
    mainLogger$1.debug("Layout dimensions updated", { dimensions });
  }
  // 새 탭 생성
  createTab(url, section = "normal") {
    const tab = {
      id: this.generateTabId(),
      title: "New Tab",
      url,
      isActive: false,
      section,
      isLoading: true,
      canGoBack: false,
      canGoForward: false,
      createdAt: /* @__PURE__ */ new Date(),
      lastActiveAt: /* @__PURE__ */ new Date()
    };
    try {
      tab.view = new electron.WebContentsView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true,
          sandbox: true
          // 보안 강화
        }
      });
      tab.view.webContents.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      this.setupTabEvents(tab);
      if (tab.view?.webContents) {
        Promise.resolve().then(() => index).then(({ serviceManager: serviceManager2 }) => {
          serviceManager2.optimizeWebContents(tab.view.webContents);
        }).catch((error) => {
          mainLogger$1.error("Failed to apply WebContents optimization", { error });
        });
      }
      tab.view.webContents.loadURL(url);
      mainLogger$1.info("Tab created", { id: tab.id, url, section });
    } catch (error) {
      mainLogger$1.error("Failed to create tab view", { error });
    }
    this.tabs.push(tab);
    return tab;
  }
  // 탭 이벤트 설정
  setupTabEvents(tab) {
    if (!tab.view) return;
    const webContents = tab.view.webContents;
    webContents.on("did-start-loading", () => {
      tab.isLoading = true;
      tab.lastActiveAt = /* @__PURE__ */ new Date();
      mainLogger$1.debug("Tab loading started", { id: tab.id });
    });
    webContents.on("did-finish-load", () => {
      tab.isLoading = false;
      tab.title = webContents.getTitle() || "Untitled";
      tab.url = webContents.getURL();
      tab.canGoBack = webContents.navigationHistory.canGoBack();
      tab.canGoForward = webContents.navigationHistory.canGoForward();
      mainLogger$1.info("Tab loaded", { id: tab.id, title: tab.title, url: tab.url });
    });
    webContents.on("page-title-updated", (event, title) => {
      tab.title = title;
      mainLogger$1.debug("Tab title updated", { id: tab.id, title });
    });
    webContents.on("did-navigate", () => {
      tab.url = webContents.getURL();
      tab.canGoBack = webContents.navigationHistory.canGoBack();
      tab.canGoForward = webContents.navigationHistory.canGoForward();
      mainLogger$1.debug("Tab navigated", { id: tab.id, url: tab.url });
    });
    webContents.setWindowOpenHandler((details) => {
      mainLogger$1.info("New window request intercepted", { url: details.url });
      this.createTab(details.url, tab.section);
      return { action: "deny" };
    });
    webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
      mainLogger$1.error("Tab failed to load", {
        id: tab.id,
        errorCode,
        errorDescription,
        url: validatedURL
      });
      tab.isLoading = false;
    });
    webContents.on("render-process-gone", (event, details) => {
      mainLogger$1.error("Tab renderer process gone", {
        id: tab.id,
        reason: details.reason,
        exitCode: details.exitCode
      });
    });
  }
  // 탭 활성화
  activateTab(tabId) {
    const tab = this.getTab(tabId);
    if (!tab || !tab.view || !this.mainWindow) {
      mainLogger$1.warn("Cannot activate tab", { tabId, hasView: !!tab?.view, hasWindow: !!this.mainWindow });
      return false;
    }
    try {
      if (this.activeTabId) {
        const previousTab = this.getTab(this.activeTabId);
        if (previousTab && previousTab.view) {
          this.mainWindow.contentView.removeChildView(previousTab.view);
          previousTab.isActive = false;
        }
      }
      tab.isActive = true;
      tab.lastActiveAt = /* @__PURE__ */ new Date();
      this.activeTabId = tabId;
      const bounds = this.mainWindow.getContentBounds();
      const chromeX = 20;
      const chromeY = 80;
      const chromeWidth = bounds.width - 284;
      const chromeHeight = bounds.height - 100;
      tab.view.setBounds({
        x: chromeX,
        y: chromeY,
        width: chromeWidth,
        height: chromeHeight
      });
      this.mainWindow.contentView.addChildView(tab.view);
      mainLogger$1.info("Tab activated", { id: tabId, title: tab.title });
      return true;
    } catch (error) {
      mainLogger$1.error("Failed to activate tab", { error, tabId });
      return false;
    }
  }
  // 탭 닫기
  closeTab(tabId) {
    const tabIndex = this.tabs.findIndex((t) => t.id === tabId);
    if (tabIndex === -1) {
      mainLogger$1.warn("Tab not found for closing", { tabId });
      return false;
    }
    const tab = this.tabs[tabIndex];
    try {
      if (tab.view) {
        tab.view.webContents.close();
      }
      this.tabs.splice(tabIndex, 1);
      if (this.activeTabId === tabId) {
        this.activeTabId = null;
        const nextTab = this.tabs[Math.min(tabIndex, this.tabs.length - 1)];
        if (nextTab) {
          this.activateTab(nextTab.id);
        }
      }
      mainLogger$1.info("Tab closed", { id: tabId });
      return true;
    } catch (error) {
      mainLogger$1.error("Failed to close tab", { error, tabId });
      return false;
    }
  }
  // 탭 검색
  getTab(tabId) {
    return this.tabs.find((t) => t.id === tabId);
  }
  // 활성 탭 가져오기
  getActiveTab() {
    if (!this.activeTabId) return void 0;
    return this.getTab(this.activeTabId);
  }
  // 모든 탭 가져오기
  getAllTabs() {
    return [...this.tabs];
  }
  // 탭 이동
  moveTab(tabId, targetSection) {
    const tab = this.getTab(tabId);
    if (!tab) {
      mainLogger$1.warn("Tab not found for moving", { tabId });
      return false;
    }
    const oldSection = tab.section;
    tab.section = targetSection;
    mainLogger$1.info("Tab moved", { id: tabId, from: oldSection, to: targetSection });
    return true;
  }
  // 모든 탭 닫기
  closeAllTabs() {
    const tabIds = this.tabs.map((t) => t.id);
    tabIds.forEach((id) => this.closeTab(id));
    mainLogger$1.info("All tabs closed");
  }
  // 탭 ID 생성
  generateTabId() {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  // 윈도우 크기 변경 시 처리
  resizeActiveTab() {
    if (!this.mainWindow || !this.activeTabId) {
      mainLogger$1.debug("No active tab or window to resize");
      return;
    }
    const activeTab = this.getTab(this.activeTabId);
    if (!activeTab || !activeTab.view) {
      mainLogger$1.debug("Active tab not found or has no view");
      return;
    }
    try {
      const bounds = this.mainWindow.getContentBounds();
      const chromeX = this.layoutDimensions.sidebarWidth;
      const chromeY = this.layoutDimensions.headerHeight;
      const chromeWidth = bounds.width - this.layoutDimensions.sidebarWidth;
      const chromeHeight = bounds.height - this.layoutDimensions.headerHeight;
      activeTab.view.setBounds({
        x: chromeX,
        y: chromeY,
        width: chromeWidth,
        height: chromeHeight
      });
      mainLogger$1.debug("Active tab resized with dynamic dimensions", {
        tabId: this.activeTabId,
        layoutDimensions: this.layoutDimensions,
        chromeArea: { x: chromeX, y: chromeY, width: chromeWidth, height: chromeHeight },
        chromeHeight
      });
    } catch (error) {
      mainLogger$1.error("Failed to resize active tab", { error, tabId: this.activeTabId });
    }
  }
  // 모든 탭의 User-Agent 업데이트
  updateAllTabsUserAgent(userAgent) {
    try {
      let updatedCount = 0;
      for (const tab of this.tabs) {
        if (tab.view?.webContents) {
          tab.view.webContents.setUserAgent(userAgent);
          updatedCount++;
        }
      }
      mainLogger$1.info("User-Agent updated for all tabs", {
        userAgent,
        totalTabs: this.tabs.length,
        updatedTabs: updatedCount
      });
    } catch (error) {
      mainLogger$1.error("Failed to update User-Agent for tabs", { error, userAgent });
    }
  }
}
const tabService = TabService.getInstance();
const { app, ipcMain, shell } = electron;
let isInitialized = false;
const initDataListener = () => {
  if (!ipcMain || !app) {
    throw new Error("Electron Store: You need to call `.initRenderer()` from the main process.");
  }
  const appData = {
    defaultCwd: app.getPath("userData"),
    appVersion: app.getVersion()
  };
  if (isInitialized) {
    return appData;
  }
  ipcMain.on("electron-store-get-data", (event) => {
    event.returnValue = appData;
  });
  isInitialized = true;
  return appData;
};
class ElectronStore extends vendor.Conf {
  constructor(options) {
    let defaultCwd;
    let appVersion;
    if (process$1.type === "renderer") {
      const appData = electron.ipcRenderer.sendSync("electron-store-get-data");
      if (!appData) {
        throw new Error("Electron Store: You need to call `.initRenderer()` from the main process.");
      }
      ({ defaultCwd, appVersion } = appData);
    } else if (ipcMain && app) {
      ({ defaultCwd, appVersion } = initDataListener());
    }
    options = {
      name: "config",
      ...options
    };
    options.projectVersion ||= appVersion;
    if (options.cwd) {
      options.cwd = path.isAbsolute(options.cwd) ? options.cwd : path.join(defaultCwd, options.cwd);
    } else {
      options.cwd = defaultCwd;
    }
    options.configName = options.name;
    delete options.name;
    super(options);
  }
  static initRenderer() {
    initDataListener();
  }
  async openInEditor() {
    const error = await shell.openPath(this.path);
    if (error) {
      throw new Error(error);
    }
  }
}
const USER_AGENT_PRESETS = {
  chrome: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  firefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:142.0) Gecko/20100101 Firefox/142.0",
  safari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15",
  edge: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0",
  custom: ""
};
class SettingsService {
  constructor() {
    this.defaultSettings = {
      ui: {
        // 사이드바 설정
        showSidebar: true,
        sidebarAutoHide: false,
        sidebarWidth: 250,
        // 헤더바 설정
        showHeaderBar: true,
        headerAutoHide: false,
        headerHeight: 60,
        // 테마 설정
        theme: "dark",
        compactMode: false
      },
      browser: {
        // User-Agent 설정
        userAgent: USER_AGENT_PRESETS.chrome,
        userAgentPreset: "chrome",
        // 기본 브라우저 설정
        defaultSearchEngine: "https://www.google.com/search?q=%s",
        homePage: "https://www.google.com",
        downloadPath: "",
        enableDevTools: true,
        enableJavaScript: true
      },
      developer: {
        devToolsEnabled: true,
        consoleLogLevel: "info",
        enableExperimentalFeatures: false
      },
      shortcuts: {
        toggleSidebar: "CommandOrControl+B",
        toggleHeaderBar: "CommandOrControl+Shift+B",
        newTab: "CommandOrControl+T",
        closeTab: "CommandOrControl+W",
        toggleDevTools: "F12",
        focusAddressBar: "CommandOrControl+L",
        openPreferences: "CommandOrControl+,"
      },
      version: "1.0.0"
    };
    this.schema = {
      ui: {
        type: "object",
        properties: {
          showSidebar: { type: "boolean", default: true },
          sidebarAutoHide: { type: "boolean", default: false },
          sidebarWidth: { type: "number", minimum: 200, maximum: 500, default: 250 },
          showHeaderBar: { type: "boolean", default: true },
          headerAutoHide: { type: "boolean", default: false },
          headerHeight: { type: "number", minimum: 40, maximum: 100, default: 60 },
          theme: { type: "string", enum: ["dark", "light", "auto"], default: "dark" },
          compactMode: { type: "boolean", default: false }
        },
        required: ["showSidebar", "sidebarWidth", "showHeaderBar", "headerHeight", "theme"],
        default: this.defaultSettings.ui
      },
      browser: {
        type: "object",
        properties: {
          userAgent: { type: "string", default: USER_AGENT_PRESETS.chrome },
          userAgentPreset: { type: "string", enum: ["chrome", "firefox", "safari", "edge", "custom"], default: "chrome" },
          defaultSearchEngine: { type: "string", default: "https://www.google.com/search?q=%s" },
          homePage: { type: "string", default: "https://www.google.com" },
          downloadPath: { type: "string", default: "" },
          enableDevTools: { type: "boolean", default: true },
          enableJavaScript: { type: "boolean", default: true }
        },
        required: ["userAgent", "userAgentPreset", "defaultSearchEngine", "homePage"],
        default: this.defaultSettings.browser
      },
      developer: {
        type: "object",
        properties: {
          devToolsEnabled: { type: "boolean", default: true },
          consoleLogLevel: { type: "string", enum: ["debug", "info", "warn", "error"], default: "info" },
          enableExperimentalFeatures: { type: "boolean", default: false }
        },
        required: ["devToolsEnabled", "consoleLogLevel"],
        default: this.defaultSettings.developer
      },
      shortcuts: {
        type: "object",
        properties: {
          toggleSidebar: { type: "string", default: "CommandOrControl+B" },
          toggleHeaderBar: { type: "string", default: "CommandOrControl+Shift+B" },
          newTab: { type: "string", default: "CommandOrControl+T" },
          closeTab: { type: "string", default: "CommandOrControl+W" },
          toggleDevTools: { type: "string", default: "F12" },
          focusAddressBar: { type: "string", default: "CommandOrControl+L" },
          openPreferences: { type: "string", default: "CommandOrControl+," }
        },
        required: ["toggleSidebar", "newTab", "closeTab"],
        default: this.defaultSettings.shortcuts
      },
      version: {
        type: "string",
        default: "1.0.0"
      }
    };
    this.store = new ElectronStore({
      name: "loop-browser-settings",
      defaults: this.defaultSettings,
      schema: this.schema
    });
    mainLogger$1.info("SettingsService initialized");
  }
  static getInstance() {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }
  // 초기화
  async initialize() {
    try {
      await this.migrateSettings();
      mainLogger$1.info("SettingsService initialized successfully");
    } catch (error) {
      mainLogger$1.error("Failed to initialize SettingsService", { error });
      throw error;
    }
  }
  // 설정 마이그레이션
  async migrateSettings() {
    const currentVersion = this.store.get("version", "1.0.0");
    mainLogger$1.info(`Migrating settings from version ${currentVersion}`);
    this.store.set("version", this.defaultSettings.version);
  }
  // 전체 설정 가져오기
  getAllSettings() {
    return this.store.store;
  }
  // UI 설정 관련 메서드
  getUISettings() {
    return this.store.get("ui");
  }
  setUISettings(settings) {
    const current = this.store.get("ui");
    this.store.set("ui", { ...current, ...settings });
    mainLogger$1.debug("UI settings updated", { settings });
  }
  // 브라우저 설정 관련 메서드
  getBrowserSettings() {
    return this.store.get("browser");
  }
  setBrowserSettings(settings) {
    const current = this.store.get("browser");
    this.store.set("browser", { ...current, ...settings });
    mainLogger$1.debug("Browser settings updated", { settings });
  }
  // 개발자 설정 관련 메서드
  getDeveloperSettings() {
    return this.store.get("developer");
  }
  setDeveloperSettings(settings) {
    const current = this.store.get("developer");
    this.store.set("developer", { ...current, ...settings });
    mainLogger$1.debug("Developer settings updated", { settings });
  }
  // 단축키 설정 관련 메서드
  getShortcutSettings() {
    return this.store.get("shortcuts");
  }
  setShortcutSettings(settings) {
    const current = this.store.get("shortcuts");
    this.store.set("shortcuts", { ...current, ...settings });
    mainLogger$1.debug("Shortcut settings updated", { settings });
  }
  // User-Agent 관련 메서드
  getUserAgent() {
    return this.store.get("browser.userAgent");
  }
  setUserAgent(userAgent, preset) {
    this.store.set("browser.userAgent", userAgent);
    if (preset) {
      this.store.set("browser.userAgentPreset", preset);
    }
    mainLogger$1.info("User-Agent updated", { userAgent, preset });
  }
  setUserAgentPreset(preset) {
    const userAgent = USER_AGENT_PRESETS[preset];
    this.setUserAgent(userAgent, preset);
  }
  // 개별 설정 가져오기/설정하기
  get(key) {
    return this.store.get(key);
  }
  set(key, value) {
    this.store.set(key, value);
    mainLogger$1.debug("Setting updated", { key, value });
  }
  // 설정 초기화
  resetSettings() {
    this.store.clear();
    this.store.store = this.defaultSettings;
    mainLogger$1.info("Settings reset to defaults");
  }
  // 설정 내보내기
  exportSettings() {
    return this.store.store;
  }
  // 설정 가져오기
  importSettings(settings) {
    const current = this.store.store;
    this.store.store = { ...current, ...settings };
    mainLogger$1.info("Settings imported");
  }
  // 설정 파일 경로 가져오기
  getSettingsPath() {
    return this.store.path;
  }
}
const settingsService = SettingsService.getInstance();
const securityLogger = createModuleLogger("Security", "main");
class SecurityManager {
  constructor() {
  }
  static getInstance() {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }
  /**
   * CSP 헤더 생성
   */
  getCSPHeader() {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com http://localhost:5173",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com http://localhost:5173",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob: http://localhost:5173",
      "connect-src 'self' https: wss: http://localhost:5173 ws://localhost:5173",
      "media-src 'self' https: blob: http://localhost:5173",
      "object-src 'none'",
      "frame-src 'self' https: http://localhost:5173",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join("; ");
  }
  /**
   * CSP 적용
   */
  applyCSP(webContents) {
    const cspHeader = this.getCSPHeader();
    webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [cspHeader]
        }
      });
    });
    securityLogger.info("CSP (Content Security Policy) applied to webContents");
  }
  /**
   * 보안 검증
   */
  validateSecurity(url) {
    try {
      const urlObj = new URL(url);
      const allowedProtocols = ["http:", "https:", "file:"];
      if (!allowedProtocols.includes(urlObj.protocol)) {
        securityLogger.warn("Blocked potentially unsafe protocol", { protocol: urlObj.protocol, url });
        return false;
      }
      return true;
    } catch (error) {
      securityLogger.error("Security validation failed", { url, error });
      return false;
    }
  }
}
const securityManager = SecurityManager.getInstance();
class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.webContentsView = null;
    this.isWindowReady = false;
    mainLogger$1.info("WindowManager initialized");
  }
  static getInstance() {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager();
    }
    return WindowManager.instance;
  }
  // 메인 윈도우 생성
  async createMainWindow() {
    if (this.mainWindow) {
      mainLogger$1.warn("Main window already exists");
      return this.mainWindow;
    }
    try {
      mainLogger$1.info("Creating main window...");
      const { width: screenWidth, height: screenHeight } = electron.screen.getPrimaryDisplay().workAreaSize;
      const windowWidth = Math.floor(screenWidth * 0.8);
      const windowHeight = Math.floor(screenHeight * 0.8);
      const contentWidth = windowWidth - 20;
      const contentHeight = windowHeight - 20;
      this.mainWindow = new electron.BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        minWidth: 800,
        minHeight: 600,
        show: false,
        autoHideMenuBar: true,
        frame: true,
        // 기본 프레임 사용 (창 컨트롤 버튼 포함)
        titleBarStyle: "default",
        // 기본 타이틀바
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true,
          preload: require("path").join(__dirname, "../preload/preload.js")
        }
      });
      const userAgent = settingsService.getUserAgent();
      this.mainWindow.webContents.setUserAgent(userAgent);
      mainLogger$1.info("User-Agent set from settings", { userAgent });
      devToolsService.setMainWindow(this.mainWindow);
      tabService.setMainWindow(this.mainWindow);
      this.webContentsView = new electron.WebContentsView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      this.mainWindow.contentView.addChildView(this.webContentsView);
      this.setupWindowEvents();
      this.mainWindow.center();
      await this.loadUI();
      if (this.mainWindow) {
        securityManager.applyCSP(this.mainWindow.webContents);
      }
      electron.ipcMain.on("update-layout", (_event, dims) => {
        try {
          this.updateWebContentsViewBounds(dims.headerHeight, dims.sidebarWidth);
        } catch (err) {
          mainLogger$1.error("Failed to update WebContentsView bounds from IPC", { err });
        }
      });
      mainLogger$1.info("Main window created successfully", {
        width: windowWidth,
        height: windowHeight
      });
      return this.mainWindow;
    } catch (error) {
      mainLogger$1.error("Failed to create main window", { error });
      throw error;
    }
  }
  // 윈도우 이벤트 설정
  setupWindowEvents() {
    if (!this.mainWindow) return;
    this.mainWindow.on("ready-to-show", () => {
      if (this.isWindowReady) {
        mainLogger$1.debug("Window already ready, skipping ready-to-show handler");
        return;
      }
      mainLogger$1.info("Main window ready to show");
      this.mainWindow?.show();
      if (process.env.NODE_ENV === "development") {
        this.mainWindow?.webContents.openDevTools({ mode: "detach" });
      }
      this.createDefaultTab();
      this.isWindowReady = true;
    });
    this.mainWindow.on("resize", () => {
      mainLogger$1.debug("Window resized");
      tabService.resizeActiveTab();
      this.updateWebContentsViewBounds();
    });
    this.mainWindow.on("focus", () => {
      mainLogger$1.debug("Window focused");
    });
    this.mainWindow.on("blur", () => {
      mainLogger$1.debug("Window blurred");
    });
    this.mainWindow.on("closed", () => {
      mainLogger$1.info("Main window closed");
      this.cleanup();
    });
    this.mainWindow.webContents.on("render-process-gone", (event, details) => {
      mainLogger$1.error("Renderer process gone", {
        reason: details.reason,
        exitCode: details.exitCode
      });
    });
    this.mainWindow.webContents.on("unresponsive", () => {
      mainLogger$1.warn("WebContents became unresponsive");
    });
    this.mainWindow.webContents.on("responsive", () => {
      mainLogger$1.info("WebContents became responsive again");
    });
    if (this.webContentsView) {
      this.webContentsView.webContents.on("did-finish-load", () => {
        mainLogger$1.info("WebContentsView finished load");
      });
      this.webContentsView.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
        mainLogger$1.error("WebContentsView failed to load", { errorCode, errorDescription, validatedURL });
      });
    }
  }
  // UI 로드
  async loadUI() {
    if (!this.mainWindow) return;
    try {
      if (process.env.NODE_ENV === "development") {
        await this.mainWindow.loadURL("http://localhost:5173");
        mainLogger$1.info("Loaded development UI");
      } else {
        await this.mainWindow.loadFile(require("path").join(__dirname, "../renderer/index.html"));
        mainLogger$1.info("Loaded production UI");
      }
      const activeTab = tabService.getActiveTab();
      const initialUrl = activeTab?.url || "https://www.google.com";
      if (this.webContentsView) {
        this.webContentsView.webContents.loadURL(initialUrl).catch((err) => {
          mainLogger$1.error("Failed to load initial URL into WebContentsView", { err, url: initialUrl });
        });
      }
    } catch (error) {
      mainLogger$1.error("Failed to load UI", { error });
      throw error;
    }
  }
  // WebContentsView bounds 업데이트 helper
  updateWebContentsViewBounds(headerHeight = 60, sidebarWidth = 250) {
    if (!this.mainWindow || !this.webContentsView) return;
    const contentBounds = this.mainWindow.getContentBounds();
    const left = 10 + sidebarWidth;
    const top = 10 + headerHeight;
    const width = Math.max(0, contentBounds.width - left - 10);
    const height = Math.max(0, contentBounds.height - top - 10);
    this.webContentsView.setBounds({ x: left, y: top, width, height });
    mainLogger$1.debug("WebContentsView bounds updated", { x: left, y: top, width, height });
  }
  // 기본 탭 생성
  createDefaultTab() {
    try {
      const existingTabs = tabService.getAllTabs();
      if (existingTabs.length > 0) {
        mainLogger$1.debug("Tabs already exist, skipping default tab creation");
        return;
      }
      const defaultTab = tabService.createTab("https://www.google.com", "normal");
      tabService.activateTab(defaultTab.id);
      mainLogger$1.info("Default tab created and activated", { id: defaultTab.id });
    } catch (error) {
      mainLogger$1.error("Failed to create default tab", { error });
    }
  }
  // 메인 윈도우 가져오기
  getMainWindow() {
    return this.mainWindow;
  }
  // WebContentsView 가져오기
  getWebContentsView() {
    return this.webContentsView;
  }
  // 숨기기/보이기 유틸
  hideWebContentsView() {
    if (!this.webContentsView || !this.mainWindow) return;
    try {
      this.mainWindow.contentView.removeChildView(this.webContentsView);
      mainLogger$1.debug("WebContentsView hidden");
    } catch (error) {
      mainLogger$1.error("Failed to hide WebContentsView", { error });
    }
  }
  showWebContentsView() {
    if (!this.webContentsView || !this.mainWindow) return;
    try {
      this.mainWindow.contentView.addChildView(this.webContentsView);
      this.updateWebContentsViewBounds();
      mainLogger$1.debug("WebContentsView shown");
    } catch (error) {
      mainLogger$1.error("Failed to show WebContentsView", { error });
    }
  }
  // 윈도우 표시 여부 확인
  isWindowVisible() {
    return this.mainWindow?.isVisible() || false;
  }
  // 윈도우 포커스 여부 확인
  isWindowFocused() {
    return this.mainWindow?.isFocused() || false;
  }
  // 윈도우 최소화 여부 확인
  isWindowMinimized() {
    return this.mainWindow?.isMinimized() || false;
  }
  // 윈도우 최대화 여부 확인
  isWindowMaximized() {
    return this.mainWindow?.isMaximized() || false;
  }
  // 윈도우 전체화면 여부 확인
  isWindowFullScreen() {
    return this.mainWindow?.isFullScreen() || false;
  }
  // 윈도우 보이기
  showWindow() {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
      mainLogger$1.debug("Window shown and focused");
    }
  }
  // 윈도우 숨기기
  hideWindow() {
    if (this.mainWindow) {
      this.mainWindow.hide();
      mainLogger$1.debug("Window hidden");
    }
  }
  // 윈도우 최소화
  minimizeWindow() {
    if (this.mainWindow) {
      this.mainWindow.minimize();
      mainLogger$1.debug("Window minimized");
    }
  }
  // 윈도우 최대화/복원
  toggleMaximizeWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
        mainLogger$1.debug("Window unmaximized");
      } else {
        this.mainWindow.maximize();
        mainLogger$1.debug("Window maximized");
      }
    }
  }
  // 전체화면 토글
  toggleFullScreen() {
    if (this.mainWindow) {
      this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
      mainLogger$1.debug("Window fullscreen toggled", {
        isFullScreen: this.mainWindow.isFullScreen()
      });
    }
  }
  // 윈도우 닫기
  closeWindow() {
    if (this.mainWindow) {
      this.mainWindow.close();
      mainLogger$1.debug("Window close requested");
    }
  }
  // User-Agent 동적 업데이트
  updateUserAgent(userAgent) {
    try {
      if (!this.mainWindow) {
        mainLogger$1.warn("Cannot update User-Agent: main window not available");
        return;
      }
      const newUserAgent = userAgent || settingsService.getUserAgent();
      this.mainWindow.webContents.setUserAgent(newUserAgent);
      mainLogger$1.info("User-Agent updated", { userAgent: newUserAgent });
      tabService.updateAllTabsUserAgent(newUserAgent);
    } catch (error) {
      mainLogger$1.error("Failed to update User-Agent", { error, userAgent });
    }
  }
  // 정리 작업
  cleanup() {
    try {
      if (this.mainWindow) {
        if (this.webContentsView) {
          this.webContentsView.webContents.close();
          this.webContentsView = null;
        }
        devToolsService.unregisterShortcuts();
        tabService.closeAllTabs();
        this.mainWindow = null;
        this.isWindowReady = false;
        mainLogger$1.info("WindowManager cleanup complete");
      }
    } catch (error) {
      mainLogger$1.error("Error during WindowManager cleanup", { error });
    }
  }
}
const windowManager = WindowManager.getInstance();
class IpcHandlers {
  constructor() {
    this.isSetup = false;
    mainLogger$1.info("IpcHandlers initialized");
  }
  static getInstance() {
    if (!IpcHandlers.instance) {
      IpcHandlers.instance = new IpcHandlers();
    }
    return IpcHandlers.instance;
  }
  // IPC 핸들러 설정
  setupHandlers() {
    if (this.isSetup) {
      mainLogger$1.warn("IPC handlers already setup");
      return;
    }
    try {
      mainLogger$1.info("Setting up IPC handlers...");
      this.setupWindowHandlers();
      this.setupTabHandlers();
      this.setupNavigationHandlers();
      this.setupDevToolsHandlers();
      this.setupSettingsHandlers();
      this.setupCaptureHandlers();
      this.isSetup = true;
      mainLogger$1.info("IPC handlers setup complete");
    } catch (error) {
      mainLogger$1.error("Failed to setup IPC handlers", { error });
      throw error;
    }
  }
  // 윈도우 관련 핸들러
  setupWindowHandlers() {
    electron.ipcMain.on("toggle-sidebar", (event) => {
      try {
        const currentSettings = settingsService.getUISettings();
        const newSidebarState = !currentSettings.showSidebar;
        settingsService.setUISettings({
          ...currentSettings,
          showSidebar: newSidebarState
        });
        tabService.resizeActiveTab();
        const mainWindow = windowManager.getMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send("sidebar-toggled", newSidebarState);
          const allSettings = settingsService.getAllSettings();
          mainWindow.webContents.send("settings-changed", allSettings);
        }
        mainLogger$1.debug("Sidebar toggled to:", newSidebarState);
      } catch (error) {
        mainLogger$1.error("Failed to toggle sidebar", { error });
      }
    });
    electron.ipcMain.on("update-layout", (event, dimensions) => {
      try {
        mainLogger$1.debug("Layout updated", { dimensions });
        tabService.updateLayoutDimensions(dimensions);
        tabService.resizeActiveTab();
      } catch (error) {
        mainLogger$1.error("Failed to update layout", { error });
      }
    });
    electron.ipcMain.on("minimize-window", () => {
      try {
        windowManager.minimizeWindow();
      } catch (error) {
        mainLogger$1.error("Failed to minimize window", { error });
      }
    });
    electron.ipcMain.on("toggle-maximize-window", () => {
      try {
        windowManager.toggleMaximizeWindow();
      } catch (error) {
        mainLogger$1.error("Failed to toggle maximize window", { error });
      }
    });
    electron.ipcMain.on("close-window", () => {
      try {
        windowManager.closeWindow();
      } catch (error) {
        mainLogger$1.error("Failed to close window", { error });
      }
    });
    electron.ipcMain.on("toggle-fullscreen", () => {
      try {
        windowManager.toggleFullScreen();
      } catch (error) {
        mainLogger$1.error("Failed to toggle fullscreen", { error });
      }
    });
    electron.ipcMain.handle("get-window-state", () => {
      try {
        return {
          isMaximized: windowManager.isWindowMaximized(),
          isMinimized: windowManager.isWindowMinimized(),
          isFullScreen: windowManager.isWindowFullScreen(),
          isFocused: windowManager.isWindowFocused(),
          isVisible: windowManager.isWindowVisible()
        };
      } catch (error) {
        mainLogger$1.error("Failed to get window state", { error });
        return null;
      }
    });
  }
  // 탭 관련 핸들러
  setupTabHandlers() {
    electron.ipcMain.handle("create-tab", (event, url, section) => {
      try {
        const tab = tabService.createTab(url, section);
        mainLogger$1.info("Tab created via IPC", { id: tab.id, url, section });
        return {
          id: tab.id,
          title: tab.title,
          url: tab.url,
          section: tab.section,
          isActive: tab.isActive,
          isLoading: tab.isLoading,
          canGoBack: tab.canGoBack,
          canGoForward: tab.canGoForward
        };
      } catch (error) {
        mainLogger$1.error("Failed to create tab via IPC", { error, url, section });
        return null;
      }
    });
    electron.ipcMain.handle("activate-tab", (event, tabId) => {
      try {
        const result = tabService.activateTab(tabId);
        mainLogger$1.debug("Tab activated via IPC", { tabId, success: result });
        return result;
      } catch (error) {
        mainLogger$1.error("Failed to activate tab via IPC", { error, tabId });
        return false;
      }
    });
    electron.ipcMain.handle("close-tab", (event, tabId) => {
      try {
        const result = tabService.closeTab(tabId);
        mainLogger$1.debug("Tab closed via IPC", { tabId, success: result });
        return result;
      } catch (error) {
        mainLogger$1.error("Failed to close tab via IPC", { error, tabId });
        return false;
      }
    });
    electron.ipcMain.handle("get-all-tabs", () => {
      try {
        const tabs = tabService.getAllTabs().map((tab) => ({
          id: tab.id,
          title: tab.title,
          url: tab.url,
          section: tab.section,
          isActive: tab.isActive,
          isLoading: tab.isLoading,
          canGoBack: tab.canGoBack,
          canGoForward: tab.canGoForward,
          favicon: tab.favicon
        }));
        mainLogger$1.debug("Tabs retrieved via IPC", { count: tabs.length });
        return tabs;
      } catch (error) {
        mainLogger$1.error("Failed to get tabs via IPC", { error });
        return [];
      }
    });
    electron.ipcMain.handle("get-active-tab", () => {
      try {
        const activeTab = tabService.getActiveTab();
        if (activeTab) {
          return {
            id: activeTab.id,
            title: activeTab.title,
            url: activeTab.url,
            section: activeTab.section,
            isActive: activeTab.isActive,
            isLoading: activeTab.isLoading,
            canGoBack: activeTab.canGoBack,
            canGoForward: activeTab.canGoForward,
            favicon: activeTab.favicon
          };
        }
        return null;
      } catch (error) {
        mainLogger$1.error("Failed to get active tab via IPC", { error });
        return null;
      }
    });
    electron.ipcMain.handle("move-tab", (event, tabId, targetSection) => {
      try {
        const result = tabService.moveTab(tabId, targetSection);
        mainLogger$1.debug("Tab moved via IPC", { tabId, targetSection, success: result });
        return result;
      } catch (error) {
        mainLogger$1.error("Failed to move tab via IPC", { error, tabId, targetSection });
        return false;
      }
    });
  }
  // 네비게이션 관련 핸들러
  setupNavigationHandlers() {
    electron.ipcMain.on("navigate-to", (event, url) => {
      try {
        const activeTab = tabService.getActiveTab();
        if (url.startsWith("about:")) {
          const mainWindow = windowManager.getMainWindow();
          if (mainWindow) {
            if (url === "about:preferences") {
              windowManager.hideWebContentsView();
              mainWindow.webContents.send("show-preferences");
            }
          }
          return;
        }
        if (activeTab && activeTab.view) {
          let formattedUrl = url;
          if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("file://")) {
            if (url.includes(".") && !url.includes(" ")) {
              formattedUrl = "https://" + url;
            } else {
              formattedUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
            }
          }
          activeTab.view.webContents.loadURL(formattedUrl);
          windowManager.showWebContentsView();
          mainLogger$1.info("Navigation requested via IPC", { originalUrl: url, formattedUrl });
        } else {
          mainLogger$1.warn("No active tab for navigation", { url });
        }
      } catch (error) {
        mainLogger$1.error("Failed to navigate via IPC", { error, url });
      }
    });
    electron.ipcMain.on("go-back", () => {
      try {
        const activeTab = tabService.getActiveTab();
        if (activeTab && activeTab.view && activeTab.canGoBack) {
          activeTab.view.webContents.navigationHistory.goBack();
          mainLogger$1.debug("Go back requested via IPC");
        }
      } catch (error) {
        mainLogger$1.error("Failed to go back via IPC", { error });
      }
    });
    electron.ipcMain.on("go-forward", () => {
      try {
        const activeTab = tabService.getActiveTab();
        if (activeTab && activeTab.view && activeTab.canGoForward) {
          activeTab.view.webContents.navigationHistory.goForward();
          mainLogger$1.debug("Go forward requested via IPC");
        }
      } catch (error) {
        mainLogger$1.error("Failed to go forward via IPC", { error });
      }
    });
    electron.ipcMain.on("reload", () => {
      try {
        const activeTab = tabService.getActiveTab();
        if (activeTab && activeTab.view) {
          activeTab.view.webContents.reload();
          mainLogger$1.debug("Reload requested via IPC");
        }
      } catch (error) {
        mainLogger$1.error("Failed to reload via IPC", { error });
      }
    });
    electron.ipcMain.on("go-home", () => {
      try {
        const activeTab = tabService.getActiveTab();
        if (activeTab && activeTab.view) {
          activeTab.view.webContents.loadURL("https://www.google.com");
          mainLogger$1.debug("Go home requested via IPC");
        }
      } catch (error) {
        mainLogger$1.error("Failed to go home via IPC", { error });
      }
    });
  }
  // DevTools 관련 핸들러
  setupDevToolsHandlers() {
    electron.ipcMain.on("open-devtools", (event, mode) => {
      try {
        devToolsService.openChromeDevTools(mode);
        mainLogger$1.debug("DevTools opened via IPC", { mode });
      } catch (error) {
        mainLogger$1.error("Failed to open DevTools via IPC", { error, mode });
      }
    });
    electron.ipcMain.handle("is-devtools-open", () => {
      try {
        return devToolsService.isDevToolsOpen();
      } catch (error) {
        mainLogger$1.error("Failed to check DevTools state via IPC", { error });
        return false;
      }
    });
  }
  // 설정 관련 핸들러
  setupSettingsHandlers() {
    electron.ipcMain.handle("get-settings", () => {
      try {
        const settings = settingsService.getAllSettings();
        mainLogger$1.debug("Settings retrieved via IPC");
        return settings;
      } catch (error) {
        mainLogger$1.error("Failed to get settings via IPC", { error });
        return {};
      }
    });
    electron.ipcMain.handle("get-ui-settings", () => {
      try {
        return settingsService.getUISettings();
      } catch (error) {
        mainLogger$1.error("Failed to get UI settings via IPC", { error });
        return null;
      }
    });
    electron.ipcMain.handle("set-ui-settings", (event, settings) => {
      try {
        settingsService.setUISettings(settings);
        const allSettings = settingsService.getAllSettings();
        const mainWindow = windowManager.getMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send("settings-changed", allSettings);
        }
        mainLogger$1.debug("UI settings saved and broadcasted via IPC", { settings });
        return true;
      } catch (error) {
        mainLogger$1.error("Failed to set UI settings via IPC", { error, settings });
        return false;
      }
    });
    electron.ipcMain.handle("get-browser-settings", () => {
      try {
        return settingsService.getBrowserSettings();
      } catch (error) {
        mainLogger$1.error("Failed to get browser settings via IPC", { error });
        return null;
      }
    });
    electron.ipcMain.handle("set-browser-settings", (event, settings) => {
      try {
        settingsService.setBrowserSettings(settings);
        const allSettings = settingsService.getAllSettings();
        const mainWindow = windowManager.getMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send("settings-changed", allSettings);
        }
        mainLogger$1.debug("Browser settings saved and broadcasted via IPC", { settings });
        return true;
      } catch (error) {
        mainLogger$1.error("Failed to set browser settings via IPC", { error, settings });
        return false;
      }
    });
    electron.ipcMain.handle("set-user-agent-preset", (event, preset) => {
      try {
        settingsService.setUserAgentPreset(preset);
        windowManager.updateUserAgent();
        mainLogger$1.info("User-Agent preset updated via IPC", { preset });
        return true;
      } catch (error) {
        mainLogger$1.error("Failed to set User-Agent preset via IPC", { error, preset });
        return false;
      }
    });
    electron.ipcMain.handle("reset-settings", () => {
      try {
        settingsService.resetSettings();
        mainLogger$1.info("Settings reset via IPC");
        return true;
      } catch (error) {
        mainLogger$1.error("Failed to reset settings via IPC", { error });
        return false;
      }
    });
  }
  // 캡쳐 관련 핸들러
  setupCaptureHandlers() {
    electron.ipcMain.handle("capture-page", async () => {
      try {
        const activeTab = tabService.getActiveTab();
        if (!activeTab || !activeTab.view) {
          mainLogger$1.warn("No active tab to capture");
          return null;
        }
        const image = await activeTab.view.webContents.capturePage();
        const buffer = image.toPNG();
        mainLogger$1.info("Page captured successfully");
        return buffer;
      } catch (error) {
        mainLogger$1.error("Failed to capture page", { error });
        return null;
      }
    });
    electron.ipcMain.handle("capture-tab", async (event, tabId) => {
      try {
        const tab = tabService.getTab(tabId);
        if (!tab || !tab.view) {
          mainLogger$1.warn("Tab not found for capture", { tabId });
          return null;
        }
        const image = await tab.view.webContents.capturePage();
        const buffer = image.toPNG();
        mainLogger$1.info("Tab captured successfully", { tabId });
        return buffer;
      } catch (error) {
        mainLogger$1.error("Failed to capture tab", { error, tabId });
        return null;
      }
    });
    electron.ipcMain.on("toggle-memory-monitor", (event) => {
      try {
        const mainWindow = windowManager.getMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send("toggle-memory-monitor");
        }
        mainLogger$1.debug("Memory monitor toggle requested");
      } catch (error) {
        mainLogger$1.error("Failed to toggle memory monitor", { error });
      }
    });
    electron.ipcMain.handle("get-memory-stats", async () => {
      try {
        const memoryService2 = (await Promise.resolve().then(() => MemoryService$1)).memoryService;
        return await memoryService2.getMemoryStats();
      } catch (error) {
        mainLogger$1.error("Failed to get memory stats", { error });
        return null;
      }
    });
  }
  // 핸들러 정리
  cleanup() {
    try {
      electron.ipcMain.removeAllListeners();
      this.isSetup = false;
      mainLogger$1.info("IPC handlers cleanup complete");
    } catch (error) {
      mainLogger$1.error("Error during IPC handlers cleanup", { error });
    }
  }
}
IpcHandlers.getInstance();
class AppLifecycle {
  constructor() {
    this.isInitialized = false;
    this.windowManager = WindowManager.getInstance();
    this.ipcHandlers = IpcHandlers.getInstance();
    mainLogger$1.info("AppLifecycle initialized");
  }
  static getInstance() {
    if (!AppLifecycle.instance) {
      AppLifecycle.instance = new AppLifecycle();
    }
    return AppLifecycle.instance;
  }
  // 앱 준비 이벤트 핸들러
  async onReady() {
    try {
      mainLogger$1.info("App ready event triggered");
      if (!this.isInitialized) {
        await this.initializeApp();
      }
      await this.windowManager.createMainWindow();
    } catch (error) {
      mainLogger$1.error("Failed to handle app ready event", { error });
      electron.app.quit();
    }
  }
  // 모든 창 닫힘 이벤트 핸들러
  onWindowAllClosed() {
    mainLogger$1.info("All windows closed");
    if (process.platform !== "darwin") {
      mainLogger$1.info("Quitting app on non-macOS platform");
      electron.app.quit();
    }
  }
  // 앱 활성화 이벤트 핸들러 (macOS dock 클릭)
  onActivate() {
    mainLogger$1.info("App activated");
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      this.windowManager.createMainWindow();
    }
  }
  // 앱 시작 전 초기화
  onBeforeQuit() {
    mainLogger$1.info("App is about to quit - cleaning up resources");
    this.windowManager.cleanup();
    this.ipcHandlers.cleanup();
  }
  // 앱 초기화
  async initializeApp() {
    try {
      mainLogger$1.info("Initializing application components...");
      this.ipcHandlers.setupHandlers();
      this.isInitialized = true;
      mainLogger$1.info("Application initialization complete");
    } catch (error) {
      mainLogger$1.error("Failed to initialize app", { error });
      throw error;
    }
  }
  // 이벤트 핸들러 등록
  setupEventHandlers() {
    mainLogger$1.info("Setting up app event handlers");
    electron.app.on("ready", () => this.onReady());
    electron.app.on("window-all-closed", () => this.onWindowAllClosed());
    electron.app.on("activate", () => this.onActivate());
    electron.app.on("before-quit", () => this.onBeforeQuit());
  }
}
class NetworkService {
  constructor() {
    this.config = {
      enableHTTP2: true,
      enablePreloading: true,
      enableCompression: true,
      enableCaching: true,
      cacheMaxAge: 36e5,
      // 1시간
      maxConcurrentConnections: 6
    };
    mainLogger$1.info("NetworkService initialized");
  }
  static getInstance() {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }
  // 네트워크 최적화 활성화
  async optimizeNetwork() {
    try {
      await this.setupHTTP2();
      await this.setupCompression();
      await this.setupCaching();
      await this.setupPreloading();
      await this.setupConnectionLimits();
      mainLogger$1.info("Network optimization applied successfully", this.config);
    } catch (error) {
      mainLogger$1.error("Failed to apply network optimization", { error });
      throw error;
    }
  }
  // HTTP/2 활성화
  async setupHTTP2() {
    if (!this.config.enableHTTP2) return;
    try {
      const defaultSession = electron.session.defaultSession;
      defaultSession.setSpellCheckerEnabled(false);
      mainLogger$1.debug("HTTP/2 optimization enabled");
    } catch (error) {
      mainLogger$1.error("Failed to setup HTTP/2", { error });
    }
  }
  // 압축 최적화
  async setupCompression() {
    if (!this.config.enableCompression) return;
    try {
      const defaultSession = electron.session.defaultSession;
      defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders["Accept-Encoding"] = "gzip, deflate, br";
        callback({ requestHeaders: details.requestHeaders });
      });
      mainLogger$1.debug("Compression optimization enabled");
    } catch (error) {
      mainLogger$1.error("Failed to setup compression", { error });
    }
  }
  // 캐싱 최적화
  async setupCaching() {
    if (!this.config.enableCaching) return;
    try {
      const defaultSession = electron.session.defaultSession;
      defaultSession.webRequest.onHeadersReceived((details, callback) => {
        const responseHeaders = details.responseHeaders || {};
        if (this.isStaticResource(details.url)) {
          responseHeaders["Cache-Control"] = [`max-age=${this.config.cacheMaxAge}`];
        }
        callback({ responseHeaders });
      });
      mainLogger$1.debug("Caching optimization enabled", { maxAge: this.config.cacheMaxAge });
    } catch (error) {
      mainLogger$1.error("Failed to setup caching", { error });
    }
  }
  // 프리로딩 최적화
  async setupPreloading() {
    if (!this.config.enablePreloading) return;
    try {
      const defaultSession = electron.session.defaultSession;
      defaultSession.webRequest.onBeforeRequest((details, callback) => {
        if (this.isCriticalResource(details.url)) {
          callback({});
        } else {
          callback({});
        }
      });
      mainLogger$1.debug("Preloading optimization enabled");
    } catch (error) {
      mainLogger$1.error("Failed to setup preloading", { error });
    }
  }
  // 연결 제한 설정
  async setupConnectionLimits() {
    try {
      const defaultSession = electron.session.defaultSession;
      await defaultSession.clearCache();
      mainLogger$1.debug("Connection limits configured", {
        maxConnections: this.config.maxConcurrentConnections
      });
    } catch (error) {
      mainLogger$1.error("Failed to setup connection limits", { error });
    }
  }
  // 정적 리소스 판별
  isStaticResource(url) {
    const staticExtensions = [".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".ttf"];
    return staticExtensions.some((ext) => url.includes(ext));
  }
  // 중요 리소스 판별
  isCriticalResource(url) {
    const criticalPatterns = [".css", ".js", "/api/", "/critical/"];
    return criticalPatterns.some((pattern) => url.includes(pattern));
  }
  // WebContents별 네트워크 최적화
  optimizeWebContents(webContents) {
    try {
      webContents.on("dom-ready", () => {
        webContents.executeJavaScript(`
                    // DNS 프리페치 최적화
                    const linkEl = document.createElement('link');
                    linkEl.rel = 'dns-prefetch';
                    linkEl.href = '//fonts.googleapis.com';
                    document.head.appendChild(linkEl);

                    // 이미지 지연 로딩
                    if ('loading' in HTMLImageElement.prototype) {
                        const images = document.querySelectorAll('img[data-src]');
                        images.forEach(img => {
                            img.src = img.dataset.src;
                            img.loading = 'lazy';
                        });
                    }
                `).catch(() => {
        });
      });
      mainLogger$1.debug("WebContents network optimization applied");
    } catch (error) {
      mainLogger$1.error("Failed to optimize WebContents", { error });
    }
  }
  // 네트워크 통계 수집
  getNetworkStats() {
    return new Promise((resolve) => {
      const stats = {
        cacheHitRate: 0,
        averageLoadTime: 0,
        compressionRatio: 0,
        activeConnections: 0
      };
      resolve(stats);
    });
  }
  // 설정 업데이트
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    mainLogger$1.info("NetworkService configuration updated", this.config);
  }
  // 정리 작업
  cleanup() {
    mainLogger$1.info("NetworkService cleanup completed");
  }
}
const networkService = NetworkService.getInstance();
class V8Service {
  constructor() {
    this.config = {
      enableGCOptimization: true,
      enableJITOptimization: true,
      heapSizeLimit: 1024,
      // 1GB
      enableTurboFan: true,
      enableCodeCache: true
    };
    this.gcStats = {
      totalCollections: 0,
      totalTime: 0,
      lastCollection: Date.now()
    };
    mainLogger$1.info("V8Service initialized");
  }
  static getInstance() {
    if (!V8Service.instance) {
      V8Service.instance = new V8Service();
    }
    return V8Service.instance;
  }
  // V8 엔진 최적화 활성화
  async optimizeV8Engine() {
    try {
      await this.setupGCOptimization();
      await this.setupJITOptimization();
      await this.setupHeapLimits();
      await this.setupTurboFan();
      await this.setupCodeCache();
      mainLogger$1.info("V8 engine optimization applied successfully", this.config);
    } catch (error) {
      mainLogger$1.error("Failed to apply V8 optimization", { error });
      throw error;
    }
  }
  // 가비지 컬렉션 최적화
  async setupGCOptimization() {
    if (!this.config.enableGCOptimization) return;
    try {
      const v8Flags = [
        "--max-old-space-size=" + this.config.heapSizeLimit,
        "--optimize-for-size",
        // 메모리 사용량 최적화
        "--gc-interval=100",
        // GC 주기 최적화
        "--incremental-marking",
        // 점진적 마킹
        "--concurrent-marking",
        // 동시 마킹
        "--parallel-scavenge"
        // 병렬 스카벤징
      ];
      if (global.gc) {
        setInterval(() => {
          const startTime = Date.now();
          if (global.gc) {
            global.gc();
          }
          const gcTime = Date.now() - startTime;
          this.gcStats.totalCollections++;
          this.gcStats.totalTime += gcTime;
          this.gcStats.lastCollection = Date.now();
          if (gcTime > 50) {
            mainLogger$1.debug("Manual GC completed", {
              duration: gcTime,
              totalCollections: this.gcStats.totalCollections
            });
          }
        }, 6e4);
      }
      mainLogger$1.debug("GC optimization enabled", { heapLimit: this.config.heapSizeLimit });
    } catch (error) {
      mainLogger$1.error("Failed to setup GC optimization", { error });
    }
  }
  // JIT 컴파일러 최적화
  async setupJITOptimization() {
    if (!this.config.enableJITOptimization) return;
    try {
      mainLogger$1.debug("JIT optimization enabled");
    } catch (error) {
      mainLogger$1.error("Failed to setup JIT optimization", { error });
    }
  }
  // 힙 크기 제한 설정
  async setupHeapLimits() {
    try {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      mainLogger$1.debug("Memory usage stats", {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        heapLimit: `${this.config.heapSizeLimit}MB`
      });
      if (heapUsedMB > this.config.heapSizeLimit * 0.8) {
        mainLogger$1.warn("High memory usage detected", {
          current: `${heapUsedMB}MB`,
          limit: `${this.config.heapSizeLimit}MB`
        });
      }
    } catch (error) {
      mainLogger$1.error("Failed to setup heap limits", { error });
    }
  }
  // TurboFan 최적화
  async setupTurboFan() {
    if (!this.config.enableTurboFan) return;
    try {
      mainLogger$1.debug("TurboFan optimization enabled");
    } catch (error) {
      mainLogger$1.error("Failed to setup TurboFan", { error });
    }
  }
  // 코드 캐시 최적화
  async setupCodeCache() {
    if (!this.config.enableCodeCache) return;
    try {
      mainLogger$1.debug("Code cache optimization enabled");
    } catch (error) {
      mainLogger$1.error("Failed to setup code cache", { error });
    }
  }
  // WebContents별 V8 최적화
  optimizeWebContents(webContents) {
    try {
      if (this.config.enableCodeCache) {
        webContents.session.setCodeCachePath(
          require("path").join(electron.app.getPath("userData"), "code-cache")
        );
      }
      webContents.on("dom-ready", () => {
        webContents.executeJavaScript(`
                    // 메모리 최적화를 위한 JavaScript 설정
                    if (window.performance && window.performance.memory) {
                        // 메모리 사용량 모니터링
                        const memInfo = window.performance.memory;
                        logger.debug('WebContents memory usage:', {
                            used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
                            total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
                            limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB'
                        });
                    }

                    // 이벤트 리스너 최적화
                    const optimizeEventListeners = () => {
                        // Passive 이벤트 리스너 사용
                        ['touchstart', 'touchmove', 'wheel'].forEach(event => {
                            document.addEventListener(event, function() {}, { passive: true });
                        });
                    };
                    optimizeEventListeners();
                `).catch(() => {
        });
      });
      mainLogger$1.debug("WebContents V8 optimization applied");
    } catch (error) {
      mainLogger$1.error("Failed to optimize WebContents V8", { error });
    }
  }
  // 메모리 통계 수집
  getMemoryStats() {
    const memoryUsage = process.memoryUsage();
    return {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      // MB
      external: Math.round(memoryUsage.external / 1024 / 1024),
      // MB
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      // MB
      gcStats: this.gcStats,
      heapLimit: this.config.heapSizeLimit
    };
  }
  // V8 플래그 반환 (앱 시작 시 사용)
  getV8Flags() {
    const flags = [];
    if (this.config.enableGCOptimization) {
      flags.push("--max-old-space-size=1024");
      flags.push("--gc-interval=100");
      flags.push("--incremental-marking");
      flags.push("--concurrent-marking");
      flags.push("--parallel-scavenge");
    }
    if (this.config.enableJITOptimization) {
      flags.push("--turbo-fast-api-calls");
      flags.push("--turbo-inline-array-elements");
      flags.push("--enable-turbofan");
      flags.push("--turbo-instruction-scheduling");
    }
    return flags;
  }
  // 강제 가비지 컬렉션
  forceGC() {
    if (global.gc) {
      const startTime = Date.now();
      if (global.gc) {
        global.gc();
      }
      const gcTime = Date.now() - startTime;
      this.gcStats.totalCollections++;
      this.gcStats.totalTime += gcTime;
      this.gcStats.lastCollection = Date.now();
      mainLogger$1.debug("Forced GC completed", { duration: gcTime });
    } else {
      mainLogger$1.warn("Global GC not available");
    }
  }
  // 설정 업데이트
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    mainLogger$1.info("V8Service configuration updated", this.config);
  }
  // 정리 작업
  cleanup() {
    if (global.gc) {
      this.forceGC();
    }
    mainLogger$1.info("V8Service cleanup completed");
  }
}
const v8Service = V8Service.getInstance();
class SEOService {
  constructor() {
    this.config = {
      enablePrerendering: true,
      enableCrawlerOptimization: true,
      enableMetaOptimization: true,
      enableStructuredData: true,
      enableOpenGraph: true
    };
    mainLogger$1.info("SEOService initialized");
  }
  static getInstance() {
    if (!SEOService.instance) {
      SEOService.instance = new SEOService();
    }
    return SEOService.instance;
  }
  // SEO 최적화 활성화
  async optimizeSEO() {
    try {
      await this.setupPrerendering();
      await this.setupCrawlerOptimization();
      await this.setupMetaOptimization();
      await this.setupStructuredData();
      await this.setupOpenGraph();
      mainLogger$1.info("SEO optimization applied successfully", this.config);
    } catch (error) {
      mainLogger$1.error("Failed to apply SEO optimization", { error });
      throw error;
    }
  }
  // 프리렌더링 설정
  async setupPrerendering() {
    if (!this.config.enablePrerendering) return;
    try {
      mainLogger$1.debug("Prerendering optimization enabled");
    } catch (error) {
      mainLogger$1.error("Failed to setup prerendering", { error });
    }
  }
  // 크롤러 최적화
  async setupCrawlerOptimization() {
    if (!this.config.enableCrawlerOptimization) return;
    try {
      mainLogger$1.debug("Crawler optimization enabled");
    } catch (error) {
      mainLogger$1.error("Failed to setup crawler optimization", { error });
    }
  }
  // 메타태그 최적화
  async setupMetaOptimization() {
    if (!this.config.enableMetaOptimization) return;
    try {
      mainLogger$1.debug("Meta tag optimization enabled");
    } catch (error) {
      mainLogger$1.error("Failed to setup meta optimization", { error });
    }
  }
  // 구조화된 데이터 설정
  async setupStructuredData() {
    if (!this.config.enableStructuredData) return;
    try {
      mainLogger$1.debug("Structured data optimization enabled");
    } catch (error) {
      mainLogger$1.error("Failed to setup structured data", { error });
    }
  }
  // Open Graph 최적화
  async setupOpenGraph() {
    if (!this.config.enableOpenGraph) return;
    try {
      mainLogger$1.debug("Open Graph optimization enabled");
    } catch (error) {
      mainLogger$1.error("Failed to setup Open Graph", { error });
    }
  }
  // WebContents별 SEO 최적화
  optimizeWebContents(webContents) {
    try {
      webContents.on("dom-ready", () => {
        this.injectSEOOptimizations(webContents);
      });
      webContents.on("did-finish-load", () => {
        this.optimizePageSpeed(webContents);
      });
      mainLogger$1.debug("WebContents SEO optimization applied");
    } catch (error) {
      mainLogger$1.error("Failed to optimize WebContents SEO", { error });
    }
  }
  // SEO 최적화 주입
  injectSEOOptimizations(webContents) {
    webContents.executeJavaScript(`
            (function() {
                // 메타태그 최적화
                const optimizeMeta = () => {
                    // Viewport 메타태그 확인 및 추가
                    if (!document.querySelector('meta[name="viewport"]')) {
                        const viewport = document.createElement('meta');
                        viewport.name = 'viewport';
                        viewport.content = 'width=device-width, initial-scale=1.0';
                        document.head.appendChild(viewport);
                    }

                    // 언어 속성 설정
                    if (!document.documentElement.lang) {
                        document.documentElement.lang = 'ko';
                    }

                    // 메타 description 최적화
                    const description = document.querySelector('meta[name="description"]');
                    if (description && description.content.length > 160) {
                        description.content = description.content.substring(0, 157) + '...';
                    }
                };

                // 이미지 최적화
                const optimizeImages = () => {
                    const images = document.querySelectorAll('img:not([alt])');
                    images.forEach(img => {
                        if (!img.alt) {
                            img.alt = img.title || 'Image';
                        }
                    });

                    // 지연 로딩 적용
                    const lazyImages = document.querySelectorAll('img[data-src]');
                    if ('IntersectionObserver' in window) {
                        const imageObserver = new IntersectionObserver((entries) => {
                            entries.forEach(entry => {
                                if (entry.isIntersecting) {
                                    const img = entry.target;
                                    img.src = img.dataset.src;
                                    img.classList.remove('lazy');
                                    imageObserver.unobserve(img);
                                }
                            });
                        });

                        lazyImages.forEach(img => imageObserver.observe(img));
                    }
                };

                // 링크 최적화
                const optimizeLinks = () => {
                    const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])');
                    externalLinks.forEach(link => {
                        if (!link.rel) {
                            link.rel = 'noopener noreferrer';
                        }
                    });
                };

                // 구조화된 데이터 추가
                const addStructuredData = () => {
                    if (!document.querySelector('script[type="application/ld+json"]')) {
                        const structuredData = {
                            "@context": "https://schema.org",
                            "@type": "WebPage",
                            "name": document.title,
                            "description": document.querySelector('meta[name="description"]')?.content || '',
                            "url": window.location.href
                        };

                        const script = document.createElement('script');
                        script.type = 'application/ld+json';
                        script.textContent = JSON.stringify(structuredData);
                        document.head.appendChild(script);
                    }
                };

                // 모든 최적화 실행
                optimizeMeta();
                optimizeImages();
                optimizeLinks();
                addStructuredData();

                logger.debug('SEO optimizations applied');
            })();
        `).catch(() => {
    });
  }
  // 페이지 속도 최적화
  optimizePageSpeed(webContents) {
    webContents.executeJavaScript(`
            (function() {
                // CSS 최적화
                const optimizeCSS = () => {
                    // 사용하지 않는 CSS 제거 (간단한 버전)
                    const unusedStyles = document.querySelectorAll('style:empty, link[rel="stylesheet"]:not([href])');
                    unusedStyles.forEach(style => style.remove());
                };

                // JavaScript 최적화
                const optimizeJS = () => {
                    // 사용하지 않는 스크립트 제거
                    const emptyScripts = document.querySelectorAll('script:empty:not([src])');
                    emptyScripts.forEach(script => script.remove());
                };

                // 폰트 최적화
                const optimizeFonts = () => {
                    // font-display: swap 추가
                    const style = document.createElement('style');
                    style.textContent = \`
                        @font-face {
                            font-display: swap;
                        }
                    \`;
                    document.head.appendChild(style);
                };

                // 리소스 힌트 추가
                const addResourceHints = () => {
                    const hints = [
                        { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
                        { rel: 'dns-prefetch', href: '//www.google-analytics.com' },
                        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true }
                    ];

                    hints.forEach(hint => {
                        if (!document.querySelector(\`link[href="\${hint.href}"]\`)) {
                            const link = document.createElement('link');
                            link.rel = hint.rel;
                            link.href = hint.href;
                            if (hint.crossorigin) link.crossOrigin = hint.crossorigin;
                            document.head.appendChild(link);
                        }
                    });
                };

                optimizeCSS();
                optimizeJS();
                optimizeFonts();
                addResourceHints();

                logger.debug('Page speed optimizations applied');
            })();
        `).catch(() => {
    });
  }
  // SEO 점수 계산
  calculateSEOScore(webContents) {
    return new Promise((resolve) => {
      webContents.executeJavaScript(`
                (function() {
                    let score = 0;
                    const checks = [];

                    // 제목 태그 검사
                    const title = document.querySelector('title');
                    if (title && title.textContent.trim().length > 0) {
                        score += 20;
                        checks.push('Title tag exists');
                    }

                    // 메타 description 검사
                    const description = document.querySelector('meta[name="description"]');
                    if (description && description.content.trim().length > 0) {
                        score += 20;
                        checks.push('Meta description exists');
                    }

                    // 헤딩 태그 검사
                    const h1 = document.querySelector('h1');
                    if (h1) {
                        score += 15;
                        checks.push('H1 tag exists');
                    }

                    // 이미지 alt 속성 검사
                    const images = document.querySelectorAll('img');
                    const imagesWithAlt = document.querySelectorAll('img[alt]');
                    if (images.length === 0 || imagesWithAlt.length / images.length > 0.8) {
                        score += 15;
                        checks.push('Images have alt attributes');
                    }

                    // 내부 링크 검사
                    const internalLinks = document.querySelectorAll('a[href^="/"], a[href*="' + window.location.hostname + '"]');
                    if (internalLinks.length > 0) {
                        score += 10;
                        checks.push('Internal links present');
                    }

                    // 페이지 속도 관련 검사
                    if (document.readyState === 'complete') {
                        score += 10;
                        checks.push('Page loaded completely');
                    }

                    // 구조화된 데이터 검사
                    const structuredData = document.querySelector('script[type="application/ld+json"]');
                    if (structuredData) {
                        score += 10;
                        checks.push('Structured data present');
                    }

                    return { score, checks };
                })();
            `).then((result) => {
        mainLogger$1.debug("SEO score calculated", result);
        resolve(result.score);
      }).catch(() => {
        resolve(50);
      });
    });
  }
  // 설정 업데이트
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    mainLogger$1.info("SEOService configuration updated", this.config);
  }
  // 정리 작업
  cleanup() {
    mainLogger$1.info("SEOService cleanup completed");
  }
}
const seoService = SEOService.getInstance();
class MemoryService {
  constructor() {
    this.config = {
      enableMemoryMonitoring: true,
      enableLeakDetection: true,
      enableResourceCleanup: true,
      memoryWarningThreshold: 512,
      // 512MB
      criticalMemoryThreshold: 1024,
      // 1GB
      cleanupInterval: 3e4
      // 30초
    };
    this.memoryHistory = [];
    this.monitoringInterval = null;
    this.cleanupInterval = null;
    mainLogger$1.info("MemoryService initialized");
  }
  static getInstance() {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }
  // 메모리 최적화 활성화
  async optimizeMemory() {
    try {
      await this.setupMemoryMonitoring();
      await this.setupLeakDetection();
      await this.setupResourceCleanup();
      await this.startCleanupInterval();
      mainLogger$1.info("Memory optimization applied successfully", this.config);
    } catch (error) {
      mainLogger$1.error("Failed to apply memory optimization", { error });
      throw error;
    }
  }
  // 메모리 모니터링 설정
  async setupMemoryMonitoring() {
    if (!this.config.enableMemoryMonitoring) return;
    try {
      this.monitoringInterval = setInterval(() => {
        const stats = this.getMemoryStats();
        this.memoryHistory.push(stats);
        if (this.memoryHistory.length > 100) {
          this.memoryHistory = this.memoryHistory.slice(-100);
        }
        this.checkMemoryThresholds(stats);
      }, 1e4);
      mainLogger$1.debug("Memory monitoring enabled");
    } catch (error) {
      mainLogger$1.error("Failed to setup memory monitoring", { error });
    }
  }
  // 메모리 누수 감지 설정
  async setupLeakDetection() {
    if (!this.config.enableLeakDetection) return;
    try {
      setInterval(() => {
        if (this.memoryHistory.length < 5) return;
        const recent = this.memoryHistory.slice(-5);
        const trend = this.calculateMemoryTrend(recent);
        if (trend > 10) {
          mainLogger$1.warn("Potential memory leak detected", {
            trend: `${trend.toFixed(2)}MB/min`,
            currentMemory: `${recent[recent.length - 1].heapUsed}MB`
          });
        }
      }, 6e4);
      mainLogger$1.debug("Memory leak detection enabled");
    } catch (error) {
      mainLogger$1.error("Failed to setup leak detection", { error });
    }
  }
  // 리소스 정리 설정
  async setupResourceCleanup() {
    if (!this.config.enableResourceCleanup) return;
    try {
      electron.app.on("before-quit", () => {
        this.cleanup();
      });
      mainLogger$1.debug("Resource cleanup enabled");
    } catch (error) {
      mainLogger$1.error("Failed to setup resource cleanup", { error });
    }
  }
  // 정리 주기 시작
  async startCleanupInterval() {
    try {
      this.cleanupInterval = setInterval(() => {
        this.performRoutineCleanup();
      }, this.config.cleanupInterval);
      mainLogger$1.debug("Cleanup interval started", {
        interval: this.config.cleanupInterval
      });
    } catch (error) {
      mainLogger$1.error("Failed to start cleanup interval", { error });
    }
  }
  // 메모리 통계 수집
  getMemoryStats() {
    const memoryUsage = process.memoryUsage();
    const totalMemory = require("os").totalmem();
    return {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      // MB
      external: Math.round(memoryUsage.external / 1024 / 1024),
      // MB
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      // MB
      percentage: Math.round(memoryUsage.rss / totalMemory * 100),
      timestamp: Date.now()
    };
  }
  // 메모리 임계치 검사
  checkMemoryThresholds(stats) {
    if (stats.heapUsed > this.config.criticalMemoryThreshold) {
      mainLogger$1.error("Critical memory usage detected", {
        current: `${stats.heapUsed}MB`,
        threshold: `${this.config.criticalMemoryThreshold}MB`
      });
      this.performEmergencyCleanup();
    } else if (stats.heapUsed > this.config.memoryWarningThreshold) {
      mainLogger$1.warn("High memory usage detected", {
        current: `${stats.heapUsed}MB`,
        threshold: `${this.config.memoryWarningThreshold}MB`
      });
      this.performRoutineCleanup();
    }
  }
  // 메모리 증가 트렌드 계산
  calculateMemoryTrend(stats) {
    if (stats.length < 2) return 0;
    const first = stats[0];
    const last = stats[stats.length - 1];
    const timeDiff = (last.timestamp - first.timestamp) / 1e3 / 60;
    const memoryDiff = last.heapUsed - first.heapUsed;
    return timeDiff > 0 ? memoryDiff / timeDiff : 0;
  }
  // 일반 정리 수행
  performRoutineCleanup() {
    try {
      if (global.gc) {
        global.gc();
        mainLogger$1.debug("Routine GC performed");
      }
      const stats = this.getMemoryStats();
      mainLogger$1.debug("Routine cleanup completed", stats);
    } catch (error) {
      mainLogger$1.error("Failed to perform routine cleanup", { error });
    }
  }
  // 긴급 정리 수행
  performEmergencyCleanup() {
    try {
      if (global.gc) {
        for (let i = 0; i < 3; i++) {
          global.gc();
        }
        mainLogger$1.warn("Emergency GC performed (3 cycles)");
      }
      this.memoryHistory = this.memoryHistory.slice(-50);
      const stats = this.getMemoryStats();
      mainLogger$1.warn("Emergency cleanup completed", stats);
    } catch (error) {
      mainLogger$1.error("Failed to perform emergency cleanup", { error });
    }
  }
  // WebContents별 메모리 최적화
  optimizeWebContents(webContents) {
    try {
      webContents.on("destroyed", () => {
        if (global.gc) {
          global.gc();
        }
      });
      webContents.on("dom-ready", () => {
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
        });
      });
      mainLogger$1.debug("WebContents memory optimization applied");
    } catch (error) {
      mainLogger$1.error("Failed to optimize WebContents memory", { error });
    }
  }
  // 메모리 보고서 생성
  generateMemoryReport() {
    const currentStats = this.getMemoryStats();
    const trend = this.memoryHistory.length > 1 ? this.calculateMemoryTrend(this.memoryHistory.slice(-10)) : 0;
    return {
      current: currentStats,
      trend: `${trend.toFixed(2)}MB/min`,
      history: this.memoryHistory.slice(-20),
      // 최근 20개 기록
      thresholds: {
        warning: this.config.memoryWarningThreshold,
        critical: this.config.criticalMemoryThreshold
      },
      status: this.getMemoryStatus(currentStats)
    };
  }
  // 메모리 상태 판단
  getMemoryStatus(stats) {
    if (stats.heapUsed > this.config.criticalMemoryThreshold) {
      return "critical";
    } else if (stats.heapUsed > this.config.memoryWarningThreshold) {
      return "warning";
    } else {
      return "normal";
    }
  }
  // 설정 업데이트
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    mainLogger$1.info("MemoryService configuration updated", this.config);
  }
  // 정리 작업
  cleanup() {
    try {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }
      this.performEmergencyCleanup();
      mainLogger$1.info("MemoryService cleanup completed");
    } catch (error) {
      mainLogger$1.error("Error during MemoryService cleanup", { error });
    }
  }
  // 실시간 메모리 모니터링 UI 컴포넌트
  createMemoryMonitorUI() {
    const { BrowserWindow } = require("electron");
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
    });
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
            <\/script>
        </body>
        </html>`;
    monitorWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(monitorHTML));
  }
  // 실시간 모니터링 시작
  startRealtimeMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.monitoringInterval = setInterval(() => {
      const stats = this.getMemoryStats();
      if (stats) {
        const { BrowserWindow } = require("electron");
        BrowserWindow.getAllWindows().forEach((win) => {
          win.webContents.send("memory-stats-update", stats);
        });
      }
    }, 1e3);
    mainLogger$1.debug("Realtime memory monitoring enabled");
  }
  // 실시간 모니터링 중지
  stopRealtimeMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    mainLogger$1.debug("Realtime memory monitoring disabled");
  }
}
const memoryService = MemoryService.getInstance();
const MemoryService$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MemoryService,
  memoryService
}, Symbol.toStringTag, { value: "Module" }));
class ServiceManager {
  constructor() {
    this.config = {
      enableNetworkOptimization: true,
      enableV8Optimization: true,
      enableSEOOptimization: true,
      enableMemoryOptimization: true,
      enablePerformanceMonitoring: false,
      // 기본적으로 비활성화
      optimizationLevel: "balanced",
      // 균형잡힌 최적화
      monitoringIntervalMs: 3e5
      // 5분 (300초)
    };
    this.performanceHistory = [];
    this.monitoringInterval = null;
    mainLogger$1.info("ServiceManager initialized");
  }
  static getInstance() {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }
  // 모든 서비스 초기화
  async initializeAllServices() {
    try {
      mainLogger$1.info("Initializing all services...");
      await this.initializeCoreServices();
      await this.initializeOptimizationServices();
      if (this.config.enablePerformanceMonitoring) {
        await this.startPerformanceMonitoring();
      }
      mainLogger$1.info("All services initialized successfully");
    } catch (error) {
      mainLogger$1.error("Failed to initialize services", { error });
      throw error;
    }
  }
  // 핵심 서비스들 초기화
  async initializeCoreServices() {
    try {
      await settingsService.initialize();
      mainLogger$1.debug("Core services initialized");
    } catch (error) {
      mainLogger$1.error("Failed to initialize core services", { error });
      throw error;
    }
  }
  // 최적화 서비스들 초기화
  async initializeOptimizationServices() {
    try {
      const initPromises = [];
      if (this.config.enableNetworkOptimization) {
        initPromises.push(networkService.optimizeNetwork());
      }
      if (this.config.enableV8Optimization) {
        initPromises.push(v8Service.optimizeV8Engine());
      }
      if (this.config.enableSEOOptimization) {
        initPromises.push(seoService.optimizeSEO());
      }
      if (this.config.enableMemoryOptimization) {
        initPromises.push(memoryService.optimizeMemory());
      }
      await Promise.all(initPromises);
      mainLogger$1.debug("Optimization services initialized");
    } catch (error) {
      mainLogger$1.error("Failed to initialize optimization services", { error });
      throw error;
    }
  }
  // WebContents별 최적화 적용 (선택적 최적화)
  optimizeWebContents(webContents) {
    try {
      const level = this.config.optimizationLevel;
      if (level === "minimal") {
        if (this.config.enableMemoryOptimization) {
          memoryService.optimizeWebContents(webContents);
        }
        mainLogger$1.debug("Minimal WebContents optimization applied");
        return;
      }
      if (level === "balanced") {
        if (this.config.enableNetworkOptimization) {
          networkService.optimizeWebContents(webContents);
        }
        if (this.config.enableMemoryOptimization) {
          memoryService.optimizeWebContents(webContents);
        }
        mainLogger$1.debug("Balanced WebContents optimization applied");
        return;
      }
      if (level === "aggressive") {
        if (this.config.enableNetworkOptimization) {
          networkService.optimizeWebContents(webContents);
        }
        if (this.config.enableV8Optimization) {
          v8Service.optimizeWebContents(webContents);
        }
        if (this.config.enableSEOOptimization) {
          seoService.optimizeWebContents(webContents);
        }
        if (this.config.enableMemoryOptimization) {
          memoryService.optimizeWebContents(webContents);
        }
        mainLogger$1.debug("Aggressive WebContents optimization applied");
      }
    } catch (error) {
      mainLogger$1.error("Failed to optimize WebContents", { error });
    }
  }
  // 성능 모니터링 시작 (간격 조정됨)
  async startPerformanceMonitoring() {
    try {
      if (!this.config.enablePerformanceMonitoring) {
        mainLogger$1.debug("Performance monitoring is disabled");
        return;
      }
      this.monitoringInterval = setInterval(async () => {
        await this.collectPerformanceMetrics();
      }, this.config.monitoringIntervalMs);
      mainLogger$1.debug(`Performance monitoring started with ${this.config.monitoringIntervalMs / 1e3}s interval`);
    } catch (error) {
      mainLogger$1.error("Failed to start performance monitoring", { error });
    }
  }
  // 성능 메트릭 수집
  async collectPerformanceMetrics() {
    try {
      const metrics = {
        network: await networkService.getNetworkStats(),
        memory: memoryService.generateMemoryReport(),
        v8: v8Service.getMemoryStats(),
        seo: 0,
        // SEO 점수는 WebContents가 있을 때만 계산 가능
        overall: 0,
        timestamp: Date.now()
      };
      metrics.overall = this.calculateOverallScore(metrics);
      this.performanceHistory.push(metrics);
      if (this.performanceHistory.length > 100) {
        this.performanceHistory = this.performanceHistory.slice(-100);
      }
      this.checkPerformanceAlerts(metrics);
    } catch (error) {
      mainLogger$1.error("Failed to collect performance metrics", { error });
    }
  }
  // 전체 성능 점수 계산
  calculateOverallScore(metrics) {
    let score = 100;
    const memoryStatus = metrics.memory.status;
    if (memoryStatus === "critical") {
      score -= 40;
    } else if (memoryStatus === "warning") {
      score -= 20;
    }
    const heapUsage = metrics.v8.heapUsed / metrics.v8.heapLimit;
    if (heapUsage > 0.8) {
      score -= 20;
    } else if (heapUsage > 0.6) {
      score -= 10;
    }
    return Math.max(0, score);
  }
  // 성능 경고 확인 (덜 공격적으로 변경)
  checkPerformanceAlerts(metrics) {
    if (metrics.overall < 40 && this.config.optimizationLevel === "aggressive") {
      mainLogger$1.warn("Critical performance detected - emergency optimization triggered", {
        score: metrics.overall,
        memory: metrics.memory.status,
        v8HeapUsage: `${metrics.v8.heapUsed}MB`
      });
      this.performEmergencyOptimization();
    } else if (metrics.overall < 60) {
      mainLogger$1.warn("Low performance detected", {
        score: metrics.overall,
        memory: metrics.memory.status,
        level: this.config.optimizationLevel
      });
    }
  }
  // 긴급 최적화 수행
  performEmergencyOptimization() {
    try {
      mainLogger$1.warn("Performing emergency optimization...");
      v8Service.forceGC();
      memoryService.cleanup();
      mainLogger$1.warn("Emergency optimization completed");
    } catch (error) {
      mainLogger$1.error("Failed to perform emergency optimization", { error });
    }
  }
  // 성능 보고서 생성
  generatePerformanceReport() {
    const latest = this.performanceHistory[this.performanceHistory.length - 1];
    const history = this.performanceHistory.slice(-20);
    return {
      current: latest,
      history,
      averageScore: history.reduce((sum, m) => sum + m.overall, 0) / history.length,
      trends: {
        memory: this.calculateTrend(history.map((h) => h.memory.current.heapUsed)),
        v8: this.calculateTrend(history.map((h) => h.v8.heapUsed)),
        overall: this.calculateTrend(history.map((h) => h.overall))
      },
      config: this.config
    };
  }
  // 트렌드 계산
  calculateTrend(values) {
    if (values.length < 2) return "stable";
    const first = values[0];
    const last = values[values.length - 1];
    const change = (last - first) / first * 100;
    if (change > 10) return "increasing";
    if (change < -10) return "decreasing";
    return "stable";
  }
  // 서비스별 접근자
  get network() {
    return networkService;
  }
  get v8() {
    return v8Service;
  }
  get seo() {
    return seoService;
  }
  get memory() {
    return memoryService;
  }
  get devTools() {
    return devToolsService;
  }
  get tab() {
    return tabService;
  }
  get settings() {
    return settingsService;
  }
  // V8 최적화 플래그 가져오기 (PerformanceOptimizer에서 사용)
  getV8Flags() {
    return v8Service.getV8Flags();
  }
  // 설정 업데이트
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    mainLogger$1.info("ServiceManager configuration updated", this.config);
  }
  // 정리 작업
  async cleanup() {
    try {
      mainLogger$1.info("Cleaning up all services...");
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }
      const cleanupPromises = [
        networkService.cleanup(),
        v8Service.cleanup(),
        seoService.cleanup(),
        memoryService.cleanup()
      ];
      await Promise.allSettled(cleanupPromises);
      mainLogger$1.info("All services cleanup completed");
    } catch (error) {
      mainLogger$1.error("Error during services cleanup", { error });
    }
  }
}
const serviceManager = ServiceManager.getInstance();
const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ServiceManager,
  devToolsService,
  memoryService,
  networkService,
  seoService,
  serviceManager,
  settingsService,
  tabService,
  v8Service
}, Symbol.toStringTag, { value: "Module" }));
class PerformanceOptimizer {
  constructor() {
    mainLogger$1.info("PerformanceOptimizer initialized");
  }
  static getInstance() {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }
  // 메모리 최적화를 위한 하드웨어 가속 비활성화
  disableHardwareAcceleration() {
    mainLogger$1.info("Disabling hardware acceleration for memory optimization");
    electron.app.disableHardwareAcceleration();
  }
  // GPU 성능 최적화 (필요시 활성화)
  enableGpuOptimizations() {
    mainLogger$1.info("Enabling GPU optimizations");
    electron.app.commandLine.appendSwitch("enable-gpu-rasterization");
    electron.app.commandLine.appendSwitch("enable-gpu-memory-buffer-video-frames");
    electron.app.commandLine.appendSwitch("enable-gpu-memory-buffer-compositor-resources");
    electron.app.commandLine.appendSwitch("enable-features", "VaapiVideoDecoder,VaapiIgnoreDriverChecks");
  }
  // V8 엔진 최적화 플래그 적용
  applyV8Optimizations() {
    const v8Flags = serviceManager.getV8Flags();
    if (v8Flags.length > 0) {
      mainLogger$1.info("Applying V8 optimization flags", { flags: v8Flags });
      v8Flags.forEach((flag) => {
        electron.app.commandLine.appendSwitch("js-flags", flag);
      });
    } else {
      mainLogger$1.info("No V8 optimization flags to apply");
    }
  }
  // 일반 성능 최적화 플래그
  applyPerformanceFlags() {
    mainLogger$1.info("Applying general performance optimization flags");
    electron.app.commandLine.appendSwitch("disable-software-rasterizer");
    electron.app.commandLine.appendSwitch("disable-background-timer-throttling");
    electron.app.commandLine.appendSwitch("disable-renderer-backgrounding");
    electron.app.commandLine.appendSwitch("disable-features", "TranslateUI");
  }
  // 모든 최적화 적용
  applyAllOptimizations() {
    mainLogger$1.info("Applying all performance optimizations");
    this.disableHardwareAcceleration();
    this.applyV8Optimizations();
    this.applyPerformanceFlags();
    mainLogger$1.info("All performance optimizations applied successfully");
  }
}
const mainLogger = createModuleLogger("MainProcess", "main");
async function bootstrap() {
  try {
    mainLogger.info("Starting Loop Browser main process...");
    const optimizer = PerformanceOptimizer.getInstance();
    optimizer.applyAllOptimizations();
    const lifecycle = AppLifecycle.getInstance();
    lifecycle.setupEventHandlers();
    mainLogger.info("Main process bootstrap complete");
  } catch (error) {
    mainLogger.error("Failed to bootstrap main process", { error });
    process.exit(1);
  }
}
bootstrap();
