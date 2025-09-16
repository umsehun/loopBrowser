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
    build: {
        outDir: 'dist/renderer',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/renderer/index.html')
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