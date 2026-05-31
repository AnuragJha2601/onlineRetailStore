import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'stdhanak2026prod.blob.core.windows.net',
        pathname: '/product-thumbnails/**',
      },
    ],
  },
};

export default nextConfig;
