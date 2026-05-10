'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Box, Edges, Float, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

function RotatingBox() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.cos(t / 4) * 0.2
      meshRef.current.rotation.y = Math.sin(t / 2) * 0.4
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Box ref={meshRef} args={[3, 2.2, 2]} castShadow>
        <meshStandardMaterial 
          color="#1a1a2e" 
          roughness={0.3}
          metalness={0.8}
          emissive="#00FFD1"
          emissiveIntensity={0.1}
        />
        <Edges 
          linewidth={4} 
          threshold={15} 
          color="#00FFD1" 
        />
      </Box>
    </Float>
  )
}

export default function BoxPreview({
  width = 580,
  height = 580,
}: {
  width?: number
  height?: number
}) {
  return (
    <div style={{ width, height }} className="relative">
      <Suspense fallback={<div className="w-full h-full bg-[#0A0A0F]/50 animate-pulse rounded-[80px]" />}>
        <Canvas dpr={[1, 2]} shadows camera={{ position: [5, 5, 5], fov: 40 }}>
          <ambientLight intensity={1} />
          <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
          <pointLight position={[-10, -10, -10]} color="#00FFD1" intensity={1} />
          
          <RotatingBox />
          
          <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4.5} />
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate={true}
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}
