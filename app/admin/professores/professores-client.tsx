'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Users, Mail, Phone, Trash2, X, Loader2, Check, Eye, EyeOff, BookOpen } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { convidarProfessor, alternarAtivoProfessor, excluirProfessor, type Professor } from './actions'

const DISCIPLINAS = [
  'Matemática', 'Português', 'Física', 'Química', 'Biologia', 'História',
  'Geografia', 'Inglês', 'Espanhol', 'Artes', 'Educação Física', 'Filosofia', 'Sociologia',
]

function iniciais(nome: string): string {
  const partes = nome.trim().split(' ')
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function formatarData(iso: string): string {
  try { return new Date(iso).toLocaleDateString('pt-BR') } catch { return '—' }
}

export function ProfessoresClient({ professores }: { professores: Professor[] }) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [novoAberto, setNovoAberto] = useState(false)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [disciplinasSel, setDisciplinasSel] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [processando, setProcessando] = useState<string | null>(null)

  const filtrados = professores.filter((p) => {
    const termo = busca.toLowerCase()
    return busca === '' || p.nome.toLowerCase().includes(termo) || p.email.toLowerCase().includes(termo)
  })

  const ativos = professores.filter((p) => p.ativo).length

  function toggleDisciplina(d: string) {
    setDisciplinasSel((atual) => atual.includes(d) ? atual.filter((x) => x !== d) : [...atual, d])
  }

  function limpar() {
    setNome(''); setEmail(''); setTelefone(''); setDisciplinasSel([]); setErro(''); setSucesso(false)
  }

  async function handleConvidar() {
    setErro('')
    if (!nome.trim()) return setErro('Informe o nome.')
    if (!email.includes('@')) return setErro('E-mail inválido.')

    setEnviando(true)
    const r = await convidarProfessor({ nome, email, disciplinas: disciplinasSel, telefone })
    setEnviando(false)

    if (!r.success) {
      setErro(r.error || 'Erro ao convidar.')
      return
    }

    setSucesso(true)
    router.refresh()
    setTimeout(() => {
      setNovoAberto(false)
      limpar()
    }, 2200)
  }

  async function handleToggleAtivo(p: Professor) {
    setProcessando(p.id)
    await alternarAtivoProfessor(p.id, !p.ativo)
    setProcessando(null)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    setProcessando(confirmarExclusao)
    await excluirProfessor(confirmarExclusao)
    setProcessando(null)
    setConfirmarExclusao(null)
    router.refresh()
  }

  return (
    <AdminShell mode="school" active="Professores">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Equipe"
            title="Professores e equipe"
            description="Convide professores e coordenação para o portal."
          />
          <button
            onClick={() => { limpar(); setNovoAberto(true) }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e]"
          >
            <Plus className="size-4" /> Convidar professor
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]"><Users className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Equipe total</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#12232b]">{professores.length}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]"><Check className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Ativos</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#065f46]">{ativos}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]"><BookOpen className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Disciplinas</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#3b82f6]">
                {new Set(professores.flatMap((p) => p.disciplinas || [])).size}
              </p>
            </div>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-base font-bold text-[#12232b]">Toda a equipe</h2>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-72">
                <Search className="size-4 text-[#9aaab0]" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou e-mail"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]"
                />
              </div>
            </div>
          </div>

          {professores.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]"><Users className="size-6" /></div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhum professor ainda</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">Convide o primeiro professor para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Professor</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Disciplinas</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Contato</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Status</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Desde</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-[#82939a]">Nenhum professor encontrado.</td></tr>
                  ) : (
                    filtrados.map((p) => (
                      <tr key={p.id} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="grid size-9 place-items-center rounded-full bg-[#ccfbf1] text-xs font-bold text-[#0f766e]">
                              {iniciais(p.nome)}
                            </div>
                            <div className="text-sm font-semibold text-[#243942]">{p.nome}</div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {p.disciplinas && p.disciplinas.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {p.disciplinas.slice(0, 3).map((d) => (
                                <span key={d} className="rounded-full bg-[#ccfbf1] px-2 py-0.5 text-[10px] font-bold text-[#0f766e]">{d}</span>
                              ))}
                              {p.disciplinas.length > 3 && (
                                <span className="text-[10px] text-[#82939a]">+{p.disciplinas.length - 3}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-[#82939a]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#4d626c]">
                          <div className="flex items-center gap-1.5"><Mail className="size-3.5 text-[#82939a]" /> {p.email}</div>
                          {p.telefone && <div className="mt-1 flex items-center gap-1.5 text-xs text-[#82939a]"><Phone className="size-3" /> {p.telefone}</div>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.ativo ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#e5ecee] text-[#5e7a94]'}`}>
                            {p.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#82939a]">{formatarData(p.criado_em)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleToggleAtivo(p)}
                              disabled={processando === p.id}
                              className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee] disabled:opacity-50"
                              title={p.ativo ? 'Desativar' : 'Ativar'}
                            >
                              {p.ativo ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                            <button
                              onClick={() => setConfirmarExclusao(p.id)}
                              className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                              title="Excluir"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </main>

      {novoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !enviando && setNovoAberto(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Convidar professor</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Enviaremos um link de acesso por e-mail</p>
              </div>
              <button onClick={() => setNovoAberto(false)} disabled={enviando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Nome completo</label>
                  <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Maria Silva" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">E-mail</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="professor@escola.com.br" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Telefone (opcional)</label>
                  <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(21) 90000-0000" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Disciplinas que leciona</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DISCIPLINAS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDisciplina(d)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                          disciplinasSel.includes(d) ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[#0d9488]'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
                {sucesso && (
                  <div className="flex items-center gap-2 rounded-lg border border-[#0d9488]/30 bg-[#ccfbf1] px-3 py-2 text-xs text-[#0f766e]">
                    <Check className="size-4" /> Convite enviado! O professor receberá o link por e-mail.
                  </div>
                )}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovoAberto(false)} disabled={enviando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Fechar</button>
              <button onClick={handleConvidar} disabled={enviando || sucesso} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                {enviando ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                {enviando ? 'Enviando...' : 'Enviar convite'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmarExclusao(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]"><Trash2 className="size-5" /></div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir professor?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">O acesso será removido. As notas e ocorrências já lançadas permanecem.</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmarExclusao(null)} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e]">Cancelar</button>
              <button onClick={handleExcluir} disabled={!!processando} className="flex-1 rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-50">
                {processando ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}