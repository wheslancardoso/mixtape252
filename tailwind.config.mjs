export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                // Mapeia nomes de classe do Tailwind para as nossas variáveis CSS dinâmicas
                'background': 'var(--color-bg)',
                'text': 'var(--color-text)',
                'accent': 'var(--color-accent)',

                // Mapeia nomes de classe para as cores estáticas (se precisar usar diretamente)
                'safety-orange': 'var(--color-accent-default)',

                'system-log': {
                    'dark': 'var(--color-system-log-bg)',
                    'neon': 'var(--color-system-log-text)'
                },
                'pixel-trash': {
                    'dark': 'var(--color-pixel-trash-bg)',
                    'hot': 'var(--color-pixel-trash-accent)'
                }
            },
            fontFamily: {
                'sans': ['"Space Grotesk"', 'sans-serif'],
                'mono': ['"Space Mono"', 'monospace'],
                'display': ['"Anton"', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
