/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
            },
            colors: {
                background: "#020617",
                surface: "#0f172a",
                primary: "#f8fafc",
                secondary: "#94a3b8",
                vision: {
                    cyan: "#22d3ee",
                    purple: "#c084fc",
                    blue: "#38bdf8",
                    dark: "#030014",
                }
            },
            boxShadow: {
                'neon-cyan': '0 0 15px rgba(34, 211, 238, 0.4)',
                'neon-purple': '0 0 15px rgba(192, 132, 252, 0.4)',
            }
        },
    },
    plugins: [],
}
