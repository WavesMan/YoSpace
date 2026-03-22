import { resolveFaviconBuffer } from '../favicon-utils';

/**
 * 输出 favicon.ico 资源
 *
 * 使用示例：
 * // 浏览器请求 /favicon.ico 自动触发
 *
 * @returns favicon 响应
 */
export const GET = async () => {
  try {
    const { buffer, mimeType } = await resolveFaviconBuffer();
    const body = new Uint8Array(buffer);
    return new Response(body, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
};
