'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Mail, Phone, Users, Inbox, Eye, UserPlus, CheckCircle2, X, Loader2, RefreshCw, Send } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { convidarAlunoParaPortal, reenviarConviteAluno, type Aluno } from './actions'

function iniciais(nome: string): string {
  const partes = nome.trim().split(' ')
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}

export function AlunosClient({ alunos }: { alunos: Aluno[] }) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [convidando, setConvidando] = useState<Aluno | null>(null)
  const [emailConvite, setEmailConvite] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const [reenviando, setReenviando] = useState<string | null>(null)
  const [sucessoReenvio, setSucessoReenvio] = useState<string | null>(null)

  const filtrados = alunos.filter((a) => {
    const termo = busca.toLowerCase()
    return (
      busca === '' ||
      a.nome.toLowerCase().includes(termo) ||
      a.responsavel_nome.toLowerCase().includes(termo) ||
      (a.serie || '').toLowerCase().includes(termo)
    )
  })

  const ativos = alunos.filter((a) => a.status === 'ativo').length
  const comPortal = alunos.filter((a) => a.usuario_id).length

  function abrirConvite(aluno: Aluno) {
    setConvidando(aluno)
    setEmailConvite(aluno.email_aluno || '')
    setErro('')
    setSucesso(false)
  }

  async function handleConvidar() {
    if (!convidando) return
    if (!emailConvite.trim()) {
      setErro('Informe o e-mail do aluno.')
      return
    }

    setEnviando(true)
    setErro('')
    const result = await convidarAlunoParaPortal(convidando.id, emailConvite.trim())
    setEnviando(false)

    if (!result.success) {
      setErro(result.error || 'Erro ao convidar.')
      return
    }

    setSucesso(true)
    router.refresh()
    setTimeout(() => {
      setConvidando(null)
      setSucesso(false)
    }, 1800)
  }

  async function handleReenviar(aluno: Aluno) {
    setReenviando(aluno.id)
    setSucessoReenvio(null)

    const r = await reenviarConviteAluno(aluno.id)
    setReenviando(null)

    if (!r.success) {
      alert(r.error || 'Erro ao reenviar.')
      return
    }

    setSucessoReenvio(aluno.id)
    setTimeout(() => setSucessoReenvio(null), 3000)
  }

  return (
    <AdminShell mode="school" active="Alunos">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="Secretaria"
          title="Alunos"
          description="Gerencie os alunos matriculados na escola."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Alunos ativos</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#12232b]">{ativos}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Total cadastrado</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#12232b]">{alunos.length}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ede9fe] text-[#5b21b6]">
              <UserPlus className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Com acesso ao portal</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#5b21b6]">{comPortal}</p>
            </div>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-base font-bold text-[#12232b]">Todos os alunos</h2>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-72">
                <Search className="size-4 text-[#9aaab0]" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome, série ou responsável"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]"
                />
              </div>
            </div>
          </div>

          {alunos.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]">
                <Inbox className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhum aluno cadastrado ainda</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">
                Quando uma matrícula for efetivada, o aluno aparecerá automaticamente aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Aluno</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Série / Turma</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Turno</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Responsável</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Portal</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#82939a]">
                        Nenhum aluno encontrado com esses filtros.
                      </td>
                    </tr>
                  ) : (
                    filtrados.map((a) => (
                      <tr key={a.id} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="grid size-9 place-items-center rounded-full bg-[#ccfbf1] text-xs font-bold text-[#0f766e]">
                              {iniciais(a.nome)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[#243942]">{a.nome}</div>
                              <div className="text-xs text-[#82939a]">{a.email_aluno || a.responsavel_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#4d626c]">{a.serie || '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-[#4d626c]">{a.turno || '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-[#4d626c]">
                          <div>{a.responsavel_nome}</div>
                          <div className="text-xs text-[#82939a]">{a.responsavel_telefone || '—'}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          {a.usuario_id ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#d1fae5] px-2.5 py-1 text-[11px] font-semibold text-[#065f46]">
                              <CheckCircle2 className="size-3" /> Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-[#e5ecee] px-2.5 py-1 text-[11px] font-semibold text-[#5e7a94]">
                              Sem acesso
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1">
                            {a.usuario_id ? (
                              <button
                                onClick={() => handleReenviar(a)}
                                disabled={reenviando === a.id || sucessoReenvio === a.id}
                                className={`rounded-lg p-1.5 transition ${
                                  sucessoReenvio === a.id
                                    ? 'bg-[#d1fae5] text-[#065f46]'
                                    : 'text-[#0d9488] hover:bg-[#ccfbf1]'
                                } disabled:opacity-60`}
                                title={sucessoReenvio === a.id ? 'Convite reenviado' : 'Reenviar convite'}
                              >
                                {reenviando === a.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : sucessoReenvio === a.id ? (
                                  <CheckCircle2 className="size-4" />
                                ) : (
                                  <Send className="size-4" />
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => abrirConvite(a)}
                                className="rounded-lg p-1.5 text-[#0d9488] hover:bg-[#ccfbf1]"
                                title="Convidar para o portal"
                              >
                                <UserPlus className="size-4" />
                              </button>
                            )}
                            <button className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Ver detalhes">
                              <Eye className="size-4" />
                            </button>
                            <a href={`mailto:${a.responsavel_email}`} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Enviar e-mail ao responsável">
                              <Mail className="size-4" />
                            </a>
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

      {convidando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !enviando && setConvidando(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#12232b]">Portal do aluno</h3>
                <p className="mt-1 text-sm text-[#82939a]">
                  Dê acesso ao portal para <strong className="text-[#243942]">{convidando.nome}</strong>.
                </p>
              </div>
              <button
                onClick={() => setConvidando(null)}
                disabled={enviando}
                className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5">
              <label className="mb-1.5 block text-xs font-semibold text-[#536871]">E-mail do aluno</label>
              <input
                type="email"
                value={emailConvite}
                onChange={(e) => setEmailConvite(e.target.value)}
                placeholder="aluno@email.com"
                className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
              />
              <p className="mt-2 text-xs leading-5 text-[#82939a]">
                O aluno fará login usando este e-mail. Se já existir conta, apenas vinculamos. Se não existir, criamos agora.
              </p>
            </div>

            {erro && (
              <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">
                {erro}
              </p>
            )}

            {sucesso && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#0d9488]/30 bg-[#ccfbf1] px-3 py-2 text-xs text-[#0f766e]">
                <CheckCircle2 className="size-4" /> Aluno vinculado ao portal.
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setConvidando(null)}
                disabled={enviando}
                className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e] disabled:opacity-50"
              >
                Fechar
              </button>
              <button
                onClick={handleConvidar}
                disabled={enviando || sucesso}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50"
              >
                {enviando ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                {enviando ? 'Vinculando...' : 'Convidar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}