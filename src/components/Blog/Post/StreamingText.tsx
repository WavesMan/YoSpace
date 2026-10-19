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
    element?.querySelectorAll('[data-stream-state]').forEach(child => child.dispatchEvent(new Event('reading-reveal-finish')));
}

/** 保留原有调用接口，改为一次性淡入；不再逐字测量、裁切或逐行扫描。 */
export default function StreamingText({ as: Tag = 'p', variant = 'text', onRevealComplete, children, className, node: _node, ...props }: Props) {
    const ref = useRef<HTMLElement | null>(null);
    const complete = useRef(onRevealComplete);
    complete.current = onRevealComplete;
    const visible = usePageVisible();
    useEffect(() => {
        const element = ref.current;
        if (!element || !visible || element.dataset.streamState === 'done') return;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            element.dataset.streamState = 'done';
            complete.current?.();
        };
        const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        const onMotion = () => { if (motion?.matches) finish(); };
        const unobserve = observeViewportEntry(element, () => {
            if (motion?.matches || variant === 'text') { finish(); return; }
            element.dataset.streamState = 'playing';
            timer = setTimeout(finish, 240);
        }, '0px');
        element.addEventListener('transitionend', finish);
        element.addEventListener('reading-reveal-finish', finish);
        element.addEventListener('pointerdown', finish);
        element.addEventListener('focusin', finish);
        motion?.addEventListener?.('change', onMotion);
        return () => {
            clearTimeout(timer);
            unobserve();
            element.removeEventListener('transitionend', finish);
            element.removeEventListener('reading-reveal-finish', finish);
            element.removeEventListener('pointerdown', finish);
            element.removeEventListener('focusin', finish);
            motion?.removeEventListener?.('change', onMotion);
        };
    }, [visible, variant]);
    return <Tag {...props} ref={ref as React.Ref<HTMLParagraphElement & HTMLLIElement & HTMLDivElement>}
        className={[styles.streaming_text, className].filter(Boolean).join(' ')} data-stream-state="pending" data-stream-variant={variant}>{children}</Tag>;
}
