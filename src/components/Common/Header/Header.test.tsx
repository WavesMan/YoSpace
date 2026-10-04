import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Header from './Header';
import { I18nProvider } from '@/context/I18nContext';

vi.mock('next/navigation', () => ({ usePathname: () => '/blog/markdown-test' }));

afterEach(() => vi.restoreAllMocks());

describe('移动端导航', () => {
    it('存储访问被拒绝时仍能打开和关闭菜单', () => {
        vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
            throw new DOMException('存储被禁用', 'SecurityError');
        });
        vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
        try {
            render(<I18nProvider><Header /></I18nProvider>);
            const toggle = screen.getByRole('button', { name: 'Toggle menu' });
            expect(toggle).toHaveAttribute('aria-expanded', 'false');
            fireEvent.click(toggle);
            expect(toggle).toHaveAttribute('aria-expanded', 'true');
            fireEvent.click(screen.getByRole('button', { name: '亮色模式' }));
            expect(document.body).toHaveAttribute('data-theme', 'light');
            expect(toggle).toHaveAttribute('aria-expanded', 'false');
            fireEvent.click(toggle);
            expect(toggle).toHaveAttribute('aria-expanded', 'true');
            fireEvent.click(toggle);
            expect(toggle).toHaveAttribute('aria-expanded', 'false');
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
