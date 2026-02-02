/** @type {import('next').NextConfig} */

// 从环境变量中读取允许的图片域名，并提供一个默认列表
const imageHostnames = (process.env.IMAGE_HOSTNAMES || 'cloud.waveyo.cn,i.scdn.co,**.music.126.net').split(',');

const nextConfig = {
  reactStrictMode: true,
  images: {
    // 动态生成 remotePatterns
    remotePatterns: imageHostnames.map(hostname => ({
      protocol: 'https',
      hostname,
    })),
  },
};

module.exports = nextConfig;
