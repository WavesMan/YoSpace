"use client";

import React, { useEffect, useState, useRef } from "react";
import style from "./Blog.module.css";
import Background from "../Common/Background/Background";
import Pagination from "../Common/Pagination/Pagination";
import BlogCard from "./BlogCard";
import { useI18n } from "@/context/I18nContext";

/**
 * 文章列表项接口
 */
export interface PostsListShape {
    title: string;
    description: string;
    slug: string;
    publishedTime: string;
    isPinned?: boolean;
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

    return (
        <>
            <div className={style.blog_wrapper}>
                <div className={style.blog_container}>
                    <h1 className={style.blog_title}>{t('Pages.Blog')}</h1>
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
                                    posts.map((post, index) => (
                                        <BlogCard
                                            key={post.slug}
                                            articleId={post.slug}
                                            articleTitle={post.title}
                                            articleDescription={post.description}
                                            articleDate={post.publishedTime}
                                            cardStyle={{ animationDelay: `${index * 0.1}s` }}
                                        />
                                    ))
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
