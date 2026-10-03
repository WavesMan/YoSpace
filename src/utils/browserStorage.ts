type StorageName = 'localStorage' | 'sessionStorage';

// 浏览器禁用存储时仍允许页面渲染和交互，只放弃持久化。
export const readBrowserStorage = (name: StorageName, key: string): string | null => {
    try {
        return typeof window === 'undefined' ? null : window[name].getItem(key);
    } catch {
        return null;
    }
};

export const writeBrowserStorage = (name: StorageName, key: string, value: string): void => {
    try {
        if (typeof window !== 'undefined') window[name].setItem(key, value);
    } catch {
        // 内存中的主题、语言和滚动状态不依赖存储写入成功。
    }
};
