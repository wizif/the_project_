/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'export',  // ← MUST HAVE THIS
  images: {
    unoptimized: true,  // ← MUST HAVE THIS
  },
  trailingSlash: true,  // ← HELPS WITH ROUTING
};

export default nextConfig;
