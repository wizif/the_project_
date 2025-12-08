/** @type {import('next').NextConfig} */
const nextConfig = {
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: "https",
  //       hostname: "pm-s3-images-neqw.s3.eu-north-1.amazonaws.com",
  //       port: "",
  //       pathname: "/**",
  //     }
  //   ]
  // },
  eslint: {
    ignoreDuringBuilds: true,  // ✅ ADD THIS LINE
  },
  typescript: {
    ignoreBuildErrors: true,  // ✅ ADD THIS LINE
  },
};

export default nextConfig;
