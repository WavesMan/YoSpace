"use client";

import React, { useEffect, useState, useRef } from "react";
import style from "./Blog.module.css";
import Background from "../Common/Background/Background";
import { fetchPostsListAction } from "@/actions/blog";
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
 * 负责从 Contentful 获取文章列表，并展示分页。
 * 包含加载状态和错误处理。
 * 支持服务端预渲染数据 (SSG/ISR)。
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

    const isFirstRender = useRef(true);

    useEffect(() => {
        const fetchPosts = async () => {
            // 映射 locale 到 Contentful 支持的格式
            const queryLocale = locale === 'zh-CN' ? 'zh-CN' : 'en';

            // 如果是首次渲染，且有初始数据，且初始数据的语言与当前语言匹配，且在第一页
            // 则跳过 fetch，直接使用初始数据
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
                const res = await fetchPostsListAction(currentPage - 1, itemsLimit, queryLocale);
                setTotalItems(res.total);
                setPosts(res.items);
                setStatus("Done");
            } catch (err) {
                console.error("Blog fetch error:", err);
                setStatus("Error");
                // 隐藏具体错误信息，防止后端信息泄露
                setErrorMsg(t('Status.Error') || "Failed to load blog posts.");
            }
        };
        fetchPosts();
    }, [currentPage, locale, initialPosts, initialLocale]); // 依赖项包含 locale，切换语言时会自动重新获取

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // 滚动到顶部
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
