'use client'

import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Box, Edges, Float, ContactShadows, Html } from '@react-three/drei'
import * as THREE from 'three'

// ─── Props ────────────────────────────────────────────────────────────────────
interface Box3DViewerProps {
  l: number
  w: number
  h: number
  color?: string
  // Product-inside-box props (optional)
  productL?: number
  productW?: number
  productH?: number
  spaceUtilization?: number  // 0–100
  fragility?: 'low' | 'medium' | 'high' | 'extreme'
}

// ─── Fill colour helper ───────────────────────────────────────────────────────
function fillColor(utilization: number) {
  if (utilization >= 70) return '#22c55e'   // green — tight fit
  if (utilization >= 40) return '#F59E0B'   // amber — moderate
  return '#ef4444'                           // red   — too much void
}

// ─── Inner 3D model ──────────────────────────────────────────────────────────
function BoxModel({
  l, w, h,
  productL, productW, productH,
  spaceUtilization,
  color = '#00FFD1',
}: Omit<Box3DViewerProps, 'fragility'>) {
  const scale = 4 / Math.max(l, w, h, 1)
  const sl = l * scale
  const sw = w * scale
  const sh = h * scale

  // Product scaled inside the box
  const hasProd = !!productL && !!productW && !!productH
  const pl = hasProd ? productL! * scale : 0
  const pw = hasProd ? productW! * scale : 0
  const ph = hasProd ? productH! * scale : 0

  const utilization = spaceUtilization ?? 0
  const prodColor = fillColor(utilization)

  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>

        {/* ── Outer Box (wireframe style) ── */}
        <Box args={[sl, sh, sw]}>
          <meshStandardMaterial
            color="#3a3a4a"
            roughness={0.3}
            metalness={0.8}
            emissive={color}
            emissiveIntensity={0.15}
            transparent
            opacity={0.35}
          />
          <Edges linewidth={3} threshold={15} color={color} />

          {/* Dimension label */}
          <Html position={[0, sh / 2 + 0.25, 0]} center distanceFactor={8}>
            <div className="px-2 py-1 bg-black/80 backdrop-blur-md border border-[#00FFD1]/30 rounded text-[10px] font-black text-[#00FFD1] whitespace-nowrap shadow-[0_0_10px_rgba(0,255,209,0.3)]">
              {l}×{w}×{h} cm
            </div>
          </Html>
        </Box>

        {/* ── Product mesh inside box ── */}
        {hasProd && (
          <Box args={[pl, ph, pw]} position={[0, (ph - sh) / 2, 0]}>
            <meshStandardMaterial
              color={prodColor}
              roughness={0.4}
              metalness={0.3}
              transparent
              opacity={0.75}
              emissive={prodColor}
              emissiveIntensity={0.3}
            />
            <Edges linewidth={1.5} threshold={15} color={prodColor} />
          </Box>
        )}

        {/* ── Fill-level plane ── */}
        {hasProd && (
          <mesh position={[0, (ph - sh) / 2 + ph / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[sl * 0.95, sw * 0.95]} />
            <meshStandardMaterial
              color={prodColor}
              transparent
              opacity={0.18}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Front label */}
        <Html position={[0, 0, sw / 2 + 0.15]} center distanceFactor={10}>
          <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] select-none">
            PackVision AI
          </div>
        </Html>
      </Float>
    </group>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Box3DViewer({
  l, w, h,
  color = '#00FFD1',
  productL, productW, productH,
  spaceUtilization,
  fragility,
}: Box3DViewerProps) {
  const utilization = spaceUtilization ?? 0
  const fc = fillColor(utilization)

  return (
    <div className="w-full h-full min-h-[300px] relative rounded-[32px] overflow-hidden bg-gradient-to-br from-[#0A0A0F] to-[#151520] border border-white/5 cursor-grab active:cursor-grabbing shadow-inner">
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center text-[#00FFD1] font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
          Initializing 3D Engine...
        </div>
      }>
        <Canvas dpr={[1, 2]} shadows camera={{ position: [6, 6, 6], fov: 40 }}>
          <ambientLight intensity={1.5} />
          <spotLight position={[15, 20, 10]} angle={0.3} penumbra={1} intensity={2.5} castShadow />
          <pointLight position={[-10, -10, -10]} color={color} intensity={1.5} />
          <directionalLight position={[0, 10, 0]} intensity={1} />

          <BoxModel
            l={l} w={w} h={h}
            productL={productL} productW={productW} productH={productH}
            spaceUtilization={spaceUtilization}
            color={color}
          />

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

      {/* Dimension overlays */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5">
        {[
          { label: 'L', val: l, c: '#00FFD1' },
          { label: 'W', val: w, c: '#185FA5' },
          { label: 'H', val: h, c: 'rgba(255,255,255,0.4)' },
        ].map(d => (
          <div key={d.label} className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.c }} />
            {d.label}: {d.val}cm
          </div>
        ))}
      </div>

      {/* Space utilization badge — only when product is shown */}
      {productL && spaceUtilization !== undefined && (
        <div className="absolute top-4 left-4">
          <div
            className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border text-[10px] font-black uppercase tracking-widest"
            style={{ borderColor: `${fc}40`, color: fc }}
          >
            {utilization}% filled
          </div>
        </div>
      )}

      {/* Fragility badge */}
      {fragility && fragility !== 'low' && (
        <div className="absolute bottom-4 left-4">
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-xl border ${
            fragility === 'extreme' ? 'border-red-500/40 text-red-400' :
            fragility === 'high'    ? 'border-orange-500/40 text-orange-400' :
            'border-yellow-500/40 text-yellow-400'
          }`}>
            {fragility} fragility
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-1/2 translate-x-1/2">
        <div className="px-4 py-1.5 rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 text-[8px] font-black text-gray-500 uppercase tracking-[0.3em]">
          Interactive 3D Preview
        </div>
      </div>
    </div>
  )
}
