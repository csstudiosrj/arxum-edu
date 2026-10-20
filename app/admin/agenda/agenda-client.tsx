'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, Trash2, X, Loader2, BookOpen, Users, Bus, PartyPopper, Edit, Check } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { criarEvento, atualizarEvento, excluirEvento, type Evento } from './actions'

type IconeComponente = typeof Calendar

const tipos: Array<{ key: string; label: string; icone: IconeComponente; cor: string }> = [
  { key: 'prova', label: 'Prova', icone: BookOpen, cor: '#3b82f6' },
  { key: 'reuniao', label: 'Reunião', icone: Users, cor: '#7c3aed' },
  { key: 'passeio', label: 'Passeio', icone: Bus, cor: '#0d9488' },
  { key: 'feriado', label: 'Feriado', icone: PartyPopper, cor: '#d97706' },
  { key: 'evento', label: 'Evento', icone: Calendar, cor: '#dc2626' },
  { key: 'outro', label: 'Outro', icone: Calendar, cor: '#6b7d86' },
]

const publicos = [
  { key: 'todos', label: 'Toda a escola' },
  { key: 'infantil', label: 'Educação Infantil' },
  { key: 'fundamental1', label: 'Fundamental I' },
  { key: 'fundamental2', label: 'Fundamental II' },
  { key: 'medio', label: 'Ensino Médio' },
]

function tipoInfo(key: string) {
  return tipos.find((t) => t.key === key) || tipos[5]
}

