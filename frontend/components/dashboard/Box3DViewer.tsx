'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Box, Edges, Float, ContactShadows, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

function BoxModel({ l, w, h, color = '#4361EE' }: { l: number, w: number, h: number, color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Scale dimensions to fit well in view (normalize)
  const max = Math.max(l, w, h)
  const sl = (l / max) * 4
  const sw = (w / max) * 4
  const sh = (h / max) * 4

  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
        <Box ref={meshRef} args={[sl, sh, sw]}>
          <meshStandardMaterial 
            color="#1a1a2e" 
            roughness={0.3}
            metalness={0.8}
            transparent
            opacity={0.9}
          />
          <Edges 
            linewidth={2} 
            threshold={15} 
            color={color} 
          />
          
          {/* Dimension Labels Simulation */}
          <mesh position={[0, 0, sw/2 + 0.01]}>
             <planeGeometry args={[sl * 0.4, sh * 0.1]} />
             <meshBasicMaterial color={color} transparent opacity={0.3} />
          </mesh>
        </Box>
      </Float>
    </group>
  )
}

export default function Box3DViewer({ l, w, h, color = '#4361EE' }: { l: number, w: number, h: number, color?: string }) {
  return (
    <div className="w-full h-full min-h-[300px] relative rounded-2xl overflow-hidden bg-black/40 border border-white/5 cursor-grab active:cursor-grabbing">
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">Initializing 3D Render...</div>}>
        <Canvas dpr={[1, 2]} shadows>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={45} />
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} color={color} intensity={0.5} />
          
          <BoxModel l={l} w={w} h={h} color={color} />
          
          <ContactShadows position={[0, -2.5, 0]} opacity={0.3} scale={10} blur={2} far={4.5} />
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            minDistance={4}
            maxDistance={12}
          />
        </Canvas>
      </Suspense>
      
      {/* UI Overlay */}
      <div className="absolute bottom-4 left-4 flex gap-2">
         <div className="px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black text-gray-400 uppercase tracking-widest">
           L: {l}cm
         </div>
         <div className="px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black text-gray-400 uppercase tracking-widest">
           W: {w}cm
         </div>
         <div className="px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black text-gray-400 uppercase tracking-widest">
           H: {h}cm
         </div>
      </div>
    </div>
  )
}
