import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore TypeScript errors in the backend folder during build
    ignoreBuildErrors: false,
  },
  eslint: {
    // Only run ESLint on the following directories during production builds
    dirs: ['app', 'components', 'lib'],
  },
};

export default nextConfig;
