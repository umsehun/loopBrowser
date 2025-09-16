/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/renderer/**/*.{js,ts,jsx,tsx}",
        "./src/renderer/index.html"
    ],
    theme: {
        extend: {
            colors: {
                gray: {
                    850: '#1f2937',
                    950: '#0f172a'
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-down': 'slideDown 0.15s ease-out'
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(-4px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                slideDown: {
                    '0%': { transform: 'translateY(-8px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' }
                }
            }
        },
    },
    plugins: [],
}