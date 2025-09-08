// Theme Manager
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'system';
        this.init();
    }

    init() {
        // Apply theme on load
        this.applyTheme();
        
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => {
                if (this.theme === 'system') {
                    this.applyTheme();
                }
            };
            mediaQuery.addEventListener('change', handleChange);
        }
    }

    applyTheme() {
        let themeToApply = this.theme;
        
        if (themeToApply === 'system') {
            themeToApply = window.matchMedia('(prefers-color-scheme: dark)').matches 
                ? 'dark' 
                : 'light';
        }

        // Update data-theme attribute on html tag
        document.documentElement.setAttribute('data-theme', themeToApply);
        
        // Update meta theme color for mobile browsers
        const themeColor = themeToApply === 'dark' ? '#121212' : '#4f46e5';
        document.querySelector('meta[name="theme-color"]').setAttribute('content', themeColor);
        
        // Force repaint to ensure styles are applied
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.display = '';
    }

    setTheme(theme) {
        if (['light', 'dark', 'system'].includes(theme)) {
            this.theme = theme;
            localStorage.setItem('theme', theme);
            this.applyTheme();
            return true;
        }
        return false;
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Make setTheme available globally
window.setTheme = (theme) => {
    if (themeManager.setTheme(theme)) {
        // Update active state in settings
        document.querySelectorAll('.setting-item').forEach(item => {
            const itemTheme = item.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            item.classList.toggle('active', itemTheme === theme);
        });
    }
};

// Initialize active state on load
document.addEventListener('DOMContentLoaded', () => {
    // Set active state for current theme
    document.querySelectorAll('.setting-item').forEach(item => {
        const theme = item.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        if (theme === themeManager.theme) {
            item.classList.add('active');
        }
    });
});

// Add theme styles to the head
function addThemeStyles() {
    const style = document.createElement('style');
    style.id = 'theme-styles';
    style.textContent = `
        /* Light theme (default) */
        :root {
            --bg-primary: #ffffff;
            --bg-secondary: #f8f9fa;
            --bg-tertiary: #f0f2f5;
            --text-primary: #1a1a1a;
            --text-secondary: #4b5563;
            --text-muted: #6b7280;
            --border-color: #e5e7eb;
            --card-bg: #ffffff;
            --card-hover: #f9fafb;
            --shadow: 0 1px 3px rgba(0,0,0,0.1);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            --primary: #4f46e5;
            --primary-hover: #4338ca;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --info: #3b82f6;
        }

        /* Dark theme */
        .theme-dark {
            --bg-primary: #121212;
            --bg-secondary: #1e1e1e;
            --bg-tertiary: #2d2d2d;
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
            --text-muted: #6b7280;
            --border-color: #374151;
            --card-bg: #1e1e1e;
            --card-hover: #2d2d2d;
            --shadow: 0 1px 3px rgba(0,0,0,0.3);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
            --primary: #6366f1;
            --primary-hover: #818cf8;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --info: #3b82f6;
        }

        /* Base styles */
        body {
            background-color: var(--bg-primary);
            color: var(--text-primary);
            transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* Cards and containers */
        .card, .settings-section, .profile-stats, .content-section, .device-card {
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow);
            transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
        }

        /* Text colors */
        h1, h2, h3, h4, h5, h6, p, span, div {
            color: var(--text-primary);
        }

        .text-muted {
            color: var(--text-muted) !important;
        }

        /* Buttons */
        .btn-primary {
            background-color: var(--primary);
            border-color: var(--primary);
            color: white;
        }

        .btn-primary:hover {
            background-color: var(--primary-hover);
            border-color: var(--primary-hover);
        }

        /* Inputs */
        input, textarea, select {
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            transition: border-color 0.3s, background-color 0.3s;
        }

        input:focus, textarea:focus, select:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
        }

        /* Navigation */
        .bottom-nav {
            background-color: var(--card-bg);
            border-top: 1px solid var(--border-color);
        }

        .nav-item {
            color: var(--text-secondary);
        }

        .nav-item.active {
            color: var(--primary);
        }

        /* Settings items */
        .setting-item {
            border-bottom: 1px solid var(--border-color);
            transition: background-color 0.2s;
        }

        .setting-item:hover {
            background-color: var(--bg-tertiary);
        }

        /* Status indicators */
        .status-online { color: var(--success); }
        .status-offline { color: var(--danger); }
        .status-warning { color: var(--warning); }

        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: var(--bg-secondary);
        }

        ::-webkit-scrollbar-thumb {
            background: var(--border-color);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--text-muted);
        }
    `;
    
    document.head.appendChild(style);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    addThemeStyles();
});