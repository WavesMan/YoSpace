export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';
// 旧 theme 值由自动检测和手动切换共同写入，无法可靠代表用户选择。
export const THEME_STORAGE_KEY = 'theme-preference';
export const isThemePreference = (value: unknown): value is ThemePreference => value === 'light' || value === 'dark' || value === 'system';

/** 此函数序列化后在 head 执行，必须保持自包含，且不依赖可用的存储。 */
function initializeTheme(storageKey: string) {
    let preference = 'system';
    try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved === 'light' || saved === 'dark') preference = saved;
    } catch { /* 禁用存储时继续检测系统主题。 */ }
    const dark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = preference === 'system' ? dark ? 'dark' : 'light' : preference;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme-preference', preference);
    document.documentElement.style.colorScheme = theme;
}

export const themeInitScript = `(${initializeTheme.toString()})(${JSON.stringify(THEME_STORAGE_KEY)});`;

export function applyTheme(theme: Theme, preference: ThemePreference) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme-preference', preference);
    document.documentElement.style.colorScheme = theme;
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    document.body.setAttribute('data-theme', theme);
}
