'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Box, MeshDistortMaterial } from '@react-three/drei'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'

function RotatingBox() {
  const meshRef = useRef<Mesh>(null)
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3
      meshRef.current.rotation.y += delta * 0.5
    }
  })
  return (
    <Box ref={meshRef} args={[2.2, 1.8, 1.6]} castShadow>
      <MeshDistortMaterial
        color="#6366f1"
        emissive="#4f46e5"
        emissiveIntensity={0.4}
        metalness={0.6}
        roughness={0.2}
        distort={0.05}
        speed={1.5}
      />
    </Box>
  )
}

function BoxEdges() {
  const meshRef = useRef<Mesh>(null)
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3
      meshRef.current.rotation.y += delta * 0.5
    }
  })
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2.21, 1.81, 1.61]} />
      <meshBasicMaterial color="#818cf8" wireframe />
    </mesh>
  )
}

export default function BoxPreview({
  width = 400,
  height = 400,
}: {
  width?: number
  height?: number
}) {
  return (
    <div style={{ width, height }} className="rounded-2xl overflow-hidden">
      <Suspense fallback={<div className="w-full h-full bg-gray-900 animate-pulse rounded-2xl" />}>
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} shadows>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
          <pointLight position={[-10, -10, -10]} color="#8b5cf6" intensity={1} />
          <RotatingBox />
          <BoxEdges />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      </Suspense>
    </div>
  )
}
