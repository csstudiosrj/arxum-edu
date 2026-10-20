import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import {
  Syne,
  DM_Sans,
  Playfair_Display,
  Inter,
  Space_Grotesk,
  Fraunces,
  Nunito_Sans,
  Libre_Baskerville,
  Source_Sans_3,
  Bricolage_Grotesque,
  Baloo_2,
  Cormorant_Garamond,
  Montserrat,
  Manrope,
} from 'next/font/google'
import './globals.css'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' })
const nunitoSans = Nunito_Sans({ subsets: ['latin'], variable: '--font-nunito-sans', display: 'swap' })
const libreBaskerville = Libre_Baskerville({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-libre-baskerville', display: 'swap' })
const sourceSans = Source_Sans_3({ subsets: ['latin'], variable: '--font-source-sans', display: 'swap' })
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap' })
const baloo = Baloo_2({ subsets: ['latin'], variable: '--font-baloo', display: 'swap' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-cormorant', display: 'swap' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', display: 'swap' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' })

const fontVars = [
  syne.variable,
  dmSans.variable,
  playfair.variable,
  inter.variable,
  spaceGrotesk.variable,
  fraunces.variable,
  nunitoSans.variable,
  libreBaskerville.variable,
  sourceSans.variable,
  bricolage.variable,
  baloo.variable,
  cormorant.variable,
  montserrat.variable,
  manrope.variable,
].join(' ')

export const metadata: Metadata = {
  metadataBase: new URL('https://arxum.com.br'),
  title: {
    default: 'ARXUM Edu — Plataforma escolar',
    template: '%s | ARXUM Edu',
  },
  description: 'Matrículas, comunicação, financeiro, sala virtual e EduFlix em uma única plataforma.',
  generator: 'ARXUM Suite',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'ARXUM Edu',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#07090c',
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={fontVars}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}