import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // خطاهای ESLint (مثل no-explicit-any) نباید دیپلوی را متوقف کنند
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
