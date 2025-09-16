import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import { resolve } from 'path'

export default defineConfig({
    plugins: [
        react(),
        electron({
            main: {
                entry: 'src/main/main.ts',
                vite: {
                    resolve: {
                        alias: {
                            // GIGA-CHAD: 절대 경로로 import 정리
                            '@shared': resolve(__dirname, 'src/shared'),
                            '@main': resolve(__dirname, 'src/main'),
                            '@renderer': resolve(__dirname, 'src/renderer'),
                            '@preload': resolve(__dirname, 'src/preload')
                        }
                    },
                    build: {
                        outDir: 'dist/main',
                        rollupOptions: {
                            external: ['electron']
                        }
                    }
                }
            },
            preload: {
                input: 'src/preload/preload.ts',
                vite: {
                    resolve: {
                        alias: {
                            '@shared': resolve(__dirname, 'src/shared'),
                            '@main': resolve(__dirname, 'src/main'),
                            '@renderer': resolve(__dirname, 'src/renderer'),
                            '@preload': resolve(__dirname, 'src/preload')
                        }
                    },
                    build: {
                        outDir: 'dist/preload'
                    }
                }
            },
            renderer: process.env.NODE_ENV === 'test' ? undefined : {}
        })
    ],
    root: '.',
    base: './',
    publicDir: 'public',
    resolve: {
        alias: {
            // GIGA-CHAD: 절대 경로로 import 정리
            '@shared': resolve(__dirname, 'src/shared'),
            '@main': resolve(__dirname, 'src/main'),
            '@renderer': resolve(__dirname, 'src/renderer'),
            '@preload': resolve(__dirname, 'src/preload')
        }
    },
    build: {
        outDir: 'dist/renderer',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/renderer/index.html')
            },
            output: {
                manualChunks: {
                    // GIGA-CHAD: 코드 스플리팅으로 초기 번들 크기 최소화
                    vendor: ['react', 'react-dom'],
                    ui: ['lucide-react']
                }
            }
        }
    },
    server: {
        port: 5173,
        strictPort: true
    },
    optimizeDeps: {
        exclude: ['electron']
    }
})