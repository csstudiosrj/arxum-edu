'use client'

import { useState } from 'react'
import { Search, ShieldAlert, FileText, User, Clock, CheckCircle2, History } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { type LogAuditoria } from './actions'

const acaoLabels: Record<string, string> = {
  CRIAR_NOTA: 'Lançou Nota',
  EDITAR_NOTA: 'Editou Nota',
  DELETAR_NOTA: 'Excluiu Nota',
  CRIAR_FATURA: 'Gerou Fatura',
  DELETAR_FATURA: 'Excluiu Fatura',
  ALTERAR_STATUS_MATRICULA: 'Alterou Matrícula',
  VINCULAR_ALUNO: 'Vinculou Aluno',
  VISUALIZAR_DADOS_SENSIVEIS: 'Acessou Dados Sensíveis (LGPD)',
  EXPORTAR_DADOS: 'Exportou Dados'
}

const entidadeCores: Record<string, string> = {
  notas: 'bg-blue-100 text-blue-700',
  faturas: 'bg-green-100 text-green-700',
  matriculas: 'bg-yellow-100 text-yellow-700',
  alunos: 'bg-purple-100 text-purple-700',
  lgpd: 'bg-red-100 text-red-700'
}

function formatarDataHora(iso: string) {
  try { return new Date(iso).toLocaleString('pt-BR') } catch { return iso }
}

export function AuditoriaClient({ logsIniciais }: { logsIniciais: LogAuditoria[] }) {
  const [busca, setBusca] = useState('')
  const [filtroEntidade, setFiltroEntidade] = useState('todas')

  const filtrados = logsIniciais.filter(l => {
    const termo = busca.toLowerCase()
    const matchBusca = l.usuario_nome.toLowerCase().includes(termo) || l.usuario_email.toLowerCase().includes(termo) || l.acao.toLowerCase().includes(termo)
    const matchEntidade = filtroEntidade === 'todas' || l.entidade === filtroEntidade
    return matchBusca && matchEntidade
  })

  return (
    <AdminShell mode="school" active="Auditoria e LGPD">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Segurança"
            title="Trilha de Auditoria"
            description="Monitore quem acessou ou alterou dados sensíveis na escola (Conformidade LGPD)."
          />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#1e40af]"><History className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#6b7d86]">Ações Registradas</p>
              <p className="text-2xl font-bold text-[#1e40af]">{logsIniciais.length}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#fee2e2] text-[#991b1b]"><ShieldAlert className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#6b7d86]">Acessos a Dados Sensíveis</p>
              <p className="text-2xl font-bold text-[#991b1b]">{logsIniciais.filter(l => l.acao === 'VISUALIZAR_DADOS_SENSIVEIS').length}</p>
            </div>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setFiltroEntidade('todas')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filtroEntidade === 'todas' ? 'bg-[var(--cor-primaria)] text-white' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>Todas</button>
              {Object.keys(entidadeCores).map(ent => (
                <button key={ent} onClick={() => setFiltroEntidade(ent)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${filtroEntidade === ent ? 'bg-[var(--cor-primaria)] text-white' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>{ent}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
              <Search className="size-4 text-[#9aaab0]" />
              <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar usuário ou ação" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
            </div>
          </div>

          {filtrados.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#82939a] flex flex-col items-center">
              <FileText size={32} className="text-[#a0afb4] mb-3" />
              Nenhum log encontrado.
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4f5]">
              {filtrados.map(log => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-[#fafcfc] transition">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f0f4f5] text-[#536871]">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#243942]">{log.usuario_nome} <span className="text-xs font-normal text-[#82939a]">({log.usuario_email})</span></p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${entidadeCores[log.entidade] || 'bg-gray-100 text-gray-700'}`}>{log.entidade}</span>
                        <span className="text-xs text-[#536871] font-medium">{acaoLabels[log.acao] || log.acao}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-[#82939a]">
                    <div className="flex items-center gap-1"><Clock size={12} /> {formatarDataHora(log.criado_em)}</div>
                    <div className="bg-[#f0f4f5] px-2 py-1 rounded font-mono">IP: {log.ip}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </main>
    </AdminShell>
  )
}