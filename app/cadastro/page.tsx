import { CadastroClient } from './cadastro-client'
import { PublicHeader, PublicFooter } from '@/components/arxum-brand'

export const metadata = {
  title: 'Criar conta — ARXUM Edu',
}

export default function CadastroPage({
  searchParams,
}: {
  searchParams: { plano?: string }
}) {
  const planoInicial = searchParams.plano || 'raiz'

  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5] font-sans">
      <PublicHeader />
      <CadastroClient planoInicial={planoInicial} />
      <PublicFooter />
    </div>
  )
}