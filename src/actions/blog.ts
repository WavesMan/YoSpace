'use server';

import { getLocalPostsList, getLocalPostContent, PostListResponse, PostContentResponse } from '@/utils/content/local';

// 从本地文件系统获取博客文章列表
export async function fetchPostsListAction(offset: number, limit: number, locale: string): Promise<PostListResponse> {
    try {
        return await getLocalPostsList(offset, limit, locale);
    } catch (error) {
        console.error('Failed to fetch posts list:', error);
        throw new Error('Failed to fetch posts');
    }
}

// 从本地文件系统获取博客文章内容
export async function fetchPostContentAction(slug: string, locale: string): Promise<PostContentResponse> {
    try {
        return await getLocalPostContent(slug, locale);
    } catch (error) {
        console.error(`Failed to fetch post content for slug ${slug}:`, error);
        throw new Error('Post not found');
    }
}
