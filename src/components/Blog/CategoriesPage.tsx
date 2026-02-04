"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import style from "./Blog.module.css";
import Background from "../Common/Background/Background";
import { useI18n } from "@/context/I18nContext";
import type { PostCategory, PostSeries } from "@/utils/content/local";

interface CategoryPostItem {
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

interface CategoryInfo {
    id: string;
    label: string;
    count: number;
}

type CategoriesStatus = "Loading" | "Error" | "Done";

const tagVariantCount = 5;

const getVariantIndex = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash += value.charCodeAt(i);
    }
    return Math.abs(hash) % tagVariantCount;
};

const getCategoryClassName = (value: string, baseClass: string) => {
    const index = getVariantIndex(value);
    const variantClass = style[`blog_taxonomy_link_variant_${index}`] || "";
    return `${baseClass} ${variantClass}`.trim();
};

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

const CategoriesPage: React.FC = () => {
    const { t, locale } = useI18n();
    const [status, setStatus] = useState<CategoriesStatus>("Loading");
    const [posts, setPosts] = useState<CategoryPostItem[]>([]);

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
                console.error("Categories fetch error:", error);
                setStatus("Error");
            }
        };

        fetchAll();
    }, [locale]);

    const categories: CategoryInfo[] = useMemo(() => {
        const counter = new Map<string, { label: string; count: number }>();
        posts.forEach(post => {
            if (!post.category) return;
            const id = post.category.id;
            if (!id) return;
            const existing = counter.get(id);
            const label = resolveCategoryLabel(post.category, locale);
            if (!existing) {
                counter.set(id, { label, count: 1 });
            } else {
                counter.set(id, { label: existing.label || label, count: existing.count + 1 });
            }
        });
        const list: CategoryInfo[] = Array.from(counter.entries()).map(([id, value]) => ({
            id,
            label: value.label || id,
            count: value.count,
        }));
        list.sort((a, b) => {
            if (b.count !== a.count) {
                return b.count - a.count;
            }
            return a.label.localeCompare(b.label);
        });
        return list;
    }, [posts, locale]);

    return (
        <>
            <div className={style.blog_wrapper}>
                <div className={style.blog_container}>
                    <h1 className={style.blog_title}>{t("Categories.Title")}</h1>
                    {status === "Loading" && (
                        <div className={style.blog_tip_loading}>{t("Status.Loading")}</div>
                    )}
                    {status === "Error" && (
                        <>
                            <div className={style.blog_tip_error}>{t("Status.Error")}</div>
                        </>
                    )}
                    {status === "Done" && categories.length === 0 && (
                        <div className={style.blog_tip_error_details}>No Categories Yet</div>
                    )}
                    {status === "Done" && categories.length > 0 && (
                        <ul className={style.blog_taxonomy_list} aria-label={t("Categories.Title")}>
                            {categories.map(category => (
                                <li key={category.id} className={style.blog_taxonomy_item}>
                                    <Link
                                        href={`/category/${encodeURIComponent(category.id)}`}
                                        className={getCategoryClassName(category.label, style.blog_taxonomy_link)}
                                    >
                                        <span className={style.blog_taxonomy_name}>{category.label}</span>
                                        <span className={style.blog_taxonomy_count}>{category.count}{t("Categories.PostsSuffix")}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <Background text={t("Categories.Title")} />
        </>
    );
};

export default CategoriesPage;
