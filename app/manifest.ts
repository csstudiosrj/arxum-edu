import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ARXUM Edu',
    short_name: 'ARXUM',
    description: 'Plataforma escolar completa: matrículas, financeiro, notas e comunicação.',
    start_url: '/',
    display: 'standalone',
    background_color: '#07090c',
    theme_color: '#0d9488',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-light-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}