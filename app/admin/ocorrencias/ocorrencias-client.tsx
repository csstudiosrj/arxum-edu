'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, AlertCircle, BookOpen, Heart, Award, FileQuestion, ShieldAlert, Trash2, X, Loader2, Eye, Check, Edit } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { criarOcorrencia, atualizarOcorrencia, excluirOcorrencia, type Ocorrencia } from './actions'

type IconeComponente = typeof AlertCircle

// ── SEMÂNTICO: cores por categoria de ocorrência ────────────────────
const tipos: Array<{ key: string; label: string; icone: IconeComponente; cor: string }> = [
  { key: 'pedagogica', label: 'Pedagógica', icone: BookOpen, cor: '#3b82f6' },
  { key: 'disciplinar', label: 'Disciplinar', icone: ShieldAlert, cor: '#dc2626' },
  { key: 'saude', label: 'Saúde', icone: Heart, cor: '#d97706' },
  { key: 'elogio', label: 'Elogio', icone: Award, cor: '#0d9488' },
  { key: 'outro', label: 'Outro', icone: FileQuestion, cor: '#6b7d86' },
]

const gravidades = [
  { key: 'baixa', label: 'Baixa', style: 'bg-[#e5ecee] text-[#5e7a94]' },
  { key: 'media', label: 'Média', style: 'bg-[#fef3c7] text-[#92400e]' },
  { key: 'alta', label: 'Alta', style: 'bg-[#fee2e2] text-[#991b1b]' },
]

const filtros = [
  { key: 'todas', label: 'Todas' },
  { key: 'pedagogica', label: 'Pedagógica' },
  { key: 'disciplinar', label: 'Disciplinar' },
  { key: 'saude', label: 'Saúde' },
  { key: 'elogio', label: 'Elogio' },
]

function tipoInfo(key: string) {
  return tipos.find((t) => t.key === key) || tipos[4]
}

function gravidadeInfo(key: string) {
  return gravidades.find((g) => g.key === key) || gravidades[0]
}

