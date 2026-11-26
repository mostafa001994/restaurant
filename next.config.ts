<<<<<<< HEAD
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    experimental: {
    // turbo: false
  }


};

export default nextConfig;
=======
import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        // پاسخ‌های احراز هویت هرگز نباید کش شوند
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

export default config;
>>>>>>> 34bf24593a230c586d76f66effe63e65f5219641
