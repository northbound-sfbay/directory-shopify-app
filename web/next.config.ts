import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/sitemap.xml", destination: "/api/sitemap" },
      { source: "/ads.txt", destination: "/api/ads-txt" },
    ];
  },
};

export default nextConfig;
