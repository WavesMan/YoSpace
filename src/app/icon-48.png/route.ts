import { resolveCirclePngBuffer } from '../favicon-utils';

export const runtime = 'nodejs';

const ICON_SIZE = 48;

/**
 * 输出 48x48 PNG 图标
 *
 * 使用示例：
 * // 浏览器请求 /icon-48.png 自动触发
 *
 * @returns PNG 图标响应
 */
export const GET = async () => {
  try {
    const buffer = await resolveCirclePngBuffer(ICON_SIZE);
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
};
