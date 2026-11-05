'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle2, XCircle, Info } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { alternarAddon, type AddonEscola } from './actions'

export function AddonsEscolaClient({ addonsIniciais, totalAlunos }: { addonsIniciais: AddonEscola[], totalAlunos: number }) {
  const [addons, setAddons] = useState(addonsIniciais)
  const [processando, setProcessando] = useState<string | null>(null)

  const formatarMoeda = (centavos: number) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  async function handleToggle(slug: string, ativar: boolean) {
    setProcessando(slug)
    const r = await alternarAddon(slug, ativar)
    setProcessando(null)

    if (r.success) {
      setAddons(prev => prev.map(a => a.slug === slug ? { ...a, ativo: ativar } : a))
    } else {
      alert(r.error)
    }
  }

  return (
    <AdminShell mode="school" active="Add-ons">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading 
          eyebrow="Gestão" 
          title="Add-ons e Módulos Extras" 
          description="Ative recursos adicionais para a sua escola." 
        />

        <div className="mt-8 rounded-xl border border-[#dce5e8] bg-white p-5 mb-8 flex items-start gap-4">
          <div className="grid size-10 place-items-center rounded-lg bg-[#f0fdfa] text-[#0d9488] shrink-0">
            <Info className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#12232b]">Como funciona a cobrança?</h3>
            <p className="text-xs text-[#82939a] mt-1 leading-relaxed">
              Os add-ons podem ser cobrados com um valor fixo mensal ou por aluno ativo. 
              Sua escola possui atualmente <strong>{totalAlunos} alunos ativos</strong>. 
              O custo será incluído automaticamente na sua próxima fatura.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {addons.map(a => {
            const isPorAluno = a.preco_por_aluno_centavos > 0
            const custoMensal = isPorAluno ? a.preco_por_aluno_centavos * totalAlunos : a.preco_centavos

            return (
              <Panel key={a.slug} className={`p-6 flex flex-col justify-between transition-all ${a.ativo ? 'border-[#0d9488] ring-1 ring-[#0d9488]' : ''}`}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`grid size-12 place-items-center rounded-xl ${a.ativo ? 'bg-[#0d9488] text-white' : 'bg-[#ccfbf1] text-[#0d9488]'}`}>
                      <Sparkles className="size-6" />
                    </div>
                    {a.ativo && (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                        <CheckCircle2 className="size-3" /> Ativo
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[#12232b]">{a.nome}</h3>
                  <p className="text-sm text-[#82939a] mt-2 line-clamp-3 leading-relaxed">{a.descricao || 'Sem descrição.'}</p>
                </div>

                <div className="mt-6 border-t border-[#e5ecee] pt-4">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-xs text-[#6b7d86] font-semibold uppercase tracking-wider">Custo Estimado</p>
                      <p className="text-2xl font-bold text-[#12232b]">{formatarMoeda(custoMensal)}<span className="text-sm font-normal text-gray-500">/mês</span></p>
                      {isPorAluno && <p className="text-[10px] text-[#0d9488] mt-1">{formatarMoeda(a.preco_por_aluno_centavos)} por aluno</p>}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(a.slug, !a.ativo)}
                    disabled={processando === a.slug}
                    className={`w-full py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
                      a.ativo 
                        ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                        : 'bg-[#0d9488] text-white hover:bg-[#0f766e]'
                    } disabled:opacity-50`}
                  >
                    {processando === a.slug ? <Loader2 className="size-4 animate-spin" /> : a.ativo ? <XCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
                    {processando === a.slug ? 'Processando...' : a.ativo ? 'Desativar Add-on' : 'Ativar Add-on'}
                  </button>
                </div>
              </Panel>
            )
          })}

          {addons.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center border border-[#dce5e8] rounded-xl bg-white">
              <div className="grid size-14 place-items-center rounded-full bg-[#f0f4f5] text-[#82939a]"><Sparkles className="size-6" /></div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhum add-on disponível</h3>
              <p className="mt-1 text-sm text-[#82939a]">A ARXUM ainda não liberou módulos extras para a sua escola.</p>
            </div>
          )}
        </div>
      </main>
    </AdminShell>
  )
}
