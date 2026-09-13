import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Songbook',
  description: 'Librería de letras y repertorios para cantar en vivo.',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Songbook' },
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#0b0f16',
  width: 'device-width',
  initialScale: 1,
  // Locked: an accidental pinch mid-song would ruin the auto-fit layout.
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
