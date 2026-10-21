'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Bell, Eye, X, Trash2, AlertCircle, Send, Loader2 } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { criarComunicado, excluirComunicado, type Comunicado } from './actions'

// ── SEMÂNTICO: cores por setor ──────────────────────────────────────
const setorStyles: Record<string, string> = {
  'Coordenação': 'bg-[#dbeafe] text-[#1e40af]',
  'Secretaria': 'bg-[#ccfbf1] text-[#0f766e]',
  'Financeiro': 'bg-[#fef3c7] text-[#92400e]',
  'Direção': 'bg-[#ede9fe] text-[#5b21b6]',
}

// ── SEMÂNTICO: cores por prioridade ─────────────────────────────────
const prioridadeStyles: Record<string, string> = {
  'alta': 'bg-[#fee2e2] text-[#991b1b]',
  'normal': 'bg-[#e5ecee] text-[#5e7a94]',
  'baixa': 'bg-[#f0f4f5] text-[#6b7d86]',
}

const setores = ['Secretaria', 'Coordenação', 'Financeiro', 'Direção']
const prioridades = [
  { key: 'baixa', label: 'Baixa' },
  { key: 'normal', label: 'Normal' },
  { key: 'alta', label: 'Alta' },
]

function formatarData(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

export function ComunicacaoClient({ comunicados }: { comunicados: Comunicado[] }) {
  const router = useRouter()
  const [novoAberto, setNovoAberto] = useState(false)
  const [comunicadoLido, setComunicadoLido] = useState<Comunicado | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [setor, setSetor] = useState('Secretaria')
  const [prioridade, setPrioridade] = useState('normal')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  function limparForm() {
    setTitulo('')
    setMensagem('')
    setSetor('Secretaria')
    setPrioridade('normal')
    setErro('')
  }

  async function handleEnviar() {
    if (!titulo.trim()) {
      setErro('Informe um título.')
      return
    }
    if (!mensagem.trim()) {
      setErro('Informe a mensagem.')
      return
    }

    setEnviando(true)
    setErro('')
    const result = await criarComunicado({ titulo, mensagem, setor, prioridade })
    setEnviando(false)

    if (!result.success) {
      setErro(result.error || 'Erro ao enviar.')
      return
    }

    limparForm()
    setNovoAberto(false)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    setExcluindo(true)
    const result = await excluirComunicado(confirmarExclusao)
    setExcluindo(false)
    
    if (result.success) {
      setConfirmarExclusao(null)
      router.refresh()
    } else {
      alert(result.error || 'Erro ao excluir.')
    }
  }

  const totalComunicados = comunicados.length
  const totalLeituras = comunicados.reduce((soma, c) => soma + c.total_leituras, 0)

  return (
    <AdminShell mode="school" active="Comunicação">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Comunicação"
            title="Central de comunicação"
            description="Envie comunicados para os responsáveis da escola."
          />
          <button 
            onClick={() => setNovoAberto(true)} 
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90"
            style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
          >
            <Plus className="size-4" />
            Novo comunicado
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="flex items-center gap-4 p-5">
            <div
              className="grid size-10 place-items-center rounded-lg"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                color: 'var(--cor-primaria, #0d9488)',
              }}
            >
              <Bell className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Comunicados</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#12232b]">{totalComunicados}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
              <Eye className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Total de leituras</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#12232b]">{totalLeituras}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Alta prioridade</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#12232b]">{comunicados.filter((c) => c.prioridade === 'alta').length}</p>
            </div>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <h2 className="text-base font-bold text-[#12232b]">Comunicados enviados</h2>
          </div>
          {comunicados.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div
                className="grid size-14 place-items-center rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                  color: 'var(--cor-primaria, #0d9488)',
                }}
              >
                <Bell className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhum comunicado ainda</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">
                Envie o primeiro comunicado e ele aparecerá na área dos responsáveis.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4f5]">
              {comunicados.map((c) => (
                <div key={c.id} className="px-5 py-4 transition hover:bg-[#fafcfc]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setComunicadoLido(c)}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${setorStyles[c.setor] || 'bg-[#e5ecee] text-[#5e7a94]'}`}>
                          {c.setor}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${prioridadeStyles[c.prioridade] || prioridadeStyles.normal}`}>
                          {c.prioridade.charAt(0).toUpperCase() + c.prioridade.slice(1)}
                        </span>
                      </div>
                      <h3
                        className="mt-2 text-sm font-semibold text-[#243942] transition-colors"
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cor-primaria, #0d9488)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                      >
                        {c.titulo}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#82939a]">{c.mensagem}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#82939a]">
                        <span>Por: {c.autor_nome}</span>
                        <span>·</span>
                        <span>{formatarData(c.criado_em)}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1"><Eye className="size-3" /> {c.total_leituras} leituras</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1 items-end">
                      <button
                        onClick={() => setComunicadoLido(c)}
                        className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]"
                        title="Ler comunicado"
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        onClick={() => setConfirmarExclusao(c.id)}
                        className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                        title="Excluir"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </main>

      {/* MODAL NOVO COMUNICADO */}
      {novoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !enviando && setNovoAberto(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Novo comunicado</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Será enviado para todos os responsáveis</p>
              </div>
              <button onClick={() => setNovoAberto(false)} disabled={enviando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50">
                <X className="size-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Título</label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Reunião de pais — 9º Ano A"
                    className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Mensagem</label>
                  <textarea
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Escreva o comunicado completo..."
                    rows={8}
                    className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Setor</label>
                  <div className="grid grid-cols-4 gap-2">
                    {setores.map((s) => {
                      const sel = setor === s
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSetor(s)}
                          className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${sel ? '' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[var(--cor-primaria,#0d9488)]'}`}
                          style={sel ? {
                            borderColor: 'var(--cor-primaria, #0d9488)',
                            backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                            color: 'var(--cor-primaria, #0d9488)',
                          } : undefined}
                        >
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Prioridade</label>
                  <div className="grid grid-cols-3 gap-2">
                    {prioridades.map((p) => {
                      const sel = prioridade === p.key
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setPrioridade(p.key)}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${sel ? '' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[var(--cor-primaria,#0d9488)]'}`}
                          style={sel ? {
                            borderColor: 'var(--cor-primaria, #0d9488)',
                            backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                            color: 'var(--cor-primaria, #0d9488)',
                          } : undefined}
                        >
                          {p.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {erro && (
                  <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">
                    {erro}
                  </p>
                )}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovoAberto(false)} disabled={enviando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] hover:border-[var(--cor-primaria,#0d9488)] disabled:opacity-50">
                Cancelar
              </button>
              <button
                onClick={handleEnviar}
                disabled={enviando}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
              >
                {enviando ? <><Loader2 className="size-4 animate-spin" /> Enviando...</> : <><Send className="size-4" /> Enviar comunicado</>}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {/* MODAL LER COMUNICADO */}
      {comunicadoLido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setComunicadoLido(null)} />
          <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-[#e5ecee] px-6 py-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${setorStyles[comunicadoLido.setor] || 'bg-[#e5ecee] text-[#5e7a94]'}`}>{comunicadoLido.setor}</span>
                  {comunicadoLido.prioridade === 'alta' && <span className="rounded-full bg-[#fee2e2] px-2 py-1 text-[10px] font-bold text-[#991b1b]">Alta prioridade</span>}
                </div>
                <h2 className="mt-3 text-xl font-bold text-[#12232b]">{comunicadoLido.titulo}</h2>
                <p className="mt-1 text-xs text-[#82939a]">Por {comunicadoLido.autor_nome} · {formatarData(comunicadoLido.criado_em)}</p>
              </div>
              <button onClick={() => setComunicadoLido(null)} className="ml-3 rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
            </header>
            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-[#243942]">{comunicadoLido.mensagem}</p>
            </div>
            <footer className="flex items-center justify-between border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#82939a]">
                <Eye className="size-4" /> {comunicadoLido.total_leituras} responsáveis leram
              </span>
              <button onClick={() => setComunicadoLido(null)} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e]">
                Fechar
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR */}
      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !excluindo && setConfirmarExclusao(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]">
              <Trash2 className="size-5" />
            </div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir comunicado?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">
              O comunicado deixará de aparecer na área dos responsáveis. Essa ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmarExclusao(null)} disabled={excluindo} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e] disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleExcluir} disabled={excluindo} className="flex-1 rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-50">
                {excluindo ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}