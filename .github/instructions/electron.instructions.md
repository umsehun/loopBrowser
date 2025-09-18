Got it 👍 이제 네가 원하는 **마크업 스타일**(`.md`)로 `copilot-instructions.md` 만들어줄게. 아까 준 내용을 **Root Index 예시**처럼 정리해서 내보냈다:

````markdown
---
description: Copilot instructions for Electron (38 LTS) + Vite (React 19 LTS) browser project
applyTo: '**'
---

# ⚡ Electron + Vite (React 19) Browser Development Instructions

This file provides the **coding guidelines and rules** for building a custom browser using  
**Electron 38 LTS** and **Vite (React 19 LTS)**.  

---

## 🔑 Core Electron APIs

### `BrowserWindow`
- Creates and manages application windows
- Config options: `width`, `height`, `frame`, `webPreferences`
- Example:
  ```ts
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      sandbox: true,
    }
  })
````

### `App`

* Controls application lifecycle (`ready`, `window-all-closed`, `activate`)
* Example:

  ```ts
  app.on("ready", () => createMainWindow())
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
  })
  ```

### `WebContentsView`

* Modern API to embed multiple web views (tabs, multi-pane layouts)
* More efficient than `BrowserView`
* Example:

  ```ts
  const view = new WebContentsView()
  mainWindow.contentView.addChildView(view)
  view.webContents.loadURL("https://example.com")
  ```

### `screen`

* Provides monitor/display info (multi-monitor, DPI scaling, fullscreen)
* Example:

  ```ts
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  mainWindow.setBounds({ x: 0, y: 0, width, height })
  ```

---

## 🖥️ Browser UI Layout

Structure like **Zen Browser**:

* **Renderer UI Zone (Outer Frame)**
  React-based toolbar, sidebar, tab bar, menus.
  Styled with Tailwind or CSS-in-JS.

* **Browser Content Zone (Inner Frame)**
  Each tab = one `WebContentsView`.
  Dynamically attached/detached to simulate browsing sessions.
  IPC for communication between React ↔ Electron.

```tsx
return (
  <div className="app-window">
    <div className="titlebar"> {/* draggable area */} </div>
    <div className="tabbar"> {/* tab controls */} </div>
    <div className="content"> {/* WebContentsView zone */} </div>
  </div>
)
```

---

## 🚨 Key Guidelines

* **Security**

  * `contextIsolation: true`
  * `nodeIntegration: false`
  * Only expose safe APIs via preload scripts

* **Performance**

  * Prefer `WebContentsView` over legacy `BrowserView`
  * Optimize React rendering (memoization, lazy loading tabs)

* **Process Separation**

  * Main = system APIs, Renderer = UI
  * Communication strictly via `ipcMain` / `ipcRenderer`

* **Custom Window Controls**

  * `frame: false` requires manual buttons for minimize/maximize/close
  * Call `win.minimize()` / `win.maximize()`

* **Crash Recovery**

  * Detect with `webContents.on("crashed")`
  * Reload/recover session state gracefully

---

## 📋 Implementation Checklist

* [ ] Use `BrowserWindow` with `frame: false`
* [ ] Build UI with React 19 + Tailwind (via Vite)
* [ ] Use `WebContentsView` for tabs/web content
* [ ] Sync tab state via IPC
* [ ] Implement crash recovery
* [ ] Enforce strict security
* [ ] Optimize rendering and memory usage

