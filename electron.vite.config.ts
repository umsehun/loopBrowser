import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    main: {
        // 성능 최적화: require() 병목 해결
        plugins: [externalizeDepsPlugin({ exclude: ['electron-store'] })], // electron-store는 번들링에 포함
        build: {
            outDir: 'out/main',
            // 성능 향상을 위한 설정
            reportCompressedSize: false, // 압축 크기 보고 비활성화로 빌드 속도 향상
            minify: false, // 개발 단계에서는 minify 비활성화로 빌드 속도 향상
            rollupOptions: {
                // 네이티브 모듈 제외
                external: ['sqlite3', 'fsevents'],
                output: {
                    // 수동 청킹으로 최적화
                    manualChunks(id) {
                        if (id.includes('node_modules') && !id.includes('electron-store')) {
                            return 'vendor'
                        }
                    }
                }
            }
        }
    },
    preload: {
        // require() 병목 해결
        plugins: [externalizeDepsPlugin({ exclude: ['electron-store'] })], // electron-store는 번들링에 포함
        build: {
            outDir: 'out/preload',
            reportCompressedSize: false,
            minify: false,
            lib: {
                entry: 'src/preload/preload.ts'
            }
        }
    },
    renderer: {
        root: 'src/renderer',
        build: {
            outDir: 'out/renderer',
            // 렌더러 성능 최적화
            reportCompressedSize: false,
            target: 'chrome120', // 최신 Chrome 엔진 활용
            rollupOptions: {
                output: {
                    // 청킹 전략으로 로딩 속도 최적화
                    manualChunks: {
                        'react-vendor': ['react', 'react-dom'],
                        'ui-vendor': ['@headlessui/react', '@heroicons/react']
                    }
                }
            }
        },
        server: {
            port: 5173,
            strictPort: true,
            // HMR 최적화
            hmr: {
                overlay: false // 오버레이 비활성화로 성능 향상
            }
        },
        plugins: [tailwindcss()],
        // 개발 서버 최적화
        optimizeDeps: {
            include: ['react', 'react-dom'],
            exclude: ['electron']
        }
    }
})