import { resolveCircleSvg } from './favicon-utils';

// 路由段配置
export const runtime = 'nodejs';

// 图片元数据
export const size = {
  width: 256,
  height: 256,
};
export const contentType = 'image/svg+xml'; // 修改为 SVG

// 图像生成
export default async function Icon() {
  try {
    const svg = await resolveCircleSvg(size.width);

    return new Response(svg, {
        headers: {
            'Content-Type': 'image/svg+xml',
            // 简单的缓存策略
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });

  } catch {
    // 回退图标（SVG 圆形与字母）
    const fallbackSvg = `
<svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${size.width / 2}" cy="${size.height / 2}" r="${size.width / 2}" fill="black" />
  <text 
    x="50%" 
    y="50%" 
    dy=".35em" 
    text-anchor="middle" 
    fill="white" 
    font-size="${size.width / 2}" 
    font-family="Arial, sans-serif"
  >W</text>
</svg>
    `.trim();
    
    return new Response(fallbackSvg, {
        headers: {
            'Content-Type': 'image/svg+xml',
        },
    });
  }
}
