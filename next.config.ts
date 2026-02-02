import type { NextConfig } from "next";

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

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      allowedOrigins: serverActionsAllowedOrigins.length > 0 ? serverActionsAllowedOrigins : undefined,
    },
  } as NonNullable<NextConfig['experimental']>,
  async rewrites() {
    return [
      {
        source: '/api/music-proxy/:path*',
        destination: 'https://netmusic.waveyo.cn/:path*',
      },
    ];
  },
};

export default nextConfig;
