'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/context/I18nContext';

type Readiness = { pending: Set<symbol>; register: () => () => void };
const ReadinessContext = createContext<Readiness | null>(null);
const PageVisibleContext = createContext(true);
export const usePageVisible = () => useContext(PageVisibleContext);

/** 组件挂载时登记，完成渲染（或已渲染错误回退）后释放。 */
export function usePageReadyTask(pending: boolean) {
    const readiness = useContext(ReadinessContext);
    useEffect(() => {
        if (!pending || !readiness) return;
        return readiness.register();
    }, [pending, readiness]);
}

export default function PageReadiness({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { locale } = useI18n();
    const enabled = /^\/blog\/[^/]+\/?$/.test(pathname || '');
    const routeKey = `${pathname}:${locale}`;
    const [result, setResult] = useState({ key: routeKey, status: 'loading' });
    // 每次导航都重置，包含离开后返回同一文章的情况；在提交 DOM 前完成重置。
    if (result.key !== routeKey) setResult({ key: routeKey, status: 'loading' });
    const readiness = useMemo<Readiness>(() => {
        const pending = new Set<symbol>();
        return { pending, register: () => {
            const token = Symbol();
            pending.add(token);
            return () => { pending.delete(token); };
        } };
    }, [routeKey]);
    const ready = !enabled || (result.key === routeKey && result.status === 'ready');
    const failed = !ready && result.key === routeKey && result.status === 'error';

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        let frame = 0;
        let stableFrames = 0;
        const timeout = window.setTimeout(() => {
            cancelled = true;
            cancelAnimationFrame(frame);
            // 超时显示可重试的错误界面，不把未完成的页面当成加载成功。
            setResult({ key: routeKey, status: 'error' });
        }, 15000);

        const check = () => {
            if (cancelled) return;
            if (readiness.pending.size) {
                stableFrames = 0;
            } else if (++stableFrames >= 2) {
                // 只等待正文数据与基础布局；图片、图表和高亮由阅读位置驱动。
                clearTimeout(timeout);
                setResult({ key: routeKey, status: 'ready' });
                return;
            }
            frame = requestAnimationFrame(check);
        };
        frame = requestAnimationFrame(check);
        return () => {
            cancelled = true;
            clearTimeout(timeout);
            cancelAnimationFrame(frame);
        };
    }, [enabled, routeKey, readiness]);

    return (
        <ReadinessContext.Provider value={enabled ? readiness : null}>
          <PageVisibleContext.Provider value={ready}>
            <div data-page-ready={ready} aria-busy={!ready}
                style={{ visibility: ready ? 'visible' : 'hidden' }}>
                {children}
            </div>
            {!ready && (
                <div className="page_readiness" role={failed ? 'alert' : 'status'} aria-live="polite">
                    <div className="app_transition_card">
                        {!failed && <div className="app_transition_spinner" />}
                        <div className="app_transition_content">
                            <div className="app_transition_title">{failed ? '页面加载未完成' : '正在准备页面'}</div>
                            <div className="app_transition_text">{failed ? '请检查网络连接后重新加载。' : '首屏就绪后开始阅读'}</div>
                            {failed && <button type="button" onClick={() => window.location.reload()}>重新加载</button>}
                        </div>
                    </div>
                </div>
            )}
            <noscript><style>{'[data-page-ready] { visibility: visible !important; } [data-stream-state] { clip-path: none !important; opacity: 1 !important; } .page_readiness { display: none; }'}</style></noscript>
          </PageVisibleContext.Provider>
        </ReadinessContext.Provider>
    );
}
