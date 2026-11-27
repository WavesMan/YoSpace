import type { NextConfig } from "next";
import seoData from "./src/data/seo.json";

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

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  async redirects() {
    return [{
      source: "/:path*",
      has: [{ type: "host", value: "(?:yospace\\.waveyo\\.cn|waveyo\\.cn)" }],
      destination: `${seoData.siteUrl}/:path*`,
      permanent: true,
    }];
  },
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
  } as NonNullable<NextConfig['experimental']>,
};

export default nextConfig;
