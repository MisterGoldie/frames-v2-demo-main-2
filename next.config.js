const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Remove swcMinify - it's deprecated in Next.js 15
};

module.exports = nextConfig;