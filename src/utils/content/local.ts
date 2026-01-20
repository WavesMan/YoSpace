import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Redefine types to support Markdown string content instead of Contentful Document
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
    content: string; // Markdown content
    publishedTime: string;
    isPinned?: boolean;
    locale?: string;
    description?: string;
}

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

// Helper: Parse locale from filename or default to 'en'
// Filename format: slug.md (en) or slug.locale.md
const parseFileMetadata = (fileName: string) => {
    const parts = fileName.replace(/\.md$/, '').split('.');
    const slug = parts[0];
    const locale = parts.length > 1 ? parts.slice(1).join('.') : 'en'; // e.g. 'zh-CN' or 'en'
    return { slug, locale };
};

export const getLocalPostsList = async (offset: number, limit: number, locale: string = 'en'): Promise<PostListResponse> => {
    if (!fs.existsSync(postsDirectory)) {
        return { items: [], total: 0, locale };
    }

    const fileNames = fs.readdirSync(postsDirectory);
    
    // Filter files for the requested locale
    // Strategy: 
    // If locale is 'en', look for *.md (where no other locale) or *.en.md?
    // Let's assume:
    // *.md -> default (en)
    // *.zh-CN.md -> zh-CN
    // If requesting 'zh-CN', look for *.zh-CN.md.
    // If requesting 'en', look for *.md (excluding *.zh-CN.md etc) or *.en.md.
    
    // Simplification: exact match on locale suffix, or no suffix for 'en'.
    const targetSuffix = locale === 'en' ? '.md' : `.${locale}.md`;
    
    // Special case: 'en' should also match just '.md' but NOT '.zh-CN.md'
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
        
        // Extract slug from filename (remove locale part)
        const { slug } = parseFileMetadata(fileName);

        return {
            slug,
            title: data.title || slug,
            description: data.description || '',
            publishedTime: data.date || '', // ISO string
            isPinned: data.isPinned || false,
            // Include raw date for sorting
            dateObj: new Date(data.date || 0)
        };
    });

    // Sort posts by date
    const sortedPosts = allPostsData.sort((a, b) => {
        return b.dateObj.getTime() - a.dateObj.getTime();
    });

    const paginatedPosts = sortedPosts.slice(offset * limit, (offset + 1) * limit);

    return {
        items: paginatedPosts.map(({ dateObj, ...rest }) => rest),
        total: sortedPosts.length,
        locale
    };
};

export const getLocalPostContent = async (slug: string, locale: string = 'en'): Promise<PostContentResponse> => {
    // Construct filename based on locale
    // Try specific locale first, then fallback to default if locale is 'en'
    let fileName = `${slug}.${locale}.md`;
    if (locale === 'en') {
        fileName = `${slug}.md`;
    }
    
    let fullPath = path.join(postsDirectory, fileName);
    
    if (!fs.existsSync(fullPath)) {
         // Fallback logic? 
         // If requesting zh-CN and not found, maybe return en?
         // For now, strict match.
         // But wait, user might have requested 'zh-Hans' (Contentful style) but file is 'zh-CN'.
         // I need to normalize locales.
         // In Blog.tsx, we mapped 'zh-CN' -> 'zh-Hans'.
         // My files are 'zh-CN'.
         // I should align file naming with what's passed or normalize inside here.
         // Let's assume the caller passes the correct file suffix or I handle mapping here.
         // The caller (Blog.tsx) passes `locale` from useI18n ('zh-CN' or 'en-US') mapped to Contentful ('zh-Hans' or 'en').
         // I should probably update Blog.tsx to pass 'zh-CN' directly if I use 'zh-CN' in filenames.
         // Let's handle 'zh-Hans' -> 'zh-CN' mapping here for compatibility.
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

export const getAllLocalPostSlugs = async () => {
    if (!fs.existsSync(postsDirectory)) {
        return [];
    }
    const fileNames = fs.readdirSync(postsDirectory);
    // Get unique slugs
    const slugs = new Set(fileNames.map(fileName => parseFileMetadata(fileName).slug));
    return Array.from(slugs).map(slug => ({ slug }));
};
