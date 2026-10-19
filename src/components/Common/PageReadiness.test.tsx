import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PageReadiness, { usePageReadyTask } from './PageReadiness';

const route = vi.hoisted(() => ({ pathname: '/blog/example', locale: 'zh-CN' }));
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }));
vi.mock('@/context/I18nContext', () => ({ useI18n: () => ({ locale: route.locale }) }));

function Component({ pending }: { pending: boolean }) {
    usePageReadyTask(pending);
    return <h1>文章内容</h1>;
}

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    route.pathname = '/blog/example';
    route.locale = 'zh-CN';
});

describe('文章页统一显示', () => {
    it('服务端输出内容与加载状态，首次绘制即隐藏待加载内容', () => {
        const html = renderToString(<PageReadiness><Component pending /></PageReadiness>);
        expect(html).toContain('文章内容');
        expect(html).toContain('visibility:hidden');
        expect(html).toContain('正在准备页面');
        expect(html).toContain('<noscript>');
    });

    it('等待全部已登记组件完成后统一显示', async () => {
        const { container, rerender } = render(<PageReadiness><Component pending /></PageReadiness>);
        await new Promise(resolve => setTimeout(resolve, 80));
        expect(container.querySelector('[data-page-ready]')).toHaveAttribute('data-page-ready', 'false');
        rerender(<PageReadiness><Component pending={false} /></PageReadiness>);
        await waitFor(() => expect(container.querySelector('[data-page-ready]')).toHaveAttribute('data-page-ready', 'true'));
        expect(screen.queryByText('正在准备页面')).not.toBeInTheDocument();
    });

    it('路由切换后重新等待新页面组件', async () => {
        const { container, rerender } = render(<PageReadiness><Component pending={false} /></PageReadiness>);
        await waitFor(() => expect(container.querySelector('[data-page-ready]')).toHaveAttribute('data-page-ready', 'true'));
        route.pathname = '/blog/another';
        rerender(<PageReadiness><Component pending /></PageReadiness>);
        expect(container.querySelector('[data-page-ready]')).toHaveAttribute('data-page-ready', 'false');
        rerender(<PageReadiness><Component pending={false} /></PageReadiness>);
        await waitFor(() => expect(container.querySelector('[data-page-ready]')).toHaveAttribute('data-page-ready', 'true'));
    });

    it('图片自行懒加载，不阻塞首屏文字阅读', async () => {
        const { container } = render(<PageReadiness><img src="/example.jpg" alt="首屏图片" loading="lazy" /></PageReadiness>);
        const image = screen.getByAltText('首屏图片') as HTMLImageElement;
        await waitFor(() => expect(container.querySelector('[data-page-ready]')).toHaveAttribute('data-page-ready', 'true'));
        expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('组件超时显示重试界面，不提前展示未完成内容', async () => {
        vi.useFakeTimers();
        const { container } = render(<PageReadiness><Component pending /></PageReadiness>);
        await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
        expect(screen.getByRole('alert')).toHaveTextContent('页面加载未完成');
        expect(screen.getByRole('button', { name: '重新加载' })).toBeInTheDocument();
        expect(container.querySelector('[data-page-ready]')).toHaveAttribute('data-page-ready', 'false');
    });

    it('离开后返回同一文章也重新等待，不能复用上一次的完成状态', async () => {
        const { container, rerender } = render(<PageReadiness><Component pending={false} /></PageReadiness>);
        await waitFor(() => expect(container.querySelector('[data-page-ready]')).toHaveAttribute('data-page-ready', 'true'));
        route.pathname = '/blog';
        rerender(<PageReadiness><Component pending={false} /></PageReadiness>);
        route.pathname = '/blog/example';
        rerender(<PageReadiness><Component pending /></PageReadiness>);
        expect(container.querySelector('[data-page-ready]')).toHaveAttribute('data-page-ready', 'false');
    });

    it('其他页面不受文章加载屏障影响', () => {
        route.pathname = '/blog';
        const { container } = render(<PageReadiness><Component pending /></PageReadiness>);
        expect(container.querySelector('[data-page-ready]')).toHaveAttribute('data-page-ready', 'true');
        expect(screen.queryByText('正在准备页面')).not.toBeInTheDocument();
    });
});
