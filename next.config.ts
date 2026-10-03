import type { NextConfig } from "next";

const parseImageHostnames = (value: string | undefined) => {
  return Array.from(
    new Set(
      (value || 'cloud.waveyo.cn,i.scdn.co,*.music.126.net,vercel.com,skillicons.dev,img.shields.io')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
};

const parseAllowedOrigins = (value: string | undefined) => {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const serverActionsAllowedOrigins = Array.from(
  new Set([
    ...parseAllowedOrigins(process.env.SERVER_ACTIONS_ALLOWED_ORIGINS),
    process.env.VERCEL_URL,
  ].filter(Boolean) as string[])
);

const imageHostnames = parseImageHostnames(process.env.IMAGE_HOSTNAMES);
const musicApiBase = (process.env.NEXT_PUBLIC_MUSIC_API_BASE || 'https://netmusic.waveyo.cn/').replace(/\/$/, '');

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: parseAllowedOrigins(process.env.ALLOWED_DEV_ORIGINS ?? '192.168.1.3'),
  images: {
    remotePatterns: imageHostnames.map((hostname) => ({
      protocol: 'https',
      hostname,
      pathname: '/**',
    })),
  },
  experimental: {
    serverActions: {
      allowedOrigins: serverActionsAllowedOrigins.length > 0 ? serverActionsAllowedOrigins : undefined,
    },
    cssChunking: "strict",
  } as NonNullable<NextConfig['experimental']>,
  async rewrites() {
    return [
      {
        source: '/api/music-proxy/:path*',
        destination: `${musicApiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
