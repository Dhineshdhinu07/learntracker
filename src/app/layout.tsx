import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'

// Inter variable — the canonical substitute recommended by all three design systems.
// Loads weights 100–900 in one variable font file; no layout shift.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  // Preload the weights we use most: 300 (Stripe thin display), 400 (body), 500 (labels), 600 (headings)
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LearnTrack',
  description: 'Track your job-switch prep — DSA, Java, System Design, AI Engineering',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090e',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('dark', inter.variable)} style={{ background: '#09090e' }}>
      <body style={{ background: '#09090e', minHeight: '100dvh' }}>
        <div className="min-h-screen pb-20 md:pb-0 md:pl-60">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  )
}
