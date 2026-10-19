import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TransitionLink from './TransitionLink';

vi.mock('next/link', () => ({ default: ({ onNavigate, href, children }: { onNavigate?: (event: { preventDefault: () => void }) => void; href: string; children: React.ReactNode }) =>
    <a href={href} onClick={event => { event.preventDefault(); if (!event.ctrlKey && !event.metaKey) onNavigate?.({ preventDefault: vi.fn() }); }}>{children}</a> }));
afterEach(() => vi.restoreAllMocks());

describe('统一导航开始信号', () => {
    it('站内路由跳转发出目标路径，而锚点与外链不触发', () => {
        const signal = vi.fn();
        window.addEventListener('app-navigation-start', signal);
        try {
            render(<><TransitionLink href="/archive">归档</TransitionLink><TransitionLink href="#section">锚点</TransitionLink><TransitionLink href="https://example.com">外部</TransitionLink></>);
            fireEvent.click(screen.getByText('锚点'));
            fireEvent.click(screen.getByText('外部'));
            expect(signal).not.toHaveBeenCalled();
            fireEvent.click(screen.getByText('归档'));
            expect(signal).toHaveBeenCalledTimes(1);
            expect(signal.mock.calls[0][0].detail).toBe('/archive');
        } finally { window.removeEventListener('app-navigation-start', signal); }
    });
    it('业务取消导航或修饰键打开链接时不遗留等待', () => {
        const signal = vi.fn();
        window.addEventListener('app-navigation-start', signal);
        try {
            render(<><TransitionLink href="/archive" onNavigate={event => event.preventDefault()}>取消</TransitionLink><TransitionLink href="/links">友链</TransitionLink></>);
            fireEvent.click(screen.getByText('取消'));
            fireEvent.click(screen.getByText('友链'), { ctrlKey: true });
            expect(signal).not.toHaveBeenCalled();
        } finally { window.removeEventListener('app-navigation-start', signal); }
    });
});
