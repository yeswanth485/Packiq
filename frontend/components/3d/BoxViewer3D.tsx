'use client'

import { useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html, Edges } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import * as THREE from 'three'

interface BoxViewer3DProps {
  widthCm: number
  heightCm: number
  depthCm: number // length
  openDelay?: number
}

// Convert cm to 3D units (scale down for display)
const scale = 0.1

export default function BoxViewer3D({ widthCm, heightCm, depthCm, openDelay = 500 }: BoxViewer3DProps) {
  const w = widthCm * scale
  const h = heightCm * scale
  const d = depthCm * scale

  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), openDelay)
    return () => clearTimeout(timer)
  }, [openDelay])

  // Animate the lid (top plane) rotating around its back edge
  const { lidRotation } = useSpring({
    lidRotation: isOpen ? Math.PI / 1.5 : 0, // Opens ~120 degrees
    config: { mass: 1, tension: 170, friction: 26 }
  })

  // Material for the box: semi-transparent, teal edges will be added via <Edges />
  const materialProps = {
    color: '#002222',
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    depthWrite: false,
  }

  return (
    <div className="w-full h-96 bg-gray-900 rounded-2xl overflow-hidden relative">
      <Canvas camera={{ position: [w * 2, h * 2, d * 2], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} intensity={1} />
        
        <group position={[0, -h/2, 0]}>
          {/* Bottom */}
          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w, d]} />
            <meshStandardMaterial {...materialProps} />
            <Edges color="#00E5CC" threshold={15} />
          </mesh>

          {/* Back */}
          <mesh position={[0, h/2, -d/2]}>
            <planeGeometry args={[w, h]} />
            <meshStandardMaterial {...materialProps} />
            <Edges color="#00E5CC" threshold={15} />
            
            {/* Dimension label for height */}
            <Html position={[w/2 + 0.1, 0, 0]} center className="pointer-events-none">
              <div className="bg-gray-800/80 text-[#00E5CC] px-2 py-0.5 rounded text-xs whitespace-nowrap border border-[#00E5CC]/30">
                H: {heightCm}cm
              </div>
            </Html>
          </mesh>

          {/* Front */}
          <mesh position={[0, h/2, d/2]}>
            <planeGeometry args={[w, h]} />
            <meshStandardMaterial {...materialProps} />
            <Edges color="#00E5CC" threshold={15} />
            
            {/* Dimension label for width */}
            <Html position={[0, -h/2 - 0.2, 0]} center className="pointer-events-none">
              <div className="bg-gray-800/80 text-[#00E5CC] px-2 py-0.5 rounded text-xs whitespace-nowrap border border-[#00E5CC]/30">
                W: {widthCm}cm
              </div>
            </Html>
          </mesh>

          {/* Left */}
          <mesh position={[-w/2, h/2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[d, h]} />
            <meshStandardMaterial {...materialProps} />
            <Edges color="#00E5CC" threshold={15} />
          </mesh>

          {/* Right */}
          <mesh position={[w/2, h/2, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[d, h]} />
            <meshStandardMaterial {...materialProps} />
            <Edges color="#00E5CC" threshold={15} />
            
            {/* Dimension label for depth (length) */}
            <Html position={[0, -h/2 - 0.2, 0]} center className="pointer-events-none">
              <div className="bg-gray-800/80 text-[#00E5CC] px-2 py-0.5 rounded text-xs whitespace-nowrap border border-[#00E5CC]/30">
                L: {depthCm}cm
              </div>
            </Html>
          </mesh>

          {/* Top (Lid) - Animated */}
          <animated.group position={[0, h, -d/2]} rotation-x={lidRotation.to(r => -r)}>
            {/* We offset the mesh so it hinges at the back edge */}
            <mesh position={[0, 0, d/2]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[w, d]} />
              <meshStandardMaterial {...materialProps} />
              <Edges color="#00E5CC" threshold={15} />
            </mesh>
          </animated.group>
        </group>

        <OrbitControls makeDefault enableZoom={true} enablePan={true} autoRotate autoRotateSpeed={1} />
      </Canvas>
    </div>
  )
}
