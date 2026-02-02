import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// NOTE: 本地 Markdown 博文类型定义，用于替代远程 CMS 文档结构
export interface PostItem {
    title: string;
    description: string;
    slug: string;
    publishedTime: string;
    isPinned?: boolean;
}

export interface PostListResponse {
    items: PostItem[];
    total: number;
    locale?: string;
}

export interface PostContentResponse {
    title: string;
    // NOTE: 文章主体内容，Markdown 文本
    content: string;
    publishedTime: string;
    isPinned?: boolean;
    locale?: string;
    description?: string;
}

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

// NOTE: 从文件名中解析 slug 与语言，默认语言为 en
// 命名约定：slug.md（默认英文）或 slug.locale.md（例如 slug.zh-CN.md）
const parseFileMetadata = (fileName: string) => {
    const parts = fileName.replace(/\.md$/, '').split('.');
    const slug = parts[0];
    const locale = parts.length > 1 ? parts.slice(1).join('.') : 'en'; // e.g. 'zh-CN' or 'en'
    return { slug, locale };
};

// NOTE: 读取本地 posts 目录下指定语言的文章列表，并按时间倒序分页
export const getLocalPostsList = async (offset: number, limit: number, locale: string = 'en'): Promise<PostListResponse> => {
    if (!fs.existsSync(postsDirectory)) {
        return { items: [], total: 0, locale };
    }

    const fileNames = fs.readdirSync(postsDirectory);

    // NOTE: 根据 locale 过滤对应语言的 Markdown 文件
    // - locale 为 en 时匹配无语言后缀的 *.md
    // - 其他语言匹配以 .{locale}.md 结尾的文件
    const filteredFiles = fileNames.filter(fileName => {
        if (!fileName.endsWith('.md')) return false;
        if (locale === 'en') {
             // Match hello.md but not hello.zh-CN.md
             // Check if there are multiple dots?
             // hello.md -> parts: ['hello', 'md']
             // hello.zh-CN.md -> parts: ['hello', 'zh-CN', 'md']
             const parts = fileName.split('.');
             return parts.length === 2; // only [slug, md]
        } else {
            return fileName.endsWith(`.${locale}.md`);
        }
    });

    const allPostsData = filteredFiles.map(fileName => {
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data } = matter(fileContents);
        
        // NOTE: 从文件名中提取 slug（去除语言后缀）
        const { slug } = parseFileMetadata(fileName);

        return {
            slug,
            title: data.title || slug,
            description: data.description || '',
            publishedTime: data.date || '',
            isPinned: data.isPinned || false,
            // NOTE: 保留时间对象用于排序，不暴露给最终返回结果
            dateObj: new Date(data.date || 0)
        };
    });

    // NOTE: 按发布时间倒序排列文章
    const sortedPosts = allPostsData.sort((a, b) => {
        return b.dateObj.getTime() - a.dateObj.getTime();
    });

    const paginatedPosts = sortedPosts.slice(offset * limit, (offset + 1) * limit);

    return {
        items: paginatedPosts.map(({ dateObj, ...rest }) => {
            void dateObj;
            return rest;
        }),
        total: sortedPosts.length,
        locale
    };
};

export const getLocalPostContent = async (slug: string, locale: string = 'en'): Promise<PostContentResponse> => {
    // NOTE: 根据 slug 与语言构造文件名，优先使用语言后缀；英文默认为 slug.md
    let fileName = `${slug}.${locale}.md`;
    if (locale === 'en') {
        fileName = `${slug}.md`;
    }
    
    let fullPath = path.join(postsDirectory, fileName);

    if (!fs.existsSync(fullPath)) {
         // NOTE: 为兼容部分场景，将 zh-Hans 归一为 zh-CN 文件后缀
         if (locale === 'zh-Hans') fileName = `${slug}.zh-CN.md`;
         fullPath = path.join(postsDirectory, fileName);
    }

    if (!fs.existsSync(fullPath)) {
        throw new Error(`Post not found: ${slug} (${locale})`);
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
        title: data.title || slug,
        content: content,
        publishedTime: data.date || '',
        isPinned: data.isPinned || false,
        locale,
        description: data.description || ''
    };
};

// NOTE: 返回去重后的本地文章 slug 列表，可用于生成静态路由
export const getAllLocalPostSlugs = async () => {
    if (!fs.existsSync(postsDirectory)) {
        return [];
    }
    const fileNames = fs.readdirSync(postsDirectory);
    // NOTE: 使用 Set 去重得到所有唯一的 slug
    const slugs = new Set(fileNames.map(fileName => parseFileMetadata(fileName).slug));
    return Array.from(slugs).map(slug => ({ slug }));
};
