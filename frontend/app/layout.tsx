import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/components/AuthProvider'
import { Inter, Syne, Space_Mono, Outfit, Space_Grotesk } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const syne = Syne({ subsets: ['latin'], variable: '--font-syne' })
const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-mono' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', weight: ['400', '500', '600', '700', '800', '900'] })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Shipzi — AI-Powered Shipping & Packaging Intelligence',
  description: 'Reduce shipping costs and carbon footprint with AI-driven packaging recommendations. Shipzi finds the perfect box for every product.',
  keywords: 'packaging optimization, AI shipping, box sizing, cost reduction, sustainability',
  openGraph: {
    title: 'Shipzi — AI-Powered Shipping & Packaging Intelligence',
    description: 'Find the perfect box for every product with AI.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${syne.variable} ${spaceMono.variable} ${outfit.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased bg-[#0A0A0F] text-white">
        <AuthProvider>
          {children}
          <Toaster theme="dark" position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
