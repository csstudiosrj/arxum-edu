'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookMarked, Save, Check, Loader2 } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { salvarConfigAvaliacao, type ConfigAvaliacao } from './actions'

const ESCALAS = [
  { key: '0-10', label: 'Nota Numérica (0 a 10)', desc: 'Padrão tradicional. O professor lança notas de 0 a 10.' },
  { key: 'conceito', label: 'Conceito (MB, B, R, I)', desc: 'Avaliação por conceitos. O caderno exibe e o professor atribui o conceito final.' },
  { key: 'pontos', label: 'Pontos Corridos', desc: 'A nota é dada em pontos (ex: 0 a 100) e convertida para a média final.' },
] as const

const RECUPERACOES = [
  { key: 'substitutiva', label: 'Substitutiva', desc: 'A nota da recuperação substitui a nota do bimestre se for maior.' },
  { key: 'media', label: 'Média', desc: 'A nota final é a média entre a nota do bimestre e a nota da recuperação.' },
] as const

export function AvaliacaoConfigClient({ configInicial }: { configInicial: ConfigAvaliacao }) {
  const [escala, setEscala] = useState<ConfigAvaliacao['escala']>(configInicial.escala)
  const [recuperacao, setRecuperacao] = useState<ConfigAvaliacao['recuperacao']>(configInicial.recuperacao)
  const [salvando, setSalvando] = useState(false)
  const [salvou, setSalvou] = useState(false)

  async function handleSalvar() {
    setSalvando(true)
    setSalvou(false)
    const r = await salvarConfigAvaliacao({ escala, recuperacao })
    setSalvando(false)
    if (r.success) {
      setSalvou(true)
      setTimeout(() => setSalvou(false), 3000)
    } else {
      alert(r.error)
    }
  }

  return (
    <AdminShell mode="school" active="Configurações">
      <main className="px-5 py-8 lg:px-8 max-w-4xl">
        <Link href="/admin/notas" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0d9488] hover:underline mb-6">
          <ArrowLeft className="size-4" /> Voltar para o Diário Oficial
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
          <SectionHeading
            eyebrow="Pedagógico"
            title="Configurações de Avaliação"
            description="Defina como as notas são calculadas na sua escola."
          />
          <div className="flex items-center gap-2">
            {salvou && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#d1fae5] px-3 py-1.5 text-xs font-semibold text-[#065f46]">
                <Check className="size-3.5" /> Salvo
              </span>
            )}
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
            >
              {salvando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {salvando ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <Panel>
            <div className="border-b border-[#e5ecee] px-5 py-4 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#f0fdfa] text-[#0d9488]"><BookMarked size={18}/></div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Escala de Notas</h2>
                <p className="text-xs text-[#82939a]">Como os professores vão lançar as notas no caderno.</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {ESCALAS.map((e) => (
                <button
                  key={e.key}
                  onClick={() => setEscala(e.key)}
                  className={`w-full flex items-start gap-4 rounded-xl border-2 p-4 text-left transition ${escala === e.key ? 'border-[var(--cor-primaria)] bg-[color-mix(in_srgb,var(--cor-primaria)_5%,white)]' : 'border-[#e5ecee] bg-white hover:border-[#d5e0e3]'}`}
                >
                  <div className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border ${escala === e.key ? 'border-[var(--cor-primaria)]' : 'border-[#d5e0e3]'}`}>
                    {escala === e.key && <div className="size-2 rounded-full bg-[var(--cor-primaria)]" />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${escala === e.key ? 'text-[var(--cor-primaria)]' : 'text-[#243942]'}`}>{e.label}</p>
                    <p className="text-xs text-[#82939a] mt-1">{e.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel>
            <div className="border-b border-[#e5ecee] px-5 py-4 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]"><Check size={18}/></div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Regra de Recuperação</h2>
                <p className="text-xs text-[#82939a]">O que acontece quando o aluno faz a recuperação.</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {RECUPERACOES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRecuperacao(r.key)}
                  className={`w-full flex items-start gap-4 rounded-xl border-2 p-4 text-left transition ${recuperacao === r.key ? 'border-[var(--cor-primaria)] bg-[color-mix(in_srgb,var(--cor-primaria)_5%,white)]' : 'border-[#e5ecee] bg-white hover:border-[#d5e0e3]'}`}
                >
                  <div className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border ${recuperacao === r.key ? 'border-[var(--cor-primaria)]' : 'border-[#d5e0e3]'}`}>
                    {recuperacao === r.key && <div className="size-2 rounded-full bg-[var(--cor-primaria)]" />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${recuperacao === r.key ? 'text-[var(--cor-primaria)]' : 'text-[#243942]'}`}>{r.label}</p>
                    <p className="text-xs text-[#82939a] mt-1">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </main>
    </AdminShell>
  )
}