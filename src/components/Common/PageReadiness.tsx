'use client';

import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/context/I18nContext';

type Readiness = { pending: Set<symbol>; listeners: Set<() => void>; register: () => () => void };
const ReadinessContext = createContext<Readiness | null>(null);
const PageVisibleContext = createContext(true);
export const usePageVisible = () => useContext(PageVisibleContext);

/** 只登记阻塞当前内容区域的任务，媒体和播放器不参与。 */
export function usePageReadyTask(pending: boolean) {
    const readiness = useContext(ReadinessContext);
    useLayoutEffect(() => {
        if (!pending || !readiness) return;
        return readiness.register();
    }, [pending, readiness]);
}

export default function PageReadiness({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { locale } = useI18n();
    const routeKey = `${pathname}:${locale}`;
    const [result, setResult] = useState<{ key: string; status: 'loading' | 'ready' | 'error'; target?: string }>({ key: routeKey, status: 'loading' });
    if (result.key !== routeKey) setResult({ key: routeKey, status: 'loading' });
    const readiness = useMemo<Readiness>(() => {
        const pending = new Set<symbol>();
        const listeners = new Set<() => void>();
        const emit = () => listeners.forEach(listener => listener());
        return { pending, listeners, register: () => {
            const token = Symbol();
            pending.add(token);
            emit();
            return () => { pending.delete(token); emit(); };
        } };
    }, [routeKey]);
    const ready = result.key === routeKey && result.status === 'ready';
    const failed = result.key === routeKey && result.status === 'error';
    const contentRef = useRef<HTMLElement | null>(null);
    // SSR 不输出 inert，保证禁用脚本时链接仍可使用。
    useLayoutEffect(() => { if (contentRef.current) contentRef.current.inert = !ready; }, [ready]);

    useEffect(() => {
        const start = (event: Event) => {
            const target = (event as CustomEvent<string>).detail;
            if (!target) return;
            setResult(previous => target === pathname
                ? previous.target ? { key: routeKey, status: 'loading' } : previous
                : { key: routeKey, status: 'loading', target });
        };
        window.addEventListener('app-navigation-start', start);
        return () => window.removeEventListener('app-navigation-start', start);
    }, [pathname, routeKey]);

    useEffect(() => {
        let cancelled = false;
        let frame = 0;
        let timeout: number | undefined;
        const waitingForRoute = Boolean(result.key === routeKey && result.target);
        const stop = () => { cancelAnimationFrame(frame); clearTimeout(timeout); };
        const check = () => {
            stop();
            if (cancelled) return;
            if (waitingForRoute || readiness.pending.size) {
                setResult(previous => previous.key === routeKey && previous.status !== 'error' ? { ...previous, status: 'loading' } : previous);
                timeout = window.setTimeout(() => {
                    cancelled = true;
                    setResult(previous => previous.key === routeKey ? { ...previous, status: 'error' } : previous);
                }, 15000);
                return;
            }
            // 任务完成后给 React 和浏览器提交布局的机会，不循环轮询、不设最低等待。
            frame = requestAnimationFrame(() => {
                frame = requestAnimationFrame(() => {
                    if (!cancelled && readiness.pending.size === 0) setResult({ key: routeKey, status: 'ready' });
                });
            });
        };
        readiness.listeners.add(check);
        check();
        return () => { cancelled = true; stop(); readiness.listeners.delete(check); };
    }, [routeKey, readiness, result.target]);

    return <ReadinessContext.Provider value={readiness}>
        <PageVisibleContext.Provider value={ready}>
            <section className="page_stage" data-page-stage data-page-status={failed ? 'error' : ready ? 'ready' : 'loading'}>
                <section ref={contentRef} data-page-ready={ready} aria-busy={!ready} className="page_content">
                    {children}
                </section>
                <section className="page_transition" data-page-overlay role={failed ? 'alert' : 'status'} aria-live="polite" aria-hidden={ready}>
                    {failed ? <p>页面加载未完成。<button type="button" onClick={() => window.location.reload()}>重新加载</button></p>
                        : <><span className="page_transition_mark" aria-hidden="true" /><span className="visually_hidden">正在加载内容</span></>}
                </section>
            </section>
            <noscript><style>{'[data-page-ready] { opacity: 1 !important; visibility: visible !important; } [data-page-overlay] { display: none !important; } [data-stream-state], [data-image-state] { opacity: 1 !important; transform: none !important; animation: none !important; clip-path: none !important; }'}</style></noscript>
        </PageVisibleContext.Provider>
    </ReadinessContext.Provider>;
}
