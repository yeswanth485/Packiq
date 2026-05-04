import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/components/AuthProvider'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'PackIQ — AI-Powered Packaging Optimization',
  description: 'Reduce shipping costs and carbon footprint with AI-driven packaging recommendations. PackIQ finds the perfect box for every product.',
  keywords: 'packaging optimization, AI shipping, box sizing, cost reduction, sustainability',
  openGraph: {
    title: 'PackIQ — AI-Powered Packaging Optimization',
    description: 'Find the perfect box for every product with AI.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-[var(--bg-dark)] text-white">
        <AuthProvider>
          {children}
          <Toaster theme="dark" position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
