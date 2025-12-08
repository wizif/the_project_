/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // ✅ Remove output: 'export' - it breaks dynamic features!
  // ✅ Use standalone for SSR support
};

export default nextConfig;
