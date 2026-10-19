"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from '@/components/Common/TransitionLink';
import style from './BlogPost.module.css';
import Background from '../Common/Background/Background';
import { useI18n } from '@/context/I18nContext';
import type { PostContentResponse, PostItem } from '@/utils/content/local';
import { BlogPostMarkdown } from './Post/BlogPostMarkdown';
import { readBrowserStorage, writeBrowserStorage } from '@/utils/browserStorage';
import { extractTocFromMarkdown } from './Post/markdownUtils';
import { usePageReadyTask, usePageVisible } from '@/components/Common/PageReadiness';
import { useTocViewport } from './Post/useTocViewport';

interface BlogPostProps {
    initialContent?: PostContentResponse;
    initialLocale?: string;
    initialRelatedPosts?: PostItem[];
    relatedSlot?: React.ReactNode;
}

/**
 * BlogPost 组件
 * 
 * 博客文章详情页组件。
 * 根据 URL 中的 slug 从 API Route `/api/blog/post` 获取文章内容并渲染，
 * 支持服务端预渲染注入的初始内容，避免首屏重复请求。
 * 使用 ReactMarkdown 渲染 Markdown，并对链接、图片与代码块做安全与样式增强。
 */
const BlogPost: React.FC<BlogPostProps> = ({ initialContent, initialLocale, initialRelatedPosts, relatedSlot }) => {
    // 获取路由参数
    const params = useParams();
    const slug = params?.slug as string;
    const { t, locale } = useI18n();
    const pageVisible = usePageVisible();

    const [status, setStatus] = useState<"Loading" | "Error" | "Done">(
        initialContent ? "Done" : "Loading"
    );
    const [articleContent, setArticleContent] = useState<PostContentResponse | null>(initialContent || null);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [seriesPosts, setSeriesPosts] = useState<PostItem[]>(() => initialRelatedPosts?.filter(item => item.series && item.series.id === initialContent?.series?.id) || []);
    const [recommendPosts, setRecommendPosts] = useState<PostItem[]>(() => initialRelatedPosts?.filter(item => item.isRecommended && item.slug !== slug).slice(0, 4) || []);
    const tocItems = useMemo(() => extractTocFromMarkdown(articleContent?.content || ''), [articleContent?.content]);
    const [isTocOpen, setIsTocOpen] = useState(false);
    const queryLocale = locale === 'zh-CN' ? 'zh-CN' : 'en';
    usePageReadyTask(status === 'Loading');
    const [isCompactToc, setIsCompactToc] = useState(false);
    const postMainRef = useRef<HTMLDivElement | null>(null);
    const tocRef = useRef<HTMLElement | null>(null);
    const floatingTocRef = useRef<HTMLDivElement | null>(null);
    useTocViewport(tocRef, !isCompactToc && tocItems.length > 0);
    useTocViewport(floatingTocRef, isCompactToc && tocItems.length > 0);
    const restoredScrollRef = useRef(false);
    const restoreScrollYRef = useRef<number | null>(null);
    const scrollStorageKey = slug
        ? `scroll:post:${slug}:${locale}`
        : `scroll:post:unknown:${locale}`;


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
        const controller = new AbortController();
        const fetchData = async () => {
            // NOTE: 将上下文中的语言映射为内容文件使用的语言标识
            const queryLocale = locale === 'zh-CN' ? 'zh-CN' : 'en';

            if (initialContent && initialLocale === queryLocale) {
                setArticleContent(initialContent);
                setStatus('Done');
                return;
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
                const response = await fetch(`/api/blog/post?slug=${encodeURIComponent(slug)}&locale=${encodeURIComponent(queryLocale)}`, { signal: controller.signal });
                if (!response.ok) {
                    throw new Error(`Failed to fetch post: ${response.status}`);
                }
                const res = await response.json();
                if (controller.signal.aborted) return;
                setArticleContent(res as PostContentResponse);
                setStatus("Done");
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error('Error fetching blog post:', error);
                setStatus("Error");
                // NOTE: 对用户只展示统一错误提示，隐藏服务端具体异常信息，防止后端信息泄露
                setErrorMsg(t('Status.Error') || "Failed to load blog post.");
            }
        };
        
        fetchData();
        return () => controller.abort();
    }, [slug, locale, initialContent, initialLocale, t]);

    /**
     * 重置详情页滚动恢复状态，避免跨文章误恢复。
     *
     * 使用示例：
     * restoredScrollRef.current = false;
     *
     * @returns void
     */
    useEffect(() => {
        restoredScrollRef.current = false;
        restoreScrollYRef.current = null;
    }, [scrollStorageKey]);

    /**
     * 读取详情页滚动位置，支持返回时恢复阅读进度。
     *
     * 使用示例：
     * window.sessionStorage.getItem(scrollStorageKey);
     *
     * @returns void
     */
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const raw = readBrowserStorage('sessionStorage', scrollStorageKey);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw) as { scrollY?: number };
            const nextScrollY = Number(parsed.scrollY);
            restoreScrollYRef.current = Number.isFinite(nextScrollY) && nextScrollY >= 0 ? nextScrollY : 0;
        } catch {
        }
    }, [scrollStorageKey]);

    /**
     * 记录详情页滚动位置，保持阅读进度。
     *
     * 使用示例：
     * window.sessionStorage.setItem(scrollStorageKey, JSON.stringify({ scrollY }));
     *
     * @returns void
     */
    useEffect(() => {
        if (typeof window === 'undefined') return;
        let ticking = false;
        /**
         * 通过 requestAnimationFrame 节流滚动写入，降低性能开销。
         *
         * 使用示例：
         * window.addEventListener("scroll", handleScroll);
         *
         * @returns void
         */
        const handleScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                ticking = false;
                const payload = { scrollY: window.scrollY };
                writeBrowserStorage('sessionStorage', scrollStorageKey, JSON.stringify(payload));
            });
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [scrollStorageKey]);

    /**
     * 在文章内容渲染完成后恢复滚动位置。
     *
     * 使用示例：
     * window.scrollTo({ top, behavior: "auto" });
     *
     * @returns void
     */
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (status !== "Done") return;
        if (!pageVisible) return;
        if (restoredScrollRef.current) return;
        if (restoreScrollYRef.current === null) return;
        restoredScrollRef.current = true;
        window.scrollTo({ top: restoreScrollYRef.current, behavior: "auto" });
    }, [status, pageVisible]);

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
        if (!shouldLoadRelated || (!showSeries && process.env.NEXT_PUBLIC_BLOG_RECOMMEND_ENABLED === 'false')) {
            return;
        }

        if (relatedSlot && initialLocale === queryLocale) return;

        if (initialRelatedPosts && initialLocale === queryLocale) {
            setSeriesPosts(initialRelatedPosts.filter(item => item.series && item.series.id === articleContent.series?.id));
            setRecommendPosts(initialRelatedPosts.filter(item => item.isRecommended && item.slug !== slug).slice(0, 4));
            return;
        }
        const controller = new AbortController();
        let active = true;
        const timeout = window.setTimeout(() => controller.abort(), 8000);

        const loadRelated = async () => {
            const queryLocale = locale === 'zh-CN' ? 'zh-CN' : 'en';
            const limit = Number.parseInt(process.env.NEXT_PUBLIC_BLOG_RELATED_LIMIT || '50', 10) || 50;
            try {
                const response = await fetch(`/api/blog/list?offset=0&limit=${encodeURIComponent(String(limit))}&locale=${encodeURIComponent(queryLocale)}`, { signal: controller.signal });
                if (!response.ok) {
                    return;
                }
                const data = await response.json() as { items?: PostItem[] };
                if (!active) return;
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
                if (!active) return;
                setSeriesPosts([]);
                setRecommendPosts([]);
            } finally {
                clearTimeout(timeout);
            }
        };

        loadRelated();
        return () => { active = false; controller.abort(); clearTimeout(timeout); };
    }, [status, articleContent, locale, slug, showSeries, initialRelatedPosts, initialLocale, queryLocale, relatedSlot]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const element = postMainRef.current;
        if (!element) return;
        let rafId = 0;
        const updateCompact = () => {
            if (!postMainRef.current) return;
            const rect = postMainRef.current.getBoundingClientRect();
            const styles = window.getComputedStyle(postMainRef.current);
            const gapValue = styles.columnGap || styles.gap || '0px';
            const gap = Number.parseFloat(gapValue) || 0;
            const tocWidth = tocRef.current?.getBoundingClientRect().width || 280;
            const minContentWidth = 760;
            // NOTE: 1100px 以下右侧目录预留区被移除（见 CSS 媒体查询），统一使用悬浮目录；
            //       更宽的视口再按剩余可用宽度判断，避免桌面目录与正文重叠。
            const compactByViewport = window.innerWidth <= 1100;
            const available = rect.width - tocWidth - gap;
            setIsCompactToc(compactByViewport || available < minContentWidth);
        };
        const scheduleUpdate = () => {
            if (rafId) {
                window.cancelAnimationFrame(rafId);
            }
            rafId = window.requestAnimationFrame(updateCompact);
        };
        const observer = new ResizeObserver(scheduleUpdate);
        observer.observe(element);
        window.addEventListener('resize', scheduleUpdate);
        scheduleUpdate();
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', scheduleUpdate);
            if (rafId) {
                window.cancelAnimationFrame(rafId);
            }
        };
    }, []);

    const handleTocClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string, shouldClose?: boolean) => {
        event.preventDefault();
        if (typeof window === 'undefined') return;
        const target = document.getElementById(id);
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const offset = 100;
        const targetY = window.scrollY + rect.top - offset;
        window.scrollTo({
            top: targetY,
            behavior: 'smooth',
        });
        if (shouldClose) {
            setIsTocOpen(false);
        }
    };

    return (
        <div className={style.post_wrapper}>
            <div className={style.post_container}>
                <Link href="/blog" className={style.post_backlink}>
                    &lt; Back to blog list
                </Link>
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
                <div className={style.post_main} ref={postMainRef}>
                    {tocItems.length > 0 && !isCompactToc && (
                        <nav
                            ref={tocRef}
                            className={style.post_toc}
                            aria-label={locale === 'zh-CN' ? '文章目录' : 'Table of contents'}
                        >
                            <div className={style.post_toc_title}>
                                {locale === 'zh-CN' ? '目录' : 'Contents'}
                            </div>
                            <div className={style.post_toc_body}>
                                <ul className={style.post_toc_list}>
                                    {tocItems.map(item => (
                                        <li
                                            key={`${item.level}-${item.id}-${item.text}`}
                                            className={`${style.post_toc_item} ${item.level === 2 ? style.post_toc_item_level_2 : ''} ${item.level === 3 ? style.post_toc_item_level_3 : ''}`}
                                        >
                                            <a
                                                className={style.post_toc_link}
                                                href={`#${item.id}`}
                                                onClick={(event) => handleTocClick(event, item.id)}
                                            >
                                                {item.text}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </nav>
                    )}
                    <div className={style.post_content} data-post-content>
                        {status === "Done" && articleContent ? (
                            <BlogPostMarkdown content={articleContent.content} locale={locale} />
                        ) : status === "Error" ? (
                            <>
                                <div className={style.tip_error}>{t('Status.Error')}</div>
                                <div className={style.tip_error_details} id="error_details">{errorMsg}</div>
                                <div className={style.tip_error_details}>
                                    <Link href="/blog" className={style.post_backlink_inline}>
                                        {t('Error.BackToBlog')}
                                    </Link>
                                </div>
                            </>
                        ) : (
                            null
                        )}
                        {
                            status === "Done"
                                ? (
                                    <Link href="/blog" className={style.post_backlink_inline}>
                                        {`< Back to blog list`}
                                    </Link>
                                )
                                : null
                        }
                    </div>
                </div>
                {initialLocale === queryLocale && relatedSlot}
                {(!relatedSlot || initialLocale !== queryLocale) && showSeries && articleContent?.series && seriesPosts.length > 1 && (
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
                {(!relatedSlot || initialLocale !== queryLocale) && process.env.NEXT_PUBLIC_BLOG_RECOMMEND_ENABLED !== 'false' && recommendPosts.length > 0 && (
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
            {tocItems.length > 0 && isCompactToc && (
                <div ref={floatingTocRef} className={style.post_toc_container}>
                    <button
                        type="button"
                        className={`${style.post_toc_toggle} ${isTocOpen ? style.post_toc_toggle_open : ''}`}
                        onClick={() => setIsTocOpen(!isTocOpen)}
                        aria-label={locale === 'zh-CN' ? '切换目录' : 'Toggle table of contents'}
                        aria-expanded={isTocOpen}
                        aria-controls="post-toc-panel"
                        data-toc-toggle
                    >
                        <span className={style.post_toc_toggle_icon}>
                            {isTocOpen ? '×' : '☰'}
                        </span>
                    </button>
                    {isTocOpen && (
                        <nav id="post-toc-panel" className={style.post_toc_panel} aria-label={locale === 'zh-CN' ? '文章目录' : 'Table of contents'}>
                            <div className={style.post_toc_panel_header}>
                                <div className={style.post_toc_title}>
                                    {locale === 'zh-CN' ? '目录' : 'Contents'}
                                </div>
                                <button
                                    type="button"
                                    className={style.post_toc_panel_close}
                                    onClick={() => setIsTocOpen(false)}
                                    aria-label={locale === 'zh-CN' ? '关闭目录' : 'Close table of contents'}
                                >
                                    ×
                                </button>
                            </div>
                            <div className={style.post_toc_body}>
                                <ul className={style.post_toc_list}>
                                    {tocItems.map(item => (
                                        <li
                                            key={`mobile-${item.level}-${item.id}-${item.text}`}
                                            className={`${style.post_toc_item} ${item.level === 2 ? style.post_toc_item_level_2 : ''} ${item.level === 3 ? style.post_toc_item_level_3 : ''}`}
                                        >
                                            <a
                                                className={style.post_toc_link}
                                                href={`#${item.id}`}
                                                onClick={(event) => handleTocClick(event, item.id, true)}
                                            >
                                                {item.text}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </nav>
                    )}
                </div>
            )}
            <Background text="BLOG" />
        </div>
    );
};

export default BlogPost;
