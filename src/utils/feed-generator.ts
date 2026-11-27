import type { PostItem } from './content/local';
import { seoConfig, toSeoDate } from './seo';

/**
 * RSS/ATOM 订阅生成工具
 * 
 * 提供静态化订阅文件生成功能，支持 RSS 2.0 和 ATOM 1.0 格式
 * 在构建时生成订阅文件，适配静态部署环境
 */

/**
 * 生成 RSS 2.0 格式订阅内容
 * 
 * @param posts 博客文章列表
 * @param baseUrl 网站基础URL
 * @returns RSS XML 内容
 */
export function generateRSS(posts: PostItem[], baseUrl: string = seoConfig.siteUrl): string {
  const siteTitle = seoConfig.siteName;
  const siteDescription = seoConfig.defaultDescription;
  
  const items = posts.map(post => {
    const postUrl = `${baseUrl}/blog/${encodeURIComponent(post.slug)}`;
    const published = toSeoDate(post.publishedTime);
    const pubDate = published ? new Date(published).toUTCString() : undefined;
    
    return `
      <item>
        <title>${escapeXML(post.title)}</title>
        <link>${postUrl}</link>
        <guid isPermaLink="true">${postUrl}</guid>
        ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
        <description>${escapeXML(post.description || '')}</description>
      </item>`;
  }).join('');

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
 * 生成 ATOM 1.0 格式订阅内容
 * 
 * @param posts 博客文章列表
 * @param baseUrl 网站基础URL
 * @returns ATOM XML 内容
 */
export function generateATOM(posts: PostItem[], baseUrl: string = seoConfig.siteUrl): string {
  const siteTitle = seoConfig.siteName;
  const siteUrl = baseUrl;
  const updated = posts.map(post => toSeoDate(post.updatedTime) ?? toSeoDate(post.publishedTime))
    .filter(Boolean).sort().at(-1) || new Date().toISOString();
  
  const entries = posts.map(post => {
    const postUrl = `${baseUrl}/blog/${encodeURIComponent(post.slug)}`;
    const published = toSeoDate(post.publishedTime);
    const modified = toSeoDate(post.updatedTime) ?? published ?? updated;
    
    return `
    <entry>
      <title type="html">${escapeXML(post.title)}</title>
      <link href="${postUrl}" rel="alternate"/>
      <id>${postUrl}</id>
      ${published ? `<published>${published}</published>` : ''}
      <updated>${modified}</updated>
      <summary type="html">${escapeXML(post.description || '')}</summary>
      <author>
        <name>${escapeXML(seoConfig.siteName)}</name>
      </author>
    </entry>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXML(siteTitle)}</title>
  <link href="${siteUrl}" rel="alternate"/>
  <link href="${baseUrl}${process.env.NEXT_PUBLIC_ATOM_FEED_PATH || '/feeds/atom.xml'}" rel="self"/>
  <id>${siteUrl}</id>
  <updated>${updated}</updated>
  <author>
    <name>${escapeXML(seoConfig.siteName)}</name>
  </author>
  ${entries}
</feed>`;
}

/**
 * XML 特殊字符转义函数
 * 
 * @param str 需要转义的字符串
 * @returns 转义后的字符串
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}