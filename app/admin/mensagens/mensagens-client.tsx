'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Inbox, Mail, Phone, Trash2, X, Check, Eye, EyeOff, ExternalLink, MessageSquare, Plus, ArrowLeft, Send, Loader2 } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { marcarMensagemLida, marcarMensagemRespondida, excluirMensagem, type Mensagem } from '@/lib/cms/actions'
import { getMensagensChat, criarConversa, enviarMensagemChat, type Conversa, type MensagemChat } from './chat-actions'

function formatarDataHora(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

export function MensagensClient({ mensagens, conversasIniciais, alunos }: { mensagens: Mensagem[], conversasIniciais: Conversa[], alunos: any[] }) {
  const router = useRouter()
  const [abaAtiva, setAbaAtiva] = useState<'site' | 'chat'>('site')

  // ── LÓGICA DO SITE (Contato) ──
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todas' | 'nao_lidas' | 'nao_respondidas'>('todas')
  const [selecionada, setSelecionada] = useState<Mensagem | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)

  const filtradas = mensagens.filter((m) => {
    const termo = busca.toLowerCase()
    const matchBusca = busca === '' || m.nome.toLowerCase().includes(termo) || m.email.toLowerCase().includes(termo) || (m.assunto || '').toLowerCase().includes(termo)
    const matchFiltro = filtro === 'todas' || (filtro === 'nao_lidas' && !m.lida) || (filtro === 'nao_respondidas' && !m.respondida)
    return matchBusca && matchFiltro
  })

  const naoLidas = mensagens.filter((m) => !m.lida).length
  const naoRespondidas = mensagens.filter((m) => !m.respondida).length

  async function abrir(m: Mensagem) { setSelecionada(m); if (!m.lida) await marcarMensagemLida(m.id, true) }
  async function handleMarcarRespondida(id: string) { setProcessando(true); await marcarMensagemRespondida(id); setProcessando(false); setSelecionada(null); router.refresh() }
  async function handleToggleLida(m: Mensagem) { setProcessando(true); await marcarMensagemLida(m.id, !m.lida); setProcessando(false); router.refresh() }
  async function handleExcluir() { if (!confirmarExclusao) return; setProcessando(true); await excluirMensagem(confirmarExclusao); setProcessando(false); setConfirmarExclusao(null); setSelecionada(null); router.refresh() }

  // ── LÓGICA DO CHAT INTERNO ──
  const [conversas, setConversas] = useState<Conversa[]>(conversasIniciais)
  const [conversaAtiva, setConversaAtiva] = useState<Conversa | null>(null)
  const [mensagensChat, setMensagensChat] = useState<MensagemChat[]>([])
  const [carregandoMsgs, setCarregandoMsgs] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  
  const [novaConversaAberta, setNovaConversaAberta] = useState(false)
  const [alunoId, setAlunoId] = useState('')
  const [assunto, setAssunto] = useState('')
  const [criando, setCriando] = useState(false)
  const [erroChat, setErroChat] = useState('')

  async function abrirConversa(c: Conversa) {
    setConversaAtiva(c)
    setCarregandoMsgs(true)
    const msgs = await getMensagensChat(c.id)
    setMensagensChat(msgs)
    setCarregandoMsgs(false)
    setConversas(prev => prev.map(item => item.id === c.id ? { ...item, nao_lidas: 0 } : item))
  }

  async function handleCriarConversa() {
    if (!alunoId) return setErroChat('Selecione o aluno.')
    if (!assunto.trim()) return setErroChat('Informe o assunto.')
    setCriando(true); setErroChat('')
    const r = await criarConversa(alunoId, assunto)
    setCriando(false)
    if (!r.success) return setErroChat(r.error || 'Erro.')
    setNovaConversaAberta(false); setAssunto(''); setAlunoId(''); window.location.reload()
  }

  async function handleEnviarChat() {
    if (!conversaAtiva || !texto.trim()) return
    setEnviando(true)
    const r = await enviarMensagemChat(conversaAtiva.id, texto)
    setEnviando(false)
    if (r.success) { setTexto(''); const msgs = await getMensagensChat(conversaAtiva.id); setMensagensChat(msgs) } else alert(r.error)
  }

  return (
    <AdminShell mode="school" active="Mensagens">
      {/* SE ESTIVER DENTRO DE UM CHAT, MOSTRA A TELA DE CHAT CHEIA */}
      {conversaAtiva ? (
        <main className="h-[calc(100vh-72px)] flex flex-col bg-[#f6f8f9]">
          <header className="bg-white border-b border-[#e5ecee] px-6 py-4 flex items-center gap-4 shrink-0 shadow-sm z-10">
            <button onClick={() => setConversaAtiva(null)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500"><ArrowLeft className="size-5" /></button>
            <div>
              <h2 className="font-bold text-[#12232b]">{conversaAtiva.aluno_nome}</h2>
              <p className="text-xs text-[#82939a]">{conversaAtiva.assunto} · {conversaAtiva.responsavel_email}</p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {carregandoMsgs ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#0d9488] size-6" /></div>
            ) : mensagensChat.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-10">Nenhuma mensagem ainda. Diga olá!</div>
            ) : (
              mensagensChat.map(m => {
                const isEscola = m.remetente_tipo === 'escola'
                return (
                  <div key={m.id} className={`flex flex-col max-w-[70%] ${isEscola ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    <span className="text-[10px] text-gray-400 mb-1 px-1">{m.remetente_nome} • {new Date(m.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className={`p-3 rounded-2xl text-sm ${isEscola ? 'bg-[#0d9488] text-white rounded-tr-sm' : 'bg-white border border-[#e5ecee] text-[#243942] rounded-tl-sm'}`}>{m.conteudo}</div>
                  </div>
                )
              })
            )}
          </div>

          <div className="p-4 bg-white border-t border-[#e5ecee] shrink-0">
            <div className="flex items-center gap-2 max-w-4xl mx-auto">
              <input type="text" value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEnviarChat()} placeholder="Digite sua mensagem..." className="flex-1 border border-[#d5e0e3] rounded-full px-4 py-3 text-sm outline-none focus:border-[#0d9488]" />
              <button onClick={handleEnviarChat} disabled={enviando || !texto.trim()} className="bg-[#0d9488] text-white p-3 rounded-full hover:bg-[#0f766e] transition disabled:opacity-50">
                {enviando ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
              </button>
            </div>
          </div>
        </main>
      ) : (
        /* TELA DE LISTAS COM AS ABAS */
        <main className="px-5 py-8 lg:px-8">
          <SectionHeading eyebrow="Comunicação" title="Mensagens" description="Gerencie o contato do site e converse com os pais." />

          <div className="mt-8 flex gap-1 border-b border-[#e5ecee]">
            <button onClick={() => setAbaAtiva('site')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${abaAtiva === 'site' ? 'border-[#0d9488] text-[#0d9488]' : 'border-transparent text-[#6b7d86] hover:text-[#12232b]'}`}>
              <Inbox className="size-4" /> Formulário do Site
            </button>
            <button onClick={() => setAbaAtiva('chat')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${abaAtiva === 'chat' ? 'border-[#0d9488] text-[#0d9488]' : 'border-transparent text-[#6b7d86] hover:text-[#12232b]'}`}>
              <MessageSquare className="size-4" /> Chat com Responsáveis
            </button>
          </div>

          {/* CONTEÚDO DA ABA SITE (CÓDIGO ORIGINAL INTACTO) */}
          {abaAtiva === 'site' && (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <Panel className="flex items-center gap-4 p-5">
                  <div className="grid size-10 place-items-center rounded-lg bg-[#f0fdfa] text-[#0d9488]"><Inbox className="size-5" /></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Total</p><p className="text-2xl font-bold text-[#0d9488]">{mensagens.length}</p></div>
                </Panel>
                <Panel className="flex items-center gap-4 p-5">
                  <div className="grid size-10 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]"><Eye className="size-5" /></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Não lidas</p><p className="text-2xl font-bold text-[#92400e]">{naoLidas}</p></div>
                </Panel>
                <Panel className="flex items-center gap-4 p-5">
                  <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]"><Check className="size-5" /></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Não respondidas</p><p className="text-2xl font-bold text-[#3b82f6]">{naoRespondidas}</p></div>
                </Panel>
              </div>

              <Panel className="mt-6">
                <div className="border-b border-[#e5ecee] px-5 py-4 flex justify-between items-center">
                  <div className="flex flex-wrap gap-1.5">
                    {[{ key: 'todas', label: 'Todas' }, { key: 'nao_lidas', label: 'Não lidas' }, { key: 'nao_respondidas', label: 'Não respondidas' }].map((f) => (
                      <button key={f.key} onClick={() => setFiltro(f.key as any)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filtro === f.key ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>{f.label}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
                    <Search className="size-4 text-[#9aaab0]" /><input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar..." className="w-full bg-transparent text-sm outline-none" />
                  </div>
                </div>

                {filtradas.length === 0 ? (
                  <div className="p-12 text-center text-sm text-[#82939a]">Nenhuma mensagem encontrada.</div>
                ) : (
                  <div className="divide-y divide-[#f0f4f5]">
                    {filtradas.map((m) => (
                      <div key={m.id} className={`flex items-start gap-4 px-5 py-4 transition hover:bg-[#fafcfc] ${!m.lida ? 'bg-[#f0fdfa]' : ''}`}>
                        <div className={`grid size-10 shrink-0 place-items-center rounded-full ${!m.lida ? 'bg-[#0d9488] text-white' : 'bg-[#f0f4f5] text-[#536871]'}`}>
                          <span className="text-xs font-bold">{m.nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-[#243942]">{m.nome}</h3>
                            {!m.lida && <span className="rounded-full bg-[#dc2626] px-2 py-0.5 text-[10px] font-bold text-white">Nova</span>}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-[#82939a]">{m.email}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#82939a]">{m.mensagem}</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button onClick={() => abrir(m)} className="p-1.5 text-[#6b7d86] hover:bg-[#e5ecee] rounded-lg"><Eye className="size-4" /></button>
                          <button onClick={() => handleToggleLida(m)} className="p-1.5 text-[#6b7d86] hover:bg-[#e5ecee] rounded-lg">{m.lida ? <EyeOff className="size-4" /> : <Check className="size-4" />}</button>
                          <button onClick={() => setConfirmarExclusao(m.id)} className="p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626] rounded-lg"><Trash2 className="size-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </>
          )}

          {/* CONTEÚDO DA ABA CHAT (NOVO) */}
          {abaAtiva === 'chat' && (
            <Panel className="mt-6 overflow-hidden">
              <div className="border-b border-[#e5ecee] px-5 py-4 flex justify-between items-center">
                 <h2 className="text-base font-bold text-[#12232b]">Conversas Recentes</h2>
                 <button onClick={() => setNovaConversaAberta(true)} className="bg-[#0d9488] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-[#0f766e]">
                    <Plus className="size-3" /> Nova Conversa
                 </button>
              </div>
              {conversas.length === 0 ? (
                <div className="p-12 text-center text-[#82939a]">Nenhuma conversa iniciada ainda.</div>
              ) : (
                <div className="divide-y divide-[#f0f4f5]">
                  {conversas.map(c => (
                    <button key={c.id} onClick={() => abrirConversa(c)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-[#fafcfc] transition">
                      <div className="grid size-12 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488] shrink-0"><MessageSquare className="size-5" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#243942]">{c.aluno_nome}</p>
                        <p className="text-sm text-[#82939a] mt-0.5 truncate">{c.assunto}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-[#82939a]">{new Date(c.atualizado_em).toLocaleDateString('pt-BR')}</p>
                        {c.nao_lidas > 0 && <span className="inline-flex mt-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{c.nao_lidas} novas</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Panel>
          )}
        </main>
      )}

      {/* MODAIS DO SITE (LEITURA/EXCLUSÃO) */}
      {selecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSelecionada(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <header className="flex items-start justify-between border-b border-[#e5ecee] px-6 py-4">
              <div><h2 className="text-lg font-bold text-[#12232b]">{selecionada.assunto || 'Sem assunto'}</h2><p className="text-xs text-[#82939a] mt-1">{formatarDataHora(selecionada.criado_em)}</p></div>
              <button onClick={() => setSelecionada(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="size-5" /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-5 bg-[#fafcfc] border border-[#e5ecee] p-4 rounded-lg flex items-center gap-3">
                <div className="size-10 bg-[#0d9488] text-white grid place-items-center rounded-full text-sm font-bold">{selecionada.nome.slice(0,2).toUpperCase()}</div>
                <div><p className="text-sm font-semibold">{selecionada.nome}</p><p className="text-xs text-[#82939a]">{selecionada.email}</p></div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-7 text-[#243942]">{selecionada.mensagem}</p>
            </div>
            <footer className="border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4 flex justify-between">
              <a href={`mailto:${selecionada.email}`} className="bg-[#0d9488] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"><ExternalLink className="size-4"/> Responder por E-mail</a>
              <div className="flex gap-2">
                 {!selecionada.respondida && <button onClick={() => handleMarcarRespondida(selecionada.id)} className="border border-[#b8c9ce] bg-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"><Check className="size-4"/> Marcar Respondida</button>}
                 <button onClick={() => setConfirmarExclusao(selecionada.id)} className="border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-red-50"><Trash2 className="size-4"/> Excluir</button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {confirmarExclusao && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full text-center">
            <div className="mx-auto size-12 bg-red-100 text-red-600 rounded-full grid place-items-center mb-4"><Trash2 className="size-6"/></div>
            <h3 className="text-lg font-bold text-[#12232b]">Excluir mensagem?</h3>
            <p className="text-sm text-[#82939a] mt-2">Essa ação não pode ser desfeita.</p>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setConfirmarExclusao(null)} className="flex-1 py-2 border rounded-lg font-semibold text-sm">Cancelar</button>
              <button onClick={handleExcluir} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVA CONVERSA (CHAT) */}
      {novaConversaAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full relative shadow-2xl">
            <button onClick={() => setNovaConversaAberta(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X className="size-4" /></button>
            <h3 className="font-bold text-lg text-[#12232b] mb-6">Nova Conversa</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1 block">Aluno / Responsável</label>
                <select value={alunoId} onChange={e => setAlunoId(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]">
                  <option value="">Selecione...</option>
                  {alunos.map(a => <option key={a.id} value={a.id}>{a.nome} ({a.responsavel_email})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">Assunto</label>
                <input type="text" value={assunto} onChange={e => setAssunto(e.target.value)} placeholder="Ex: Dúvida sobre nota" className="w-full border p-2 rounded outline-none focus:border-[#0d9488]" />
              </div>
              {erroChat && <p className="text-red-500 text-sm">{erroChat}</p>}
              <button onClick={handleCriarConversa} disabled={criando} className="w-full bg-[#0d9488] text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-[#0f766e] mt-2 disabled:opacity-50">
                {criando ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} {criando ? 'Iniciando...' : 'Iniciar Conversa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
