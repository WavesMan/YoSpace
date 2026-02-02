import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface PostCategory {
    id: string;
    labelZh?: string;
    labelEn?: string;
    i18nKey?: string;
    colorToken?: string;
    order?: number;
}

export interface PostSeries {
    id: string;
    index?: number;
    label?: string;
}

export interface PostItem {
    title: string;
    description: string;
    slug: string;
    publishedTime: string;
    isPinned?: boolean;
    isRecommended?: boolean;
    recommendRank?: number;
    pinnedRank?: number;
    category?: PostCategory;
    tags?: string[];
    series?: PostSeries;
}

export interface PostListResponse {
    items: PostItem[];
    total: number;
    locale?: string;
}

export interface PostContentResponse {
    title: string;
    content: string;
    publishedTime: string;
    isPinned?: boolean;
    isRecommended?: boolean;
    recommendRank?: number;
    pinnedRank?: number;
    locale?: string;
    description?: string;
    category?: PostCategory;
    tags?: string[];
    series?: PostSeries;
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
        
        const { slug } = parseFileMetadata(fileName);

        const rawRank = (data as unknown as { recommendRank?: unknown }).recommendRank;
        let recommendRank: number | undefined;
        if (typeof rawRank === 'number' && Number.isFinite(rawRank)) {
            recommendRank = rawRank;
        } else if (typeof rawRank === 'string') {
            const parsed = parseInt(rawRank, 10);
            if (Number.isFinite(parsed)) {
                recommendRank = parsed;
            }
        }

        const rawPinnedRank = (data as unknown as { pinnedRank?: unknown }).pinnedRank;
        let pinnedRank: number | undefined;
        if (typeof rawPinnedRank === 'number' && Number.isFinite(rawPinnedRank)) {
            pinnedRank = rawPinnedRank;
        } else if (typeof rawPinnedRank === 'string') {
            const parsedPinned = parseInt(rawPinnedRank, 10);
            if (Number.isFinite(parsedPinned)) {
                pinnedRank = parsedPinned;
            }
        }

        return {
            slug,
            title: data.title || slug,
            description: data.description || '',
            publishedTime: data.date || '',
            isPinned: data.isPinned || false,
            isRecommended: data.isRecommended || false,
            recommendRank,
            pinnedRank,
            category: data.category,
            tags: Array.isArray(data.tags) ? data.tags : undefined,
            series: data.series,
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
    const candidates: { fileName: string; locale: string }[] = [];

    if (locale === 'en') {
        candidates.push({ fileName: `${slug}.md`, locale: 'en' });
        candidates.push({ fileName: `${slug}.zh-CN.md`, locale: 'zh-CN' });
    } else if (locale === 'zh-Hans') {
        candidates.push({ fileName: `${slug}.zh-CN.md`, locale: 'zh-CN' });
        candidates.push({ fileName: `${slug}.md`, locale: 'en' });
    } else {
        candidates.push({ fileName: `${slug}.${locale}.md`, locale });
        if (locale !== 'zh-CN') {
            candidates.push({ fileName: `${slug}.zh-CN.md`, locale: 'zh-CN' });
        }
        if (locale !== 'en') {
            candidates.push({ fileName: `${slug}.md`, locale: 'en' });
        }
    }

    let selectedPath: string | null = null;
    let selectedLocale = locale;

    for (const item of candidates) {
        const fullPathCandidate = path.join(postsDirectory, item.fileName);
        if (fs.existsSync(fullPathCandidate)) {
            selectedPath = fullPathCandidate;
            selectedLocale = item.locale;
            break;
        }
    }

    if (!selectedPath) {
        throw new Error(`Post not found: ${slug} (${locale})`);
    }

    const fileContents = fs.readFileSync(selectedPath, 'utf8');
    const { data, content } = matter(fileContents);

    const rawRank = (data as unknown as { recommendRank?: unknown }).recommendRank;
    let recommendRank: number | undefined;
    if (typeof rawRank === 'number' && Number.isFinite(rawRank)) {
        recommendRank = rawRank;
    } else if (typeof rawRank === 'string') {
        const parsed = parseInt(rawRank, 10);
        if (Number.isFinite(parsed)) {
            recommendRank = parsed;
        }
    }

    const rawPinnedRank = (data as unknown as { pinnedRank?: unknown }).pinnedRank;
    let pinnedRank: number | undefined;
    if (typeof rawPinnedRank === 'number' && Number.isFinite(rawPinnedRank)) {
        pinnedRank = rawPinnedRank;
    } else if (typeof rawPinnedRank === 'string') {
        const parsedPinned = parseInt(rawPinnedRank, 10);
        if (Number.isFinite(parsedPinned)) {
            pinnedRank = parsedPinned;
        }
    }

    return {
        title: data.title || slug,
        content: content,
        publishedTime: data.date || '',
        isPinned: data.isPinned || false,
        isRecommended: data.isRecommended || false,
        recommendRank,
        pinnedRank,
        locale: selectedLocale,
        description: data.description || '',
        category: data.category,
        tags: Array.isArray(data.tags) ? data.tags : undefined,
        series: data.series
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
