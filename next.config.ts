import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
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
