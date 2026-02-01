"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import style from './BlogPost.module.css';
import Background from '../Common/Background/Background';
import { fetchPostContentAction } from '@/actions/blog';
import { useI18n } from '@/context/I18nContext';
import type { PostContentResponse } from '@/utils/content/local';
import CodeBlock from './CodeBlock';

interface BlogPostProps {
    initialContent?: PostContentResponse;
    initialLocale?: string;
}

/**
 * BlogPost 组件
 * 
 * 博客文章详情页组件。
 * 根据 URL 中的 slug 获取文章内容并渲染。
 * 支持 Markdown 渲染。
 * 支持服务端预渲染数据 (SSG)。
 */
const BlogPost: React.FC<BlogPostProps> = ({ initialContent, initialLocale }) => {
    // 获取路由参数
    const params = useParams();
    const slug = params?.slug as string;
    const { t, locale } = useI18n();

    const [status, setStatus] = useState<"Loading" | "Error" | "Done">(
        initialContent ? "Done" : "Loading"
    );
    const [articleContent, setArticleContent] = useState<PostContentResponse | null>(initialContent || null);
    const [errorMsg, setErrorMsg] = useState<string>("");

    const isFirstRender = useRef(true);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // 如果是 invalid date，返回原字符串
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            // 确定语言
            // 映射 locale 到 Contentful 支持的格式
            const queryLocale = locale === 'zh-CN' ? 'zh-CN' : 'en';

            if (isFirstRender.current) {
                isFirstRender.current = false;
                // 如果有初始内容，且语言匹配，则跳过
                if (initialContent) {
                    if (initialLocale === queryLocale || (initialLocale === 'en' && queryLocale === 'en')) {
                        return;
                    }
                }
            }

            try {
                if (!slug) {
                    // 如果是预渲染导致的 slug 为空（理论上不应该，因为 page 会传入 content），则忽略
                    if (initialContent) return;
                    throw new Error("Invalid Slug");
                }
                
                setStatus("Loading");
                const res = await fetchPostContentAction(slug, queryLocale);
                setArticleContent(res);
                setStatus("Done");
            } catch (error) {
                console.error('Error fetching blog post:', error);
                setStatus("Error");
                // 隐藏具体错误信息，防止后端信息泄露
                setErrorMsg(t('Status.Error') || "Failed to load blog post.");
            }
        };
        
        fetchData();
    }, [slug, locale, initialContent, initialLocale]);

    return (
        <div className={style.post_wrapper}>
            <div className={style.post_container}>
                <h1 className={style.post_title}>
                    {
                        status === "Done" && articleContent
                            ? articleContent.title
                            : status === "Error"
                                ? ""
                                : t('Status.Loading')
                    }
                </h1>
                {
                    status === "Done" && articleContent?.publishedTime && (
                        <div className={style.post_date}>
                            {t('Blog.PublishedOn')} {formatDate(articleContent.publishedTime)}
                        </div>
                    )
                }
                <div className={style.post_content}>
                    {
                        status === "Done" && articleContent
                            ? (
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]} 
                                    rehypePlugins={[rehypeRaw]}
                                    components={{
                                        code({ className, children, ...props }: { node?: unknown; className?: string; children?: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
                                            const match = /language-(\w+)/.exec(className || '')
                                            return match ? (
                                                <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                                            ) : (
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            )
                                        }
                                    }}
                                >
                                    {articleContent.content}
                                </ReactMarkdown>
                            )
                            : status === "Error"
                                ? <>
                                    <div className={style.tip_error}>{t('Status.Error')}</div>
                                    <div className={style.tip_error_details} id="error_details">{errorMsg}</div>
                                    <div className={style.tip_error_details}>
                                        <Link href="/blog">{t('Error.BackToBlog')}</Link>
                                    </div>
                                </>
                                : <div className={style.tip_loading}>{t('Status.Loading')}</div>

                    }
                    {
                        status === "Done"
                            ? <Link href="/blog">{`< Back to blog list`}</Link>
                            : null
                    }
                </div>
            </div>
            <Background text="BLOG" />
        </div>
    );
};

export default BlogPost;
