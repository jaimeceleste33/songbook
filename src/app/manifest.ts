import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Songbook',
    short_name: 'Songbook',
    description: 'Letras y repertorios para cantar en vivo.',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0b0f16',
    theme_color: '#0b0f16',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
}
