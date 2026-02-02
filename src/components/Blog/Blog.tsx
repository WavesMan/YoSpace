"use client";

import React, { useEffect, useState, useRef } from "react";
import style from "./Blog.module.css";
import Background from "../Common/Background/Background";
import Pagination from "../Common/Pagination/Pagination";
import BlogCard from "./BlogCard";
import { useI18n } from "@/context/I18nContext";
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
    initialPosts?: PostsListShape[];
    initialTotal?: number;
    initialLocale?: string;
}

/**
 * Blog 组件
 * 
 * 博客列表页面组件。
 * 通过调用 API Route `/api/blog/list` 从本地 Markdown 内容中获取文章列表，
 * 支持服务端预渲染注入的初始数据，避免首屏重复请求。
 * 内部管理分页、加载状态与错误提示。
 */
const Blog: React.FC<BlogProps> = ({ initialPosts, initialTotal, initialLocale }) => {
    const { t, locale } = useI18n();
    const itemsLimit = parseInt(process.env.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE || '10') || 10;

    const [totalItems, setTotalItems] = useState<number>(initialTotal || 0);
    const [posts, setPosts] = useState<PostsListShape[]>(initialPosts || []);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [sortMode, setSortMode] = useState<"recommend" | "date-desc" | "date-asc">("recommend");
    
    // 如果有初始数据且在第一页，状态默认为 Done，否则为 Loading
    const [status, setStatus] = useState<"Loading" | "Error" | "Done">(
        initialPosts && initialPosts.length > 0 ? "Done" : "Loading"
    );
    const [errorMsg, setErrorMsg] = useState<string>("");

    // NOTE: 通过标记首渲染，在有服务端初始数据时避免重复请求
    const isFirstRender = useRef(true);

    useEffect(() => {
        const fetchPosts = async () => {
            // NOTE: 将上下文中的语言映射为内容文件使用的语言标识
            const queryLocale = locale === 'zh-CN' ? 'zh-CN' : 'en';

            // NOTE: 如果是首渲染且已有与当前语言匹配的服务端初始数据，并且停留在第一页
            //       则跳过客户端请求，直接使用注入的列表，减少一次无意义的网络请求
            if (isFirstRender.current) {
                isFirstRender.current = false;
                if (initialPosts && initialPosts.length > 0 && currentPage === 1) {
                    if (initialLocale === queryLocale || (initialLocale === 'en' && queryLocale === 'en')) {
                        return;
                    }
                }
            }

            try {
                setStatus("Loading");
                // NOTE: 通过 API Route 访问本地 Markdown 列表，offset 从 0 开始，因此这里减 1
                const response = await fetch(`/api/blog/list?offset=${currentPage - 1}&limit=${itemsLimit}&locale=${encodeURIComponent(queryLocale)}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch posts: ${response.status}`);
                }
                const res = await response.json();
                setTotalItems(res.total);
                setPosts(res.items);
                setStatus("Done");
            } catch (err) {
                console.error("Blog fetch error:", err);
                setStatus("Error");
                // NOTE: 对用户只展示统一错误提示，隐藏服务端具体异常信息，防止后端信息泄露
                setErrorMsg(t('Status.Error') || "Failed to load blog posts.");
            }
        };
        fetchPosts();
    }, [currentPage, locale, initialPosts, initialLocale, itemsLimit, t]); // 依赖项包含 locale，切换语言时会自动重新获取

    /**
     * 处理分页切换
     *
     * 更新当前页并平滑滚动到页面顶部，保证用户在翻页后仍能从列表起始位置阅读。
     */
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // NOTE: 滚动到顶部，改善长列表场景下的翻页体验
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
                                onClick={() => setSortMode("recommend")}
                                role="radio"
                                aria-checked={sortMode === "recommend"}
                            >
                                {t('Blog.Sort.Recommend')}
                            </button>
                            <button
                                type="button"
                                className={sortMode === "date-desc" ? style.blog_sort_button_active : style.blog_sort_button}
                                onClick={() => setSortMode("date-desc")}
                                role="radio"
                                aria-checked={sortMode === "date-desc"}
                            >
                                {t('Blog.Sort.DateDesc')}
                            </button>
                            <button
                                type="button"
                                className={sortMode === "date-asc" ? style.blog_sort_button_active : style.blog_sort_button}
                                onClick={() => setSortMode("date-asc")}
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
                                <div className={style.blog_tip_loading}>{t('Status.Loading')}</div>
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
                                        <div className={style.blog_tip_error_details} id="error_details">{errorMsg}</div>
                                    </>
                                ) : (
                                    <div className={style.blog_tip_loading}>{t('Status.Loading')}</div>
                                )
                        }
                    </div>
                    <Pagination totalItems={totalItems} itemsLimitPerPage={itemsLimit} visiblePages={5} currentPage={currentPage} handlePageChange={handlePageChange} />
                </div>
            </div>
            <Background text="BLOG" />
        </>
    );
};

export default Blog;
