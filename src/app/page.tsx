"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Profile from "@/components/Profile/Profile";
import BlogCard from "@/components/Blog/BlogCard";
import profileStyles from "@/components/Profile/Profile.module.css";
import { useI18n } from "@/context/I18nContext";
import type { PostCategory, PostSeries } from "@/utils/content/local";
import styles from "./Home.module.css";
import HomeTabs from "@/components/Home/HomeTabs";

interface SearchPostItem {
    title: string;
    description: string;
    slug: string;
    publishedTime: string;
    isPinned?: boolean;
    isRecommended?: boolean;
    recommendRank?: number;
    pinnedRank?: number;
    category?: PostCategory;
    tags?: string[];
    series?: PostSeries;
}

type SearchStatus = "Idle" | "Loading" | "Error" | "Ready";
type HomePageId = "profile" | "search";

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
    const [status, setStatus] = useState<SearchStatus>("Idle");
    const [posts, setPosts] = useState<SearchPostItem[]>([]);
    const [query, setQuery] = useState("");
    const [engineId, setEngineId] = useState<SearchEngineId>("bing");
    const [isTabsExpanded, setIsTabsExpanded] = useState(true);
    const transitionLockRef = useRef(false);
    const transitionTimerRef = useRef<number | null>(null);
    const pageOrder = useMemo<HomePageId[]>(() => ["profile", "search"], []);

    const isSearchPage = activePageId === "search";
    const isSiteEngine = engineId === "site";

    useEffect(() => {
        if (!isSearchPage || !isSiteEngine) return;
        const queryLocale = locale === "zh-CN" ? "zh-CN" : "en";
        let isActive = true;
        const fetchAll = async () => {
            try {
                setStatus("Loading");
                const response = await fetch(`/api/blog/list?offset=0&limit=1000&locale=${encodeURIComponent(queryLocale)}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch posts: ${response.status}`);
                }
                const data = await response.json();
                if (!isActive) return;
                setPosts(Array.isArray(data.items) ? data.items : []);
                setStatus("Ready");
            } catch (error) {
                if (!isActive) return;
                console.error("Search index fetch error:", error);
                setStatus("Error");
            }
        };
        fetchAll();
        return () => {
            isActive = false;
        };
    }, [isSearchPage, isSiteEngine, locale]);

    const results = useMemo(() => {
        const trimmed = query.trim();
        if (!trimmed || !isSiteEngine) {
            return [] as SearchPostItem[];
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
    }, [posts, query, isSiteEngine]);

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
        }, 600);
    }, [activePageId]);

    useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
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

        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
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
        return () => {
            window.removeEventListener("wheel", handleWheel);
            window.removeEventListener("keydown", handleKeyDown);
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
                        <div className={`${styles.home_page} ${styles.home_page_animate}`} key="search">
                            <div className={styles.home_search_section}>
                                <h1 className={`${styles.home_title} ${styles.home_search_title_animated}`}>{t("Search.Title")}</h1>
                                <form className={`${styles.home_search_bar} ${styles.home_search_bar_animated}`} aria-label={t("Search.InputLabel")} onSubmit={handleSearchSubmit}>
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
                                                    {"labelKey" in engine ? t(engine.labelKey) : engine.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <input
                                        className={styles.home_search_input}
                                        type="search"
                                        value={query}
                                        onChange={event => setQuery(event.target.value)}
                                        placeholder={t("Search.Placeholder")}
                                    />
                                </form>
                                {isSiteEngine && status === "Loading" && (
                                    <div className={`${styles.home_tip_loading} ${styles.home_search_status_animated}`}>{t("Status.Loading")}</div>
                                )}
                                {isSiteEngine && status === "Error" && (
                                    <div className={`${styles.home_tip_error} ${styles.home_search_status_animated}`}>{t("Status.Error")}</div>
                                )}
                                {isSiteEngine && status === "Ready" && query.trim().length > 0 && results.length === 0 && (
                                    <div className={`${styles.home_tip_empty} ${styles.home_search_status_animated}`}>{t("Search.NoResult")}</div>
                                )}
                                {isSiteEngine && status === "Ready" && results.length > 0 && (
                                    <div className={`${styles.home_results} ${styles.home_results_animated}`}>
                                        {results.map((post, index) => (
                                            <BlogCard
                                                key={post.slug}
                                                articleId={post.slug}
                                                articleTitle={post.title}
                                                articleDescription={post.description}
                                                articleDate={post.publishedTime}
                                                category={post.category}
                                                tags={post.tags}
                                                currentLocale={locale}
                                                cardStyle={{ animationDelay: `${index * 0.05}s` }}
                                            />
                                        ))}
                                    </div>
                                )}
                                <div className={`${styles.home_search_nav_placeholder} ${styles.home_search_nav_animated}`} />
                            </div>
                            <p className={profileStyles.profile_background}>{`<SEARCH/>`}</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
