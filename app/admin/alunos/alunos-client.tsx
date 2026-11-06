'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Mail, Users, Inbox, Eye, UserPlus, CheckCircle2, X, Loader2, Send, Trash2, MapPin, Heart, FileText, ExternalLink, Download, Clock, TrendingUp } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { 
  convidarAlunoParaPortal, 
  reenviarConviteAluno, 
  getAlunoDetalhes, 
  excluirAluno, 
  getLimiteAlunos, 
  getHistoricoDocumentosAluno, 
  getDadosParaDocumentoAdmin,
  getNotasParaBoletimAdmin,
  registrarEmissaoDocumentoAdmin,
  type Aluno 
} from './actions'
import { gerarDocumentoHTML } from '@/lib/documentos/gerador'

function iniciais(nome: string): string {
  const partes = nome.trim().split(' ')
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function formatarData(iso: string | null): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('pt-BR') } catch { return '—' }
}

const nomesDocumentos = [
  { key: 'rg_aluno', label: 'RG ou Certidão de nascimento' },
  { key: 'cpf_responsavel', label: 'CPF do responsável' },
  { key: 'comprovante_residencia', label: 'Comprovante de residência' },
  { key: 'historico_escolar', label: 'Histórico escolar' },
]

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

  const [detalheAluno, setDetalheAluno] = useState<any>(null)
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false)
  const [confirmarExclusao, setConfirmarExclusao] = useState<Aluno | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const [abaDetalhe, setAbaDetalhe] = useState<'dados' | 'documentos'>('dados')
  const [historicoDocs, setHistoricoDocs] = useState<any[]>([])
  const [carregandoDocs, setCarregandoDocs] = useState(false)
  const [emitindo, setEmitindo] = useState<string | null>(null)
  
  const [limiteInfo, setLimiteInfo] = useState<{max_alunos: number, teto_alunos_excedentes: number, preco_aluno_extra_centavos: number, alunos_ativos: number} | null>(null)

  useEffect(() => {
    getLimiteAlunos().then(setLimiteInfo)
  }, [])

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
    if (!emailConvite.trim()) return setErro('Informe o e-mail do aluno.')

    setEnviando(true)
    setErro('')
    const result = await convidarAlunoParaPortal(convidando.id, emailConvite.trim())
    setEnviando(false)

    if (!result.success) return setErro(result.error || 'Erro ao convidar.')

    setSucesso(true)
    router.refresh()
    setTimeout(() => { setConvidando(null); setSucesso(false) }, 1800)
  }

  async function handleReenviar(aluno: Aluno) {
    setReenviando(aluno.id)
    setSucessoReenvio(null)
    const r = await reenviarConviteAluno(aluno.id)
    setReenviando(null)
    if (!r.success) return alert(r.error || 'Erro ao reenviar.')
    setSucessoReenvio(aluno.id)
    setTimeout(() => setSucessoReenvio(null), 3000)
  }

  async function abrirDetalhes(alunoId: string) {
    setCarregandoDetalhes(true)
    setAbaDetalhe('dados')
    const detalhes = await getAlunoDetalhes(alunoId)
    setCarregandoDetalhes(false)
    if (detalhes) setDetalheAluno(detalhes)
  }

  async function carregarDocumentos() {
    if (!detalheAluno) return
    setCarregandoDocs(true)
    const docs = await getHistoricoDocumentosAluno(detalheAluno.id)
    setHistoricoDocs(docs)
    setCarregandoDocs(false)
  }

  async function handleEmitirDoc(tipo: 'matricula' | 'frequencia' | 'boletim') {
    if (!detalheAluno) return
    setEmitindo(tipo)
    
    const res = await getDadosParaDocumentoAdmin(detalheAluno.id)
    if (!res.success || !res.dados) {
      alert(res.error || 'Erro ao carregar dados da escola.')
      setEmitindo(null)
      return
    }

    let dadosExtras = undefined
    if (tipo === 'boletim') {
      const notas = await getNotasParaBoletimAdmin(detalheAluno.id)
      dadosExtras = notas
    }

    await registrarEmissaoDocumentoAdmin(detalheAluno.id, res.dados.escolaId, tipo)

    gerarDocumentoHTML({ tipo, ...res.dados, dadosExtras })

    setEmitindo(null)
    carregarDocumentos()
  }

  useEffect(() => {
    if (detalheAluno && abaDetalhe === 'documentos') {
      carregarDocumentos()
    }
  }, [detalheAluno, abaDetalhe])

  async function handleExcluir() {
    if (!confirmarExclusao) return
    setExcluindo(true)
    const r = await excluirAluno(confirmarExclusao.id)
    setExcluindo(false)
    if (!r.success) return alert(r.error || 'Erro ao excluir.')
    setConfirmarExclusao(null)
    router.refresh()
  }

  return (
    <AdminShell mode="school" active="Alunos">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading eyebrow="Secretaria" title="Alunos" description="Gerencie os alunos matriculados na escola." />

        {limiteInfo && limiteInfo.max_alunos > 0 && limiteInfo.alunos_ativos >= limiteInfo.max_alunos && (
          <div className="mt-6 bg-[#fef3c7] border border-[#fde68a] text-[#92400e] p-4 rounded-lg flex items-start gap-3">
            <Clock className="size-5 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Atenção: Limite de Alunos Atingido</h4>
              <p className="text-xs mt-1">Seu plano permite {limiteInfo.max_alunos} alunos. Você está na margem de tolerância de {limiteInfo.teto_alunos_excedentes} alunos extras. Alunos excedentes gerarão cobrança adicional.</p>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#f0fdfa] text-[#0d9488]"><Users className="size-5" /></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Alunos ativos</p><p className="text-2xl font-bold text-[#12232b]">{ativos}</p></div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]"><Users className="size-5" /></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Total cadastrado</p><p className="text-2xl font-bold text-[#12232b]">{alunos.length}</p></div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ede9fe] text-[#5b21b6]"><UserPlus className="size-5" /></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Com acesso ao portal</p><p className="text-2xl font-bold text-[#5b21b6]">{comPortal}</p></div>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-base font-bold text-[#12232b]">Todos os alunos</h2>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-72">
                <Search className="size-4 text-[#9aaab0]" />
                <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, série ou responsável" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
              </div>
            </div>
          </div>

          {alunos.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#f0fdfa] text-[#0d9488]"><Inbox className="size-6" /></div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhum aluno cadastrado ainda</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">Quando uma matrícula for efetivada, o aluno aparecerá automaticamente aqui.</p>
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
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-[#82939a]">Nenhum aluno encontrado com esses filtros.</td></tr>
                  ) : (
                    filtrados.map((a) => (
                      <tr key={a.id} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="grid size-9 place-items-center rounded-full text-xs font-bold bg-[#ccfbf1] text-[#0d9488]">{iniciais(a.nome)}</div>
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
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#d1fae5] px-2.5 py-1 text-[11px] font-semibold text-[#065f46]"><CheckCircle2 className="size-3" /> Ativo</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-[#e5ecee] px-2.5 py-1 text-[11px] font-semibold text-[#5e7a94]">Sem acesso</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1">
                            {a.usuario_id ? (
                              <button onClick={() => handleReenviar(a)} disabled={reenviando === a.id || sucessoReenvio === a.id} className={`rounded-lg p-1.5 transition ${sucessoReenvio === a.id ? 'bg-[#d1fae5] text-[#065f46]' : 'text-[#0d9488] hover:bg-[#ccfbf1]'} disabled:opacity-60`} title={sucessoReenvio === a.id ? 'Convite reenviado' : 'Reenviar convite'}>
                                {reenviando === a.id ? <Loader2 className="size-4 animate-spin" /> : sucessoReenvio === a.id ? <CheckCircle2 className="size-4" /> : <Send className="size-4" />}
                              </button>
                            ) : (
                              <button onClick={() => abrirConvite(a)} className="rounded-lg p-1.5 text-[#0d9488] hover:bg-[#ccfbf1] transition" title="Convidar para o portal">
                                <UserPlus className="size-4" />
                              </button>
                            )}
                            <button onClick={() => abrirDetalhes(a.id)} disabled={carregandoDetalhes} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Ver detalhes">
                              {carregandoDetalhes ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
                            </button>
                            <button onClick={() => setConfirmarExclusao(a)} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]" title="Excluir aluno">
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

      {convidando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !enviando && setConvidando(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div><h3 className="text-lg font-bold text-[#12232b]">Portal do aluno</h3><p className="mt-1 text-sm text-[#82939a]">Dê acesso ao portal para <strong className="text-[#243942]">{convidando.nome}</strong>.</p></div>
              <button onClick={() => setConvidando(null)} disabled={enviando} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-4" /></button>
            </div>
            <div className="mt-5">
              <label className="mb-1.5 block text-xs font-semibold text-[#536871]">E-mail do aluno</label>
              <input type="email" value={emailConvite} onChange={(e) => setEmailConvite(e.target.value)} placeholder="aluno@email.com" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
            </div>
            {erro && <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
            {sucesso && <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#0d9488] bg-[#f0fdfa] px-3 py-2 text-xs text-[#0d9488]"><CheckCircle2 className="size-4" /> Aluno vinculado ao portal.</div>}
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConvidando(null)} disabled={enviando} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e] disabled:opacity-50">Fechar</button>
              <button onClick={handleConvidar} disabled={enviando || sucesso} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-50">
                {enviando ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} {enviando ? 'Vinculando...' : 'Convidar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detalheAluno && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetalheAluno(null)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Ficha do aluno</p>
                <h2 className="mt-1 text-lg font-bold text-[#12232b]">{detalheAluno.nome}</h2>
              </div>
              <button onClick={() => setDetalheAluno(null)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
            </header>

            <div className="flex border-b border-[#e5ecee] px-6">
              <button onClick={() => setAbaDetalhe('dados')} className={`py-3 text-sm font-semibold border-b-2 transition ${abaDetalhe === 'dados' ? 'border-[#0d9488] text-[#0d9488]' : 'border-transparent text-[#6b7d86]'}`}>Dados Pessoais</button>
              <button onClick={() => setAbaDetalhe('documentos')} className={`py-3 text-sm font-semibold border-b-2 transition ml-6 ${abaDetalhe === 'documentos' ? 'border-[#0d9488] text-[#0d9488]' : 'border-transparent text-[#6b7d86]'}`}>Documentos</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {abaDetalhe === 'dados' ? (
                <>
                  <section className="space-y-3">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0d9488]"><Users className="size-3.5" /> Dados do aluno</h3>
                    <dl className="space-y-2 rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4 text-sm">
                      <div><dt className="text-xs text-[#82939a]">Nome</dt><dd className="text-[#243942]">{detalheAluno.nome}</dd></div>
                      <div><dt className="text-xs text-[#82939a]">Data de nascimento</dt><dd className="text-[#243942]">{formatarData(detalheAluno.data_nascimento)}</dd></div>
                      <div><dt className="text-xs text-[#82939a]">Série / Turma</dt><dd className="text-[#243942]">{detalheAluno.serie || '—'}</dd></div>
                      <div><dt className="text-xs text-[#82939a]">Turno</dt><dd className="text-[#243942]">{detalheAluno.turno || '—'}</dd></div>
                    </dl>
                  </section>
                  <section className="mt-6 space-y-3">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0d9488]"><UserPlus className="size-3.5" /> Responsável</h3>
                    <dl className="space-y-2 rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4 text-sm">
                      <div><dt className="text-xs text-[#82939a]">Nome</dt><dd className="text-[#243942]">{detalheAluno.responsavel_nome}</dd></div>
                      <div><dt className="text-xs text-[#82939a]">E-mail</dt><dd className="text-[#243942]">{detalheAluno.responsavel_email}</dd></div>
                      <div><dt className="text-xs text-[#82939a]">Telefone</dt><dd className="text-[#243942]">{detalheAluno.responsavel_telefone || '—'}</dd></div>
                    </dl>
                  </section>
                  <section className="mt-6 space-y-3">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0d9488]"><MapPin className="size-3.5" /> Endereço</h3>
                    <dl className="space-y-2 rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4 text-sm">
                      <div><dt className="text-xs text-[#82939a]">Endereço</dt><dd className="text-[#243942]">{[detalheAluno.endereco_rua, detalheAluno.endereco_numero, detalheAluno.endereco_complemento].filter(Boolean).join(', ') || '—'}</dd></div>
                      <div><dt className="text-xs text-[#82939a]">Bairro / Cidade</dt><dd className="text-[#243942]">{[detalheAluno.endereco_bairro, detalheAluno.endereco_cidade, detalheAluno.endereco_estado].filter(Boolean).join(' · ') || '—'}</dd></div>
                    </dl>
                  </section>
                  <section className="mt-6 space-y-3">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0d9488]"><Heart className="size-3.5" /> Anamnese</h3>
                    <dl className="space-y-2 rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4 text-sm">
                      <div><dt className="text-xs text-[#82939a]">Alergias</dt><dd className="text-[#243942]">{detalheAluno.anamnese_alergias || '—'}</dd></div>
                      <div><dt className="text-xs text-[#82939a]">Condições médicas</dt><dd className="text-[#243942]">{detalheAluno.anamnese_condicoes || '—'}</dd></div>
                      <div><dt className="text-xs text-[#82939a]">Medicamentos</dt><dd className="text-[#243942]">{detalheAluno.anamnese_medicamentos || '—'}</dd></div>
                    </dl>
                  </section>
                  <section className="mt-6 space-y-3">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0d9488]"><FileText className="size-3.5" /> Documentos</h3>
                    <div className="space-y-2">
                      {nomesDocumentos.map(({ key, label }) => {
                        const doc = detalheAluno.documentos?.[key]
                        const temArquivo = doc && doc.url
                        return (
                          <div key={key} className={`flex items-center justify-between rounded-lg border p-3 ${!temArquivo ? 'border-[#e5ecee] bg-[#fafcfc]' : 'border-[#0d9488] bg-[#f0fdfa]'}`}>
                            <div className="flex min-w-0 items-center gap-3">
                              <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${temArquivo ? 'text-white bg-[#0d9488]' : 'bg-[#e5ecee] text-[#82939a]'}`}><FileText className="size-4" /></div>
                              <div className="min-w-0"><p className="truncate text-xs font-semibold text-[#243942]">{label}</p><p className="truncate text-xs text-[#82939a]">{temArquivo ? doc.nome : 'Não enviado'}</p></div>
                            </div>
                            {temArquivo && (<a href={doc.url} target="_blank" rel="noopener noreferrer" className="ml-2 shrink-0 rounded-lg border border-[#0d9488] text-[#0d9488] px-2.5 py-1.5 text-[11px] font-semibold hover:bg-[#ccfbf1]"><ExternalLink className="mr-1 inline size-3" />Abrir</a>)}
                          </div>
                        )
                      })}
                    </div>
                  </section>
                </>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-[#12232b] mb-3">Emitir Documento (Secretaria)</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={() => handleEmitirDoc('matricula')} disabled={!!emitindo} className="flex flex-col items-center gap-2 p-3 border border-[#e5ecee] rounded-xl hover:border-[#0d9488] hover:bg-[#f0fdfa] transition group">
                        <FileText className="size-6 text-[#0d9488] group-hover:scale-110 transition" />
                        <span className="text-xs font-semibold text-[#30454e] text-center">Declaração de Matrícula</span>
                        {emitindo === 'matricula' && <Loader2 className="size-4 animate-spin text-[#0d9488]"/>}
                      </button>
                      <button onClick={() => handleEmitirDoc('frequencia')} disabled={!!emitindo} className="flex flex-col items-center gap-2 p-3 border border-[#e5ecee] rounded-xl hover:border-[#0d9488] hover:bg-[#f0fdfa] transition group">
                        <CheckCircle2 className="size-6 text-[#0d9488] group-hover:scale-110 transition" />
                        <span className="text-xs font-semibold text-[#30454e] text-center">Declaração de Frequência</span>
                        {emitindo === 'frequencia' && <Loader2 className="size-4 animate-spin text-[#0d9488]"/>}
                      </button>
                      <button onClick={() => handleEmitirDoc('boletim')} disabled={!!emitindo} className="flex flex-col items-center gap-2 p-3 border border-[#e5ecee] rounded-xl hover:border-[#0d9488] hover:bg-[#f0fdfa] transition group">
                        <TrendingUp className="size-6 text-[#0d9488] group-hover:scale-110 transition" />
                        <span className="text-xs font-semibold text-[#30454e] text-center">Boletim Escolar</span>
                        {emitindo === 'boletim' && <Loader2 className="size-4 animate-spin text-[#0d9488]"/>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#12232b] mb-3">Histórico de Emissões</h3>
                    {carregandoDocs ? (
                      <div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin text-gray-400" /></div>
                    ) : historicoDocs.length === 0 ? (
                      <p className="text-xs text-[#82939a] text-center py-4 bg-[#fafcfc] rounded-lg border border-[#e5ecee]">Nenhum documento emitido ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {historicoDocs.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-[#fafcfc] border border-[#e5ecee] rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="grid size-8 place-items-center rounded-lg bg-white border border-[#e5ecee] text-[#0d9488]"><FileText className="size-4" /></div>
                              <div><p className="text-sm font-semibold text-[#243942] capitalize">{doc.tipo_documento === 'matricula' ? 'Declaração de Matrícula' : doc.tipo_documento === 'frequencia' ? 'Declaração de Frequência' : 'Boletim Escolar'}</p><p className="text-[10px] text-[#82939a]">Por: {doc.responsavel_email}</p></div>
                            </div>
                            <span className="text-xs text-[#82939a] flex items-center gap-1"><Clock className="size-3"/> {new Date(doc.emitido_em).toLocaleString('pt-BR')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !excluindo && setConfirmarExclusao(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]"><Trash2 className="size-5" /></div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir aluno?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">Tem certeza que deseja excluir <strong className="text-[#243942]">{confirmarExclusao.nome}</strong>? Todos os dados vinculados serão removidos.</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmarExclusao(null)} disabled={excluindo} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleExcluir} disabled={excluindo} className="flex-1 rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-50">{excluindo ? 'Excluindo...' : 'Excluir aluno'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
