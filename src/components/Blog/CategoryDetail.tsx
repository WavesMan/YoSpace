"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import style from "./Blog.module.css";
import Background from "../Common/Background/Background";
import BlogCard from "./BlogCard";
import { useI18n } from "@/context/I18nContext";
import type { PostCategory, PostItem } from "@/utils/content/local";

type CategoryDetailStatus = "Loading" | "Error" | "Done";

interface CategoryDetailProps {
    slug: string;
    initialPosts?: PostItem[];
    initialLocale?: string;
}

const resolveCategoryLabel = (category: PostCategory | undefined, locale: string) => {
    if (!category) return "";
    const resolved = locale === "en-US" ? "en-US" : "zh-CN";
    if (resolved === "en-US") {
        if (category.labelEn) return category.labelEn;
    } else {
        if (category.labelZh) return category.labelZh;
    }
    return category.id;
};

const CategoryDetail: React.FC<CategoryDetailProps> = ({ slug, initialPosts, initialLocale }) => {
    const { t, locale } = useI18n();
    const [status, setStatus] = useState<CategoryDetailStatus>(initialPosts ? "Done" : "Loading");
    const [posts, setPosts] = useState<PostItem[]>(initialPosts || []);
    const isFirstRender = useRef(true);

    useEffect(() => {
        const queryLocale = locale === "zh-CN" ? "zh-CN" : "en";
        const fetchAll = async () => {
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
                console.error("Category detail fetch error:", error);
                setStatus("Error");
            }
        };

        if (isFirstRender.current) {
            isFirstRender.current = false;
            if (initialPosts && initialLocale && (initialLocale === queryLocale || (initialLocale === "en" && queryLocale === "en"))) {
                return;
            }
        }

        fetchAll();
    }, [initialLocale, initialPosts, locale]);

    const decodedId = useMemo(() => {
        try {
            return decodeURIComponent(slug);
        } catch {
            return slug;
        }
    }, [slug]);

    const filtered = useMemo(() => {
        return posts.filter(item => item.category && item.category.id === decodedId);
    }, [posts, decodedId]);

    const titleLabel = useMemo(() => {
        if (filtered.length === 0) {
            return decodedId;
        }
        const anyCategory = filtered[0].category;
        if (!anyCategory) {
            return decodedId;
        }
        return resolveCategoryLabel(anyCategory, locale);
    }, [filtered, locale, decodedId]);

    const renderPostCard = (post: PostItem, index: number) => (
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
                    <h1 className={style.blog_title}>{titleLabel}</h1>
                    {status === "Loading" && (
                        <div className={style.blog_tip_loading}>{t("Status.Loading")}</div>
                    )}
                    {status === "Error" && (
                        <>
                            <div className={style.blog_tip_error}>{t("Status.Error")}</div>
                        </>
                    )}
                    {status === "Done" && filtered.length === 0 && (
                        <div className={style.blog_tip_error_details}>{t("Search.NoResult")}</div>
                    )}
                    {status === "Done" && filtered.length > 0 && (
                        <div className={style.blog_card_wrapper}>
                            {filtered.map((post, index) => renderPostCard(post, index))}
                        </div>
                    )}
                </div>
            </div>
            <Background text={titleLabel} />
        </>
    );
};

export default CategoryDetail;
