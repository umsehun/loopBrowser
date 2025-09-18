Perfect, let’s consolidate everything into a clean **Markdown spec file** with proper formatting and sections.

Here’s the fully structured `.githubinstructions` version:

````md
---
description: Logger System usage guideline (console.log not allowed, shard/logger required)
applyTo: '**'
---

# 🔹 Logger System Guidelines

## 1. ❌ Forbidden Rules
- Direct calls to `console.log`, `console.error`, `console.warn`, etc. are **strictly forbidden**  
- All logging must go through the **`shard/logger` (GigaLogger)** module  

### Wrong Example
```ts
console.log("debug info:", data)
console.error("something went wrong")
````

---

## 2. ✅ Allowed Rules

* Always use `createModuleLogger("ModuleName")` or the `Logger` singleton
* Every log must include a **module name**

### Correct Example

```ts
import { createModuleLogger } from "shard/logger/index"

const uiLogger = createModuleLogger("Renderer")

uiLogger.info("User clicked Play button", { button: "Start" })
uiLogger.error("Failed to load song", { id: "track_001" })
```

---

## 3. Main vs Renderer

### Main Process

* Handles **system logs, crashes, and file output**
* Can call `Logger.logSystemInfo("Main")`, `Logger.logMemoryUsage("Main")`
* Receives logs from Renderer via IPC and centralizes them

### Renderer Process

* Logs **UI interactions, warnings, and errors only**
* Can forward logs to Main via IPC if needed
* **Cannot** log system info or write to files directly

---

## 4. Log Levels

* `DEBUG`: Development-only details
* `INFO`: Normal execution flow (UI events, state changes)
* `WARN`: Abnormal but recoverable conditions
* `ERROR`: Crashes, failures, unrecoverable errors

---

## 5. Performance / Memory Logging

* Use `Logger.startTimer()` / `Logger.endTimer()` for **performance profiling**
* Use `Logger.logMemoryUsage("Main")` for **memory usage monitoring**

---

## 6. Review Checklist

* [ ] No `console.*` calls remain
* [ ] All logs use `shard/logger`
* [ ] Each log includes a **module name**
* [ ] Renderer logs are sent to Main via IPC when necessary
* [ ] `Logger.logSystemInfo("Main")` is called on Main startup

```

---

Do you want me to also **bundle an ESLint rule (`no-console`)** with a custom error message like *"Use shard/logger instead"* so this guideline is enforced automatically in PRs?
```
