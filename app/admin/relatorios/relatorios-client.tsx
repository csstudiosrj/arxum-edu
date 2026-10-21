'use client'

import { Users, TrendingUp, WalletCards, MessageSquare, AlertCircle, Award, CheckCircle2, Clock, XCircle, BarChart3, BookOpen, ShieldAlert, Heart, FileQuestion, ShoppingCart } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import type { RelatorioData } from './actions'

// ── SEMÂNTICO: cores por status ─────────────────────────────────────
const statusLabels: Record<string, string> = {
  inscrito: 'Inscrito',
  em_analise: 'Em análise',
  entrevista: 'Entrevista',
  aprovado: 'Aprovado',
  matriculado: 'Matriculado',
  lista_espera: 'Lista de espera',
  nao_aprovado: 'Não aprovado',
  cancelado: 'Cancelado',
}

const statusCores: Record<string, string> = {
  inscrito: '#5e7a94',
  em_analise: '#d97706',
  entrevista: '#3b82f6',
  aprovado: '#0d9488',
  matriculado: '#065f46',
  lista_espera: '#d97706',
  nao_aprovado: '#dc2626',
  cancelado: '#82939a',
}

// ── SEMÂNTICO: cores por tipo de ocorrência ─────────────────────────
const tipoOcorrencia: Record<string, { label: string; cor: string; icone: typeof AlertCircle }> = {
  pedagogica: { label: 'Pedagógica', cor: '#3b82f6', icone: BookOpen },
  disciplinar: { label: 'Disciplinar', cor: '#dc2626', icone: ShieldAlert },
  saude: { label: 'Saúde', cor: '#d97706', icone: Heart },
  elogio: { label: 'Elogio', cor: '#0d9488', icone: Award },
  outro: { label: 'Outro', cor: '#6b7d86', icone: FileQuestion },
}

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function Barra({ label, valor, max, cor }: { label: string; valor: number; max: number; cor: string }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-[#243942]">{label}</span>
        <span className="text-[#82939a]">{valor}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#f0f4f5]">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cor }} />
      </div>
    </div>
  )
}

