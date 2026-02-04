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
import type { PostContentResponse, PostItem } from '@/utils/content/local';
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
    const [seriesPosts, setSeriesPosts] = useState<PostItem[]>([]);
    const [recommendPosts, setRecommendPosts] = useState<PostItem[]>([]);

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

    const showCategory = process.env.NEXT_PUBLIC_BLOG_CATEGORY_ENABLED !== 'false';
    const showTags = process.env.NEXT_PUBLIC_BLOG_TAGS_ENABLED !== 'false';
    const showSeries = process.env.NEXT_PUBLIC_BLOG_SERIES_ENABLED !== 'false';

    const labelStrategy = process.env.NEXT_PUBLIC_BLOG_CATEGORY_LABEL_STRATEGY || 'i18n-first';

    const resolvedLocale = locale === 'en-US' ? 'en-US' : 'zh-CN';

    const categoryLabel = (() => {
        if (!articleContent?.category) return undefined;
        const category = articleContent.category;
        const id = category.id;
        if (labelStrategy === 'frontmatter-first') {
            if (resolvedLocale === 'en-US' && category.labelEn) return category.labelEn;
            if (resolvedLocale !== 'en-US' && category.labelZh) return category.labelZh;
            return id;
        }
        if (resolvedLocale === 'en-US') {
            if (category.labelEn) return category.labelEn;
        } else {
            if (category.labelZh) return category.labelZh;
        }
        return id;
    })();

    const tagVariantCount = 5;

    const getVariantIndex = (value: string) => {
        let hash = 0;
        for (let i = 0; i < value.length; i += 1) {
            hash += value.charCodeAt(i);
        }
        return Math.abs(hash) % tagVariantCount;
    };

    const getPostTagClassName = (tag: string) => {
        const index = getVariantIndex(tag);
        const variantClass = style[`post_tag_variant_${index}`] || '';
        return `${style.post_tag} ${variantClass}`.trim();
    };

    useEffect(() => {
        const shouldLoadRelated = status === 'Done' && articleContent;
        if (!shouldLoadRelated) {
            return;
        }

        const loadRelated = async () => {
            const queryLocale = locale === 'zh-CN' ? 'zh-CN' : 'en';
            const limit = Number.parseInt(process.env.NEXT_PUBLIC_BLOG_RELATED_LIMIT || '50', 10) || 50;
            try {
                const response = await fetch(`/api/blog/list?offset=0&limit=${encodeURIComponent(String(limit))}&locale=${encodeURIComponent(queryLocale)}`);
                if (!response.ok) {
                    return;
                }
                const data = await response.json() as { items?: PostItem[] };
                const items = Array.isArray(data.items) ? data.items : [];

                if (showSeries && articleContent.series) {
                    const filteredSeries = items
                        .filter(item => item.series && item.series.id === articleContent.series?.id);
                    setSeriesPosts(filteredSeries);
                } else {
                    setSeriesPosts([]);
                }

                if (process.env.NEXT_PUBLIC_BLOG_RECOMMEND_ENABLED !== 'false') {
                    const filteredRecommend = items
                        .filter(item => item.isRecommended && item.slug !== slug);

                    if (filteredRecommend.length === 0) {
                        setRecommendPosts([]);
                        return;
                    }

                    const shuffled = [...filteredRecommend];
                    for (let i = shuffled.length - 1; i > 0; i -= 1) {
                        const j = Math.floor(Math.random() * (i + 1));
                        const tmp = shuffled[i];
                        shuffled[i] = shuffled[j];
                        shuffled[j] = tmp;
                    }

                    const maxRecommendCount = 4;
                    setRecommendPosts(shuffled.slice(0, maxRecommendCount));
                } else {
                    setRecommendPosts([]);
                }
            } catch {
            }
        };

        loadRelated();
    }, [status, articleContent, locale, slug, showSeries]);

    return (
        <div className={style.post_wrapper}>
            <div className={style.post_container}>
                {showCategory && categoryLabel && articleContent?.category?.id && (
                    <Link href={`/category/${encodeURIComponent(articleContent.category.id)}`} className={style.post_category}>
                        {categoryLabel}
                    </Link>
                )}
                {showCategory && categoryLabel && !articleContent?.category?.id && (
                    <div className={style.post_category}>{categoryLabel}</div>
                )}
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
                {status === 'Done' && articleContent && (showTags || showSeries) && (
                    <div className={style.post_meta_row}>
                        {showSeries && articleContent.series && (
                            <span className={style.post_series_badge}>{articleContent.series.label || articleContent.series.id}</span>
                        )}
                        {showTags && articleContent.tags && articleContent.tags.length > 0 && (
                            <div className={style.post_tags}>
                                {articleContent.tags.map(tag => (
                                    <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`} className={getPostTagClassName(tag)}>
                                        {tag}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
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
                {showSeries && articleContent?.series && seriesPosts.length > 1 && (
                    <section className={style.post_series_section}>
                        <h2 className={style.post_series_title}>{t('Blog.Series')}</h2>
                        <ul className={style.post_series_list}>
                            {seriesPosts.map(item => (
                                <li key={item.slug} className={item.slug === slug ? style.post_series_item_active : style.post_series_item}>
                                    <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                {process.env.NEXT_PUBLIC_BLOG_RECOMMEND_ENABLED !== 'false' && recommendPosts.length > 0 && (
                    <section className={style.post_recommend_section}>
                        <h2 className={style.post_recommend_title}>{t('Blog.Recommend')}</h2>
                        <ul className={style.post_recommend_list}>
                            {recommendPosts.map(item => (
                                <li key={item.slug} className={style.post_recommend_item}>
                                    <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
            <Background text="BLOG" />
        </div>
    );
};

export default BlogPost;
