'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Box, Edges } from '@react-three/drei'
import * as THREE from 'three'

function RotatingWireframeCube() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.15
      meshRef.current.rotation.y += delta * 0.2
    }
  })

  return (
    <Box ref={meshRef} args={[2.5, 2.5, 2.5]}>
      {/* Semi-transparent core */}
      <meshPhysicalMaterial 
        color="#00E5CC" 
        transparent 
        opacity={0.05} 
        roughness={0.2}
        metalness={0.8}
        clearcoat={1}
      />
      {/* Glowing edges */}
      <Edges 
        linewidth={3} 
        threshold={15} 
        color="#00E5CC" 
      />
    </Box>
  )
}

export default function Hero3DBox() {
  return (
    <div className="w-full h-full min-h-[400px] relative pointer-events-auto cursor-grab active:cursor-grabbing">
      <Suspense fallback={<div className="w-full h-full bg-[#0A0A0F]/50 animate-pulse rounded-2xl" />}>
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} color="#00E5CC" intensity={2} />
          <pointLight position={[-10, -10, -10]} color="#6366f1" intensity={1} />
          <RotatingWireframeCube />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={0.5} 
          />
        </Canvas>
      </Suspense>
    </div>
  )
}
