'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Grid, Environment, Float, Text, Box as ThreeBox, Edges } from '@react-three/drei'
import { Suspense } from 'react'

interface BoxProps {
  dimensions: { l: number; w: number; h: number }
  color: string
  opacity?: number
  wireframe?: boolean
  label?: string
}

function BoxModel({ dimensions, color, opacity = 1, wireframe = false, label }: BoxProps) {
  // Scale factor to keep visualization manageable
  const scale = 0.05
  const l = dimensions.l * scale
  const w = dimensions.w * scale
  const h = dimensions.h * scale

  return (
    <group>
      <ThreeBox args={[l, h, w]}>
        <meshStandardMaterial
          color={color}
          transparent={opacity < 1}
          opacity={opacity}
          wireframe={wireframe}
          metalness={0.2}
          roughness={0.1}
        />
        {!wireframe && <Edges color={color} threshold={15} />}
      </ThreeBox>

      {label && (
        <Text
          position={[0, h / 2 + 0.2, 0]}
          fontSize={0.15}
          color="white"
          font="/fonts/SpaceGrotesk-Bold.ttf" // Optional: ensure font exists or fallback
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  )
}

export default function Box3DViewer({
  optimizedDims,
  originalDims,
  productName
}: {
  optimizedDims: { l: number; w: number; h: number },
  originalDims: { l: number; w: number; h: number },
  productName: string
}) {
  return (
    <div className="w-full h-full min-h-[400px] bg-[#0A0F1E] rounded-3xl overflow-hidden relative border border-white/5">
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
          <OrbitControls
            enablePan={false}
            minDistance={3}
            maxDistance={10}
            autoRotate
            autoRotateSpeed={0.5}
          />

          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />

          <group position={[0, -1, 0]}>
            {/* Original Box Wireframe */}
            <BoxModel
              dimensions={originalDims}
              color="#EF4444"
              wireframe
              label="Original Size"
            />

            {/* Optimized Box */}
            <BoxModel
              dimensions={optimizedDims}
              color="#2563EB"
              opacity={0.6}
              label="Optimized Box"
            />

            <Grid
              renderOrder={-1}
              position={[0, -0.01, 0]}
              infiniteGrid
              cellSize={0.5}
              sectionSize={2.5}
              sectionThickness={1}
              sectionColor="#ffffff05"
              fadeDistance={20}
            />
          </group>

          <Environment preset="city" />
        </Suspense>
      </Canvas>

      <div className="absolute top-6 left-6 space-y-1 pointer-events-none">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Visualizing</p>
        <h4 className="text-xl font-bold text-white font-space-grotesk">{productName}</h4>
      </div>

      <div className="absolute bottom-6 left-6 right-6 flex justify-between pointer-events-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#2563EB]/60 rounded-full" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Optimized</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-[#EF4444] rounded-full" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Wasted Space</span>
          </div>
        </div>
      </div>
    </div>
  )
}
