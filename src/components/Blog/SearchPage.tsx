"use client";

import React, { useEffect, useState } from "react";
import style from "./Blog.module.css";
import Background from "../Common/Background/Background";
import BlogCard from "./BlogCard";
import { useI18n } from "@/context/I18nContext";
import type { PostCategory, PostSeries } from "@/utils/content/local";

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

/**
 * 归一化搜索关键字文本
 *
 * 统一转为小写字符串，避免因为大小写差异导致匹配失败，
 * 同时兼容 Future 中服务端搜索实现的大小写不敏感约定。
 *
 * @param value 原始输入内容
 * @returns 归一化后的文本
 */
const normalize = (value: string) => value.toLowerCase();

const SearchPage: React.FC = () => {
    const { t, locale } = useI18n();
    const [status, setStatus] = useState<SearchStatus>("Idle");
    const [results, setResults] = useState<SearchPostItem[]>([]);
    const [query, setQuery] = useState("");

    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed) {
            setResults([]);
            setStatus("Idle");
            return;
        }

        let isCancelled = false;
        const runSearch = async () => {
            const queryLocale = locale === "zh-CN" ? "zh-CN" : "en";
            const params = new URLSearchParams({
                query: trimmed,
                offset: "0",
                limit: "50",
                locale: queryLocale,
            });

            try {
                setStatus("Loading");
                const response = await fetch(`/api/blog/search?${params.toString()}`);
                if (!response.ok) {
                    throw new Error(`Failed to search posts: ${response.status}`);
                }
                const data = await response.json();
                if (isCancelled) {
                    return;
                }
                setResults(Array.isArray(data.items) ? data.items : []);
                setStatus("Ready");
            } catch (error) {
                if (isCancelled) {
                    return;
                }
                console.error("Search request error:", error);
                setStatus("Error");
            }
        };

        void runSearch();

        return () => {
            isCancelled = true;
        };
    }, [query, locale]);

    const renderPostCard = (post: SearchPostItem, index: number) => (
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

    const isReady = status === "Ready";

    return (
        <>
            <div className={style.blog_wrapper}>
                <div className={style.blog_container}>
                    <h1 className={style.blog_title}>{t("Search.Title")}</h1>
                    <div className={style.blog_search_bar} aria-label={t("Search.InputLabel")}>
                        <input
                            className={style.blog_search_input}
                            type="search"
                            value={query}
                            onChange={event => setQuery(event.target.value)}
                            placeholder={t("Search.Placeholder")}
                        />
                    </div>
                    {status === "Loading" && (
                        <div className={style.blog_tip_loading}>{t("Status.Loading")}</div>
                    )}
                    {status === "Error" && (
                        <>
                            <div className={style.blog_tip_error}>{t("Status.Error")}</div>
                        </>
                    )}
                    {isReady && query.trim().length > 0 && results.length === 0 && (
                        <div className={style.blog_tip_error_details}>{t("Search.NoResult")}</div>
                    )}
                    {isReady && results.length > 0 && (
                        <div className={style.blog_card_wrapper}>
                            {results.map((post, index) => renderPostCard(post, index))}
                        </div>
                    )}
                </div>
            </div>
            <Background text="BLOG" />
        </>
    );
};

export default SearchPage;

