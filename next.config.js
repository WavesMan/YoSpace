/** @type {import('next').NextConfig} */

// 从环境变量中读取允许的图片域名，并提供一个默认列表
const imageHostnames = Array.from(
  new Set(
    (process.env.IMAGE_HOSTNAMES || 'cloud.waveyo.cn,i.scdn.co,**.music.126.net,vercel.com')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )
);

// 从环境变量中读取音乐 API 基础地址，并移除末尾斜杠
const musicApiBase = (process.env.NEXT_PUBLIC_MUSIC_API_BASE || 'https://netmusic.waveyo.cn/').replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,
  images: {
    // 动态生成 remotePatterns
    remotePatterns: imageHostnames.map(hostname => ({
      protocol: 'https',
      hostname,
    })),
  },
  async rewrites() {
    return [
      {
        source: '/api/music-proxy/:path*',
        destination: `${musicApiBase}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