export function RelatoriosClient({ data }: { data: RelatorioData }) {
  const maxMatriculas = Math.max(...data.matriculasPorStatus.map((m) => m.total), 1)
  const maxOcorrencias = Math.max(...data.ocorrenciasPorTipo.map((o) => o.total), 1)
  const totalNotas = data.distribuicaoNotas.aprovados + data.distribuicaoNotas.recuperacao + data.distribuicaoNotas.reprovados
  const pctAprovados = totalNotas > 0 ? Math.round((data.distribuicaoNotas.aprovados / totalNotas) * 100) : 0
  const pctRecuperacao = totalNotas > 0 ? Math.round((data.distribuicaoNotas.recuperacao / totalNotas) * 100) : 0
  const pctReprovados = totalNotas > 0 ? Math.round((data.distribuicaoNotas.reprovados / totalNotas) * 100) : 0

  return (
    <AdminShell mode="school" active="Relatórios">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="Business Intelligence"
          title="Relatórios"
          description="Visão executiva dos principais indicadores da escola."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Panel className="p-5">
            <div className="flex items-start justify-between">
              <div
                className="grid size-10 place-items-center rounded-lg"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                  color: 'var(--cor-primaria, #0d9488)',
                }}
              >
                <Users className="size-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Alunos ativos</p>
            <p className="mt-1 text-3xl font-bold tracking-[-.03em]" style={{ color: 'var(--cor-primaria, #0d9488)' }}>{data.alunosAtivos}</p>
            <p className="mt-1 text-xs text-[#82939a]">{data.turmasUnicas} turmas · {data.totalAlunos} total</p>
          </Panel>

          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
              <TrendingUp className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Média geral</p>
            <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#3b82f6]">
              {data.mediaGeral !== null ? data.mediaGeral.toFixed(1) : '—'}
            </p>
            <p className="mt-1 text-xs text-[#82939a]">{totalNotas} avaliações lançadas</p>
          </Panel>

          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#fee2e2] text-[#dc2626]">
              <WalletCards className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Inadimplência</p>
            <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#dc2626]">{data.inadimplenciaPct}%</p>
            <p className="mt-1 text-xs text-[#82939a]">{formatarMoeda(data.receitaVencida)} vencido</p>
          </Panel>

          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ede9fe] text-[#5b21b6]">
              <MessageSquare className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Engajamento</p>
            <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#5b21b6]">{data.engajamentoPct}%</p>
            <p className="mt-1 text-xs text-[#82939a]">{data.totalLeituras} leituras de comunicados</p>
          </Panel>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Panel className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div
                className="grid size-9 place-items-center rounded-lg"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                  color: 'var(--cor-primaria, #0d9488)',
                }}
              >
                <Users className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Matrículas por status</h2>
                <p className="text-xs text-[#82939a]">Taxa de conversão: {data.taxaConversao}%</p>
              </div>
            </div>
            {data.matriculasPorStatus.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#82939a]">Nenhuma matrícula registrada.</p>
            ) : (
              <div className="space-y-3">
                {data.matriculasPorStatus
                  .sort((a, b) => b.total - a.total)
                  .map((m) => (
                    <Barra
                      key={m.status}
                      label={statusLabels[m.status] || m.status}
                      valor={m.total}
                      max={maxMatriculas}
                      cor={statusCores[m.status] || '#6b7d86'}
                    />
                  ))}
              </div>
            )}
          </Panel>

          <Panel className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
                <Award className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Distribuição de notas</h2>
                <p className="text-xs text-[#82939a]">{totalNotas} avaliações com nota</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#d1fae5] bg-[#d1fae5]/40 p-3 text-center">
                <CheckCircle2 className="mx-auto text-[#065f46]" size={20} />
                <p className="mt-2 text-2xl font-bold text-[#065f46]">{data.distribuicaoNotas.aprovados}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#065f46]">Aprovados</p>
                <p className="mt-0.5 text-xs text-[#065f46]/70">{pctAprovados}%</p>
              </div>
              <div className="rounded-lg border border-[#fef3c7] bg-[#fef3c7]/40 p-3 text-center">
                <Clock className="mx-auto text-[#92400e]" size={20} />
                <p className="mt-2 text-2xl font-bold text-[#92400e]">{data.distribuicaoNotas.recuperacao}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#92400e]">Recuperação</p>
                <p className="mt-0.5 text-xs text-[#92400e]/70">{pctRecuperacao}%</p>
              </div>
              <div className="rounded-lg border border-[#fee2e2] bg-[#fee2e2]/40 p-3 text-center">
                <XCircle className="mx-auto text-[#991b1b]" size={20} />
                <p className="mt-2 text-2xl font-bold text-[#991b1b]">{data.distribuicaoNotas.reprovados}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#991b1b]">Reprovados</p>
                <p className="mt-0.5 text-xs text-[#991b1b]/70">{pctReprovados}%</p>
              </div>
            </div>
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div
                className="grid size-9 place-items-center rounded-lg"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                  color: 'var(--cor-primaria, #0d9488)',
                }}
              >
                <BarChart3 className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Desempenho por disciplina</h2>
                <p className="text-xs text-[#82939a]">Média das notas lançadas</p>
              </div>
            </div>
            {data.mediaPorDisciplina.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#82939a]">Nenhuma nota lançada ainda.</p>
            ) : (
              <div className="space-y-3">
                {data.mediaPorDisciplina.map((d) => {
                  const cor = d.media >= 7 ? '#0d9488' : d.media >= 5 ? '#d97706' : '#dc2626'
                  return (
                    <div key={d.disciplina}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#243942]">{d.disciplina}</span>
                        <span className="text-[#82939a]">{d.media.toFixed(1)} · {d.total} notas</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#f0f4f5]">
                        <div className="h-full rounded-full" style={{ width: `${(d.media / 10) * 100}%`, backgroundColor: cor }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>

          <Panel className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#fee2e2] text-[#dc2626]">
                <AlertCircle className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Ocorrências por tipo</h2>
                <p className="text-xs text-[#82939a]">{data.ocorrenciasTotal} ocorrências no total</p>
              </div>
            </div>
            {data.ocorrenciasPorTipo.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#82939a]">Nenhuma ocorrência registrada.</p>
            ) : (
              <div className="space-y-3">
                {data.ocorrenciasPorTipo
                  .sort((a, b) => b.total - a.total)
                  .map((o) => {
                    const info = tipoOcorrencia[o.tipo] || tipoOcorrencia.outro
                    return (
                      <Barra
                        key={o.tipo}
                        label={info.label}
                        valor={o.total}
                        max={maxOcorrencias}
                        cor={info.cor}
                      />
                    )
                  })}
              </div>
            )}
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Panel className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]">
                <WalletCards className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Financeiro</h2>
                <p className="text-xs text-[#82939a]">Situação das faturas</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-[#d1fae5] bg-[#d1fae5]/30 p-3">
                <span className="text-xs font-semibold text-[#065f46]">Recebido</span>
                <span className="text-base font-bold text-[#065f46]">{formatarMoeda(data.receitaTotal)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#dbeafe] bg-[#dbeafe]/30 p-3">
                <span className="text-xs font-semibold text-[#1e40af]">Em aberto</span>
                <span className="text-base font-bold text-[#1e40af]">{formatarMoeda(data.receitaEmAberto)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#fee2e2] bg-[#fee2e2]/30 p-3">
                <span className="text-xs font-semibold text-[#991b1b]">Vencido</span>
                <span className="text-base font-bold text-[#991b1b]">{formatarMoeda(data.receitaVencida)}</span>
              </div>
            </div>
          </Panel>

          <Panel className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Autorizações</h2>
                <p className="text-xs text-[#82939a]">Respostas dos responsáveis</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#243942]">Taxa de resposta</span>
                  <span className="text-[#82939a]">{data.engajamentoAutorizacoesPct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#f0f4f5]">
                  <div className="h-full rounded-full bg-[#3b82f6]" style={{ width: `${Math.min(data.engajamentoAutorizacoesPct, 100)}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Total enviadas</p>
                  <p className="mt-1 text-xl font-bold text-[#243942]">{data.totalAutorizacoes}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Autorizadas</p>
                  <p className="mt-1 text-xl font-bold" style={{ color: 'var(--cor-primaria, #0d9488)' }}>{data.totalAutorizados}</p>
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#ede9fe] text-[#5b21b6]">
                <ShoppingCart className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Loja virtual</h2>
                <p className="text-xs text-[#82939a]">Pedidos e receita</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Pendentes</p>
                  <p className="mt-1 text-xl font-bold text-[#92400e]">{data.pedidosPendentes}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Confirmados</p>
                  <p className="mt-1 text-xl font-bold text-[#065f46]">{data.pedidosPagos}</p>
                </div>
              </div>
              <div className="rounded-lg border border-[#ede9fe] bg-[#ede9fe]/30 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5b21b6]">Receita confirmada</p>
                <p className="mt-1 text-lg font-bold text-[#5b21b6]">{formatarMoeda(data.receitaLoja)}</p>
              </div>
            </div>
          </Panel>
        </div>
      </main>
    </AdminShell>
  )
}