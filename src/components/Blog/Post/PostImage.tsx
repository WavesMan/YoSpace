'use client';

import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { usePageVisible } from '@/components/Common/PageReadiness';
import { observeViewportEntry } from './useViewportEntry';
import styles from './PostImage.module.css';

/** 图片解码并进入视口后，以首页社交图标的左侧渐入节奏呈现，保留原生懒加载。 */
const PostImage = forwardRef<HTMLImageElement, ImageProps>(function PostImage({ onLoad, onError, onAnimationEnd, className, ...props }, forwardedRef) {
    const ref = useRef<HTMLImageElement | null>(null);
    const pageVisible = usePageVisible();
    const source = props.src;
    const [state, setState] = useState({ source, decoded: false, entered: false, done: false, error: false });
    if (state.source !== source) setState({ source, decoded: false, entered: false, done: false, error: false });
    const setRef = useCallback((element: HTMLImageElement | null) => {
        ref.current = element;
        if (typeof forwardedRef === 'function') return forwardedRef(element);
        if (forwardedRef) forwardedRef.current = element;
    }, [forwardedRef]);
    const decode = useCallback(async (element: HTMLImageElement) => {
        try { await element.decode?.(); } catch { /* 已完成 load 的图片仍可展示，解码取消不应永久隐藏。 */ }
        setState(previous => previous.source === source ? { ...previous, decoded: true, error: false } : previous);
    }, [source]);

    useEffect(() => {
        const element = ref.current;
        if (element?.complete && element.naturalWidth > 0) void decode(element);
        else if (element?.complete) setState(previous => ({ ...previous, error: true }));
    }, [source, decode]);

    useEffect(() => {
        if (!pageVisible || !ref.current) return;
        const element = ref.current;
        return observeViewportEntry(element, () => {
            const images = Array.from(element.closest('[data-post-content]')?.querySelectorAll('img[data-image-state]') || [element]);
            const visible = images.filter(image => {
                const box = image.getBoundingClientRect();
                return box.bottom > 0 && box.top < window.innerHeight;
            });
            const index = Math.max(0, visible.indexOf(element));
            // 只对同时进入视口的图片轻微错峰，不累计整篇文章的等待时间。
            element.style.setProperty('--image-enter-delay', `${Math.min(index, 3) * 20}ms`);
            setState(previous => previous.source === source ? { ...previous, entered: true } : previous);
        }, '0px');
    }, [source, pageVisible]);

    useEffect(() => {
        if (!state.decoded || !state.entered || state.done || state.error) return;
        const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        const skip = () => {
            if (motion?.matches) setState(previous => previous.source === source ? { ...previous, done: true } : previous);
        };
        skip();
        motion?.addEventListener?.('change', skip);
        return () => motion?.removeEventListener?.('change', skip);
    }, [source, state.decoded, state.entered, state.done, state.error]);

    const phase = state.source !== source ? 'pending' : state.error ? 'error' : state.done ? 'done' : state.decoded && state.entered ? 'entering' : 'pending';
    return <Image {...props} ref={setRef} className={[styles.image, className].filter(Boolean).join(' ')} data-image-state={phase}
        onLoad={event => { void decode(event.currentTarget); onLoad?.(event); }}
        onError={event => { setState(previous => ({ ...previous, error: true })); onError?.(event); }}
        onAnimationEnd={event => { setState(previous => ({ ...previous, done: true })); onAnimationEnd?.(event); }} />;
});

export default PostImage;
