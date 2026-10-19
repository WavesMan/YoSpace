import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LazyCodeBlock from './LazyCodeBlock';

vi.mock('../CodeBlock', () => ({ HighlightedCodeContent: () => <pre data-highlighted="true">高亮结果</pre> }));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('代码打字与异步高亮衔接', () => {
    it('高亮加载完成也不打断正在揭示的代码，完成后不重新播放', async () => {
        vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
        Object.defineProperty(Range.prototype, 'getBoundingClientRect', { configurable: true, value: () => ({ right: 20, top: 0, bottom: 20, height: 20 }) });
        const { container } = render(<LazyCodeBlock language="powershell" value={'echo 稳定的代码内容'.repeat(40)} />);
        const reveal = container.querySelector('[data-stream-variant="code"]') as HTMLElement;
        expect(reveal).toHaveAttribute('data-stream-state', 'playing');
        await new Promise(resolve => setTimeout(resolve, 80));
        expect(container.querySelector('[data-highlighted]')).toBeNull();
        fireEvent.pointerDown(reveal);
        await waitFor(() => expect(container.querySelector('[data-highlighted]')).not.toBeNull());
        expect(container.querySelector('[data-stream-variant="code"]')).toBe(reveal);
        expect(reveal).toHaveAttribute('data-stream-state', 'done');
    });
});
