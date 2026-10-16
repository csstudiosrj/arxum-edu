'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Download, Trash2, X, Eye, Inbox } from 'lucide-react'
import { AdminShell, Panel } from '@/components/admin-shell'
import { excluirResposta } from '../../actions'
import type { Formulario, CampoFormulario, RespostaFormulario } from '@/lib/cms/tipos-formulario'

function formatarData(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

function valorLegivel(v: any): string {
  if (v === null || v === undefined) return '—'
  if (Array.isArray(v)) return v.join(', ')
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function exportarCSV(campos: CampoFormulario[], respostas: RespostaFormulario[]) {
  const headers = ['Data', 'E-mail', 'Aluno', ...campos.map((c) => c.label)]
  const linhas = respostas.map((r) => {
    const dados = campos.map((c) => {
      const v = r.dados?.[c.id]
      return `"${valorLegivel(v).replace(/"/g, '""')}"`
    })
    return [
      `"${formatarData(r.criado_em)}"`,
      `"${r.responsavel_email || ''}"`,
      `"${r.aluno_nome || ''}"`,
      ...dados,
    ].join(',')
  })

  const csv = [headers.map((h) => `"${h}"`).join(','), ...linhas].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `respostas-${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function RespostasClient({
  formulario,
  campos,
  respostas,
}: {
  formulario: Formulario
  campos: CampoFormulario[]
  respostas: RespostaFormulario[]
}) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [detalhe, setDetalhe] = useState<RespostaFormulario | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)

  const filtradas = respostas.filter((r) => {
    const termo = busca.toLowerCase()
    const dadosStr = JSON.stringify(r.dados).toLowerCase()
    return busca === '' || (r.responsavel_email || '').toLowerCase().includes(termo) || (r.aluno_nome || '').toLowerCase().includes(termo) || dadosStr.includes(termo)
  })

  async function handleExcluir() {
    if (!confirmarExclusao) return
    await excluirResposta(confirmarExclusao)
    setConfirmarExclusao(null)
    setDetalhe(null)
    router.refresh()
  }

  return (
    <AdminShell mode="school" active="Formulários">
      <main className="px-5 py-8 lg:px-8">
        <Link href={`/admin/formularios/${formulario.id}`} className="inline-flex items-center gap-2 text-sm text-[#6b7d86] hover:text-[#0d9488]">
          <ArrowLeft className="size-4" /> Editar formulário
        </Link>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0d9488]">Respostas</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">{formulario.titulo}</h1>
            <p className="mt-1 text-sm text-[#71838b]">{respostas.length} {respostas.length === 1 ? 'resposta recebida' : 'respostas recebidas'}</p>
          </div>
          {respostas.length > 0 && (
            <button
              onClick={() => exportarCSV(campos, respostas)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] hover:border-[#0d9488] hover:text-[#0f766e]"
            >
              <Download className="size-4" /> Exportar CSV
            </button>
          )}
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-72">
              <Search className="size-4 text-[#9aaab0]" />
              <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nas respostas" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
            </div>
          </div>

          {respostas.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]"><Inbox className="size-6" /></div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhuma resposta ainda</h3>
              <p className="mt-1 text-sm text-[#82939a]">Compartilhe o link do formulário para começar a receber.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4f5]">
              {filtradas.map((r) => (
                <div key={r.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#fafcfc]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#243942]">{r.aluno_nome || r.responsavel_email || 'Sem identificação'}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-[#82939a]">{formatarData(r.criado_em)}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#82939a]">
                      {campos.slice(0, 3).map((c) => {
                        const v = r.dados?.[c.id]
                        if (v === null || v === undefined || v === '') return null
                        return <span key={c.id} className="truncate max-w-[200px]">{c.label}: <span className="font-semibold text-[#536871]">{valorLegivel(v)}</span></span>
                      })}
                    </div>
                  </div>
                  <button onClick={() => setDetalhe(r)} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Ver detalhes">
                    <Eye className="size-4" />
                  </button>
                  <button onClick={() => setConfirmarExclusao(r.id)} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]" title="Excluir">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </main>

      {detalhe && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetalhe(null)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">{detalhe.aluno_nome || 'Resposta'}</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">{detalhe.responsavel_email || ''} · {formatarData(detalhe.criado_em)}</p>
              </div>
              <button onClick={() => setDetalhe(null)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <dl className="space-y-4">
                {campos.map((c) => (
                  <div key={c.id}>
                    <dt className="text-xs font-bold uppercase tracking-wider text-[#82939a]">{c.label}</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#243942]">{valorLegivel(detalhe.dados?.[c.id])}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button
                onClick={() => setConfirmarExclusao(detalhe.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#dc2626] bg-white px-4 py-2 text-sm font-semibold text-[#dc2626] hover:bg-[#fee2e2]"
              >
                <Trash2 className="size-4" /> Excluir
              </button>
            </footer>
          </aside>
        </div>
      )}

      {confirmarExclusao && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmarExclusao(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]"><Trash2 className="size-5" /></div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir resposta?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">Essa ação não pode ser desfeita.</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmarExclusao(null)} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e]">Cancelar</button>
              <button onClick={handleExcluir} className="flex-1 rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b91c1c]">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}