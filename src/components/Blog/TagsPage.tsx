"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import style from "./Blog.module.css";
import Background from "../Common/Background/Background";
import { useI18n } from "@/context/I18nContext";
import type { PostCategory, PostSeries } from "@/utils/content/local";

interface TagPostItem {
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

interface TagInfo {
    name: string;
    count: number;
}

type TagsStatus = "Loading" | "Error" | "Done";

const tagVariantCount = 5;

const getVariantIndex = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash += value.charCodeAt(i);
    }
    return Math.abs(hash) % tagVariantCount;
};

const getTagClassName = (value: string) => {
    const index = getVariantIndex(value);
    const variantClass = style[`blog_taxonomy_link_variant_${index}`] || "";
    return `${style.blog_taxonomy_link} ${variantClass}`.trim();
};

const TagsPage: React.FC = () => {
    const { t, locale } = useI18n();
    const [status, setStatus] = useState<TagsStatus>("Loading");
    const [posts, setPosts] = useState<TagPostItem[]>([]);

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
                console.error("Tags fetch error:", error);
                setStatus("Error");
            }
        };

        fetchAll();
    }, [locale]);

    const tags: TagInfo[] = useMemo(() => {
        const counter = new Map<string, number>();
        posts.forEach(post => {
            if (!Array.isArray(post.tags)) return;
            post.tags.forEach(tag => {
                const current = counter.get(tag) || 0;
                counter.set(tag, current + 1);
            });
        });
        const list: TagInfo[] = Array.from(counter.entries()).map(([name, count]) => ({ name, count }));
        list.sort((a, b) => {
            if (b.count !== a.count) {
                return b.count - a.count;
            }
            return a.name.localeCompare(b.name);
        });
        return list;
    }, [posts]);

    return (
        <>
            <div className={style.blog_wrapper}>
                <div className={style.blog_container}>
                    <h1 className={style.blog_title}>{t("Tags.Title")}</h1>
                    {status === "Loading" && (
                        <div className={style.blog_tip_loading}>{t("Status.Loading")}</div>
                    )}
                    {status === "Error" && (
                        <>
                            <div className={style.blog_tip_error}>{t("Status.Error")}</div>
                        </>
                    )}
                    {status === "Done" && tags.length === 0 && (
                        <div className={style.blog_tip_error_details}>No Tags Yet</div>
                    )}
                    {status === "Done" && tags.length > 0 && (
                        <ul className={style.blog_taxonomy_list} aria-label={t("Tags.Title")}>
                            {tags.map(tag => (
                                <li key={tag.name} className={style.blog_taxonomy_item}>
                                    <Link href={`/tag/${encodeURIComponent(tag.name)}`} className={getTagClassName(tag.name)}>
                                        <span className={style.blog_taxonomy_name}>{tag.name}</span>
                                        <span className={style.blog_taxonomy_count}>{tag.count}{t("Tags.PostsSuffix")}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <Background text={t("Tags.Title")} />
        </>
    );
};

export default TagsPage;
