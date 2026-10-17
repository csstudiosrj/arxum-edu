import { PlanosClient } from './planos-client'
import { PublicHeader, PublicFooter } from '@/components/arxum-brand'

export const metadata = {
  title: 'Planos e Preços — ARXUM Edu',
}

export default function PlanosPage() {
  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5] font-sans">
      <PublicHeader />
      <PlanosClient />
      <PublicFooter />
    </div>
  )
}