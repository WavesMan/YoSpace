import { DEFAULT_RUNTIME_PUBLIC_CONFIG } from "@/config/runtimePublicConfig";
import { PostItem } from "./content/local";

interface FeedGeneratorOptions {
  baseUrl?: string;
  siteTitle?: string;
  siteDescription?: string;
  authorName?: string;
  atomFeedPath?: string;
}

const DEFAULT_AUTHOR_NAME = "Author";

/**
 * 生成 RSS 2.0 订阅内容。
 * @param posts 博客文章列表
 * @param options 订阅生成可选配置
 * @returns RSS XML 内容
 */
export function generateRSS(posts: PostItem[], options: FeedGeneratorOptions = {}): string {
  const baseUrl = options.baseUrl || DEFAULT_RUNTIME_PUBLIC_CONFIG.NEXT_PUBLIC_SITE_URL;
  const siteTitle = options.siteTitle || DEFAULT_RUNTIME_PUBLIC_CONFIG.NEXT_PUBLIC_SITE_TITLE;
  const siteDescription = options.siteDescription || DEFAULT_RUNTIME_PUBLIC_CONFIG.NEXT_PUBLIC_SITE_DESCRIPTION;

  const items = posts.map((post) => {
    const postUrl = `${baseUrl}/blog/${post.slug}`;
    const pubDate = new Date(post.publishedTime).toUTCString();

    return `
      <item>
        <title>${escapeXML(post.title)}</title>
        <link>${postUrl}</link>
        <guid isPermaLink="true">${postUrl}</guid>
        <pubDate>${pubDate}</pubDate>
        <description>${escapeXML(post.description || "")}</description>
      </item>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXML(siteTitle)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXML(siteDescription)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;
}

/**
 * 生成 ATOM 1.0 订阅内容。
 * @param posts 博客文章列表
 * @param options 订阅生成可选配置
 * @returns ATOM XML 内容
 */
export function generateATOM(posts: PostItem[], options: FeedGeneratorOptions = {}): string {
  const baseUrl = options.baseUrl || DEFAULT_RUNTIME_PUBLIC_CONFIG.NEXT_PUBLIC_SITE_URL;
  const siteTitle = options.siteTitle || DEFAULT_RUNTIME_PUBLIC_CONFIG.NEXT_PUBLIC_SITE_TITLE;
  const authorName = options.authorName || DEFAULT_AUTHOR_NAME;
  const atomFeedPath = options.atomFeedPath || DEFAULT_RUNTIME_PUBLIC_CONFIG.NEXT_PUBLIC_ATOM_FEED_PATH;
  const updated = new Date().toISOString();

  const entries = posts.map((post) => {
    const postUrl = `${baseUrl}/blog/${post.slug}`;
    const published = new Date(post.publishedTime).toISOString();
    const updatedTime = new Date(post.publishedTime).toISOString();

    return `
    <entry>
      <title type="html">${escapeXML(post.title)}</title>
      <link href="${postUrl}" rel="alternate"/>
      <id>${postUrl}</id>
      <published>${published}</published>
      <updated>${updatedTime}</updated>
      <summary type="html">${escapeXML(post.description || "")}</summary>
      <author>
        <name>${escapeXML(authorName)}</name>
      </author>
    </entry>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXML(siteTitle)}</title>
  <link href="${baseUrl}" rel="alternate"/>
  <link href="${baseUrl}${atomFeedPath}" rel="self"/>
  <id>${baseUrl}</id>
  <updated>${updated}</updated>
  <author>
    <name>${escapeXML(authorName)}</name>
  </author>
  ${entries}
</feed>`;
}

/**
 * XML 特殊字符转义函数。
 * @param str 需要转义的字符串
 * @returns 转义后的字符串
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