function formatarData(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

export function OcorrenciasClient({ ocorrencias, alunos }: { ocorrencias: Ocorrencia[]; alunos: Array<{ id: string; nome: string; responsavel_email: string }> }) {
  const router = useRouter()
  const [filtro, setFiltro] = useState('todas')
  const [busca, setBusca] = useState('')
  const [novaAberta, setNovaAberta] = useState(false)
  const [editando, setEditando] = useState<Ocorrencia | null>(null)
  const [detalhe, setDetalhe] = useState<Ocorrencia | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const [alunoIdx, setAlunoIdx] = useState('')
  const [tipo, setTipo] = useState('pedagogica')
  const [gravidade, setGravidade] = useState('baixa')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [providencias, setProvidencias] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const filtradas = ocorrencias.filter((o) => {
    const matchFiltro = filtro === 'todas' || o.tipo === filtro
    const termo = busca.toLowerCase()
    const matchBusca = busca === '' || o.aluno_nome.toLowerCase().includes(termo) || o.titulo.toLowerCase().includes(termo)
    return matchFiltro && matchBusca
  })

  function limpar() {
    setAlunoIdx('')
    setTipo('pedagogica')
    setGravidade('baixa')
    setTitulo('')
    setDescricao('')
    setProvidencias('')
    setErro('')
    setEditando(null)
  }

  function abrirEdicao(o: Ocorrencia) {
    const idx = alunos.findIndex((a) => a.id === o.aluno_id)
    setAlunoIdx(String(idx))
    setTipo(o.tipo)
    setGravidade(o.gravidade)
    setTitulo(o.titulo)
    setDescricao(o.descricao)
    setProvidencias(o.providencias || '')
    setEditando(o)
    setNovaAberta(true)
    setErro('')
  }

  async function handleSalvar() {
    if (!alunoIdx && !editando) return setErro('Selecione o aluno.')
    if (!titulo.trim()) return setErro('Informe o título.')
    if (!descricao.trim()) return setErro('Informe a descrição.')

    setSalvando(true)
    setErro('')
    
    if (editando) {
      const result = await atualizarOcorrencia(editando.id, { tipo, gravidade, titulo, descricao, providencias })
      setSalvando(false)
      if (!result.success) return setErro(result.error || 'Erro.')
    } else {
      const aluno = alunos[parseInt(alunoIdx, 10)]
      if (!aluno) {
        setSalvando(false)
        return setErro('Aluno inválido.')
      }
      const result = await criarOcorrencia({
        aluno_id: aluno.id,
        aluno_nome: aluno.nome,
        responsavel_email: aluno.responsavel_email,
        tipo,
        gravidade,
        titulo,
        descricao,
        providencias,
      })
      setSalvando(false)
      if (!result.success) return setErro(result.error || 'Erro.')
    }

    limpar()
    setNovaAberta(false)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    setExcluindo(true)
    const r = await excluirOcorrencia(confirmarExclusao)
    setExcluindo(false)
    if (!r.success) {
      alert(r.error || 'Erro ao excluir.')
      return
    }
    setConfirmarExclusao(null)
    router.refresh()
  }

  const naoLidas = ocorrencias.filter((o) => !o.lida).length
  const altaGravidade = ocorrencias.filter((o) => o.gravidade === 'alta').length

  return (
    <AdminShell mode="school" active="Ocorrências">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Pedagógico"
            title="Ocorrências"
            description="Registre ocorrências pedagógicas, disciplinares e de saúde dos alunos."
          />
          <button 
            onClick={() => { limpar(); setNovaAberta(true) }} 
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90"
            style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
          >
            <Plus className="size-4" />
            Nova ocorrência
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="p-5">
            <div
              className="grid size-10 place-items-center rounded-lg"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                color: 'var(--cor-primaria, #0d9488)',
              }}
            >
              <AlertCircle className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Total</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em]" style={{ color: 'var(--cor-primaria, #0d9488)' }}>{ocorrencias.length}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]">
              <Eye className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Não lidas</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#92400e]">{naoLidas}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#fee2e2] text-[#991b1b]">
              <ShieldAlert className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Alta gravidade</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#991b1b]">{altaGravidade}</p>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {filtros.map((f) => {
                  const ativo = filtro === f.key
                  return (
                    <button
                      key={f.key}
                      onClick={() => setFiltro(f.key)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${ativo ? '' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}
                      style={ativo ? {
                        backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                        color: 'var(--cor-primaria, #0d9488)',
                      } : undefined}
                    >
                      {f.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-72">
                <Search className="size-4 text-[#9aaab0]" />
                <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar aluno ou título" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
              </div>
            </div>
          </div>

          {ocorrencias.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div
                className="grid size-14 place-items-center rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                  color: 'var(--cor-primaria, #0d9488)',
                }}
              >
                <AlertCircle className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhuma ocorrência registrada</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">Registre a primeira ocorrência e ela aparecerá para o responsável.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4f5]">
              {filtradas.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-[#82939a]">Nenhuma ocorrência encontrada.</div>
              ) : (
                filtradas.map((o) => {
                  const info = tipoInfo(o.tipo)
                  const grav = gravidadeInfo(o.gravidade)
                  const Icone = info.icone
                  return (
                    <div key={o.id} className="flex items-start gap-4 px-5 py-4 transition hover:bg-[#fafcfc]">
                      <div className="grid size-10 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${info.cor}15`, color: info.cor }}>
                        <Icone className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-[#243942]">{o.titulo}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${grav.style}`}>{grav.label}</span>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${info.cor}15`, color: info.cor }}>{info.label}</span>
                          {!o.lida && <span className="rounded-full bg-[#dc2626] px-2 py-0.5 text-[10px] font-bold text-white">Não lida</span>}
                        </div>
                        <p className="mt-1 text-xs font-semibold text-[#536871]">{o.aluno_nome} · {o.responsavel_email}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#82939a]">{o.descricao}</p>
                        <p className="mt-1 text-[11px] text-[#a0afb4]">Por {o.autor_nome} · {formatarData(o.criado_em)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => abrirEdicao(o)}
                          className="rounded-lg p-1.5 transition hover:brightness-90"
                          style={{ color: 'var(--cor-primaria, #0d9488)' }}
                          title="Editar"
                        >
                          <Edit className="size-4" />
                        </button>
                        <button onClick={() => setDetalhe(o)} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Ver detalhes">
                          <Eye className="size-4" />
                        </button>
                        <button onClick={() => setConfirmarExclusao(o.id)} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]" title="Excluir">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </Panel>
      </main>

      {/* MODAL NOVA/EDITAR OCORRÊNCIA */}
      {novaAberta && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !salvando && setNovaAberta(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">{editando ? 'Editar ocorrência' : 'Nova ocorrência'}</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Aparecerá para o responsável do aluno</p>
              </div>
              <button onClick={() => setNovaAberta(false)} disabled={salvando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Aluno</label>
                  <select value={alunoIdx} onChange={(e) => setAlunoIdx(e.target.value)} disabled={!!editando} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)] disabled:bg-[#f0f4f5] disabled:text-[#82939a]">
                    <option value="">Selecione</option>
                    {alunos.map((a, i) => <option key={a.id} value={String(i)}>{a.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Tipo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {tipos.map((t) => {
                      const Icone = t.icone
                      const sel = tipo === t.key
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setTipo(t.key)}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition ${sel ? '' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[var(--cor-primaria,#0d9488)]'}`}
                          style={sel ? {
                            borderColor: 'var(--cor-primaria, #0d9488)',
                            backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                            color: 'var(--cor-primaria, #0d9488)',
                          } : undefined}
                        >
                          <Icone className="size-3.5" />{t.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Gravidade</label>
                  <div className="grid grid-cols-3 gap-2">
                    {gravidades.map((g) => {
                      const sel = gravidade === g.key
                      return (
                        <button
                          key={g.key}
                          type="button"
                          onClick={() => setGravidade(g.key)}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${sel ? '' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[var(--cor-primaria,#0d9488)]'}`}
                          style={sel ? {
                            borderColor: 'var(--cor-primaria, #0d9488)',
                            backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                            color: 'var(--cor-primaria, #0d9488)',
                          } : undefined}
                        >
                          {g.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Título</label>
                  <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Conversa durante a aula" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição</label>
                  <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="O que aconteceu" rows={4} className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Providências adotadas</label>
                  <textarea value={providencias} onChange={(e) => setProvidencias(e.target.value)} placeholder="Ex: Conversei com o aluno e ele se comprometeu (opcional)" rows={3} className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovaAberta(false)} disabled={salvando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
              >
                {salvando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Registrar ocorrência'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {/* MODAL DETALHE */}
      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetalhe(null)} />
          <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                {(() => {
                  const info = tipoInfo(detalhe.tipo)
                  const Icone = info.icone
                  return (
                    <div className="flex items-center gap-2">
                      <div className="grid size-8 place-items-center rounded-lg" style={{ backgroundColor: `${info.cor}15`, color: info.cor }}>
                        <Icone className="size-4" />
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${info.cor}15`, color: info.cor }}>{info.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${gravidadeInfo(detalhe.gravidade).style}`}>{gravidadeInfo(detalhe.gravidade).label}</span>
                    </div>
                  )
                })()}
                <h2 className="mt-3 text-xl font-bold text-[#12232b]">{detalhe.titulo}</h2>
                <p className="mt-1 text-xs text-[#82939a]">{detalhe.aluno_nome} · {formatarData(detalhe.criado_em)}</p>
              </div>
              <button onClick={() => setDetalhe(null)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#82939a]">Descrição</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#243942]">{detalhe.descricao}</p>
              </div>
              {detalhe.providencias && (
                <div className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#82939a]">Providências</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#243942]">{detalhe.providencias}</p>
                </div>
              )}
              <p className="mt-4 text-xs text-[#a0afb4]">Registrado por {detalhe.autor_nome}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR */}
      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !excluindo && setConfirmarExclusao(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]"><Trash2 className="size-5" /></div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir ocorrência?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">Essa ação não pode ser desfeita.</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmarExclusao(null)} disabled={excluindo} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
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