/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["resend"],
  experimental: {
    optimizePackageImports: ["react-icons"],
  },
};

export default nextConfig;
