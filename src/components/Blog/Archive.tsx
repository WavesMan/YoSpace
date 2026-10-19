"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import style from "./Blog.module.css";
import { usePageReadyTask } from '@/components/Common/PageReadiness';
import Background from "../Common/Background/Background";
import BlogCard from "./BlogCard";
import { useI18n } from "@/context/I18nContext";
import { readBrowserStorage, writeBrowserStorage } from '@/utils/browserStorage';
import type { PostCategory, PostSeries, PostItem } from "@/utils/content/local";

interface ArchivePostItem {
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

type ArchiveStatus = "Loading" | "Error" | "Done";

interface YearMonthGroup {
    year: number;
    months: {
        month: number;
        posts: ArchivePostItem[];
    }[];
}

const getTimeValue = (value: string) => {
    if (!value) {
        return 0;
    }
    const time = new Date(value).getTime();
    if (Number.isFinite(time)) {
        return time;
    }
    return 0;
};

const groupByYearMonth = (posts: ArchivePostItem[]): YearMonthGroup[] => {
    const yearMap = new Map<number, Map<number, ArchivePostItem[]>>();

    posts.forEach(post => {
        const date = new Date(post.publishedTime || 0);
        const timestamp = date.getTime();
        if (!Number.isFinite(timestamp)) {
            return;
        }
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        if (!yearMap.has(year)) {
            yearMap.set(year, new Map());
        }
        const monthMap = yearMap.get(year)!;
        if (!monthMap.has(month)) {
            monthMap.set(month, []);
        }
        monthMap.get(month)!.push(post);
    });

    const yearList = Array.from(yearMap.keys());
    yearList.sort((a, b) => b - a);

    return yearList.map(year => {
        const monthMap = yearMap.get(year)!;
        const monthList = Array.from(monthMap.keys());
        monthList.sort((a, b) => b - a);

        const months = monthList.map(month => {
            const items = monthMap.get(month) || [];
            const sorted = items
                .slice()
                .sort((a, b) => getTimeValue(b.publishedTime) - getTimeValue(a.publishedTime));
            return {
                month,
                posts: sorted,
            };
        });

        return {
            year,
            months,
        };
    });
};

const Archive: React.FC<{ initialPosts?: PostItem[]; initialLocale?: string }> = ({ initialPosts, initialLocale }) => {
    const { t, locale } = useI18n();
    const pathname = usePathname();
    const [status, setStatus] = useState<ArchiveStatus>(initialPosts ? "Done" : "Loading");
    usePageReadyTask(status === 'Loading');
    const [posts, setPosts] = useState<ArchivePostItem[]>(initialPosts || []);
    const restoredScrollRef = useRef(false);
    const restoreScrollYRef = useRef<number | null>(null);

    const storageKey = useMemo(() => {
        if (!pathname) return "archive:list:unknown";
        return `archive:list:${pathname}:${locale}`;
    }, [pathname, locale]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const raw = readBrowserStorage('sessionStorage', storageKey);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw) as { scrollY?: number };
            const nextScrollY = Number(parsed.scrollY);
            restoreScrollYRef.current = Number.isFinite(nextScrollY) && nextScrollY >= 0 ? nextScrollY : 0;
        } catch {
        }
    }, [storageKey]);

    useEffect(() => {
        if (initialPosts && initialLocale === locale) {
            setPosts(initialPosts);
            setStatus("Done");
            return;
        }
        const controller = new AbortController();
        const fetchAll = async () => {
            const queryLocale = locale === "zh-CN" ? "zh-CN" : "en";
            try {
                setStatus("Loading");
                const response = await fetch(`/api/blog/list?offset=0&limit=1000&locale=${encodeURIComponent(queryLocale)}`, { signal: controller.signal });
                if (!response.ok) {
                    throw new Error(`Failed to fetch posts: ${response.status}`);
                }
                const data = await response.json();
                if (controller.signal.aborted) return;
                setPosts(Array.isArray(data.items) ? data.items : []);
                setStatus("Done");
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error("Archive fetch error:", error);
                setStatus("Error");
            }
        };

        fetchAll();
        return () => controller.abort();
    }, [locale, initialLocale, initialPosts]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        let ticking = false;
        const handleScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                ticking = false;
                const payload = { scrollY: window.scrollY };
                writeBrowserStorage('sessionStorage', storageKey, JSON.stringify(payload));
            });
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [storageKey]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (status !== "Done") return;
        if (restoredScrollRef.current) return;
        if (restoreScrollYRef.current === null) return;
        restoredScrollRef.current = true;
        window.scrollTo({ top: restoreScrollYRef.current, behavior: "auto" });
    }, [status]);

    const grouped = groupByYearMonth(posts);

    const renderPostCard = (post: ArchivePostItem, index: number) => (
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
    );

    return (
        <>
            <div className={style.blog_wrapper}>
                <div className={style.blog_container}>
                    <h1 className={style.blog_title}>{t("Archive.Title")}</h1>
                    {status === "Loading" && (
                        null
                    )}
                    {status === "Error" && (
                        <>
                            <div className={style.blog_tip_error}>{t("Status.Error")}</div>
                        </>
                    )}
                    {status === "Done" && grouped.length === 0 && (
                        <div className={style.blog_tip_error_details}>No Posts Yet</div>
                    )}
                    {status === "Done" && grouped.length > 0 && (
                        <div className={style.blog_archive_timeline}>
                            {grouped.map(group => (
                                <section key={group.year} className={style.blog_archive_year_section}>
                                    <div className={style.blog_archive_year_header}>
                                        <div className={style.blog_archive_year_dot} />
                                        <h2 className={style.blog_archive_year_title}>{group.year}</h2>
                                    </div>
                                    <div className={style.blog_archive_year_body}>
                                        {group.months.map(month => {
                                            const monthKey = `${group.year}-${month.month}`;
                                            const monthLabel = month.month.toString().padStart(2, "0");
                                            return (
                                                <div key={monthKey} className={style.blog_archive_month_block}>
                                                    <div className={style.blog_archive_month_header}>
                                                        <div className={style.blog_archive_month_dot} />
                                                        <div className={style.blog_archive_month_label}>{monthLabel}</div>
                                                    </div>
                                                    <div className={style.blog_card_wrapper}>
                                                        {month.posts.map((post, index) => renderPostCard(post, index))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Background text="ARCHIVE" />
        </>
    );
};

export default Archive;
