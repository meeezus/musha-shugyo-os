<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <meta name="theme-color" content="#050505">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

    <title inertia>{{ config('app.name', 'Musha Shugyo OS') }}</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

    <!-- Initialize theme before page renders to prevent flash -->
    <script>
        (function() {
            const stored = localStorage.getItem('msos_theme');
            if (stored === 'light') {
                document.documentElement.classList.remove('dark');
            }
        })();
    </script>

    @viteReactRefresh
    @vite('resources/js/app.tsx')
    @inertiaHead

    <style>
        /* Dark mode (default) */
        .dark body {
            background-color: #050505;
            color: #E5E5E5;
        }

        /* Light mode */
        html:not(.dark) body {
            background-color: #f5f5f5;
            color: #1a1a1a;
        }

        body {
            font-family: 'Inter', sans-serif;
            -webkit-font-smoothing: antialiased;
            transition: background-color 0.2s ease, color 0.2s ease;
        }

        /* Stealth Card - Dark */
        .dark .stealth-card {
            background-color: rgba(10, 10, 10, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }
        .dark .stealth-card:hover {
            border-color: rgba(255, 255, 255, 0.15);
            background-color: rgba(15, 15, 15, 0.85);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        /* Stealth Card - Light */
        html:not(.dark) .stealth-card {
            background-color: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(0, 0, 0, 0.08);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        html:not(.dark) .stealth-card:hover {
            border-color: rgba(0, 0, 0, 0.15);
            background-color: rgba(250, 250, 250, 0.9);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .stealth-card {
            border-radius: 2px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }

        /* Mist gradient overlay for cards */
        .dark .stealth-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 0%, transparent 100%);
            border-radius: 2px 2px 0 0;
            pointer-events: none;
        }

        /* Noise Overlay - Dark */
        .dark .noise-overlay {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
        }

        /* Noise Overlay - Light (subtle) */
        html:not(.dark) .noise-overlay {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.015'/%3E%3C/svg%3E");
        }

        .noise-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none;
            z-index: 50;
        }

        /* Custom Scrollbar - Dark */
        .dark ::-webkit-scrollbar-track {
            background: #050505;
        }
        .dark ::-webkit-scrollbar-thumb {
            background: #333;
        }
        .dark ::-webkit-scrollbar-thumb:hover {
            background: #555;
        }

        /* Custom Scrollbar - Light */
        html:not(.dark) ::-webkit-scrollbar-track {
            background: #f5f5f5;
        }
        html:not(.dark) ::-webkit-scrollbar-thumb {
            background: #ccc;
        }
        html:not(.dark) ::-webkit-scrollbar-thumb:hover {
            background: #999;
        }

        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-thumb {
            border-radius: 3px;
        }

        .selection-accent::selection {
            background: rgba(16, 185, 129, 0.3);
            color: #10b981;
        }
    </style>
</head>
<body class="selection-accent overflow-hidden">
    @inertia
</body>
</html>
