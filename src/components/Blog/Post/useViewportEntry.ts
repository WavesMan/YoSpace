import { useEffect, useRef, useState } from 'react';

type Subscription = { callback: () => void };
const pools = new Map<string, { observer: IntersectionObserver; subscriptions: Map<Element, Subscription> }>();

/** 同一预加载距离共用观察器；进入一次后保持挂载，向上阅读不重新加载。 */
export function observeViewportEntry(element: Element, callback: () => void, rootMargin = '600px 0px') {
    if (typeof IntersectionObserver === 'undefined') {
        callback();
        return () => {};
    }
    let pool = pools.get(rootMargin);
    if (!pool) {
        const subscriptions = new Map<Element, Subscription>();
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                const subscription = subscriptions.get(entry.target);
                if (!subscription) continue;
                subscriptions.delete(entry.target);
                observer.unobserve(entry.target);
                subscription.callback();
            }
        }, { rootMargin });
        pool = { observer, subscriptions };
        pools.set(rootMargin, pool);
    }
    pool.subscriptions.set(element, { callback });
    pool.observer.observe(element);
    return () => {
        pool.subscriptions.delete(element);
        pool.observer.unobserve(element);
        if (!pool.subscriptions.size) {
            pool.observer.disconnect();
            if (pools.get(rootMargin) === pool) pools.delete(rootMargin);
        }
    };
}

export function useViewportEntry<T extends HTMLElement>(rootMargin = '600px 0px', enabled = true) {
    const ref = useRef<T | null>(null);
    const [entered, setEntered] = useState(false);
    useEffect(() => {
        if (!enabled || entered || !ref.current) return;
        return observeViewportEntry(ref.current, () => setEntered(true), rootMargin);
    }, [entered, rootMargin, enabled]);
    return { ref, entered };
}
