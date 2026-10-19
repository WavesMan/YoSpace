'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

/** 使用 Next 的导航回调，排除新标签页、下载、外链和被业务取消的跳转。 */
export default function TransitionLink({ onNavigate, href, ...props }: ComponentProps<typeof Link>) {
    return <Link {...props} href={href} onNavigate={event => {
        let cancelled = false;
        onNavigate?.({ preventDefault: () => { cancelled = true; event.preventDefault(); } });
        if (cancelled) return;
        const value = typeof href === 'string' ? href : href.pathname;
        if (!value) return;
        const target = new URL(value, window.location.href);
        const anchorOnly = value.startsWith('#') || (Boolean(target.hash) && target.pathname === window.location.pathname && target.search === window.location.search);
        if (target.origin === window.location.origin && !anchorOnly) {
            window.dispatchEvent(new CustomEvent('app-navigation-start', { detail: target.pathname }));
        }
    }} />;
}
