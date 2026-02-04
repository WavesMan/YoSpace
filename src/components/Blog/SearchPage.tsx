"use client";

import React, { useEffect, useMemo, useState } from "react";
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

const normalize = (value: string) => value.toLowerCase();

const SearchPage: React.FC = () => {
    const { t, locale } = useI18n();
    const [status, setStatus] = useState<SearchStatus>("Idle");
    const [posts, setPosts] = useState<SearchPostItem[]>([]);
    const [query, setQuery] = useState("");

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
                setStatus("Ready");
            } catch (error) {
                console.error("Search index fetch error:", error);
                setStatus("Error");
            }
        };

        fetchAll();
    }, [locale]);

    const results = useMemo(() => {
        const trimmed = query.trim();
        if (!trimmed) {
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
    }, [posts, query]);

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

