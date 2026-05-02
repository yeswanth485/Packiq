'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Box, Edges, PerspectiveCamera, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

function BoxModel({ dims }: { dims: { l: number, w: number, h: number } }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Normalize size for viewing
  const maxDim = Math.max(dims.l, dims.w, dims.h)
  const scale = 3 / maxDim
  const finalDims: [number, number, number] = [dims.l * scale, dims.h * scale, dims.w * scale]

  return (
    <group>
      <Box ref={meshRef} args={finalDims}>
        <meshStandardMaterial color="#00E5CC" roughness={0.3} metalness={0.8} transparent opacity={0.6} />
        <Edges linewidth={2} color="#ffffff" />
      </Box>
      {/* Internal "Product" placeholder */}
      <Box args={[finalDims[0]*0.8, finalDims[1]*0.8, finalDims[2]*0.8]}>
        <meshStandardMaterial color="#3B82F6" opacity={0.3} transparent />
      </Box>
    </group>
  )
}

export default function OptimizedBoxViewer({ dimensions }: { dimensions: string }) {
  // Parse dimensions like "10*20*30"
  const parts = dimensions.toLowerCase().replace(/x/g, '*').split('*')
  const dims = {
    l: parseFloat(parts[0]) || 1,
    w: parseFloat(parts[1]) || 1,
    h: parseFloat(parts[2]) || 1
  }

  return (
    <div className="w-full h-[300px] bg-[#0A0A0F] rounded-2xl border border-white/5 relative overflow-hidden">
      <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-500">Loading 3D Preview...</div>}>
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
          
          <BoxModel dims={dims} />
          
          <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
          <OrbitControls enableZoom={true} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </Suspense>
      
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-[10px] text-gray-400">
        Rotate: Drag | Zoom: Scroll
      </div>
    </div>
  )
}
