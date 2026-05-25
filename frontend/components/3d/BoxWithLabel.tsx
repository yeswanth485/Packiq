'use client'

import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Box, Html, ContactShadows, Edges } from '@react-three/drei'
import * as THREE from 'three'
import { QRCodeSVG } from 'qrcode.react'

function BoxWithLabelMesh({ labelData }: { labelData: any }) {
  const meshRef = useRef<THREE.Mesh>(null)

  const length = Number(labelData.length) || 20;
  const width = Number(labelData.width) || 15;
  const height = Number(labelData.height) || 10;

  // Scale dimensions to look good inside the 3D canvas viewport
  const maxDim = Math.max(length, width, height, 1);
  const scale = 4.2 / maxDim;

  const x = length * scale;
  const y = Math.max(height * scale, 2.0); // Make sure box is tall enough to hold the HTML label overlay
  const z = width * scale;

  return (
    <group>
      <Box ref={meshRef} args={[x, y, z]} castShadow receiveShadow>
        <meshStandardMaterial 
          color="#cf9f72" // Cardboard brown color
          roughness={0.85}
          metalness={0.15}
        />
        <Edges color="#ab7b50" />
        
        {/* Render the Label on the Front Face (Z = z/2 + 0.01) */}
        <Html 
          position={[0, 0, (z / 2) + 0.01]} 
          transform 
          occlude
          scale={0.25}
        >
          <div className="w-[400px] h-[550px] bg-white rounded-xl shadow-2xl p-6 flex flex-col justify-between text-black relative pointer-events-none select-none">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gray-100 rounded-bl-[40px]" />
            
            <div>
              <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">{labelData.carrier?.name || 'Carrier'}</h2>
                  <p className="text-xs font-bold mt-1">STANDARD OVERNIGHT</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black">{new Date().getDate()}</p>
                  <p className="text-xs font-bold uppercase">{new Date().toLocaleString('default', { month: 'short' })}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">From</p>
                  <p className="text-xs font-bold mt-0.5">PackIQ Logistics Center<br/>123 Innovation Way<br/>San Francisco, CA 94105</p>
                </div>
                <div className="border-l-2 border-black pl-4">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">To</p>
                  <p className="text-lg font-black uppercase leading-tight mt-0.5">
                    {labelData.shippingAddress?.name}<br/>
                    {labelData.shippingAddress?.line1}<br/>
                    {labelData.shippingAddress?.line2}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-y-2 border-black py-4 mb-6">
                <div>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Weight</p>
                  <p className="text-sm font-black">
                    {((labelData.product_weight || 0.5) * 2.2).toFixed(1)} LBS
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Dimensions</p>
                  <p className="text-sm font-black uppercase tracking-tighter">{labelData.optimized_box_dims}</p>
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between mt-auto">
              <div className="space-y-2">
                <QRCodeSVG 
                  value={`https://packiq.vercel.app/track/${labelData.product_id}`}
                  size={96}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"Q"}
                />
                <p className="text-[8px] font-mono text-center font-bold">SCAN</p>
              </div>
              
              <div className="flex-1 ml-6 h-20 flex flex-col justify-end">
                <div className="w-full h-12 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTEwLDBWMTAwaDVWMHptMTAsMFYxMDBoMlYwem01LDBWMTAwaDhWMHptMTUsMFYxMDBoM1Ywem01LDBWMTAwaDVWMHoiIGZpbGw9ImJsYWNrIi8+PC9zdmc+')] bg-repeat-x opacity-90" />
                <p className="text-[10px] font-mono text-center font-bold mt-1 tracking-[0.1em] truncate">
                  {labelData.trackingNumber}
                </p>
              </div>
            </div>
          </div>
        </Html>
      </Box>
    </group>
  )
}

export default function BoxWithLabel({ labelData }: { labelData: any }) {
  return (
    <div className="w-full h-full relative cursor-move">
      <Suspense fallback={<div className="w-full h-full bg-[#0A0A0F]/50 animate-pulse rounded-[40px]" />}>
        <Canvas dpr={[1, 2]} shadows camera={{ position: [4, 4, 6], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-10, 5, 5]} intensity={0.5} />
          
          <BoxWithLabelMesh labelData={labelData} />
          
          <ContactShadows position={[0, -1.3, 0]} opacity={0.5} scale={20} blur={2.5} far={4} />
          
          <OrbitControls 
            enableZoom={true}
            minDistance={3}
            maxDistance={10}
            autoRotate={true}
            autoRotateSpeed={1}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}
