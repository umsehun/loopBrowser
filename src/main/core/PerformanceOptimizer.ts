import { app } from 'electron'
import { logger } from '../../shared/logger/index'
import { serviceManager } from '../services/index'

export class PerformanceOptimizer {
    private static instance: PerformanceOptimizer

    constructor() {
        logger.info('PerformanceOptimizer initialized')
    }

    static getInstance(): PerformanceOptimizer {
        if (!PerformanceOptimizer.instance) {
            PerformanceOptimizer.instance = new PerformanceOptimizer()
        }
        return PerformanceOptimizer.instance
    }

    // 메모리 최적화를 위한 하드웨어 가속 비활성화
    disableHardwareAcceleration(): void {
        logger.info('Disabling hardware acceleration for memory optimization')
        app.disableHardwareAcceleration()
    }

    // GPU 성능 최적화 (필요시 활성화)
    enableGpuOptimizations(): void {
        logger.info('Enabling GPU optimizations')

        app.commandLine.appendSwitch('enable-gpu-rasterization')
        app.commandLine.appendSwitch('enable-gpu-memory-buffer-video-frames')
        app.commandLine.appendSwitch('enable-gpu-memory-buffer-compositor-resources')
        app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,VaapiIgnoreDriverChecks')
    }

    // V8 엔진 최적화 플래그 적용
    applyV8Optimizations(): void {
        const v8Flags = serviceManager.getV8Flags()

        if (v8Flags.length > 0) {
            logger.info('Applying V8 optimization flags', { flags: v8Flags })
            v8Flags.forEach(flag => {
                app.commandLine.appendSwitch('js-flags', flag)
            })
        } else {
            logger.info('No V8 optimization flags to apply')
        }
    }

    // 일반 성능 최적화 플래그
    applyPerformanceFlags(): void {
        logger.info('Applying general performance optimization flags')

        app.commandLine.appendSwitch('disable-software-rasterizer')
        app.commandLine.appendSwitch('disable-background-timer-throttling')
        app.commandLine.appendSwitch('disable-renderer-backgrounding')
        app.commandLine.appendSwitch('disable-features', 'TranslateUI')
    }

    // 모든 최적화 적용
    applyAllOptimizations(): void {
        logger.info('Applying all performance optimizations')

        this.disableHardwareAcceleration()
        this.applyV8Optimizations()
        this.applyPerformanceFlags()

        logger.info('All performance optimizations applied successfully')
    }
}