export const THEMES = {
  themeLight: {
    // Status colors
    success: '#059669',    // Emerald 600
    warning: '#d97706',    // Amber 600
    error: '#dc2626',      // Red 600
    info: '#2563eb',       // Blue 600
  
    // UI colors
    primary: '#7c3aed',    // Violet 600 (brand)
    secondary: '#4f46e5',  // Indigo 600
    accent: '#db2777',     // Pink 600
    highlight: '#ccfbf1',  // Teal 100 (Background highlight)
  
    // Neutral colors
    text: '#111827',       // Gray 900 (Dark text)
    textMuted: '#6b7280',  // Gray 500 (Dimmed text)
    border: '#e5e7eb',     // Gray 200 (Borders)
    background: '#ffffff', // White
  },
  themeDark: {
    // Status colors
    success: '#10b981',    // Emerald 500
    warning: '#f59e0b',    // Amber 500
    error: '#ef4444',      // Red 500
    info: '#3b82f6',       // Blue 500
  
    // UI colors
    primary: '#8b5cf6',    // Violet 500 (brand)
    secondary: '#6366f1',  // Indigo 500
    accent: '#ec4899',     // Pink 500
    highlight: '#14b8a6',  // Teal 500
  
    // Neutral colors
    text: '#f3f4f6',       // Gray 100 (light text)
    textMuted: '#9ca3af',  // Gray 400 (dimmed text)
    border: '#4b5563',     // Gray 600 (borders)
    background: '#1f2937', // Gray 800 (backgrounds)
  }
}

// export const THEME = THEMES.themeLight;

export const symbols = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  arrow: '→',
  bullet: '•',
  loading: '⋯',
  progressFilled: '█',
  progressEmpty: '░',
};

export const borders = {
  heavy: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    horizontal: '━',
    vertical: '┃',
  },
  light: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
  },
};

export const spinners = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
};