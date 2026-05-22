import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  experimental: {
    optimisticClientCache: true,
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  }
}

export default nextConfig
