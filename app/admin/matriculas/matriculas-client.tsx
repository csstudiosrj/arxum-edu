'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Eye, Clock, User, MapPin, Heart, X as XIcon, Inbox, FileText, ExternalLink, ImageIcon, ImageOff, Calendar, CheckCircle2 } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { atualizarStatusInscricao, type Inscricao, type DocumentosMatricula } from './actions'
import { getTurmasParaSelecao, type Turma } from '../turmas/actions'

// ... (manter os mapas de status, filtros e helpers de data iguais) ...
const statusMap: Record<string, { label: string; style: string }> = {
  inscrito: { label: 'Inscrito', style: 'bg-[#e5ecee] text-[#5e7a94]' },
  em_analise: { label: 'Em análise', style: 'bg-[#fef3c7] text-[#92400e]' },
  entrevista: { label: 'Entrevista', style: 'bg-[#dbeafe] text-[#1e40af]' },
  aprovado: { label: 'Aprovado', style: 'bg-[#ccfbf1] text-[#0f766e]' },
  matriculado: { label: 'Matriculado', style: 'bg-[#d1fae5] text-[#065f46]' },
  lista_espera: { label: 'Lista de espera', style: 'bg-[#fef3c7] text-[#92400e]' },
  nao_aprovado: { label: 'Não aprovado', style: 'bg-[#fee2e2] text-[#991b1b]' },
  cancelado: { label: 'Cancelado', style: 'bg-[#e5ecee] text-[#5e7a94]' },
}
const filtros = [
  { key: 'todas', label: 'Todas' }, { key: 'inscrito', label: 'Inscrito' }, { key: 'em_analise', label: 'Em análise' },
  { key: 'entrevista', label: 'Entrevista' }, { key: 'aprovado', label: 'Aprovado' }, { key: 'matriculado', label: 'Matriculado' },
  { key: 'nao_aprovado', label: 'Não aprovado' },
]
const nomesDocumentos: Array<{ key: keyof DocumentosMatricula; label: string }> = [
  { key: 'rg_aluno', label: 'RG ou Certidão de nascimento do aluno' },
  { key: 'cpf_responsavel', label: 'CPF do responsável' },
  { key: 'comprovante_residencia', label: 'Comprovante de residência' },
  { key: 'historico_escolar', label: 'Histórico escolar' },
]
function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('pt-BR') } catch { return '—' }
}
function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  try { const d = new Date(iso); return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) } catch { return '—' }
}
const acoesPorStatus: Record<string, { label: string; novoStatus: string; variant: 'primary' | 'secondary' | 'danger' }[]> = {
  inscrito: [ { label: 'Iniciar análise', novoStatus: 'em_analise', variant: 'primary' }, { label: 'Cancelar', novoStatus: 'cancelado', variant: 'secondary' } ],
  em_analise: [ { label: 'Agendar entrevista', novoStatus: 'entrevista', variant: 'primary' }, { label: 'Aprovar direto', novoStatus: 'aprovado', variant: 'primary' }, { label: 'Não aprovar', novoStatus: 'nao_aprovado', variant: 'danger' } ],
  entrevista: [ { label: 'Aprovar', novoStatus: 'aprovado', variant: 'primary' }, { label: 'Lista de espera', novoStatus: 'lista_espera', variant: 'secondary' }, { label: 'Não aprovar', novoStatus: 'nao_aprovado', variant: 'danger' } ],
  aprovado: [ { label: 'Efetivar matrícula', novoStatus: 'matriculado', variant: 'primary' }, { label: 'Cancelar', novoStatus: 'cancelado', variant: 'secondary' } ],
  lista_espera: [ { label: 'Aprovar agora', novoStatus: 'aprovado', variant: 'primary' }, { label: 'Não aprovar', novoStatus: 'nao_aprovado', variant: 'danger' } ],
  matriculado: [],
  nao_aprovado: [ { label: 'Reabrir análise', novoStatus: 'em_analise', variant: 'secondary' } ],
  cancelado: [ { label: 'Reabrir análise', novoStatus: 'em_analise', variant: 'secondary' } ],
}
function BadgeImagem({ autorizou }: { autorizou: boolean | null }) {
  if (autorizou === true) return <span className="inline-flex items-center gap-1 rounded-full bg-[#d1fae5] px-2 py-0.5 text-[10px] font-bold text-[#065f46]"><ImageIcon className="size-2.5" /> Autorizada</span>
  return <span className="inline-flex items-center gap-1 rounded-full bg-[#e5ecee] px-2 py-0.5 text-[10px] font-bold text-[#5e7a94]"><ImageOff className="size-2.5" /> Não autorizada</span>
}

