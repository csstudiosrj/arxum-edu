'use client'

import { useState } from 'react'
import { Search, Plus, Send, Eye, Paperclip, AlertCircle, Bell, MessageSquare } from 'lucide-react'
import { AdminShell, SectionHeading, Panel, ActionButton } from '@/components/admin-shell'

const comunicados = [
  { id: '#COM-0478', titulo: 'Reunião de pais — 9º Ano A', setor: 'Coordenação', publico: '9º Ano A', autor: 'Ana Paula', data: '14/10/2026', hora: '14:30', lidos: 24, total: 32, prioridade: 'Alta' },
  { id: '#COM-0477', titulo: 'Passeio ao Museu — autorização', setor: 'Secretaria', publico: '4º Ano B', autor: 'Marina Silva', data: '14/10/2026', hora: '10:15', lidos: 18, total: 28, prioridade: 'Normal' },
  { id: '#COM-0476', titulo: 'Calendário de provas — 2º trimestre', setor: 'Coordenação', publico: 'Toda a escola', autor: 'Ana Paula', data: '13/10/2026', hora: '16:40', lidos: 298, total: 342, prioridade: 'Alta' },
  { id: '#COM-0475', titulo: 'Boleto de outubro disponível', setor: 'Financeiro', publico: 'Toda a escola', autor: 'Roberto Lima', data: '12/10/2026', hora: '09:00', lidos: 265, total: 342, prioridade: 'Normal' },
  { id: '#COM-0474', titulo: 'Semana da Comunidade — programação', setor: 'Direção', publico: 'Toda a escola', autor: 'Diretora Helena', data: '11/10/2026', hora: '17:20', lidos: 310, total: 342, prioridade: 'Baixa' },
  { id: '#COM-0473', titulo: 'Novo horário da Educação Infantil', setor: 'Secretaria', publico: 'Educação Infantil', autor: 'Marina Silva', data: '10/10/2026', hora: '11:45', lidos: 42, total: 48, prioridade: 'Alta' },
]

const mensagens = [
  { aluno: 'Lucas Oliveira', setor: 'Financeiro', assunto: 'Solicitação de 2ª via de boleto', tempo: '5 min', urgente: true },
  { aluno: 'Sofia Almeida', setor: 'Secretaria', assunto: 'Atualização de endereço', tempo: '1h', urgente: false },
  { aluno: 'Pedro Santos', setor: 'Coordenação', assunto: 'Solicitação de declaração', tempo: '3h', urgente: false },
  { aluno: 'Isabela Costa', setor: 'Financeiro', assunto: 'Dúvida sobre desconto de irmãos', tempo: '1 dia', urgente: false },
]

const setorStyles: Record<string, string> = {
  'Coordenação': 'bg-[#dbeafe] text-[#1e40af]',
  'Secretaria': 'bg-[#ccfbf1] text-[#0f766e]',
  'Financeiro': 'bg-[#fef3c7] text-[#92400e]',
  'Direção': 'bg-[#ede9fe] text-[#5b21b6]',
}

const prioridadeStyles: Record<string, string> = {
  'Alta': 'bg-[#fee2e2] text-[#991b1b]',
  'Normal': 'bg-[#e5ecee] text-[#5e7a94]',
  'Baixa': 'bg-[#f0f4f5] text-[#6b7d86]',
}

export default function ComunicacaoPage() {
  const [busca, setBusca] = useState('')

  const filtrados = comunicados.filter(
    (c) =>
      busca === '' ||
      c.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      c.setor.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <AdminShell mode="school" active="Comunicação">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Comunicação"
            title="Central de comunicação"
            description="Envie comunicados e acompanhe as mensagens recebidas dos responsáveis."
          />
          <ActionButton variant="primary">
            <Plus className="mr-1.5 inline size-4" />
            Novo comunicado
          </ActionButton>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Comunicados este mês', value: 32, icon: Bell, color: '#0d9488' },
            { label: 'Mensagens não lidas', value: 4, icon: MessageSquare, color: '#d97706' },
            { label: 'Taxa média de leitura', value: '87%', icon: Eye, color: '#065f46' },
          ].map((m) => (
            <Panel key={m.label} className="flex items-center gap-4 p-5">
              <div className="grid size-10 place-items-center rounded-lg" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                <m.icon className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">{m.label}</p>
                <p className="text-2xl font-bold tracking-[-.03em] text-[#12232b]">{m.value}</p>
              </div>
            </Panel>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <div className="border-b border-[#e5ecee] px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-base font-bold text-[#12232b]">Comunicados enviados</h2>
                <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
                  <Search className="size-4 text-[#9aaab0]" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar comunicado"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]"
                  />
                </div>
              </div>
            </div>
            <div className="divide-y divide-[#f0f4f5]">
              {filtrados.map((c) => {
                const pct = Math.round((c.lidos / c.total) * 100)
                return (
                  <div key={c.id} className="px-5 py-4 transition hover:bg-[#fafcfc]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${setorStyles[c.setor]}`}>
                            {c.setor}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${prioridadeStyles[c.prioridade]}`}>
                            {c.prioridade}
                          </span>
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-[#243942]">{c.titulo}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#82939a]">
                          <span>Para: {c.publico}</span>
                          <span>·</span>
                          <span>Por: {c.autor}</span>
                          <span>·</span>
                          <span>{c.data} às {c.hora}</span>
                        </div>
                      </div>
                      <button className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Ver comunicado">
                        <Eye className="size-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e5ecee]">
                        <div className="h-full rounded-full bg-[#0d9488]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-[#536871]">{pct}% lido</span>
                      <span className="text-xs text-[#82939a]">({c.lidos}/{c.total})</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel>
            <div className="border-b border-[#e5ecee] px-5 py-4">
              <h2 className="text-base font-bold text-[#12232b]">Mensagens recebidas</h2>
              <p className="mt-0.5 text-xs text-[#82939a]">Tickets abertos pelos responsáveis</p>
            </div>
            <div className="divide-y divide-[#f0f4f5]">
              {mensagens.map((m, i) => (
                <div key={i} className="px-5 py-3.5 transition hover:bg-[#fafcfc]">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 grid size-7 shrink-0 place-items-center rounded-full ${m.urgente ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#f1f5f6] text-[#6b7d86]'}`}>
                      {m.urgente ? <AlertCircle className="size-3.5" /> : <MessageSquare className="size-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#6b7d86]">{m.setor}</span>
                        <span className="text-xs text-[#82939a]">{m.tempo}</span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-semibold text-[#243942]">{m.assunto}</p>
                      <p className="text-xs text-[#82939a]">{m.aluno}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#e5ecee] p-4">
              <ActionButton variant="secondary">
                <Send className="mr-1.5 inline size-4" />
                Ver todos os tickets
              </ActionButton>
            </div>
          </Panel>
        </div>
      </main>
    </AdminShell>
  )
}