export function createLogger(module: string) {
    return {
        info: (message: string) => console.log(`🦾 ${module}: ${message}`),
        warn: (message: string) => console.warn(`⚠️ ${module}: ${message}`),
        error: (message: string) => console.error(`❌ ${module}: ${message}`)
    }
}