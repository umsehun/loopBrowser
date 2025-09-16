import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    main: {
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
            outDir: 'out/main',
            rollupOptions: {
                external: ['electron']
            }
        }
    },
    preload: {
        resolve: {
            alias: {
                '@shared': resolve(__dirname, 'src/shared'),
                '@main': resolve(__dirname, 'src/main'),
                '@renderer': resolve(__dirname, 'src/renderer'),
                '@preload': resolve(__dirname, 'src/preload')
            }
        },
        build: {
            outDir: 'out/preload'
        }
    },
    renderer: {
        plugins: [react()],
        resolve: {
            alias: {
                '@shared': resolve(__dirname, 'src/shared'),
                '@main': resolve(__dirname, 'src/main'),
                '@renderer': resolve(__dirname, 'src/renderer'),
                '@preload': resolve(__dirname, 'src/preload')
            }
        },
        build: {
            outDir: 'out/renderer',
            rollupOptions: {
                output: {
                    manualChunks: {
                        // GIGA-CHAD: 코드 스플리팅으로 초기 번들 크기 최소화
                        vendor: ['react', 'react-dom'],
                        ui: ['lucide-react']
                    }
                }
            }
        }
    }
})