import { ImageResponse } from 'next/og';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

// Route segment config
export const runtime = 'nodejs';

// Image metadata
export const size = {
  width: 256,
  height: 256,
};
export const contentType = 'image/svg+xml'; // 修改为 SVG

// Image generation
export default function Icon() {
  console.log('[Icon Generation] Starting (SVG Mode)...');
  try {
    // 获取环境变量配置的路径，默认为 /weilai.png
    // 移除开头的斜杠以适配 path.join
    const configPath = process.env.NEXT_PUBLIC_FAVICON_URL || '/weilai.png';
    const cleanPath = configPath.startsWith('/') ? configPath.slice(1) : configPath;
    
    // 构建绝对路径
    const filePath = join(process.cwd(), 'public', cleanPath);

    let imageBuffer: Buffer;
    
    if (existsSync(filePath)) {
        imageBuffer = readFileSync(filePath);
    } else {
        // 如果找不到文件，尝试读取默认的 weilai.png 或返回错误占位
        const fallbackPath = join(process.cwd(), 'public', 'weilai.png');
        if (existsSync(fallbackPath)) {
            imageBuffer = readFileSync(fallbackPath);
        } else {
             throw new Error(`Favicon file not found at ${filePath} or ${fallbackPath}`);
        }
    }

    // 简单的 MIME 类型检测
    let mimeType = 'image/png'; // 默认
    const magicNumber = imageBuffer.subarray(0, 4).toString('hex').toUpperCase();

    if (magicNumber === '52494646') { // RIFF -> WebP
        mimeType = 'image/webp';
    } else if (magicNumber === 'FFD8FF') { // JPEG
        mimeType = 'image/jpeg';
    } else if (magicNumber === '89504E47') { // PNG
        mimeType = 'image/png';
    } else if (magicNumber === '3C737667') { // <svg (text)
        mimeType = 'image/svg+xml';
    }

    const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
    
    // 构造 SVG 字符串
    // 使用 <clipPath> 实现圆形裁剪
    // 内嵌 base64 图片
    const svg = `
<svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="circle-clip">
      <circle cx="${size.width / 2}" cy="${size.height / 2}" r="${size.width / 2}" />
    </clipPath>
  </defs>
  <image 
    width="${size.width}" 
    height="${size.height}" 
    href="${base64Image}" 
    clip-path="url(#circle-clip)" 
    preserveAspectRatio="xMidYMid slice"
  />
</svg>
    `.trim();

    return new Response(svg, {
        headers: {
            'Content-Type': 'image/svg+xml',
            // 简单的缓存策略
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });

  } catch (e) {
    console.error('[Icon Generation] Failed to generate icon:', e);
    // Fallback icon (SVG circle with letter)
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
