import { CadastroClient } from './cadastro-client'
import { PublicHeader, PublicFooter } from '@/components/arxum-brand'

export const metadata = {
  title: 'Comece agora — ARXUM Edu',
  description: 'Crie a conta da sua escola e comece a usar o ARXUM Edu em minutos.',
}

export default function CadastroPage() {
  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]">
      <PublicHeader />
      <CadastroClient />
      <PublicFooter />
    </div>
  )
}