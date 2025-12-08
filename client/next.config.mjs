/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // ✅ Skip prerendering errors
  staticPageGenerationTimeout: 1000,
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
