'use client'

import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Edges } from '@react-three/drei'

interface Box3DViewerProps {
  length: number
  width: number
  height: number
}

export default function Box3DViewer({ length, width, height }: Box3DViewerProps) {
  // Normalize dimensions to keep the 3D object relatively sized in the view
  const max = Math.max(length, width, height, 1)
  const sL = (length / max) * 4
  const sW = (width / max) * 4
  const sH = (height / max) * 4

  return (
    <Canvas camera={{ position: [5, 4, 5], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <mesh>
        {/* We map ThreeJS [x, y, z] to [Length, Height, Width] conceptually */}
        <boxGeometry args={[sL, sH, sW]} />
        <meshStandardMaterial color="#d4a373" roughness={0.8} />
        <Edges scale={1} threshold={15} color="#8b5a2b" />
      </mesh>
      <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={false} enablePan={false} />
    </Canvas>
  )
}
