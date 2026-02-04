"use client";

import React, { useEffect, useState } from "react";
import style from "./Blog.module.css";
import Background from "../Common/Background/Background";
import BlogCard from "./BlogCard";
import { useI18n } from "@/context/I18nContext";
import type { PostCategory, PostSeries } from "@/utils/content/local";

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

const Archive: React.FC = () => {
    const { t, locale } = useI18n();
    const [status, setStatus] = useState<ArchiveStatus>("Loading");
    const [posts, setPosts] = useState<ArchivePostItem[]>([]);

    useEffect(() => {
        const fetchAll = async () => {
            const queryLocale = locale === "zh-CN" ? "zh-CN" : "en";
            try {
                setStatus("Loading");
                const response = await fetch(`/api/blog/list?offset=0&limit=1000&locale=${encodeURIComponent(queryLocale)}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch posts: ${response.status}`);
                }
                const data = await response.json();
                setPosts(Array.isArray(data.items) ? data.items : []);
                setStatus("Done");
            } catch (error) {
                console.error("Archive fetch error:", error);
                setStatus("Error");
            }
        };

        fetchAll();
    }, [locale]);

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
                        <div className={style.blog_tip_loading}>{t("Status.Loading")}</div>
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

