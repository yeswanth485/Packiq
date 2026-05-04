'use client'

import { Suspense, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Box, Edges, Float, MeshDistortMaterial, Stars, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

function PackagingBox() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.25
    }
  })

  return (
    <group>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Box ref={meshRef} args={[2.8, 2, 1.8]}>
          {/* Premium Dark Glass Material */}
          <meshStandardMaterial 
            color="#0a0a0f" 
            roughness={0.1}
            metalness={0.9}
            transparent
            opacity={0.9}
          />
          {/* Glowing Neon Edges */}
          <Edges 
            linewidth={3} 
            threshold={15} 
            color="#4361EE" 
          />
          
          <mesh position={[0, 0, 0.91]}>
             <planeGeometry args={[1.6, 0.6]} />
             <meshBasicMaterial color="#4361EE" transparent opacity={0.4} />
          </mesh>
        </Box>
        
        {/* Inner Core Glow */}
        <mesh scale={[2.4, 1.6, 1.4]}>
          <boxGeometry />
          <meshBasicMaterial color="#4361EE" transparent opacity={0.05} />
        </mesh>
      </Float>
    </group>
  )
}

function TechParticles() {
  const count = 40
  const points = useMemo(() => {
    const p = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 10
      p[i * 3 + 1] = (Math.random() - 0.5) * 10
      p[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return p
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#4361EE" transparent opacity={0.4} />
    </points>
  )
}

export default function Hero3DBox() {
  return (
    <div className="w-full h-full min-h-[450px] relative pointer-events-auto cursor-grab active:cursor-grabbing">
      <Suspense fallback={<div className="w-full h-full bg-[#050505] animate-pulse rounded-2xl" />}>
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 35 }}>
          <color attach="background" args={['#050505']} />
          <ambientLight intensity={0.2} />
          
          {/* Advanced Studio Lighting */}
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#4361EE" />
          <pointLight position={[-10, -5, -10]} color="#06b6d4" intensity={1} />
          <pointLight position={[0, 5, 5]} color="#ffffff" intensity={0.5} />
          
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <PackagingBox />
          <TechParticles />
          
          <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} color="#4361EE" />
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={1.2} 
          />
        </Canvas>
      </Suspense>
      
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4361EE]/10 blur-[120px] -z-10 rounded-full animate-pulse" />
    </div>
  )
}
