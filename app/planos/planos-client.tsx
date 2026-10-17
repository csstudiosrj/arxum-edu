'use client'

import Link from 'next/link'
import { ArrowLeft, Check, ArrowRight } from 'lucide-react'

const planos = [
  { 
    key: 'semente', 
    label: 'Semente', 
    preco: 'R$ 199/mês', 
    desc: 'Para escolas que estão começando a digitalizar a gestão.',
    features: ['Até 100 alunos', 'Site institucional incluso', 'Gestão de matrículas', 'Portal do responsável', 'Suporte por e-mail']
  },
  { 
    key: 'raiz', 
    label: 'Raiz', 
    preco: 'R$ 399/mês', 
    desc: 'O equilíbrio perfeito para escolas em crescimento.',
    destaque: true,
    features: ['Até 300 alunos', 'Todos os recursos do Semente', 'Módulo Financeiro completo', 'Loja Virtual (uniformes)', 'Portal do professor']
  },
  { 
    key: 'copa', 
    label: 'Copa', 
    preco: 'R$ 699/mês', 
    desc: 'Para escolas consolidadas que exigem controle total.',
    features: ['Até 800 alunos', 'Todos os recursos do Raiz', 'Sala de aula virtual', 'Relatórios avançados (BI)', 'API de integração']
  },
  { 
    key: 'rede', 
    label: 'Rede', 
    preco: 'Sob consulta', 
    desc: 'Solução para redes de ensino com múltiplas unidades.',
    features: ['Alunos ilimitados', 'Multiunidade', 'Dashboard executivo consolidado', 'Gerente de conta dedicado', 'Onboarding personalizado']
  },
]

export function PlanosClient() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20 font-sans">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Escolha o plano ideal para sua escola
        </h1>
        <p className="mt-4 text-lg text-[#8aa0ad]">
          Sem taxa de setup. Teste grátis por 14 dias. Cancele quando quiser.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-2">
        {planos.map((p) => (
          <div 
            key={p.key} 
            className={`relative flex flex-col rounded-2xl border p-6 ${
              p.destaque ? 'border-[#0d9488] bg-[#0d9488]/5' : 'border-white/[.08] bg-[#0e151a]'
            }`}
          >
            {p.destaque && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0d9488] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Mais escolhido
              </div>
            )}
            <h3 className="text-xl font-bold text-white">{p.label}</h3>
            <p className="mt-2 text-sm text-[#82939a] h-10">{p.desc}</p>
            
            <div className="mt-6 mb-6 border-b border-white/[.08] pb-6">
              <span className="text-3xl font-bold text-white">{p.preco}</span>
            </div>

            <ul className="flex-1 space-y-3 mb-8">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-[#c7d5db]">
                  <Check className="size-4 shrink-0 text-[#0d9488]" />
                  {f}
                </li>
              ))}
            </ul>

            <Link 
              href={`/cadastro?plano=${p.key}`}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                p.destaque 
                  ? 'bg-[#0d9488] text-white hover:bg-[#0f766e]' 
                  : 'border border-white/20 bg-transparent text-white hover:bg-white/5'
              }`}
            >
              Assinar {p.label} <ArrowRight className="size-4" />
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#8aa0ad] hover:text-white transition">
          <ArrowLeft className="size-4" /> Voltar para o início
        </Link>
      </div>
    </main>
  )
}