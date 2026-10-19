import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import StreamingText from './StreamingText';

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('轻量内容呈现', () => {
    it('服务端保留完整文本、强调与链接结构', () => {
        const html = renderToString(<StreamingText>完整<strong>段落</strong><a href="#section">链接</a>👨‍👩‍👧</StreamingText>);
        expect(html).toContain('完整');
        expect(html).toContain('<strong>段落</strong>');
        expect(html).toContain('href="#section"');
        expect(html).toContain('👨‍👩‍👧');
        expect(html).toContain('data-stream-state="pending"');
    });

    it('正文进入视口直接完成，不逐字裁切或测量字形', async () => {
        let notify: IntersectionObserverCallback;
        const observer = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
        vi.stubGlobal('IntersectionObserver', class {
            constructor(callback: IntersectionObserverCallback) { notify = callback; }
            observe = observer.observe;
            unobserve = observer.unobserve;
            disconnect = observer.disconnect;
        });
        vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
        Object.defineProperty(Range.prototype, 'getBoundingClientRect', { configurable: true, value: () => ({ left: 0, right: 20, top: 0, bottom: 20, height: 20 }) });
        render(<StreamingText>逐字显示文字，保留完整排版高度。</StreamingText>);
        const paragraph = screen.getByText('逐字显示文字，保留完整排版高度。');
        expect(paragraph).toHaveAttribute('data-stream-state', 'pending');
        act(() => { notify!([{ target: paragraph, isIntersecting: true } as unknown as IntersectionObserverEntry], observer as unknown as IntersectionObserver); });
        expect(paragraph).toHaveAttribute('data-stream-state', 'done');
        expect(paragraph.style.clipPath).toBe('');
        fireEvent.pointerDown(paragraph);
        expect(paragraph).toHaveAttribute('data-stream-state', 'done');
        expect(paragraph.style.clipPath).toBe('');
    });

    it('减少动态效果时直接显示，不等待滚动或动画', async () => {
        vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
        render(<StreamingText>直接显示全文</StreamingText>);
        await waitFor(() => expect(screen.getByText('直接显示全文')).toHaveAttribute('data-stream-state', 'done'));
    });

    it('代码块保留完整内容，交互结束淡入时完成通知只触发一次', () => {
        vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
        Object.defineProperty(Range.prototype, 'getBoundingClientRect', { configurable: true, value: () => ({ left: 0, right: 20, top: 0, bottom: 20, height: 20 }) });
        const done = vi.fn();
        render(<StreamingText as="div" variant="code" onRevealComplete={done}><pre><code>echo 中文👨‍👩‍👧</code></pre></StreamingText>);
        const block = screen.getByText('echo 中文👨‍👩‍👧').closest('[data-stream-state]') as HTMLElement;
        expect(block).toHaveAttribute('data-stream-state', 'playing');
        expect(block).toHaveTextContent('echo 中文👨‍👩‍👧');
        fireEvent.pointerDown(block);
        fireEvent.focusIn(block);
        expect(block).toHaveAttribute('data-stream-state', 'done');
        expect(done).toHaveBeenCalledTimes(1);
    });

    it('图表只执行短淡入，不进行逐行裁切，交互立即完成', () => {
        vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
        render(<StreamingText as="div" variant="diagram"><svg role="img"><text>完整图表</text></svg></StreamingText>);
        const block = screen.getByRole('img').parentElement!;
        expect(block).toHaveAttribute('data-stream-state', 'playing');
        expect(block.style.clipPath).toBe('');
        fireEvent.pointerDown(block);
        expect(block).toHaveAttribute('data-stream-state', 'done');
    });

    it('图片与嵌套列表不受文字裁切影响', () => {
        render(<StreamingText as="li"><p>嵌套内容</p></StreamingText>);
        expect(screen.getByRole('listitem')).toHaveAttribute('data-stream-state', 'done');
    });
});
