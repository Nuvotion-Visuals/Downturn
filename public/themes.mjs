const DEFAULT_FONTS = {
  '--font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
  '--font-mono': 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
};

export const THEMES = {
  dark: {
    ...DEFAULT_FONTS,
    '--color-bg': '#0d1117',
    '--color-bg-secondary': '#161b22',
    '--color-bg-tertiary': '#21262d',
    '--color-border': '#30363d',
    '--color-border-hover': '#8b949e',
    '--color-text': '#e6edf3',
    '--color-text-muted': '#8b949e',
    '--color-text-placeholder': '#6e7681',
    '--color-link': '#58a6ff',
    '--color-accent': '#1f6feb',
    '--color-accent-alpha': 'rgba(31, 111, 235, 0.3)',
    '--color-danger': '#f85149',
    '--color-white': '#fff',
    '--color-shadow': 'rgba(0, 0, 0, 0.3)',
    '--color-shadow-heavy': 'rgba(0, 0, 0, 0.4)',
  },
  light: {
    ...DEFAULT_FONTS,
    '--color-bg': '#ffffff',
    '--color-bg-secondary': '#f6f8fa',
    '--color-bg-tertiary': '#eaeef2',
    '--color-border': '#d0d7de',
    '--color-border-hover': '#8b949e',
    '--color-text': '#1f2328',
    '--color-text-muted': '#656d76',
    '--color-text-placeholder': '#6e7681',
    '--color-link': '#0969da',
    '--color-accent': '#0969da',
    '--color-accent-alpha': 'rgba(9, 105, 218, 0.3)',
    '--color-danger': '#cf222e',
    '--color-white': '#fff',
    '--color-shadow': 'rgba(0, 0, 0, 0.1)',
    '--color-shadow-heavy': 'rgba(0, 0, 0, 0.15)',
  },
  midnight: {
    ...DEFAULT_FONTS,
    '--color-bg': '#000000',
    '--color-bg-secondary': '#000000',
    '--color-bg-tertiary': '#000000',
    '--color-border': '#1a1a1a',
    '--color-border-hover': '#444444',
    '--color-text': '#e0e0e0',
    '--color-text-muted': '#777777',
    '--color-text-placeholder': '#555555',
    '--color-link': '#58a6ff',
    '--color-accent': '#1f6feb',
    '--color-accent-alpha': 'rgba(31, 111, 235, 0.3)',
    '--color-danger': '#f85149',
    '--color-white': '#fff',
    '--color-shadow': 'rgba(0, 0, 0, 0.5)',
    '--color-shadow-heavy': 'rgba(0, 0, 0, 0.7)',
  },
};

export function applyTheme(name, overrides = {}) {
  const base = THEMES[name] || THEMES.dark;
  const theme = { ...base, ...overrides };
  const el = document.documentElement;
  for (const [key, value] of Object.entries(theme)) {
    el.style.setProperty(key, value);
  }
}

export function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const FALLBACK_FONTS = [
  'System Default',
  'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Verdana', 'Trebuchet MS',
  'Segoe UI', 'Roboto', 'Inter', 'Fira Sans', 'Noto Sans',
];

const FALLBACK_MONO_FONTS = [
  'System Default',
  'Courier New', 'Consolas', 'Menlo', 'Monaco',
  'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Cascadia Code', 'IBM Plex Mono',
];

export async function listFonts() {
  if (window.queryLocalFonts) {
    try {
      const fonts = await window.queryLocalFonts();
      const families = [...new Set(fonts.map(f => f.family))].sort();
      return { all: ['System Default', ...families], mono: ['System Default', ...families] };
    } catch {}
  }
  return { all: FALLBACK_FONTS, mono: FALLBACK_MONO_FONTS };
}
