"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import style from './BlogPost.module.css';
import Background from '../Common/Background/Background';
import { useI18n } from '@/context/I18nContext';
import type { PostContentResponse } from '@/utils/content/local';
import CodeBlock from './CodeBlock';

/**
 * NOTE: 判断图片地址是否为 Vercel 提供的 Deploy 按钮
 *
 * 用于在 Markdown 渲染时对该类按钮做特殊排版与样式处理。
 */
const isVercelButtonSrc = (src: string) => {
    return src.includes('vercel.com/button');
};

/**
 * NOTE: 判断一个段落节点是否包含 Vercel 按钮图片
 *
 * 在 ReactMarkdown 自定义渲染中，用于识别需要缩进展示的按钮位置。
 */
const hasVercelButtonChild = (children: React.ReactNode) => {
    return React.Children.toArray(children).some((child) => {
        if (!React.isValidElement(child)) return false;
        const src = (child.props as { src?: unknown })?.src;
        return typeof src === 'string' && isVercelButtonSrc(src);
    });
};

/**
 * NOTE: Markdown 链接地址统一处理
 *
 * 负责过滤潜在的 javascript: 协议，
 * 保留站内锚点与相对路径，并对外部链接做安全编码。
 */
const transformMarkdownUrl = (url: string) => {
    const input = url.trim();
    if (!input) return input;
    if (/^javascript:/i.test(input)) return '';

    if (input.startsWith('#')) {
        return input;
    }

    if (input.startsWith('/')) {
        return encodeURI(input);
    }

    try {
        const parsed = new URL(input);

        if (parsed.searchParams.has('repository-url')) {
            const repositoryUrl = parsed.searchParams.get('repository-url') || '';
            parsed.searchParams.set('repository-url', repositoryUrl);
        }

        return parsed.toString();
    } catch {
        return encodeURI(input);
    }
};

interface BlogPostProps {
    initialContent?: PostContentResponse;
    initialLocale?: string;
}

/**
 * BlogPost 组件
 * 
 * 博客文章详情页组件。
 * 根据 URL 中的 slug 从 API Route `/api/blog/post` 获取文章内容并渲染，
 * 支持服务端预渲染注入的初始内容，避免首屏重复请求。
 * 使用 ReactMarkdown 渲染 Markdown，并对链接、图片与代码块做安全与样式增强。
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

    // NOTE: 通过标记首渲染，在有服务端初始内容时避免重复请求
    const isFirstRender = useRef(true);

    /**
     * NOTE: 将 ISO 时间字符串转换为本地化日期文案
     *
     * 在日期无效时回退为原始字符串，避免渲染空白，
     * 并根据当前语言切换中英文日期格式。
     */
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
            // NOTE: 将上下文中的语言映射为内容文件使用的语言标识
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
                    // NOTE: 理论上在详情页路由中总能拿到 slug；
                    //       若因特殊情况未获取到且存在初始内容，则继续沿用初始内容。
                    if (initialContent) return;
                    throw new Error("Invalid Slug");
                }
                
                setStatus("Loading");
                // NOTE: 通过 API Route 访问本地 Markdown 文章内容
                const response = await fetch(`/api/blog/post?slug=${encodeURIComponent(slug)}&locale=${encodeURIComponent(queryLocale)}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch post: ${response.status}`);
                }
                const res = await response.json();
                setArticleContent(res as PostContentResponse);
                setStatus("Done");
            } catch (error) {
                console.error('Error fetching blog post:', error);
                setStatus("Error");
                // NOTE: 对用户只展示统一错误提示，隐藏服务端具体异常信息，防止后端信息泄露
                setErrorMsg(t('Status.Error') || "Failed to load blog post.");
            }
        };
        
        fetchData();
    }, [slug, locale, initialContent, initialLocale, t]);

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
                                    urlTransform={transformMarkdownUrl}
                                    components={{
                                        // NOTE: 自定义段落渲染逻辑，对包含 Vercel 按钮的段落做缩进与换行优化
                                        p({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { node?: unknown }) {
                                            if (hasVercelButtonChild(children)) {
                                                const items = React.Children.toArray(children);
                                                const buttonIndex = items.findIndex((child) => {
                                                    if (!React.isValidElement(child)) return false;
                                                    const childProps = child.props as { children?: React.ReactNode };
                                                    return hasVercelButtonChild(childProps.children);
                                                });

                                                if (buttonIndex >= 0) {
                                                    return (
                                                        <p {...props}>
                                                            {items.slice(0, buttonIndex)}
                                                            <br />
                                                            <span className={style.md_inline_indent}>
                                                                {items[buttonIndex]}
                                                            </span>
                                                            {items.slice(buttonIndex + 1)}
                                                        </p>
                                                    );
                                                }
                                            }

                                            return (
                                                <p {...props}>
                                                    {children}
                                                </p>
                                            );
                                        },
                                        // NOTE: 自定义链接渲染逻辑
                                        // - 站内链接使用 Next.js 的 Link 以获得预取与路由能力
                                        // - 外链自动添加安全属性并复用样式
                                        a({ href, children, target, rel, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { node?: unknown }) {
                                            const nextHref = href || '';
                                            if (nextHref.startsWith('/')) {
                                                return (
                                                    <Link href={nextHref} {...props}>
                                                        {children}
                                                    </Link>
                                                );
                                            }

                                            const isHttp = nextHref.startsWith('http://') || nextHref.startsWith('https://');
                                            const nextTarget = target ?? (isHttp ? '_blank' : undefined);
                                            const nextRel = rel ?? (isHttp ? 'noopener noreferrer' : undefined);
                                            const nextClassName = [
                                                props.className,
                                                hasVercelButtonChild(children) ? style.vercel_button_link : undefined,
                                            ].filter(Boolean).join(' ');

                                            return (
                                                <a
                                                    href={nextHref}
                                                    target={nextTarget}
                                                    rel={nextRel}
                                                    className={nextClassName || undefined}
                                                    {...props}
                                                >
                                                    {children}
                                                </a>
                                            );
                                        },
                                        // NOTE: 自定义图片渲染逻辑，统一走 next/image
                                        //       并对 Vercel 按钮图片附加特定样式
                                        img({ src, alt, width, height, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { node?: unknown }) {
                                            const nextSrc = typeof src === 'string' ? src : '';
                                            const nextClassName = [
                                                props.className,
                                                nextSrc && isVercelButtonSrc(nextSrc) ? style.vercel_button_img : undefined,
                                            ].filter(Boolean).join(' ');

                                            return (
                                                <Image
                                                    src={nextSrc}
                                                    alt={alt || ''}
                                                    className={nextClassName || undefined}
                                                    width={Number(width) || 700}
                                                    height={Number(height) || 400}
                                                    loading="lazy"
                                                    {...props}
                                                />
                                            );
                                        },
                                        // NOTE: 将带语言标识的代码块交给 CodeBlock 组件高亮与复制
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
