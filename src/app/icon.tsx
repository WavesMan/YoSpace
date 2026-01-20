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
export const contentType = 'image/png';

// Image generation
export default function Icon() {
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
             // 如果连默认文件都没有，抛出错误进入 catch
             throw new Error(`Favicon file not found at ${filePath} or ${fallbackPath}`);
        }
    }

    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    return new ImageResponse(
      (
        // ImageResponse JSX element
        <div
          style={{
            fontSize: 24,
            background: 'transparent',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%', // 核心：设置全圆角
            overflow: 'hidden',  // 核心：裁剪溢出内容
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={base64Image}
            alt="Icon"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (e) {
    console.error('Failed to generate icon:', e);
    // Fallback icon (simple circle with letter)
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 128,
            background: '#000',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            borderRadius: '50%',
          }}
        >
          W
        </div>
      ),
      { ...size }
    );
  }
}
