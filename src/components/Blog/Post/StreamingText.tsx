import React, { useEffect, useRef } from 'react';
import { usePageVisible } from '@/components/Common/PageReadiness';
import { observeViewportEntry } from './useViewportEntry';
import styles from './StreamingText.module.css';

type Props = React.HTMLAttributes<HTMLElement> & {
    as?: 'p' | 'li' | 'div'; node?: unknown;
    variant?: 'text' | 'code' | 'diagram';
    onRevealComplete?: () => void;
};

export function finishStreamingWithin(element: HTMLElement | null) {
    element?.querySelectorAll('[data-stream-state]').forEach(child => {
        child.dispatchEvent(new Event('reading-reveal-finish'));
    });
}

/** 保留完整语义文本，通过文字范围的位置逐字揭示；不追加字符、不反复解析 Markdown。 */
export default function StreamingText({ as: Tag = 'p', variant = 'text', onRevealComplete, children, className, node: _node, ...props }: Props) {
    const ref = useRef<HTMLElement | null>(null);
    const finishRef = useRef<() => void>(() => {});
    const completeRef = useRef(onRevealComplete);
    completeRef.current = onRevealComplete;
    const pageVisible = usePageVisible();
    useEffect(() => {
        const element = ref.current;
        if (!element || !pageVisible || element.dataset.streamState === 'done') return;
        let frame = 0;
        let stopped = false;
        const finish = () => {
            if (stopped) return;
            stopped = true;
            cancelAnimationFrame(frame);
            element.dataset.streamState = 'done';
            element.style.removeProperty('clip-path');
            completeRef.current?.();
        };
        finishRef.current = finish;
        const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        const handleMotion = () => { if (motion?.matches) finish(); };
        // 图像、嵌套列表和块级内容不裁切；它们保留独立的加载与交互行为。
        if (motion?.matches || (variant === 'text' && element.querySelector('img, svg, pre, table, ul, ol, p, button'))) {
            finish();
            return;
        }

        const stopObserving = observeViewportEntry(element, () => {
            if (stopped) return;
            if (element.getBoundingClientRect().top < -32) { finish(); return; }
            const walker = document.createTreeWalker(element.querySelector('pre code') || element, NodeFilter.SHOW_TEXT, {
                acceptNode(node) {
                    return node.parentElement?.closest('.linenumber, [aria-hidden="true"]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
                },
            });
            const positions: { node: Text; start: number; end: number }[] = [];
            const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
            for (let text = walker.nextNode() as Text | null; text; text = walker.nextNode() as Text | null) {
                if (segmenter) {
                    for (const segment of segmenter.segment(text.data)) {
                        positions.push({ node: text, start: segment.index, end: segment.index + segment.segment.length });
                    }
                } else {
                    let offset = 0;
                    for (const character of Array.from(text.data)) {
                        positions.push({ node: text, start: offset, end: offset + character.length });
                        offset += character.length;
                    }
                }
            }
            if (variant !== 'diagram' && (!positions.length || typeof Range.prototype.getBoundingClientRect !== 'function')) { finish(); return; }
            const range = document.createRange();
            const duration = variant === 'diagram' ? 800 : Math.min(variant === 'code' ? 1400 : 1000, Math.max(240, positions.length * 5));
            let start: number | undefined;
            let previous = -1;
            // 观察器回调与下一帧之间仍保持裁切，避免全文先闪现再开始打字。
            element.style.clipPath = 'inset(0 0 100% 0)';
            element.dataset.streamState = 'playing';
            const tick = (now: number) => {
                if (stopped) return;
                start ??= now;
                const progress = Math.min(1, (now - start) / duration);
                const index = Math.min(positions.length - 1, Math.floor(progress * positions.length));
                const box = element.getBoundingClientRect();
                // 快速滚动越过段落时立即显示全文，避免等待动画追赶。
                if (progress === 1 || box.bottom < 0) { finish(); return; }
                if (variant === 'diagram') {
                    // 用逐行扫描模拟图形的打字揭示，SVG 始终完整，不逐帧重建。
                    const rowProgress = progress * 16;
                    const row = Math.floor(rowProgress);
                    const top = box.height * row / 16;
                    const bottom = box.height * (row + 1) / 16;
                    const x = box.width * (rowProgress - row);
                    element.style.clipPath = `polygon(0 0, 100% 0, 100% ${top}px, ${x}px ${top}px, ${x}px ${bottom}px, 0 ${bottom}px)`;
                    frame = requestAnimationFrame(tick);
                    return;
                }
                if (index !== previous) {
                    previous = index;
                    const position = positions[index];
                    range.setStart(position.node, position.start);
                    range.setEnd(position.node, position.end);
                    const glyph = range.getBoundingClientRect();
                    const x = Math.max(0, glyph.right - box.left);
                    const top = Math.max(0, glyph.top - box.top);
                    const bottom = Math.max(top, glyph.bottom - box.top + 3);
                    element.style.clipPath = `polygon(0 0, 100% 0, 100% ${top}px, ${x + 3}px ${top}px, ${x + 3}px ${bottom}px, 0 ${bottom}px)`;
                    element.style.setProperty('--stream-x', `${x}px`);
                    element.style.setProperty('--stream-y', `${top}px`);
                    element.style.setProperty('--stream-caret-height', `${Math.max(12, glyph.height)}px`);
                }
                frame = requestAnimationFrame(tick);
            };
            frame = requestAnimationFrame(tick);
        }, '0px');
        motion?.addEventListener?.('change', handleMotion);
        element.addEventListener('pointerdown', finish);
        element.addEventListener('focusin', finish);
        element.addEventListener('reading-reveal-finish', finish);
        element.addEventListener('wheel', finish, { passive: true });
        element.addEventListener('scroll', finish, { capture: true, passive: true });
        return () => {
            stopped = true;
            cancelAnimationFrame(frame);
            stopObserving();
            motion?.removeEventListener?.('change', handleMotion);
            element.removeEventListener('pointerdown', finish);
            element.removeEventListener('focusin', finish);
            element.removeEventListener('reading-reveal-finish', finish);
            element.removeEventListener('wheel', finish);
            element.removeEventListener('scroll', finish, true);
        };
    }, [pageVisible, variant]);

    return <Tag {...props} ref={ref as React.Ref<HTMLParagraphElement & HTMLLIElement & HTMLDivElement>}
        className={[styles.streaming_text, className].filter(Boolean).join(' ')}
        data-stream-state="pending" data-stream-variant={variant} onFocusCapture={() => finishRef.current()}>
        {children}
    </Tag>;
}