function formatarData(iso: string): string {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function ehFuturo(iso: string): boolean {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return new Date(iso + 'T12:00:00') >= hoje
}

export function AgendaClient({ eventos }: { eventos: Evento[] }) {
  const router = useRouter()
  const [novoAberto, setNovoAberto] = useState(false)
  const [editando, setEditando] = useState<Evento | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState('prova')
  const [dataEvento, setDataEvento] = useState('')
  const [horaEvento, setHoraEvento] = useState('')
  const [publico, setPublico] = useState('todos')
  const [serie, setSerie] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const proximos = eventos.filter((e) => ehFuturo(e.data_evento))
  const passados = eventos.filter((e) => !ehFuturo(e.data_evento))

  function limpar() {
    setTitulo('')
    setDescricao('')
    setTipo('prova')
    setDataEvento('')
    setHoraEvento('')
    setPublico('todos')
    setSerie('')
    setErro('')
    setEditando(null)
  }

  function abrirEdicao(e: Evento) {
    setTitulo(e.titulo)
    setDescricao(e.descricao || '')
    setTipo(e.tipo)
    setDataEvento(e.data_evento)
    setHoraEvento(e.hora_evento || '')
    setPublico(e.publico)
    setSerie(e.serie || '')
    setEditando(e)
    setNovoAberto(true)
    setErro('')
  }

  async function handleSalvar() {
    if (!titulo.trim()) return setErro('Informe o título.')
    if (!dataEvento) return setErro('Informe a data.')

    setSalvando(true)
    setErro('')

    if (editando) {
      const result = await atualizarEvento(editando.id, { titulo, descricao, tipo, data_evento: dataEvento, hora_evento: horaEvento, publico, serie })
      setSalvando(false)
      if (!result.success) return setErro(result.error || 'Erro.')
    } else {
      const result = await criarEvento({ titulo, descricao, tipo, data_evento: dataEvento, hora_evento: horaEvento, publico, serie })
      setSalvando(false)
      if (!result.success) return setErro(result.error || 'Erro.')
    }

    limpar()
    setNovoAberto(false)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    setExcluindo(true)
    const r = await excluirEvento(confirmarExclusao)
    setExcluindo(false)
    if (!r.success) {
      alert(r.error || 'Erro ao excluir.')
      return
    }
    setConfirmarExclusao(null)
    router.refresh()
  }

  return (
    <AdminShell mode="school" active="Agenda">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Calendário escolar"
            title="Agenda"
            description="Gerencie eventos, provas e reuniões da escola."
          />
          <button 
            onClick={() => { limpar(); setNovoAberto(true) }} 
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f766e]"
          >
            <Plus className="size-4" />
            Novo evento
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
              <Calendar className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Próximos</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#0d9488]">{proximos.length}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
              <BookOpen className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Provas agendadas</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#3b82f6]">{eventos.filter((e) => e.tipo === 'prova' && ehFuturo(e.data_evento)).length}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ede9fe] text-[#5b21b6]">
              <Users className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Reuniões</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#5b21b6]">{eventos.filter((e) => e.tipo === 'reuniao' && ehFuturo(e.data_evento)).length}</p>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <h2 className="text-base font-bold text-[#12232b]">Próximos eventos</h2>
          </div>
          {proximos.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]">
                <Calendar className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhum evento agendado</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">Crie o primeiro evento e ele aparecerá na área dos responsáveis.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4f5]">
              {proximos.map((e) => {
                const info = tipoInfo(e.tipo)
                const Icone = info.icone
                return (
                  <div key={e.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#fafcfc]">
                    <div className="grid size-11 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${info.cor}15`, color: info.cor }}>
                      <Icone className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-[#243942]">{e.titulo}</h3>
                      {e.descricao && <p className="mt-0.5 truncate text-xs text-[#82939a]">{e.descricao}</p>}
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#82939a]">
                        <span className="font-medium text-[#536871]">{formatarData(e.data_evento)}{e.hora_evento ? ` · ${e.hora_evento}` : ''}</span>
                        <span>·</span>
                        <span>{info.label}</span>
                        <span>·</span>
                        <span>{publicos.find((p) => p.key === e.publico)?.label || e.publico}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button onClick={() => abrirEdicao(e)} className="rounded-lg p-1.5 text-[#0d9488] hover:bg-[#ccfbf1]" title="Editar">
                        <Edit className="size-4" />
                      </button>
                      <button onClick={() => setConfirmarExclusao(e.id)} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]" title="Excluir">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>

        {passados.length > 0 && (
          <Panel className="mt-6">
            <div className="border-b border-[#e5ecee] px-5 py-4">
              <h2 className="text-base font-bold text-[#82939a]">Eventos anteriores</h2>
            </div>
            <div className="divide-y divide-[#f0f4f5]">
              {passados.slice(0, 10).map((e) => {
                const info = tipoInfo(e.tipo)
                const Icone = info.icone
                return (
                  <div key={e.id} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-[#fafcfc]">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f0f4f5] text-[#82939a]">
                      <Icone className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm text-[#536871]">{e.titulo}</h3>
                      <p className="text-xs text-[#a0afb4]">{formatarData(e.data_evento)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button onClick={() => abrirEdicao(e)} className="rounded-lg p-1.5 text-[#a0afb4] hover:bg-[#ccfbf1] hover:text-[#0d9488]" title="Editar">
                        <Edit className="size-3.5" />
                      </button>
                      <button onClick={() => setConfirmarExclusao(e.id)} className="rounded-lg p-1.5 text-[#a0afb4] hover:bg-[#fee2e2] hover:text-[#dc2626]" title="Excluir">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>
        )}
      </main>

      {/* MODAL CRIAR / EDITAR */}
      {novoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !salvando && setNovoAberto(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">{editando ? 'Editar evento' : 'Novo evento'}</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Aparecerá na agenda dos responsáveis</p>
              </div>
              <button onClick={() => setNovoAberto(false)} disabled={salvando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50">
                <X className="size-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Título</label>
                  <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Prova de Matemática" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição</label>
                  <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes do evento (opcional)" rows={3} className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Tipo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {tipos.map((t) => {
                      const Icone = t.icone
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setTipo(t.key)}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                            tipo === t.key ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[#0d9488]'
                          }`}
                        >
                          <Icone className="size-3.5" />
                          {t.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Data</label>
                    <input type="date" value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Hora</label>
                    <input type="time" value={horaEvento} onChange={(e) => setHoraEvento(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Público</label>
                  <div className="grid grid-cols-2 gap-2">
                    {publicos.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPublico(p.key)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          publico === p.key ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[#0d9488]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Série específica</label>
                  <input type="text" value={serie} onChange={(e) => setSerie(e.target.value)} placeholder="Ex: 9º Ano A (opcional)" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>

                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovoAberto(false)} disabled={salvando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleSalvar} disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                {salvando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar evento'}
              </button>
            </footer>
          </aside>
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
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir evento?</h3>
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