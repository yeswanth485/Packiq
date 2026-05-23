'use client'

import { useRef, useState, useEffect, Suspense, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Html, Edges, Grid } from '@react-three/drei'
import * as THREE from 'three'

interface BoxViewer3DProps {
  widthCm: number
  heightCm: number
  depthCm: number // length
  sku?: string
  labelTexture?: THREE.CanvasTexture | null
}

const scale = 0.1

function DimensionLabel({ position, text, color = "#00E5CC" }: { position: [number, number, number], text: string, color?: string }) {
  return (
    <Html position={position} center className="pointer-events-none">
      <div className="bg-gray-900/90 text-white px-2 py-0.5 rounded text-[10px] font-black whitespace-nowrap border border-white/10 shadow-xl" style={{ color }}>
        {text}
      </div>
    </Html>
  )
}

function SingleBox({ widthCm, heightCm, depthCm, labelTexture }: BoxViewer3DProps) {
  const w = widthCm * scale
  const h = heightCm * scale
  const d = depthCm * scale

  // Materials
  const boxMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#002222',
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    roughness: 0.3,
    metalness: 0.8,
  }), [])

  const labelMaterial = useMemo(() => {
    if (!labelTexture) return boxMaterial
    return new THREE.MeshStandardMaterial({
      map: labelTexture,
      transparent: true,
      side: THREE.DoubleSide,
    })
  }, [labelTexture, boxMaterial])

  const materials = [
    boxMaterial, // Right
    boxMaterial, // Left
    boxMaterial, // Top
    boxMaterial, // Bottom
    labelMaterial, // Front (label goes here)
    boxMaterial, // Back
  ]

  return (
    <group position={[0, h / 2, 0]}>
      <mesh material={materials}>
        <boxGeometry args={[w, h, d]} />
        <Edges color="#00E5CC" threshold={15} />
      </mesh>

      {/* Dimension Labels */}
      <DimensionLabel position={[w / 2 + 0.2, 0, 0]} text={`H: ${heightCm}cm`} />
      <DimensionLabel position={[0, -h / 2 - 0.2, d / 2]} text={`W: ${widthCm}cm`} />
      <DimensionLabel position={[w / 2, -h / 2 - 0.2, 0]} text={`L: ${depthCm}cm`} />
    </group>
  )
}

export default function BoxViewer3D({ widthCm, heightCm, depthCm, sku }: BoxViewer3DProps) {
  if (!widthCm || !heightCm || !depthCm) {
    return (
      <div className="w-full h-96 bg-gray-900 rounded-2xl flex items-center justify-center border border-red-500/20">
        <p className="text-red-400 text-xs font-bold uppercase tracking-widest">Error: Invalid Dimensions</p>
      </div>
    )
  }

  const w = widthCm * scale
  const h = heightCm * scale
  const d = depthCm * scale

  return (
    <div className="w-full h-96 bg-gray-900 rounded-2xl overflow-hidden relative border border-white/5 shadow-2xl">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm z-10">
          <div className="w-8 h-8 border-4 border-[#00FFD1] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <Canvas camera={{ position: [w * 2.5, h * 2.5, d * 2.5], fov: 45 }} shadows>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          <SingleBox widthCm={widthCm} heightCm={heightCm} depthCm={depthCm} sku={sku} />

          <Grid
            infiniteGrid
            fadeDistance={20}
            sectionSize={1}
            sectionThickness={1}
            sectionColor="#1e1e2e"
            cellSize={0.5}
            cellColor="#11111b"
          />

          <OrbitControls makeDefault enableZoom={true} enablePan={true} autoRotate={false} />
        </Canvas>
      </Suspense>

      <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 pointer-events-none">
        <span className="text-[10px] font-black text-[#00FFD1] uppercase tracking-widest">3D Optimized View: {sku || 'Unit'}</span>
      </div>
    </div>
  )
}
