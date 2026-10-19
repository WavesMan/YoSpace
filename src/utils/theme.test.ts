import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { themeInitScript } from './theme';

let dark = true;
let media: EventTarget & { matches: boolean; media: string };
let unsubscribe: (() => void) | undefined;

beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    dark = true;
    media = Object.assign(new EventTarget(), { get matches() { return dark; }, media: '(prefers-color-scheme: dark)' });
    Object.defineProperty(media, 'matches', { get: () => dark });
    vi.stubGlobal('matchMedia', () => media);
    document.body.className = 'reading-page';
    document.documentElement.removeAttribute('data-theme');
});
afterEach(() => {
    unsubscribe?.();
    unsubscribe = undefined;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});
const system = (value: boolean) => { dark = value; media.dispatchEvent(new Event('change')); };

describe('系统主题与手动偏好', () => {
    it('首屏忽略无法区分来源的旧主题缓存，暗色系统不被固定为亮色，也不自动写入', () => {
        localStorage.setItem('theme', 'light');
        const write = vi.spyOn(Storage.prototype, 'setItem');
        window.eval(themeInitScript);
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
        expect(document.documentElement).toHaveAttribute('data-theme-preference', 'system');
        expect(write).not.toHaveBeenCalled();
    });

    it('禁用浏览器存储时首屏仍应用系统暗色', () => {
        vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new DOMException('存储被禁用', 'SecurityError'); });
        window.eval(themeInitScript);
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    it('监听系统实时变化，仅明确操作保存偏好，恢复自动后继续跟随', async () => {
        const store = await import('./themeStore');
        const write = vi.spyOn(Storage.prototype, 'setItem');
        unsubscribe = store.subscribeTheme(vi.fn());
        expect(store.getThemeSnapshot()).toEqual({ theme: 'dark', preference: 'system' });
        system(false);
        expect(document.body).toHaveAttribute('data-theme', 'light');
        expect(write).not.toHaveBeenCalled();
        store.setThemePreference('light');
        system(true);
        expect(document.body).toHaveAttribute('data-theme', 'light');
        expect(localStorage.getItem('theme-preference')).toBe('light');
        store.setThemePreference('system');
        expect(document.body).toHaveAttribute('data-theme', 'dark');
        system(false);
        expect(document.body).toHaveAttribute('data-theme', 'light');
        expect(write).toHaveBeenCalledTimes(2);
        expect(document.body).toHaveClass('reading-page');
    });

    it('跨标签清空存储会恢复系统偏好，同步过程不回写', async () => {
        localStorage.setItem('theme-preference', 'light');
        const store = await import('./themeStore');
        unsubscribe = store.subscribeTheme(vi.fn());
        expect(document.body).toHaveAttribute('data-theme', 'light');
        localStorage.clear();
        const write = vi.spyOn(Storage.prototype, 'setItem');
        window.dispatchEvent(new StorageEvent('storage', { key: null }));
        expect(store.getThemeSnapshot()).toEqual({ theme: 'dark', preference: 'system' });
        expect(write).not.toHaveBeenCalled();
    });

    it('存储禁用时保留手动选择，恢复页面也不意外覆盖', async () => {
        vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new DOMException('存储被禁用', 'SecurityError'); });
        const store = await import('./themeStore');
        unsubscribe = store.subscribeTheme(vi.fn());
        store.setThemePreference('light');
        system(true);
        window.dispatchEvent(new Event('pageshow'));
        expect(store.getThemeSnapshot()).toEqual({ theme: 'light', preference: 'light' });
    });
});
