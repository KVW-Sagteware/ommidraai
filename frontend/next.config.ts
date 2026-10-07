import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.32.9.2"],

  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://backend:8000/:path*', // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
