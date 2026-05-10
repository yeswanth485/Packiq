'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Box, Edges, Float, ContactShadows, PerspectiveCamera, Html } from '@react-three/drei'
import * as THREE from 'three'

function BoxModel({ l, w, h, color = '#00FFD1' }: { l: number, w: number, h: number, color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Scale dimensions to fit well in view (normalize)
  const max = Math.max(l, w, h, 1)
  const sl = (l / max) * 4
  const sw = (w / max) * 4
  const sh = (h / max) * 4

  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
        <Box ref={meshRef} args={[sl, sh, sw]}>
          <meshStandardMaterial 
            color="#3a3a4a" 
            roughness={0.3}
            metalness={0.8}
            emissive={color}
            emissiveIntensity={0.2}
          />
          <Edges 
            linewidth={3} 
            threshold={15} 
            color={color} 
          />
          
          {/* Dimension Labels on the box */}
          <Html position={[0, sh/2 + 0.2, 0]} center distanceFactor={8}>
            <div className="px-2 py-1 bg-black/80 backdrop-blur-md border border-[#00FFD1]/30 rounded text-[10px] font-black text-[#00FFD1] whitespace-nowrap shadow-[0_0_10px_rgba(0,255,209,0.3)]">
              {l}x{w}x{h} cm
            </div>
          </Html>

          {/* Front Label */}
          <Html position={[0, 0, sw/2 + 0.1]} center distanceFactor={10}>
            <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] select-none">
              PackIQ Standard
            </div>
          </Html>
        </Box>
      </Float>
    </group>
  )
}

export default function Box3DViewer({ l, w, h, color = '#00FFD1' }: { l: number, w: number, h: number, color?: string }) {
  return (
    <div className="w-full h-full min-h-[350px] relative rounded-[32px] overflow-hidden bg-gradient-to-br from-[#0A0A0F] to-[#151520] border border-white/5 cursor-grab active:cursor-grabbing shadow-inner">
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-[#00FFD1] font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Initializing 3D Spatial Engine...</div>}>
        <Canvas dpr={[1, 2]} shadows camera={{ position: [6, 6, 6], fov: 40 }}>
          <ambientLight intensity={1.5} />
          <spotLight position={[15, 20, 10]} angle={0.3} penumbra={1} intensity={2.5} castShadow />
          <pointLight position={[-10, -10, -10]} color={color} intensity={1.5} />
          <directionalLight position={[0, 10, 0]} intensity={1} />
          
          <BoxModel l={l} w={w} h={h} color={color} />
          
          <ContactShadows position={[0, -2.5, 0]} opacity={0.6} scale={12} blur={2.5} far={4.5} />
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            minDistance={4}
            maxDistance={15}
            autoRotate={true}
            autoRotateSpeed={1.5}
            makeDefault
          />
        </Canvas>
      </Suspense>
      
      {/* UI Overlay */}
      <div className="absolute top-6 right-6 flex flex-col gap-2">
         <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00FFD1]" /> L: {l}cm
         </div>
         <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#185FA5]" /> W: {w}cm
         </div>
         <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" /> H: {h}cm
         </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="px-4 py-2 rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 text-[8px] font-black text-gray-500 uppercase tracking-[0.3em]">
          Interactive 3D Preview
        </div>
      </div>
    </div>
  )
}
