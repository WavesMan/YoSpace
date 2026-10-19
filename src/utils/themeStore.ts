'use client';

import { applyTheme, isThemePreference, THEME_STORAGE_KEY, type Theme, type ThemePreference } from './theme';
import { writeBrowserStorage } from './browserStorage';

const serverSnapshot = { theme: 'light' as Theme, preference: 'system' as ThemePreference };
let snapshot = serverSnapshot;
const listeners = new Set<() => void>();
let media: MediaQueryList | undefined;

function readPreference(): ThemePreference {
    try {
        const value = window.localStorage.getItem(THEME_STORAGE_KEY);
        return isThemePreference(value) ? value : 'system';
    } catch {
        return snapshot.preference;
    }
}

function update(preference: ThemePreference) {
    const theme = preference === 'system' ? media?.matches ? 'dark' : 'light' : preference;
    // 主题先应用到 DOM，避免 hydration 的服务器亮色快照覆盖 head 的暗色。
    applyTheme(theme, preference);
    if (snapshot.theme === theme && snapshot.preference === preference) return;
    snapshot = { theme, preference };
    listeners.forEach(listener => listener());
}

const syncPreference = () => update(readPreference());
const onSystemChange = () => update(snapshot.preference);
const onVisibilityChange = () => { if (document.visibilityState === 'visible') syncPreference(); };
const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== THEME_STORAGE_KEY) return;
    if (event.storageArea && event.storageArea !== window.localStorage) return;
    syncPreference();
};

export function subscribeTheme(listener: () => void) {
    listeners.add(listener);
    if (listeners.size === 1) {
        media = window.matchMedia?.('(prefers-color-scheme: dark)');
        syncPreference();
        if (media?.addEventListener) media.addEventListener('change', onSystemChange);
        else media?.addListener?.(onSystemChange);
        window.addEventListener('storage', onStorage);
        window.addEventListener('pageshow', syncPreference);
        document.addEventListener('visibilitychange', onVisibilityChange);
    }
    return () => {
        listeners.delete(listener);
        if (listeners.size > 0) return;
        if (media?.removeEventListener) media.removeEventListener('change', onSystemChange);
        else media?.removeListener?.(onSystemChange);
        media = undefined;
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('pageshow', syncPreference);
        document.removeEventListener('visibilitychange', onVisibilityChange);
    };
}

// 只有明确的用户操作持久化偏好；系统变化、跨标签页同步和初始化都不写入。
export function setThemePreference(preference: ThemePreference) {
    writeBrowserStorage('localStorage', THEME_STORAGE_KEY, preference);
    update(preference);
}

export const getThemeSnapshot = () => snapshot;
export const getThemeServerSnapshot = () => serverSnapshot;
