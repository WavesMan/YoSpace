import { useEffect, useRef, useState } from "react";
import type { PostCategory } from "@/utils/content/local";

export interface SearchPostItem {
    title: string;
    description: string;
    slug: string;
    publishedTime: string;
    category?: PostCategory;
    tags?: string[];
}

type IndexState = {
    locale: string;
    status: "Loading" | "Error" | "Ready";
    posts: SearchPostItem[];
};

// 进入导航页即准备索引；切换引擎不取消或重启请求。
export function useHomeSearchIndex(enabled: boolean, locale: string) {
    const cache = useRef(new Map<string, SearchPostItem[]>());
    const [attempt, setAttempt] = useState(0);
    const [state, setState] = useState<IndexState>({ locale, status: "Loading", posts: [] });
    useEffect(() => {
        if (!enabled) return;
        const cached = cache.current.get(locale);
        if (cached) {
            setState({ locale, status: "Ready", posts: cached });
            return;
        }
        const controller = new AbortController();
        setState({ locale, status: "Loading", posts: [] });
        async function load() {
            try {
                const response = await fetch(`/api/blog/list?offset=0&limit=1000&locale=${encodeURIComponent(locale)}`, { signal: controller.signal });
                if (!response.ok) throw new Error(`搜索索引请求失败：${response.status}`);
                const data = await response.json();
                if (controller.signal.aborted) return;
                if (!Array.isArray(data.items)) throw new Error("搜索索引格式错误");
                cache.current.set(locale, data.items);
                setState({ locale, status: "Ready", posts: data.items });
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error("搜索索引加载失败", error);
                setState({ locale, status: "Error", posts: [] });
            }
        }
        void load();
        return () => controller.abort();
    }, [enabled, locale, attempt]);
    // 语言切换当帧就隐藏旧语言，避免等待 effect 后才清理。
    const current = state.locale === locale ? state : { status: "Loading" as const, posts: [] };
    return { ...current, retry: () => setAttempt(value => value + 1) };
}
