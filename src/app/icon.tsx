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
export default async function Icon() {
  try {
    // 获取环境变量配置的路径，默认为 /weilai.png
    // 移除开头的斜杠以适配 path.join
    const configPath = process.env.NEXT_PUBLIC_FAVICON_URL || 'https://cloud.waveyo.cn//Services/websites/home/images/icon/favicon.ico';

    let imageBuffer: Buffer;

    if (configPath.startsWith('data:')) {
      const match = /^data:([^;]+);base64,([\s\S]*)$/.exec(configPath);
      if (!match) {
        throw new Error('Invalid data URL for favicon');
      }
      imageBuffer = Buffer.from(match[2], 'base64');
    } else if (configPath.startsWith('http://') || configPath.startsWith('https://')) {
      const res = await fetch(configPath);
      if (!res.ok) {
        throw new Error(`Failed to fetch favicon: ${res.status} ${res.statusText}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      const cleanPath = configPath.startsWith('/') ? configPath.slice(1) : configPath;
      const filePath = join(process.cwd(), 'public', cleanPath);
      if (existsSync(filePath)) {
        imageBuffer = readFileSync(filePath);
      } else {
        const fallbackPath = join(process.cwd(), 'public', 'weilai.png');
        if (existsSync(fallbackPath)) {
          imageBuffer = readFileSync(fallbackPath);
        } else {
          throw new Error(`Favicon file not found at ${filePath} or ${fallbackPath}`);
        }
      }
    }

    // 简单的 MIME 类型检测
    let mimeType = 'image/png';
    const head2Hex = imageBuffer.subarray(0, 2).toString('hex').toUpperCase();
    const head3Hex = imageBuffer.subarray(0, 3).toString('hex').toUpperCase();
    const head4Hex = imageBuffer.subarray(0, 4).toString('hex').toUpperCase();
    const head6Ascii = imageBuffer.subarray(0, 6).toString('ascii');
    const head12Ascii = imageBuffer.subarray(0, 12).toString('ascii');
    const head200Text = imageBuffer.subarray(0, 200).toString('utf8');

    if (head4Hex === '00000100') {
      mimeType = 'image/x-icon';
    } else if (head4Hex === '00000200') {
      mimeType = 'image/x-icon';
    } else if (head6Ascii.startsWith('GIF8')) {
      mimeType = 'image/gif';
    } else if (head2Hex === '424D') {
      mimeType = 'image/bmp';
    } else if (head4Hex === '52494646' && head12Ascii.slice(8, 12) === 'WEBP') {
      mimeType = 'image/webp';
    } else if (head3Hex === 'FFD8FF') {
      mimeType = 'image/jpeg';
    } else if (head4Hex === '89504E47') {
      mimeType = 'image/png';
    } else if (head12Ascii.slice(4, 8) === 'ftyp') {
      const brand = head12Ascii.slice(8, 12);
      if (brand === 'avif' || brand === 'avis') {
        mimeType = 'image/avif';
      } else if (brand === 'heic' || brand === 'heix' || brand === 'hevc' || brand === 'hevx' || brand === 'mif1') {
        mimeType = 'image/heif';
      }
    } else if (head200Text.trimStart().startsWith('<svg')) {
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

  } catch {
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
