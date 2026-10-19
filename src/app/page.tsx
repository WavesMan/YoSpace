"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from '@/components/Common/TransitionLink';
import Profile from "@/components/Profile/Profile";
import BlogCard from "@/components/Blog/BlogCard";
import profileStyles from "@/components/Profile/Profile.module.css";
import { useI18n } from "@/context/I18nContext";
import { useHomeSearchIndex } from "@/components/Home/useHomeSearchIndex";
import styles from "./Home.module.css";
import HomeTabs from "@/components/Home/HomeTabs";
import navigationData from "@/data/navigation.json";

type HomePageId = "profile" | "search";

type NavigationLocaleText = {
    zh: string;
    en: string;
};

type NavigationFavicon = {
    type: "auto" | "url" | "local";
    value?: string;
};

type NavigationItem = {
    id: string;
    name: NavigationLocaleText;
    desc: NavigationLocaleText;
    url: string;
    favicon?: NavigationFavicon;
};

const normalize = (value: string) => value.toLowerCase();

const homePages = [
    {
        id: "profile",
        labelKey: "Home.Pages.Profile",
    },
    {
        id: "search",
        labelKey: "Home.Pages.Search",
    },
] as const;

const searchEngines = [
    {
        id: "site",
        labelKey: "Search.Engine.Site",
        type: "site",
    },
    {
        id: "bing",
        label: "Bing",
        type: "external",
        template: "https://www.bing.com/search?q={query}",
    },
    {
        id: "google",
        label: "Google",
        type: "external",
        template: "https://www.google.com/search?q={query}",
    },
    {
        id: "baidu",
        label: "Baidu",
        type: "external",
        template: "https://www.baidu.com/s?wd={query}",
    },
    {
        id: "duckduckgo",
        label: "DuckDuckGo",
        type: "external",
        template: "https://duckduckgo.com/?q={query}",
    },
] as const;

type SearchEngineId = (typeof searchEngines)[number]["id"];

