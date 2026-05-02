'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Box, Edges, Float, ContactShadows } from '@react-three/drei'
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
          {/* Premium Material: Cardboard/Matte finish */}
          <meshStandardMaterial 
            color="#1A1A1F" 
            roughness={0.6}
            metalness={0.1}
          />
          {/* Glowing teal edges */}
          <Edges 
            linewidth={2} 
            threshold={15} 
            color="#00E5CC" 
          />
          
          {/* Subtle "PackIQ" logo simulation on the box */}
          <mesh position={[0, 0, 0.91]}>
             <planeGeometry args={[1.5, 0.5]} />
             <meshBasicMaterial color="#00E5CC" transparent opacity={0.8} />
          </mesh>
        </Box>
      </Float>
    </group>
  )
}

export default function Hero3DBox() {
  return (
    <div className="w-full h-full min-h-[500px] relative pointer-events-auto cursor-grab active:cursor-grabbing">
      <Suspense fallback={<div className="w-full h-full bg-[#0A0A0F]/50 animate-pulse rounded-2xl" />}>
        <Canvas camera={{ position: [0, 0, 7], fov: 35 }} shadows>
          <ambientLight intensity={0.4} />
          
          {/* Key Light */}
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
          
          {/* Accent Lights */}
          <pointLight position={[-10, -10, -10]} color="#00E5CC" intensity={1.5} />
          <pointLight position={[0, 5, 5]} color="#3B82F6" intensity={1} />
          
          <PackagingBox />
          
          <ContactShadows 
            position={[0, -2.5, 0]} 
            opacity={0.4} 
            scale={10} 
            blur={2.5} 
            far={4} 
          />
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={0.8} 
          />
        </Canvas>
      </Suspense>
      
      {/* Visual background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00E5CC]/10 blur-[120px] -z-10" />
    </div>
  )
}
