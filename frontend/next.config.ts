import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  experimental: {
    optimisticClientCache: true
  }
}

export default nextConfig
