'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Box, Edges, Float } from '@react-three/drei'
import * as THREE from 'three'

function PackagingBox() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smooth floating rotation
      meshRef.current.rotation.y += delta * 0.2
      meshRef.current.rotation.z += delta * 0.1
    }
  })

  return (
    <group>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Box ref={meshRef} args={[2.8, 2, 1.8]}>
          {/* Light Theme Material */}
          <meshStandardMaterial 
            color="#ffffff" 
            roughness={0.2}
            metalness={0.1}
          />
          {/* Bright vibrant edges */}
          <Edges 
            linewidth={2} 
            threshold={15} 
            color="#4361EE" 
          />
          
          {/* Subtle "PackIQ" logo simulation on the box */}
          <mesh position={[0, 0, 0.91]}>
             <planeGeometry args={[1.5, 0.5]} />
             <meshBasicMaterial color="#4361EE" transparent opacity={0.8} />
          </mesh>
        </Box>
      </Float>
    </group>
  )
}

export default function Hero3DBox() {
  return (
    <div className="w-full h-full min-h-[400px] relative pointer-events-auto cursor-grab active:cursor-grabbing">
      <Suspense fallback={<div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl" />}>
        {/* Performance optimization: dpr limits pixel ratio for less lag */}
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7], fov: 35 }}>
          <ambientLight intensity={0.8} />
          
          {/* Simplified Lighting for performance */}
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          <pointLight position={[-10, -10, -10]} color="#4361EE" intensity={0.5} />
          
          <PackagingBox />
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={0.8} 
          />
        </Canvas>
      </Suspense>
      
      {/* Visual background glow (Light Theme) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#4361EE]/10 blur-[80px] -z-10 rounded-full" />
    </div>
  )
}
