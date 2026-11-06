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
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}