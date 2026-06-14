import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
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
