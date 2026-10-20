import { PlanosClient } from './planos-client'
import { PublicHeader, PublicFooter } from '@/components/arxum-brand'
import { getPlanosPublicos } from '@/lib/planos-publicos'

export const metadata = {
  title: 'Planos e Preços — ARXUM Edu',
}

export const dynamic = 'force-dynamic'

export default async function PlanosPage() {
  const planos = await getPlanosPublicos()

  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5] font-sans">
      <PublicHeader />
      <PlanosClient planos={planos} />
      <PublicFooter />
    </div>
  )
}