import React from "react";
import Link from "next/link";
import { AiFillCalendar } from "react-icons/ai";
import { FaAngleRight } from "react-icons/fa";
import style from "./BlogCard.module.css";

/**
 * BlogCard 组件 Props 接口
 */
interface BlogCardProps {
    articleId: string; // 文章 ID (slug)
    articleTitle: string; // 文章标题
    articleDescription: string; // 文章描述
    articleDate?: string; // 文章发布日期
    cardStyle?: React.CSSProperties; // 自定义样式（用于动画延迟等）
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
    cardStyle 
}) => {

    // 格式化日期
    const formattedDate = articleDate
        ? new Date(articleDate).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : "Unknown Date";

    return (
        <div className={style.blog_card_wrapper}>
            <div className={style.blog_card_container} style={cardStyle}>
                <Link className={style.blog_card_title} href={`/blog/${articleId}`}>
                    {articleTitle}
                </Link>
                <p className={style.blog_card_description}>{articleDescription}</p>
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