export default function Home() {
    const { t, locale } = useI18n();
    const [activePageId, setActivePageId] = useState<HomePageId>("profile");
    const [query, setQuery] = useState("");
    const [engineId, setEngineId] = useState<SearchEngineId>("bing");
    const [isTabsExpanded, setIsTabsExpanded] = useState(true);
    const transitionLockRef = useRef(false);
    const transitionTimerRef = useRef<number | null>(null);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const touchLastRef = useRef<{ x: number; y: number } | null>(null);
    const touchIgnoreRef = useRef(false);
    const pageOrder = useMemo<HomePageId[]>(() => ["profile", "search"], []);

    const isSearchPage = activePageId === "search";
    const isSiteEngine = engineId === "site";
    const { status, posts, retry } = useHomeSearchIndex(isSearchPage, locale === "zh-CN" ? "zh-CN" : "en");
    const reduceMotion = useReducedMotion();
    const transition = { duration: reduceMotion ? 0 : 0.18 };
    const [committedQuery, setCommittedQuery] = useState("");
    const composing = useRef(false);
    const navigationItems = navigationData as NavigationItem[];

    const results = useMemo(() => {
        const trimmed = committedQuery.trim();
        if (!trimmed || !isSiteEngine) {
            return [];
        }
        const keyword = normalize(trimmed);
        return posts.filter(item => {
            const title = normalize(item.title || "");
            const description = normalize(item.description || "");
            const tagsText = Array.isArray(item.tags) ? normalize(item.tags.join(" ")) : "";
            if (title.includes(keyword)) return true;
            if (description.includes(keyword)) return true;
            if (tagsText.includes(keyword)) return true;
            return false;
        });
    }, [posts, committedQuery, isSiteEngine]);

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;
        const engine = searchEngines.find(item => item.id === engineId);
        if (!engine || engine.type !== "external") return;
        const url = engine.template.replace("{query}", encodeURIComponent(trimmed));
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const homeTabItems = useMemo(() => {
        return homePages.map(page => ({
            id: page.id,
            label: t(page.labelKey),
        }));
    }, [t]);

    const resolveNavigationText = useCallback((value: NavigationLocaleText) => {
        return locale === "zh-CN" ? value.zh : value.en;
    }, [locale]);

    const resolveNavigationFavicon = useCallback((item: NavigationItem) => {
        const fallback = "/favicon.ico";
        if (item.favicon?.type === "local") {
            return item.favicon.value || fallback;
        }
        if (item.favicon?.type === "url") {
            return item.favicon.value || fallback;
        }
        try {
            const hostname = new URL(item.url).hostname.replace(/^www\./, "");
            const parts = hostname.split(".").filter(Boolean);
            const domain = parts.length <= 2
                ? hostname
                : `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
            return `https://favicon.pub/${domain}`;
        } catch {
            return fallback;
        }
    }, []);

    const triggerPageChange = useCallback((nextId: HomePageId) => {
        if (nextId === activePageId) return;
        if (transitionLockRef.current) return;
        transitionLockRef.current = true;
        setActivePageId(nextId);
        if (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches) {
            setIsTabsExpanded(false);
        }
        if (transitionTimerRef.current) {
            window.clearTimeout(transitionTimerRef.current);
        }
        transitionTimerRef.current = window.setTimeout(() => {
            transitionLockRef.current = false;
        }, 200);
    }, [activePageId]);

    useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest(`.${styles.home_search_body}`)) {
                return;
            }
            if (target?.closest('[data-player-root="true"]')) {
                return;
            }
            if (transitionLockRef.current) return;
            const delta = event.deltaY;
            if (Math.abs(delta) < 8) return;
            event.preventDefault();
            const currentIndex = pageOrder.indexOf(activePageId);
            if (delta > 0) {
                const nextIndex = Math.min(pageOrder.length - 1, currentIndex + 1);
                triggerPageChange(pageOrder[nextIndex]);
            } else {
                const prevIndex = Math.max(0, currentIndex - 1);
                triggerPageChange(pageOrder[prevIndex]);
            }
        };

        const handleTouchStart = (event: TouchEvent) => {
            const target = event.target as HTMLElement | null;
            touchIgnoreRef.current = Boolean(
                target?.closest(`.${styles.home_search_body}`)
                || target?.closest('[data-player-root="true"]')
                || (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable))
            );
            const touch = event.touches[0];
            touchStartRef.current = { x: touch.clientX, y: touch.clientY };
            touchLastRef.current = { x: touch.clientX, y: touch.clientY };
        };

        const handleTouchMove = (event: TouchEvent) => {
            if (touchIgnoreRef.current || !touchStartRef.current) return;
            const touch = event.touches[0];
            touchLastRef.current = { x: touch.clientX, y: touch.clientY };
            const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
            const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
            if (deltaY > deltaX) {
                event.preventDefault();
            }
        };

        const handleTouchEnd = () => {
            if (touchIgnoreRef.current) {
                touchStartRef.current = null;
                touchLastRef.current = null;
                touchIgnoreRef.current = false;
                return;
            }
            if (!touchStartRef.current || !touchLastRef.current) return;
            if (transitionLockRef.current) return;
            const deltaX = touchLastRef.current.x - touchStartRef.current.x;
            const deltaY = touchLastRef.current.y - touchStartRef.current.y;
            touchStartRef.current = null;
            touchLastRef.current = null;
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            if (absY < 40 || absY <= absX) return;
            const currentIndex = pageOrder.indexOf(activePageId);
            if (deltaY < 0) {
                const nextIndex = Math.min(pageOrder.length - 1, currentIndex + 1);
                triggerPageChange(pageOrder[nextIndex]);
            } else {
                const prevIndex = Math.max(0, currentIndex - 1);
                triggerPageChange(pageOrder[prevIndex]);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest(`.${styles.home_search_body}`)) return;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
                return;
            }
            if (transitionLockRef.current) return;
            const currentIndex = pageOrder.indexOf(activePageId);
            if (event.key === "ArrowDown" || event.key === "PageDown") {
                event.preventDefault();
                const nextIndex = Math.min(pageOrder.length - 1, currentIndex + 1);
                triggerPageChange(pageOrder[nextIndex]);
            }
            if (event.key === "ArrowUp" || event.key === "PageUp") {
                event.preventDefault();
                const prevIndex = Math.max(0, currentIndex - 1);
                triggerPageChange(pageOrder[prevIndex]);
            }
        };

        window.addEventListener("wheel", handleWheel, { passive: false });
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleTouchEnd);
        return () => {
            window.removeEventListener("wheel", handleWheel);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
        };
    }, [activePageId, pageOrder, triggerPageChange]);

    return (
        <>
            <div className={styles.home_wrapper}>
                <div className={styles.home_container}>
                    <HomeTabs
                        items={homeTabItems}
                        activeId={activePageId}
                        ariaLabel={t("Home.Pages.Label")}
                        onChange={value => triggerPageChange(value as HomePageId)}
                        isExpanded={isTabsExpanded}
                        onToggle={() => setIsTabsExpanded(prev => !prev)}
                    />

                    {activePageId === "profile" && (
                        <div className={`${styles.home_page} ${styles.home_page_profile} ${styles.home_page_animate}`} key="profile">
                            <Profile />
                            <div className={styles.home_page_hint}>
                                <span className={styles.home_page_hint_arrow}>{">>"}</span>
                            </div>
                        </div>
                    )}

                    {activePageId === "search" && (
                        <div className={`${styles.home_page} ${styles.home_page_search} ${styles.home_page_animate}`} key="search">
                            <div className={styles.home_search_section}>
                                <h1 className={`${styles.home_title} ${styles.home_search_title_animated}`}>{t("Search.Title")}</h1>
                                <form className={`${styles.home_search_bar} ${styles.home_search_bar_animated}`} aria-label={t("Search.InputLabel")} onSubmit={handleSearchSubmit}>
                                    <LayoutGroup id="home-search-engines">
                                    <div className={styles.home_search_engine_group} role="radiogroup" aria-label={t("Search.Engine.Label")}>
                                        {searchEngines.map(engine => {
                                            const isActive = engineId === engine.id;
                                            return (
                                                <button
                                                    key={engine.id}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={isActive}
                                                    className={isActive ? styles.home_search_engine_button_active : styles.home_search_engine_button}
                                                    onClick={() => setEngineId(engine.id)}
                                                >
                                                    {isActive && <motion.span aria-hidden="true" className={styles.home_search_engine_indicator} layoutId="selected-engine" transition={transition} />}
                                                    <span className={styles.home_search_engine_label}>{"labelKey" in engine ? t(engine.labelKey) : engine.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    </LayoutGroup>
                                    <input
                                        className={styles.home_search_input}
                                        type="search"
                                        value={query}
                                        onChange={event => {
                                            setQuery(event.target.value);
                                            if (!composing.current) setCommittedQuery(event.target.value);
                                        }}
                                        onCompositionStart={() => { composing.current = true; }}
                                        onCompositionEnd={event => {
                                            composing.current = false;
                                            setCommittedQuery(event.currentTarget.value);
                                        }}
                                        placeholder={t("Search.Placeholder")}
                                    />
                                </form>
                                <div className={styles.home_search_body}>
                                <AnimatePresence initial={false} mode="wait">
                                {isSiteEngine ? (
                                    <motion.section key="site" className={styles.home_site_panel} aria-label={t("Search.Engine.Site")}
                                        initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }} animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }} transition={transition}>
                                    <div className={styles.home_search_summary} role="status" aria-live="polite" aria-atomic="true">
                                        <AnimatePresence initial={false} mode="wait">
                                            <motion.p key={`${status}:${committedQuery.trim() ? results.length : "empty"}`}
                                                initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }} animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.1 }}>
                                                {status === "Loading" ? t("Status.Loading") : status === "Error" ? t("Status.Error") :
                                                    !committedQuery.trim() ? t("Search.Hint") : results.length === 0 ? t("Search.NoResult") :
                                                        t("Search.ResultCount").replace("{count}", String(results.length))}
                                            </motion.p>
                                        </AnimatePresence>
                                        {status === "Error" && <button type="button" onClick={retry}>{t("Search.Retry")}</button>}
                                    </div>
                                    <motion.div className={styles.home_results} layoutScroll aria-busy={status === "Loading"}>
                                        <AnimatePresence initial={false} mode="popLayout">
                                        {status === "Ready" && results.map(post => (
                                            <motion.div key={post.slug} layout={reduceMotion ? false : "position"} data-search-result={post.slug}
                                                initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }} transition={transition}>
                                            <BlogCard
                                                articleId={post.slug}
                                                articleTitle={post.title}
                                                articleDescription={post.description}
                                                articleDate={post.publishedTime}
                                                category={post.category}
                                                tags={post.tags}
                                                currentLocale={locale}
                                            />
                                            </motion.div>
                                        ))}
                                        </AnimatePresence>
                                    </motion.div>
                                    </motion.section>
                                ) : (
                                    <motion.div key="external" className={`${styles.home_navigation_panel} ${styles.home_search_nav_animated}`}
                                        initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }} animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }} transition={transition}>
                                        <div className={styles.home_navigation_list}>
                                            {navigationItems.map(item => {
                                                const name = resolveNavigationText(item.name);
                                                const desc = resolveNavigationText(item.desc);
                                                const faviconUrl = resolveNavigationFavicon(item);
                                                const isLocalFavicon = faviconUrl.startsWith("/");
                                                const isInternal = item.url.startsWith("/");
                                                return (
                                                    isInternal ? (
                                                        <Link
                                                            key={item.id}
                                                            className={styles.home_navigation_card}
                                                            href={item.url}
                                                        >
                                                            <div className={styles.home_navigation_favicon}>
                                                                <Image
                                                                    src={faviconUrl}
                                                                    alt={name}
                                                                    width={32}
                                                                    height={32}
                                                                    unoptimized={!isLocalFavicon}
                                                                />
                                                            </div>
                                                            <div className={styles.home_navigation_content}>
                                                                <div className={styles.home_navigation_name}>{name}</div>
                                                                <div className={styles.home_navigation_desc}>{desc}</div>
                                                            </div>
                                                        </Link>
                                                    ) : (
                                                        <a
                                                            key={item.id}
                                                            className={styles.home_navigation_card}
                                                            href={item.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <div className={styles.home_navigation_favicon}>
                                                                <Image
                                                                    src={faviconUrl}
                                                                    alt={name}
                                                                    width={32}
                                                                    height={32}
                                                                    unoptimized={!isLocalFavicon}
                                                                />
                                                            </div>
                                                            <div className={styles.home_navigation_content}>
                                                                <div className={styles.home_navigation_name}>{name}</div>
                                                                <div className={styles.home_navigation_desc}>{desc}</div>
                                                            </div>
                                                        </a>
                                                    )
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                                </AnimatePresence>
                                </div>
                            </div>
                            <p className={profileStyles.profile_background}>{`<NAVIGATION/>`}</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
