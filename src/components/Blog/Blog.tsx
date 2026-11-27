"use client";

import React, { useEffect, useState } from "react";
import { blogPagePath } from "@/utils/seo";
import style from "./Blog.module.css";
import { usePageReadyTask } from '@/components/Common/PageReadiness';
import Background from "../Common/Background/Background";
import Pagination from "../Common/Pagination/Pagination";
import BlogCard from "./BlogCard";
import { useI18n } from "@/context/I18nContext";
import { readBrowserStorage, writeBrowserStorage } from '@/utils/browserStorage';
import type { PostCategory, PostSeries } from "@/utils/content/local";

/**
 * 文章列表项接口
 */
export interface PostsListShape {
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

interface BlogProps {
    currentPage: number;
    itemsLimit: number;
    initialPosts?: PostsListShape[];
    initialTotal?: number;
    initialLocale?: string;
}

/** 按 URL 页码展示文章，记住排序和每页滚动位置。 */
const Blog: React.FC<BlogProps> = ({ currentPage, itemsLimit, initialPosts, initialTotal, initialLocale }) => {
    const { t, locale } = useI18n();
    const [totalItems, setTotalItems] = useState(initialTotal || 0);
    const [posts, setPosts] = useState(initialPosts || []);
    const [sortMode, setSortMode] = useState<"recommend" | "date-desc" | "date-asc">("recommend");
    const [status, setStatus] = useState<"Loading" | "Error" | "Done">(initialPosts ? "Done" : "Loading");
    const sortKey = `blog:sort:${locale}`;
    const scrollKey = `blog:scroll:${locale}:${currentPage}`;
    usePageReadyTask(status === 'Loading');

    useEffect(() => {
        const saved = readBrowserStorage('sessionStorage', sortKey);
        setSortMode(saved === 'date-desc' || saved === 'date-asc' ? saved : 'recommend');
    }, [sortKey]);

    function changeSortMode(value: typeof sortMode) {
        setSortMode(value);
        writeBrowserStorage('sessionStorage', sortKey, value);
    }

    useEffect(() => {
        if (status !== 'Done') return;
        const saved = readBrowserStorage('sessionStorage', scrollKey);
        if (saved !== null) window.scrollTo({ top: Number(saved), behavior: 'instant' });
        const saveScroll = () => writeBrowserStorage('sessionStorage', scrollKey, String(window.scrollY));
        window.addEventListener('scroll', saveScroll, { passive: true });
        return () => window.removeEventListener('scroll', saveScroll);
    }, [scrollKey, status]);

    useEffect(() => {
        const queryLocale = locale === 'zh-CN' ? 'zh-CN' : 'en';
        if (initialPosts && initialLocale === queryLocale) {
            setPosts(initialPosts);
            setTotalItems(initialTotal || 0);
            setStatus('Done');
            return;
        }

        const controller = new AbortController();
        const fetchPosts = async () => {
            try {
                setStatus('Loading');
                const offset = (currentPage - 1) * itemsLimit;
                const response = await fetch(`/api/blog/list?offset=${offset}&limit=${itemsLimit}&locale=${queryLocale}`, { signal: controller.signal });
                if (!response.ok) throw new Error(`Failed to fetch posts: ${response.status}`);
                const data = await response.json();
                if (controller.signal.aborted) return;
                setTotalItems(data.total);
                setPosts(data.items);
                setStatus('Done');
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error('读取博客列表失败', error);
                setStatus('Error');
            }
        };
        void fetchPosts();
        return () => controller.abort();
    }, [currentPage, locale, initialPosts, initialLocale, initialTotal, itemsLimit]);

    const pinnedStyle = process.env.NEXT_PUBLIC_BLOG_PINNED_STYLE || 'separate-section';

    const getEffectiveRank = (post: PostsListShape) => {
        if (typeof post.recommendRank === "number" && Number.isFinite(post.recommendRank)) {
            return post.recommendRank;
        }
        return Number.MAX_SAFE_INTEGER;
    };

    const getTimeValue = (post: PostsListShape) => {
        if (!post.publishedTime) {
            return 0;
        }
        const time = new Date(post.publishedTime).getTime();
        if (Number.isFinite(time)) {
            return time;
        }
        return 0;
    };

    const getEffectivePinnedRank = (post: PostsListShape) => {
        if (typeof post.pinnedRank === "number" && Number.isFinite(post.pinnedRank)) {
            return post.pinnedRank;
        }
        return Number.MAX_SAFE_INTEGER;
    };

    const compareRecommend = (a: PostsListShape, b: PostsListShape) => {
        const rankDiff = getEffectiveRank(a) - getEffectiveRank(b);
        if (rankDiff !== 0) {
            return rankDiff;
        }
        const pinnedScoreA = a.isPinned ? 1 : 0;
        const pinnedScoreB = b.isPinned ? 1 : 0;
        if (pinnedScoreA !== pinnedScoreB) {
            return pinnedScoreB - pinnedScoreA;
        }
        return getTimeValue(b) - getTimeValue(a);
    };

    const compareDateDesc = (a: PostsListShape, b: PostsListShape) => {
        return getTimeValue(b) - getTimeValue(a);
    };

    const compareDateAsc = (a: PostsListShape, b: PostsListShape) => {
        return getTimeValue(a) - getTimeValue(b);
    };

    const pinnedPosts = posts
        .filter(post => post.isPinned)
        .slice()
        .sort((a, b) => {
            const rankDiff = getEffectivePinnedRank(a) - getEffectivePinnedRank(b);
            if (rankDiff !== 0) {
                return rankDiff;
            }
            return getTimeValue(b) - getTimeValue(a);
        });
    const normalPostsBase = posts.filter(post => !post.isPinned);

    const normalPosts = (() => {
        if (sortMode === "date-desc") {
            return normalPostsBase.slice().sort(compareDateDesc);
        }
        if (sortMode === "date-asc") {
            return normalPostsBase.slice().sort(compareDateAsc);
        }
        return normalPostsBase.slice().sort((a, b) => {
            const rankDiff = getEffectiveRank(a) - getEffectiveRank(b);
            if (rankDiff !== 0) {
                return rankDiff;
            }
            return getTimeValue(b) - getTimeValue(a);
        });
    })();

    const renderPostCard = (post: PostsListShape, index: number) => (
        <BlogCard
            key={post.slug}
            articleId={post.slug}
            articleTitle={post.title}
            articleDescription={post.description}
            articleDate={post.publishedTime}
            category={post.category}
            tags={post.tags}
            currentLocale={locale}
            cardStyle={{ animationDelay: `${index * 0.1}s` }}
        />
    );

    return (
        <>
            <div className={style.blog_wrapper}>
                <div className={style.blog_container}>
                    <h1 className={style.blog_title}>{t('Pages.Blog')}</h1>
                    <div className={style.blog_sort_bar} aria-label={t('Blog.Sort.Label')}>
                        <span className={style.blog_sort_label}>{t('Blog.Sort.Label')}</span>
                        <div className={style.blog_sort_group} role="radiogroup">
                            <button
                                type="button"
                                className={sortMode === "recommend" ? style.blog_sort_button_active : style.blog_sort_button}
                                onClick={() => changeSortMode("recommend")}
                                role="radio"
                                aria-checked={sortMode === "recommend"}
                            >
                                {t('Blog.Sort.Recommend')}
                            </button>
                            <button
                                type="button"
                                className={sortMode === "date-desc" ? style.blog_sort_button_active : style.blog_sort_button}
                                onClick={() => changeSortMode("date-desc")}
                                role="radio"
                                aria-checked={sortMode === "date-desc"}
                            >
                                {t('Blog.Sort.DateDesc')}
                            </button>
                            <button
                                type="button"
                                className={sortMode === "date-asc" ? style.blog_sort_button_active : style.blog_sort_button}
                                onClick={() => changeSortMode("date-asc")}
                                role="radio"
                                aria-checked={sortMode === "date-asc"}
                            >
                                {t('Blog.Sort.DateAsc')}
                            </button>
                        </div>
                    </div>
                    <div className={style.blog_card_wrapper}>
                        {
                            posts.length === 0 && status === "Done" ? (
                                <>
                                    <div className={style.blog_tip_error}>{t('Status.Error')}</div>
                                    <div className={style.blog_tip_error_details} id="error_details">No Posts Yet</div>
                                </>
                            ) : status === "Loading" ? (
                                null
                            ) :
                                status === "Done" ? (
                                    <>
                                        {pinnedStyle === 'separate-section' && pinnedPosts.length > 0 && (
                                            <>
                                                <div className={style.blog_pinned_section}>
                                                    <div className={style.blog_pinned_label}>{t('Blog.Pinned')}</div>
                                                    {pinnedPosts.map((post, index) => renderPostCard(post, index))}
                                                </div>
                                                <div className={style.blog_pinned_divider} aria-hidden="true" />
                                            </>
                                        )}
                                        {pinnedStyle === 'separate-section'
                                            ? normalPosts.map((post, index) => renderPostCard(post, pinnedPosts.length + index))
                                            : posts
                                                .slice()
                                                .sort((a, b) => {
                                                    if (sortMode === "date-desc") {
                                                        return compareDateDesc(a, b);
                                                    }
                                                    if (sortMode === "date-asc") {
                                                        return compareDateAsc(a, b);
                                                    }
                                                    return compareRecommend(a, b);
                                                })
                                                .map((post, index) => renderPostCard(post, index))}
                                    </>
                                ) : status === "Error" ? (
                                    <>
                                        <div className={style.blog_tip_error}>{t('Status.Error')}</div>
                                    </>
                                ) : (
                                    null
                                )
                        }
                    </div>
                    <Pagination totalItems={totalItems} itemsLimitPerPage={itemsLimit} visiblePages={5} currentPage={currentPage} getPageHref={blogPagePath} />
                </div>
            </div>
            <Background text="BLOG" />
        </>
    );
};

export default Blog;
