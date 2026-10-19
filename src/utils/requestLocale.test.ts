import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveRequestLocale } from './requestLocale';

afterEach(() => vi.unstubAllEnvs());

describe('服务端语言选择', () => {
    it('关闭国际化时忽略英文偏好，直接输出中文', () => {
        vi.stubEnv('NEXT_PUBLIC_I18N', 'false');
        expect(resolveRequestLocale('en-US', 'en-US,en;q=0.9')).toBe('zh-CN');
    });
    it('开启时优先使用已保存的语言，其次使用请求语言', () => {
        vi.stubEnv('NEXT_PUBLIC_I18N', 'true');
        expect(resolveRequestLocale('zh-CN', 'en-US')).toBe('zh-CN');
        expect(resolveRequestLocale(undefined, 'en-US,en;q=0.9')).toBe('en-US');
        expect(resolveRequestLocale(undefined, 'zh-CN')).toBe('zh-CN');
    });
});
