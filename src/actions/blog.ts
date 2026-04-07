'use server';

import { PostListResponse, PostContentResponse } from '@/utils/content/local';
import { fetchPublicPostContentBySlug, fetchPublicPostsList } from '@/server/content/service';

/**
 * 获取博客文章列表
 *
 * 根据配置决定从本地 Markdown 文件系统或数据库读取文章列表，
 * 对调用方屏蔽数据源差异，始终返回统一的 PostListResponse 结构。
 *
 * @param offset 分页偏移量（从 0 开始）
 * @param limit 每页条目数
 * @param locale 目标语言标识
 * @returns 文章列表响应结构
 */
export async function fetchPostsListAction(offset: number, limit: number, locale: string): Promise<PostListResponse> {
    try {
        return await fetchPublicPostsList(offset, limit, locale);
    } catch (error) {
        console.error('Failed to fetch posts list:', error);
        throw new Error('Failed to fetch posts');
    }
}

/**
 * 获取博客文章详情
 *
 * 根据配置决定从本地 Markdown 文件系统或数据库读取文章内容，
 * 当底层实现抛出异常时统一转换为 Post not found 错误，避免透出内部实现。
 *
 * @param slug 文章唯一标识
 * @param locale 目标语言标识
 * @returns 文章详情响应结构
 */
export async function fetchPostContentAction(slug: string, locale: string): Promise<PostContentResponse> {
    try {
        const result = await fetchPublicPostContentBySlug(slug, locale);
        return result.content;
    } catch (error) {
        console.error(`Failed to fetch post content for slug ${slug}:`, error);
        throw new Error('Post not found');
    }
}
