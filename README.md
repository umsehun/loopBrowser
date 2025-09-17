# SEO Browser

Ultra-fast SEO-optimized browser with GPU acceleration and V8 performance tuning.

## 📋 Overview

SEO Browser is an experimental low-resource web browser built with **Electron + Vite**. The goal is to run **5 active windows + YouTube playback** while keeping **< 1GB memory usage**. It achieves this through aggressive background throttling, tab multiplexing, and hardware-accelerated media playback.

## 🚀 Features

- **GPU Acceleration**: Hardware-accelerated video decoding
- **V8 Optimization**: JIT compilation and memory optimization
- **SEO Analysis**: Built-in metadata extraction and performance analysis
- **Security First**: Comprehensive security policies and CSP
- **Low Resource**: Optimized for minimal memory footprint

## 🏗️ Architecture

### Main Process (`src/main/`)
- Window & tab lifecycle management
- Global resource policy control
- Service initialization (GPU, V8, SEO, Performance)

### Renderer Process (`src/renderer/`)
- Vite-powered React UI
- Tab manager and dashboard

### Preload (`src/preload/`)
- Secure bridge with `contextBridge`
- Background suspend hooks

### Services
- **GPU**: Hardware acceleration management
- **V8**: JavaScript engine optimization
- **SEO**: Metadata extraction and analysis
- **Network**: Request optimization and caching
- **Performance**: Real-time monitoring and reporting
- **Security**: WebContents security policies

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/umsehun/saoBrowser.git
cd saoBrowser

# Install dependencies
pnpm install

# Development
pnpm run dev

# Build for production
pnpm run build

# Run production build
pnpm run start
```

## 🛠️ Development

### Commands
- `pnpm run dev`: Concurrent Vite + Electron development
- `pnpm run dev:renderer`: Vite frontend only (port 5173)
- `pnpm run dev:main`: Electron main process only
- `pnpm run build`: Full production build
- `pnpm run preview`: Preview production build

### Project Structure
```
src/
├── main/                 # Electron main process
│   ├── core/            # Core application logic
│   ├── services/        # Optimization services
│   └── managers/        # Window/tab managers
├── renderer/            # React UI
├── preload/             # Security bridge
└── shared/              # Common types and utilities
```

## 🔒 Security

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- Custom security policies
- CSP (Content Security Policy) enforcement

## 📊 Performance

- Background tab throttling
- Memory monitoring (< 1GB target)
- Hardware-accelerated media
- Optimized resource loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

ISC License
