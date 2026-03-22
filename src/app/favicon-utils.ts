import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

/**
 * 解析外部或本地 favicon 资源为二进制数据
 *
 * 使用示例：
 * const { buffer, mimeType } = await resolveFaviconBuffer();
 *
 * @returns favicon 的二进制数据与 MIME 类型
 */
export const resolveFaviconBuffer = async (): Promise<{ buffer: Buffer; mimeType: string }> => {
  const configPath = process.env.NEXT_PUBLIC_FAVICON_URL
    || 'https://cloud.waveyo.cn//Services/websites/home/images/icon/favicon.ico';

  if (configPath.startsWith('data:')) {
    const match = /^data:([^;]+);base64,([\s\S]*)$/.exec(configPath);
    if (!match) {
      throw new Error('Invalid data URL for favicon');
    }
    return {
      buffer: Buffer.from(match[2], 'base64'),
      mimeType: match[1],
    };
  }

  if (configPath.startsWith('http://') || configPath.startsWith('https://')) {
    const res = await fetch(configPath);
    if (!res.ok) {
      throw new Error(`Failed to fetch favicon: ${res.status} ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return {
      buffer,
      mimeType: resolveMimeType(buffer),
    };
  }

  const cleanPath = configPath.startsWith('/') ? configPath.slice(1) : configPath;
  const filePath = join(process.cwd(), 'public', cleanPath);
  if (!existsSync(filePath)) {
    const fallbackPath = join(process.cwd(), 'public', 'weilai.png');
    if (!existsSync(fallbackPath)) {
      throw new Error(`Favicon file not found at ${filePath} or ${fallbackPath}`);
    }
    const buffer = readFileSync(fallbackPath);
    return { buffer, mimeType: resolveMimeType(buffer) };
  }
  const buffer = readFileSync(filePath);
  return { buffer, mimeType: resolveMimeType(buffer) };
};

/**
 * 基于文件头推断 MIME 类型
 *
 * 使用示例：
 * const mimeType = resolveMimeType(buffer);
 *
 * @param buffer 图片二进制数据
 * @returns MIME 类型
 */
export const resolveMimeType = (buffer: Buffer): string => {
  const head2Hex = buffer.subarray(0, 2).toString('hex').toUpperCase();
  const head3Hex = buffer.subarray(0, 3).toString('hex').toUpperCase();
  const head4Hex = buffer.subarray(0, 4).toString('hex').toUpperCase();
  const head6Ascii = buffer.subarray(0, 6).toString('ascii');
  const head12Ascii = buffer.subarray(0, 12).toString('ascii');
  const head200Text = buffer.subarray(0, 200).toString('utf8');

  if (head4Hex === '00000100' || head4Hex === '00000200') return 'image/x-icon';
  if (head6Ascii.startsWith('GIF8')) return 'image/gif';
  if (head2Hex === '424D') return 'image/bmp';
  if (head4Hex === '52494646' && head12Ascii.slice(8, 12) === 'WEBP') return 'image/webp';
  if (head3Hex === 'FFD8FF') return 'image/jpeg';
  if (head4Hex === '89504E47') return 'image/png';
  if (head12Ascii.slice(4, 8) === 'ftyp') {
    const brand = head12Ascii.slice(8, 12);
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
    if (brand === 'heic' || brand === 'heix' || brand === 'hevc' || brand === 'hevx' || brand === 'mif1') {
      return 'image/heif';
    }
  }
  if (head200Text.trimStart().startsWith('<svg')) return 'image/svg+xml';
  return 'image/png';
};

/**
 * 构建圆形裁切的 SVG 字符串
 *
 * 使用示例：
 * const svg = buildCircleSvg(buffer, mimeType, 180);
 *
 * @param buffer 图片二进制数据
 * @param mimeType 图片 MIME 类型
 * @param size 图标尺寸
 * @returns SVG 字符串
 */
export const buildCircleSvg = (buffer: Buffer, mimeType: string, size: number): string => {
  const base64Image = `data:${mimeType};base64,${buffer.toString('base64')}`;
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="circle-clip">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" />
    </clipPath>
  </defs>
  <image 
    width="${size}" 
    height="${size}" 
    href="${base64Image}" 
    clip-path="url(#circle-clip)" 
    preserveAspectRatio="xMidYMid slice"
  />
</svg>
  `.trim();
};

/**
 * 获取圆形裁切 SVG
 *
 * 使用示例：
 * const svg = await resolveCircleSvg(256);
 *
 * @param size 图标尺寸
 * @returns SVG 字符串
 */
export const resolveCircleSvg = async (size: number): Promise<string> => {
  const { buffer, mimeType } = await resolveFaviconBuffer();
  return buildCircleSvg(buffer, mimeType, size);
};

/**
 * 输出指定尺寸的 PNG 图标
 *
 * 使用示例：
 * const pngBuffer = await resolveCirclePngBuffer(180);
 *
 * @param size 图标尺寸
 * @returns PNG 二进制数据
 */
export const resolveCirclePngBuffer = async (size: number): Promise<Buffer> => {
  const svg = await resolveCircleSvg(size);
  const sharpModule = await import('sharp');
  const sharpInstance = sharpModule.default ?? sharpModule;
  return sharpInstance(Buffer.from(svg))
    .resize(size, size, { fit: 'cover' })
    .png()
    .toBuffer();
};
