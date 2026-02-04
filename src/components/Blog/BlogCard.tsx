import React from "react";
import Link from "next/link";
import { AiFillCalendar } from "react-icons/ai";
import { FaAngleRight, FaTag } from "react-icons/fa";
import style from "./BlogCard.module.css";
import type { PostCategory } from "@/utils/content/local";

/**
 * BlogCard 组件 Props 接口
 */
interface BlogCardProps {
    articleId: string; // 文章 ID (slug)
    articleTitle: string; // 文章标题
    articleDescription: string; // 文章描述
    articleDate?: string; // 文章发布日期
    cardStyle?: React.CSSProperties; // 自定义样式（用于动画延迟等）
    category?: PostCategory;
    tags?: string[];
    currentLocale?: string;
}

/**
 * BlogCard 组件
 * 
 * 展示单个博客文章的卡片组件。
 * 包含标题、描述、发布日期和"阅读更多"链接。
 */
const BlogCard: React.FC<BlogCardProps> = ({ 
    articleId, 
    articleTitle, 
    articleDescription, 
    articleDate, 
    cardStyle,
    category,
    tags,
    currentLocale,
}) => {

    // 格式化日期
    const formattedDate = articleDate
        ? new Date(articleDate).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : "Unknown Date";

    const showCategory = process.env.NEXT_PUBLIC_BLOG_CATEGORY_ENABLED !== "false";
    const showTags = process.env.NEXT_PUBLIC_BLOG_TAGS_ENABLED !== "false";

    const categoryPosition = process.env.NEXT_PUBLIC_BLOG_CATEGORY_POSITION || "above-title";
    const tagsMaxVisible = Number.parseInt(process.env.NEXT_PUBLIC_BLOG_TAGS_MAX_VISIBLE || "3", 10) || 3;

    const visibleTags = Array.isArray(tags) ? tags.slice(0, tagsMaxVisible) : [];
    const hiddenTagsCount = Array.isArray(tags) && tags.length > tagsMaxVisible ? tags.length - tagsMaxVisible : 0;

    const labelStrategy = process.env.NEXT_PUBLIC_BLOG_CATEGORY_LABEL_STRATEGY || "i18n-first";

    const resolvedLocale = currentLocale === "en-US" ? "en-US" : "zh-CN";

    const categoryLabel = (() => {
        if (!category) return undefined;
        const id = category.id;
        if (labelStrategy === "frontmatter-first") {
            if (resolvedLocale === "en-US" && category.labelEn) return category.labelEn;
            if (resolvedLocale !== "en-US" && category.labelZh) return category.labelZh;
            return id;
        }
        if (resolvedLocale === "en-US") {
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

    const getTagClassName = (tag: string) => {
        const index = getVariantIndex(tag);
        const variantClass = style[`blog_card_tag_variant_${index}`] || "";
        return `${style.blog_card_tag} ${variantClass}`.trim();
    };

    const getCategoryClassName = (label: string, inline: boolean) => {
        const index = getVariantIndex(label);
        const base = inline ? "blog_card_category_inline" : "blog_card_category";
        const baseClass = style[base] || "";
        const variantClass = style[`${base}_variant_${index}`] || "";
        return `${baseClass} ${variantClass}`.trim();
    };

    return (
        <div className={style.blog_card_wrapper}>
            <div className={style.blog_card_container} style={cardStyle}>
                {showCategory && category && categoryPosition === "above-title" && categoryLabel && (
                    category.id
                        ? (
                            <Link href={`/category/${encodeURIComponent(category.id)}`} className={getCategoryClassName(categoryLabel, false)}>
                                {categoryLabel}
                            </Link>
                        )
                        : (
                            <div className={getCategoryClassName(categoryLabel, false)}>{categoryLabel}</div>
                        )
                )}
                <Link className={style.blog_card_title} href={`/blog/${articleId}`}>
                    {categoryPosition === "inline-title" && showCategory && category && categoryLabel && (
                        <span className={getCategoryClassName(categoryLabel, true)}>{categoryLabel}</span>
                    )}
                    {articleTitle}
                </Link>
                <p className={style.blog_card_description}>{articleDescription}</p>
                {showTags && visibleTags.length > 0 && (
                    <div className={style.blog_card_tags}>
                        <span className={style.blog_card_tag_icon}>
                            <FaTag />
                        </span>
                        {visibleTags.map(tag => (
                            <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`} className={getTagClassName(tag)}>
                                {tag}
                            </Link>
                        ))}
                        {hiddenTagsCount > 0 && (
                            <span className={style.blog_card_tag_more}>+{hiddenTagsCount}</span>
                        )}
                    </div>
                )}
                <div className={style.blog_card_info}>
                    <p className={style.blog_card_date}>
                        <AiFillCalendar aria-hidden="true" /> 
                        {formattedDate} 
                    </p>
                    <Link className={style.blog_card_link} href={`/blog/${articleId}`} aria-label={`阅读更多关于 ${articleTitle}`}>
                        Read More <FaAngleRight aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default BlogCard;
