'use client'

import { useState } from 'react'
import { Headphones, Plus, X, Loader2, Check, Clock, CheckCircle2, MessageSquare, Send } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { abrirTicket, type TicketEscola } from './actions'

const prioridadeStyles: Record<string, string> = {
  baixa: 'bg-[#e5ecee] text-[#5e7a94]',
  normal: 'bg-[#dbeafe] text-[#1e40af]',
  alta: 'bg-[#fef3c7] text-[#92400e]',
  urgente: 'bg-[#fee2e2] text-[#991b1b]',
}

const prioridadeLabel: Record<string, string> = {
  baixa: 'Baixa', normal: 'Normal', alta: 'Alta', urgente: 'Urgente',
}

const statusStyles: Record<string, string> = {
  aberto: 'bg-[#fef3c7] text-[#92400e]',
  em_andamento: 'bg-[#dbeafe] text-[#1e40af]',
  resolvido: 'bg-[#d1fae5] text-[#065f46]',
  fechado: 'bg-[#e5ecee] text-[#5e7a94]',
}

const statusLabel: Record<string, string> = {
  aberto: 'Aberto', em_andamento: 'Em andamento', resolvido: 'Resolvido', fechado: 'Fechado',
}

function formatarDataHora(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

export function SuporteEscolaClient({ ticketsIniciais }: { ticketsIniciais: TicketEscola[] }) {
  const [tickets, setTickets] = useState(ticketsIniciais)
  const [novoAberto, setNovoAberto] = useState(false)
  const [detalhe, setDetalhe] = useState<TicketEscola | null>(null)
  
  const [assunto, setAssunto] = useState('')
  const [descricao, setDescricao] = useState('')
  const [prioridade, setPrioridade] = useState('normal')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleAbrirTicket() {
    if (!assunto.trim() || !descricao.trim()) return setErro('Preencha o assunto e a descrição.')
    
    setProcessando(true)
    setErro('')
    
    const r = await abrirTicket({ assunto, descricao, prioridade })
    
    setProcessando(false)
    
    if (r.success) {
      setNovoAberto(false)
      setAssunto('')
      setDescricao('')
      window.location.reload() // Recarrega para trazer o novo ticket
    } else {
      setErro(r.error || 'Erro ao abrir ticket.')
    }
  }

  const abertos = tickets.filter(t => t.status === 'aberto' || t.status === 'em_andamento').length
  const resolvidos = tickets.filter(t => t.status === 'resolvido' || t.status === 'fechado').length

  return (
    <AdminShell mode="school" active="Suporte">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Ajuda"
            title="Suporte ARXUM"
            description="Abra um chamado para nossa equipe técnica ou financeira."
          />
          <button
            onClick={() => setNovoAberto(true)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90"
            style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
          >
            <Plus className="size-4" /> Abrir Chamado
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]"><Clock className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Aguardando / Em andamento</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#92400e]">{abertos}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]"><CheckCircle2 className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Resolvidos</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#065f46]">{resolvidos}</p>
            </div>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <h2 className="text-base font-bold text-[#12232b]">Meus chamados</h2>
          </div>

          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#f0f4f5] text-[#82939a]">
                <Headphones className="size-6" />
              </div>
              <p className="mt-4 text-sm font-semibold text-[#243942]">Nenhum chamado aberto</p>
              <p className="mt-1 text-xs text-[#82939a]">Se precisar de ajuda, clique em "Abrir Chamado".</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4f5]">
              {tickets.map(t => (
                <div key={t.id} className="flex items-start gap-4 p-5 transition hover:bg-[#fafcfc]">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#f0f4f5] text-[#536871]">
                    <MessageSquare className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#243942]">{t.assunto}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${prioridadeStyles[t.prioridade] || prioridadeStyles.normal}`}>
                        {prioridadeLabel[t.prioridade] || 'Normal'}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyles[t.status] || statusStyles.aberto}`}>
                        {statusLabel[t.status] || 'Aberto'}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-[#82939a]">{t.descricao}</p>
                    <p className="mt-1 text-[11px] text-[#a0afb4]">Aberto em: {formatarDataHora(t.criado_em)}</p>
                  </div>
                  {t.resposta && (
                    <div className="shrink-0">
                      <button onClick={() => setDetalhe(t)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#0d9488] bg-white px-3 py-1.5 text-xs font-semibold text-[#0d9488] hover:bg-[#f0fdfa]">
                        <MessageSquare className="size-3.5" /> Ver Resposta
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </main>

      {/* MODAL NOVO TICKET */}
      {novoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#e5ecee] bg-[#fafcfc] px-5 py-4">
              <h3 className="font-bold text-[#12232b]">Abrir Chamado</h3>
              <button onClick={() => setNovoAberto(false)} className="text-[#82939a] hover:text-[#12232b]"><X size={20}/></button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {erro && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{erro}</p>}
              
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#536871]">Assunto</label>
                <input
                  type="text"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Ex: Erro ao gerar boleto, Dúvida sobre o plano..."
                  className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#536871]">Prioridade</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(prioridadeLabel).map(([k, l]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setPrioridade(k)}
                      className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${prioridade === k ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[#0d9488]'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#536871]">Descrição detalhada</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={5}
                  placeholder="Descreva o que aconteceu com o máximo de detalhes possível..."
                  className="w-full resize-none rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]"
                />
              </div>
            </div>

            <div className="border-t border-[#e5ecee] bg-[#fafcfc] px-5 py-4 flex justify-end gap-2">
              <button type="button" onClick={() => setNovoAberto(false)} className="px-4 py-2 text-sm font-semibold text-[#6b7d86] hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button type="button" onClick={handleAbrirTicket} disabled={processando} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0d9488] hover:brightness-90 rounded-lg disabled:opacity-50">
                {processando ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {processando ? 'Enviando...' : 'Enviar Chamado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHE / RESPOSTA */}
      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#e5ecee] bg-[#fafcfc] px-5 py-4">
              <div>
                <h3 className="font-bold text-[#12232b]">{detalhe.assunto}</h3>
                <p className="text-xs text-[#82939a]">Aberto em {formatarDataHora(detalhe.criado_em)}</p>
              </div>
              <button onClick={() => setDetalhe(null)} className="text-[#82939a] hover:text-[#12232b]"><X size={20}/></button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#82939a] mb-2">Sua mensagem:</p>
                <p className="text-sm bg-[#f0f4f5] p-3 rounded-lg text-[#243942] whitespace-pre-wrap">{detalhe.descricao}</p>
              </div>

              {detalhe.resposta && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0d9488] mb-2">Resposta da ARXUM:</p>
                  <div className="bg-[#f0fdfa] border border-[#ccfbf1] p-3 rounded-lg text-[#0f766e] text-sm whitespace-pre-wrap">
                    {detalhe.resposta}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#e5ecee] bg-[#fafcfc] px-5 py-4 flex justify-end">
              <button type="button" onClick={() => setDetalhe(null)} className="px-4 py-2 text-sm font-semibold text-white bg-[#0d9488] hover:brightness-90 rounded-lg">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}