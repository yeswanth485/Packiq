'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Edges } from '@react-three/drei'

interface Box3DViewerProps {
  length: number
  width: number
  height: number
}

// 🔴 BUG #3 FIX: Fallback 2D view for when 3D rendering fails
function Box2DFallback({ length, width, height }: Box3DViewerProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-amber-300 p-4">
      <svg className="w-16 h-16 text-amber-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <h3 className="text-sm font-semibold text-amber-900">3D View Unavailable</h3>
      <p className="text-xs text-amber-700 mt-1 text-center">Your device cannot render 3D graphics</p>
      <div className="mt-4 bg-white rounded p-3 text-xs text-gray-600 w-full">
        <p className="font-mono"><strong>Box Dimensions:</strong></p>
        <p className="font-mono">L: {length.toFixed(1)}cm × W: {width.toFixed(1)}cm × H: {height.toFixed(1)}cm</p>
        <p className="font-mono mt-2"><strong>Volume:</strong> {((length * width * height) / 1000).toFixed(2)}L</p>
      </div>
    </div>
  )
}

// 🔴 BUG #3 FIX: Error boundary wrapper
class Box3DErrorBoundary extends React.Component<
  { children: React.ReactNode; length: number; width: number; height: number },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[Box3DViewer] Error:', error.message)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Box3DViewer] Caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const { length, width, height } = this.props
      return <Box2DFallback length={length} width={width} height={height} />
    }

    return this.props.children
  }
}

// 🔴 BUG #3 FIX: Main 3D viewer with error handling
function Box3DViewerContent({ length, width, height }: Box3DViewerProps) {
  const [canvasReady, setCanvasReady] = useState(false)
  
  // Normalize dimensions to keep the 3D object relatively sized in the view
  const max = Math.max(length, width, height, 1)
  const sL = (length / max) * 4
  const sW = (width / max) * 4
  const sH = (height / max) * 4

  return (
    <div className="w-full h-full">
      <Canvas 
        camera={{ position: [5, 4, 5], fov: 45 }}
        onCreated={() => setCanvasReady(true)}
        onError={(error) => {
          console.error('[Box3DViewer] WebGL Error:', error)
          throw new Error(`3D Rendering failed: ${error}`)
        }}
      >
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
      {!canvasReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading 3D view...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Box3DViewer({ length, width, height }: Box3DViewerProps) {
  return (
    <Box3DErrorBoundary length={length} width={width} height={height}>
      <Suspense fallback={<Box2DFallback length={length} width={width} height={height} />}>
        <Box3DViewerContent length={length} width={width} height={height} />
      </Suspense>
    </Box3DErrorBoundary>
  )
}