export function MatriculasClient({ inscricoes }: { inscricoes: Inscricao[] }) {
  const router = useRouter()
  const [filtro, setFiltro] = useState('todas')
  const [busca, setBusca] = useState('')
  const [selecionada, setSelecionada] = useState<Inscricao | null>(null)
  const [loading, setLoading] = useState(false)

  // Estados para agendamento de entrevista
  const [modalEntrevistaAberto, setModalEntrevistaAberto] = useState(false)
  const [dataEntrevista, setDataEntrevista] = useState('')

  // Estados para efetivar matrícula
  const [modalEfetivarAberto, setModalEfetivarAberto] = useState(false)
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState('')

  const filtradas = inscricoes.filter((i) => {
    const matchFiltro = filtro === 'todas' || i.status === filtro
    const termo = busca.toLowerCase()
    const matchBusca = busca === '' || i.aluno_nome.toLowerCase().includes(termo) || i.responsavel_nome.toLowerCase().includes(termo) || i.protocolo.toLowerCase().includes(termo)
    return matchFiltro && matchBusca
  })

  const contadores = {
    total: inscricoes.length,
    pendentes: inscricoes.filter((i) => ['inscrito', 'em_analise', 'entrevista'].includes(i.status)).length,
    aprovadas: inscricoes.filter((i) => i.status === 'aprovado').length,
    matriculadas: inscricoes.filter((i) => i.status === 'matriculado').length,
  }

  async function handleMudarStatus(id: string, novoStatus: string, dataAgendada?: string, turmaId?: string) {
    setLoading(true)
    const result = await atualizarStatusInscricao(id, novoStatus, dataAgendada, turmaId)
    setLoading(false)

    if (result.success) {
      setSelecionada(null)
      setModalEntrevistaAberto(false)
      setModalEfetivarAberto(false)
      router.refresh()
    } else {
      alert(result.error || 'Erro ao atualizar.')
    }
  }

  function abrirAgendamento() {
    setDataEntrevista('')
    setModalEntrevistaAberto(true)
  }

  async function abrirEfetivar() {
    const t = await getTurmasParaSelecao()
    setTurmas(t)
    setTurmaSelecionadaId('')
    setModalEfetivarAberto(true)
  }

  return (
    <AdminShell mode="school" active="Matrículas">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="Secretaria"
          title="Matrículas"
          description="Acompanhe as inscrições recebidas e aprove conforme as políticas internas da escola."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total de inscrições', value: contadores.total, color: 'var(--cor-primaria, #0d9488)' },
            { label: 'Aguardando análise', value: contadores.pendentes, color: '#d97706' },
            { label: 'Aprovadas', value: contadores.aprovadas, color: '#0f766e' },
            { label: 'Efetivadas', value: contadores.matriculadas, color: '#065f46' },
          ].map((m) => (
            <Panel key={m.label} className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">{m.label}</p>
              <p className="mt-2 text-3xl font-bold tracking-[-.03em]" style={{ color: m.color }}>{m.value}</p>
            </Panel>
          ))}
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {filtros.map((f) => {
                  const ativo = filtro === f.key
                  return (
                    <button key={f.key} onClick={() => setFiltro(f.key)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${ativo ? '' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`} style={ativo ? { backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)', color: 'var(--cor-primaria, #0d9488)' } : undefined}>
                      {f.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-72">
                <Search className="size-4 text-[#9aaab0]" />
                <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar aluno, responsável ou protocolo" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
              </div>
            </div>
          </div>

          {inscricoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)', color: 'var(--cor-primaria, #0d9488)' }}>
                <Inbox className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhuma inscrição ainda</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">Quando um responsável enviar uma matrícula pelo site, ela aparecerá aqui para análise.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Protocolo</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Aluno</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Série</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Status</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Imagem</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Data</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-[#82939a]">Nenhuma inscrição encontrada com esses filtros.</td></tr>
                  ) : (
                    filtradas.map((m) => {
                      const st = statusMap[m.status] || statusMap.inscrito
                      return (
                        <tr key={m.id} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                          <td className="px-5 py-3.5 font-mono text-xs text-[#536871]">{m.protocolo}</td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{m.aluno_nome}</td>
                          <td className="px-5 py-3.5 text-sm text-[#4d626c]">{m.aluno_serie || '—'}</td>
                          <td className="px-5 py-3.5"><span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${st.style}`}>{st.label}</span></td>
                          <td className="px-5 py-3.5"><BadgeImagem autorizou={m.autorizou_imagem} /></td>
                          <td className="px-5 py-3.5 text-sm text-[#82939a]">{formatDate(m.criado_em)}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end">
                              <button onClick={() => setSelecionada(m)} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Ver detalhes"><Eye className="size-4" /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </main>

      {/* MODAL AGENDAR ENTREVISTA */}
      {modalEntrevistaAberto && selecionada && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full relative shadow-2xl">
            <div className="mb-4 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-blue-100 text-blue-600 mb-3"><Calendar className="size-6" /></div>
              <h3 className="font-bold text-lg text-[#12232b]">Agendar Entrevista</h3>
              <p className="text-xs text-gray-500 mt-1">Defina a data e hora para a família de <strong>{selecionada.aluno_nome}</strong>.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Data e Hora</label>
                <input type="datetime-local" value={dataEntrevista} onChange={e => setDataEntrevista(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setModalEntrevistaAberto(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold text-sm">Cancelar</button>
                <button onClick={() => handleMudarStatus(selecionada.id, 'entrevista', dataEntrevista)} disabled={!dataEntrevista || loading} className="flex-1 bg-[#0d9488] text-white py-2 rounded-lg font-semibold text-sm disabled:opacity-50">{loading ? 'Salvando...' : 'Confirmar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EFETIVAR MATRÍCULA */}
      {modalEfetivarAberto && selecionada && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full relative shadow-2xl">
            <div className="mb-4 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#d1fae5] text-[#065f46] mb-3"><CheckCircle2 className="size-6" /></div>
              <h3 className="font-bold text-lg text-[#12232b]">Efetivar Matrícula</h3>
              <p className="text-xs text-gray-500 mt-1">Selecione a turma em que <strong>{selecionada.aluno_nome}</strong> será matriculado.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Turma</label>
                <select value={turmaSelecionadaId} onChange={e => setTurmaSelecionadaId(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]">
                  <option value="">Selecione a turma...</option>
                  {turmas.map(t => {
                    const lotada = t.ocupacao_atual >= t.capacidade_maxima
                    return (
                      <option key={t.id} value={t.id} disabled={lotada}>
                        {t.nome} ({t.turno}) - {t.ocupacao_atual}/{t.capacidade_maxima} vagas {lotada ? '(LOTADA)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setModalEfetivarAberto(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold text-sm">Cancelar</button>
                <button onClick={() => handleMudarStatus(selecionada.id, 'matriculado', undefined, turmaSelecionadaId)} disabled={!turmaSelecionadaId || loading} className="flex-1 bg-[#0d9488] text-white py-2 rounded-lg font-semibold text-sm disabled:opacity-50">{loading ? 'Salvando...' : 'Efetivar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selecionada && !modalEntrevistaAberto && !modalEfetivarAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !loading && setSelecionada(null)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <p className="font-mono text-xs text-[#82939a]">{selecionada.protocolo}</p>
                <h2 className="mt-1 text-lg font-bold text-[#12232b]">{selecionada.aluno_nome}</h2>
              </div>
              <button onClick={() => setSelecionada(null)} disabled={loading} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><XIcon className="size-5" /></button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-6 flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMap[selecionada.status]?.style}`}>{statusMap[selecionada.status]?.label}</span>
                <BadgeImagem autorizou={selecionada.autorizou_imagem} />
                {selecionada.data_entrevista && (<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-[11px] font-semibold border border-blue-200"><Calendar className="size-3" /> Entrevista: {formatDateTime(selecionada.data_entrevista)}</span>)}
              </div>

              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--cor-primaria, #0d9488)' }}><User className="size-3.5" /> Dados do aluno</h3>
                <dl className="space-y-2 rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4 text-sm">
                  <div><dt className="text-xs text-[#82939a]">Nome</dt><dd className="text-[#243942]">{selecionada.aluno_nome}</dd></div>
                  <div><dt className="text-xs text-[#82939a]">Data de nascimento</dt><dd className="text-[#243942]">{formatDate(selecionada.aluno_data_nascimento)}</dd></div>
                  <div><dt className="text-xs text-[#82939a]">Série pretendida</dt><dd className="text-[#243942]">{selecionada.aluno_serie || '—'}</dd></div>
                  <div><dt className="text-xs text-[#82939a]">Turno</dt><dd className="text-[#243942]">{selecionada.aluno_turno || '—'}</dd></div>
                </dl>
              </section>

              <section className="mt-6 space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--cor-primaria, #0d9488)' }}><User className="size-3.5" /> Responsável</h3>
                <dl className="space-y-2 rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4 text-sm">
                  <div><dt className="text-xs text-[#82939a]">Nome</dt><dd className="text-[#243942]">{selecionada.responsavel_nome}</dd></div>
                  <div><dt className="text-xs text-[#82939a]">E-mail</dt><dd className="text-[#243942]">{selecionada.responsavel_email}</dd></div>
                  <div><dt className="text-xs text-[#82939a]">Telefone</dt><dd className="text-[#243942]">{selecionada.responsavel_telefone || '—'}</dd></div>
                </dl>
              </section>

              <section className="mt-6 space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--cor-primaria, #0d9488)' }}><FileText className="size-3.5" /> Documentos</h3>
                <div className="space-y-2">
                  {nomesDocumentos.map(({ key, label }) => {
                    const doc = selecionada.documentos?.[key]
                    const temArquivo = doc && doc.url
                    return (
                      <div key={key} className={`flex items-center justify-between rounded-lg border p-3 ${!temArquivo ? 'border-[#e5ecee] bg-[#fafcfc]' : ''}`} style={temArquivo ? { borderColor: 'var(--cor-primaria, #0d9488)', backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 8%, white)' } : undefined}>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${temArquivo ? 'text-white' : 'bg-[#e5ecee] text-[#82939a]'}`} style={temArquivo ? { backgroundColor: 'var(--cor-primaria, #0d9488)' } : undefined}><FileText className="size-4" /></div>
                          <div className="min-w-0"><p className="truncate text-xs font-semibold text-[#243942]">{label}</p><p className="truncate text-xs text-[#82939a]">{temArquivo ? doc.nome : 'Não enviado'}</p></div>
                        </div>
                        {temArquivo && (<a href={doc.url} target="_blank" rel="noopener noreferrer" className="ml-2 shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition hover:brightness-90" style={{ borderColor: 'var(--cor-primaria, #0d9488)', color: 'var(--cor-primaria, #0d9488)' }}><ExternalLink className="mr-1 inline size-3" />Abrir</a>)}
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>

            {acoesPorStatus[selecionada.status]?.length > 0 && (
              <footer className="border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Ações disponíveis</p>
                <div className="flex flex-wrap gap-2">
                  {acoesPorStatus[selecionada.status].map((a) => {
                    const varianteStyle = a.variant === 'primary' ? { backgroundColor: 'var(--cor-primaria, #0d9488)' } : undefined
                    return (
                      <button key={a.label} onClick={() => { if (a.novoStatus === 'entrevista') { abrirAgendamento() } else if (a.novoStatus === 'matriculado') { abrirEfetivar() } else { handleMudarStatus(selecionada.id, a.novoStatus) } }} disabled={loading} className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50 ${a.variant === 'primary' ? 'text-white hover:brightness-90' : a.variant === 'danger' ? 'bg-[#dc2626] text-white hover:bg-[#b91c1c]' : 'border border-[#b8c9ce] bg-white text-[#30454e] hover:border-[var(--cor-primaria,#0d9488)]'}`} style={varianteStyle}>
                        {loading ? 'Processando...' : a.label}
                      </button>
                    )
                  })}
                </div>
              </footer>
            )}
          </aside>
        </div>
      )}
    </AdminShell>
  )
}