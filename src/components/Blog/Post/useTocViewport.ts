'use client';

import { useLayoutEffect, type RefObject } from 'react';

/** 同时约束布局视口、缩放/键盘后的可视视口和固定页脚，避免最后一项目录被遮挡。 */
export function useTocViewport(ref: RefObject<HTMLElement | null>, active: boolean) {
    useLayoutEffect(() => {
        const element = ref.current;
        if (!active || !element) return;
        const baseTop = Number.parseFloat(getComputedStyle(element).top) || 96;
        const viewport = window.visualViewport;
        let frame = 0;
        let footer: HTMLElement | null = null;
        const resize = new ResizeObserver(() => schedule());
        const update = () => {
            frame = 0;
            const currentFooter = document.querySelector<HTMLElement>('[data-site-footer]');
            if (currentFooter !== footer) {
                if (footer) resize.unobserve(footer);
                footer = currentFooter;
                if (footer) resize.observe(footer);
            }
            const visibleTop = viewport?.offsetTop || 0;
            const visibleHeight = Math.min(window.innerHeight, viewport?.height || window.innerHeight);
            const top = visibleTop + Math.min(baseTop, visibleHeight / 4);
            let bottom = visibleTop + visibleHeight;
            if (footer && getComputedStyle(footer).position === 'fixed') {
                const box = footer.getBoundingClientRect();
                if (box.height > 0 && box.top < bottom && box.bottom > visibleTop) bottom = Math.min(bottom, box.top);
            }
            const safeBottom = Number.parseFloat(getComputedStyle(element).getPropertyValue('--toc-safe-bottom')) || 0;
            const available = Math.max(0, bottom - top - Math.max(16, safeBottom));
            element.style.setProperty('--toc-measured-top', `${top}px`);
            element.style.setProperty('--toc-available-height', `${available}px`);
            const toggle = element.querySelector<HTMLElement>('[data-toc-toggle]');
            if (toggle) {
                const gap = Number.parseFloat(getComputedStyle(element).rowGap) || 0;
                const panelHeight = Math.max(0, available - toggle.getBoundingClientRect().height - gap);
                element.style.setProperty('--toc-panel-height', `${panelHeight}px`);
            }
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        update();
        const mutation = new MutationObserver(schedule);
        // 页脚由延迟加载的 ClientShell 挂载，需要在它出现时重算。
        mutation.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('resize', schedule);
        window.addEventListener('scroll', schedule, { passive: true });
        viewport?.addEventListener('resize', schedule);
        viewport?.addEventListener('scroll', schedule);
        return () => {
            cancelAnimationFrame(frame);
            resize.disconnect();
            mutation.disconnect();
            window.removeEventListener('resize', schedule);
            window.removeEventListener('scroll', schedule);
            viewport?.removeEventListener('resize', schedule);
            viewport?.removeEventListener('scroll', schedule);
            for (const key of ['--toc-measured-top', '--toc-available-height', '--toc-panel-height']) element.style.removeProperty(key);
        };
    }, [ref, active]);
}
