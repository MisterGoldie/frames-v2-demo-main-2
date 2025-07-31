/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove typescript.ignoreBuildErrors if you want faster builds
  // Or keep it if you have type errors you can't fix immediately
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  // Add these for better performance
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['@farcaster/frame-sdk', 'framer-motion']
  }
}

module.exports = nextConfig