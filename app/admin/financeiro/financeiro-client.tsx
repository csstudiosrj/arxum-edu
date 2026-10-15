'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, TrendingUp, AlertCircle, CheckCircle2, Clock, Trash2, X, Loader2, Check } from 'lucide-react'
import { AdminShell, SectionHeading, Panel, ActionButton } from '@/components/admin-shell'
import { criarFatura, atualizarStatusFatura, excluirFatura, type Fatura } from './actions'

const statusStyles: Record<string, string> = {
  em_aberto: 'bg-[#dbeafe] text-[#1e40af]',
  pago: 'bg-[#d1fae5] text-[#065f46]',
  vencido: 'bg-[#fee2e2] text-[#991b1b]',
  cancelado: 'bg-[#e5ecee] text-[#5e7a94]',
}
const statusLabels: Record<string, string> = {
  em_aberto: 'Em aberto',
  pago: 'Pago',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
}

const filtros = [
  { key: 'todas', label: 'Todas' },
  { key: 'em_aberto', label: 'Em aberto' },
  { key: 'pago', label: 'Pago' },
  { key: 'vencido', label: 'Vencido' },
  { key: 'cancelado', label: 'Cancelado' },
]

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string): string {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

export function FinanceiroClient({ faturas, alunos }: { faturas: Fatura[]; alunos: Array<{ nome: string; responsavel_email: string }> }) {
  const router = useRouter()
  const [filtro, setFiltro] = useState('todas')
  const [busca, setBusca] = useState('')
  const [novaAberta, setNovaAberta] = useState(false)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)

  const [alunoIdx, setAlunoIdx] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('')

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const filtradas = faturas.filter((f) => {
    const matchFiltro = filtro === 'todas' || f.status === filtro
    const termo = busca.toLowerCase()
    const matchBusca = busca === '' || f.aluno_nome.toLowerCase().includes(termo) || f.responsavel_email.toLowerCase().includes(termo)
    return matchFiltro && matchBusca
  })

  const totalRecebido = faturas.filter((f) => f.status === 'pago').reduce((s, f) => s + f.valor_centavos, 0)
  const totalEmAberto = faturas.filter((f) => f.status === 'em_aberto').reduce((s, f) => s + f.valor_centavos, 0)
  const totalVencido = faturas.filter((f) => f.status === 'vencido').reduce((s, f) => s + f.valor_centavos, 0)

  function limparForm() {
    setAlunoIdx('')
    setDescricao('')
    setValor('')
    setVencimento('')
    setErro('')
  }

  async function handleCriar() {
    if (!alunoIdx) return setErro('Selecione o aluno.')
    if (!descricao.trim()) return setErro('Informe a descrição.')
    if (!valor.trim()) return setErro('Informe o valor.')
    if (!vencimento) return setErro('Informe o vencimento.')

    const valorCentavos = Math.round(parseFloat(valor.replace(',', '.')) * 100)
    if (isNaN(valorCentavos) || valorCentavos <= 0) return setErro('Valor inválido.')

    const aluno = alunos[parseInt(alunoIdx, 10)]
    if (!aluno) return setErro('Aluno inválido.')

    setSalvando(true)
    setErro('')
    const result = await criarFatura({
      aluno_nome: aluno.nome,
      responsavel_email: aluno.responsavel_email,
      descricao,
      valor_centavos: valorCentavos,
      vencimento,
    })
    setSalvando(false)

    if (!result.success) return setErro(result.error || 'Erro.')

    limparForm()
    setNovaAberta(false)
    router.refresh()
  }

  async function handleStatus(id: string, status: string) {
    await atualizarStatusFatura(id, status)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    await excluirFatura(confirmarExclusao)
    setConfirmarExclusao(null)
    router.refresh()
  }

  return (
    <AdminShell mode="school" active="Financeiro">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Financeiro"
            title="Gestão financeira"
            description="Gerencie faturas e acompanhe a inadimplência da escola."
          />
          <ActionButton variant="primary">
            <button onClick={() => { limparForm(); setNovaAberta(true) }} className="inline-flex items-center gap-1.5">
              <Plus className="size-4" />
              Nova fatura
            </button>
          </ActionButton>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Recebido', value: formatarMoeda(totalRecebido), icon: CheckCircle2, color: '#065f46' },
            { label: 'Em aberto', value: formatarMoeda(totalEmAberto), icon: Clock, color: '#3b82f6' },
            { label: 'Vencido', value: formatarMoeda(totalVencido), icon: AlertCircle, color: '#dc2626' },
            { label: 'Total de faturas', value: String(faturas.length), icon: TrendingUp, color: '#0d9488' },
          ].map((m) => (
            <Panel key={m.label} className="p-5">
              <div className="grid size-10 place-items-center rounded-lg" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                <m.icon className="size-5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">{m.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-[-.03em]" style={{ color: m.color }}>{m.value}</p>
            </Panel>
          ))}
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {filtros.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFiltro(f.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      filtro === f.key ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-72">
                <Search className="size-4 text-[#9aaab0]" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar aluno ou e-mail"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]"
                />
              </div>
            </div>
          </div>

          {faturas.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]">
                <TrendingUp className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhuma fatura ainda</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">Gere a primeira cobrança e ela aparecerá aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Aluno</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Descrição</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Vencimento</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Valor</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Status</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#82939a]">Nenhuma fatura encontrada.</td>
                    </tr>
                  ) : (
                    filtradas.map((f) => (
                      <tr key={f.id} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                        <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">
                          <div>{f.aluno_nome}</div>
                          <div className="text-xs font-normal text-[#82939a]">{f.responsavel_email}</div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#4d626c]">{f.descricao}</td>
                        <td className="px-5 py-3.5 text-sm text-[#4d626c]">{formatarData(f.vencimento)}</td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{formatarMoeda(f.valor_centavos)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[f.status]}`}>
                            {statusLabels[f.status]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1">
                            {f.status !== 'pago' && (
                              <button
                                onClick={() => handleStatus(f.id, 'pago')}
                                className="rounded-lg p-1.5 text-[#0d9488] hover:bg-[#ccfbf1]"
                                title="Marcar como pago"
                              >
                                <Check className="size-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmarExclusao(f.id)}
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

      {novaAberta && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !salvando && setNovaAberta(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Nova fatura</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">A fatura aparecerá na área do responsável</p>
              </div>
              <button onClick={() => setNovaAberta(false)} disabled={salvando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50">
                <X className="size-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Aluno</label>
                  <select
                    value={alunoIdx}
                    onChange={(e) => setAlunoIdx(e.target.value)}
                    className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]"
                  >
                    <option value="">Selecione</option>
                    {alunos.map((a, i) => (
                      <option key={`${a.nome}-${i}`} value={String(i)}>{a.nome} — {a.responsavel_email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição</label>
                  <input
                    type="text"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Mensalidade Novembro"
                    className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Valor (R$)</label>
                    <input
                      type="text"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Vencimento</label>
                    <input
                      type="date"
                      value={vencimento}
                      onChange={(e) => setVencimento(e.target.value)}
                      className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]"
                    />
                  </div>
                </div>
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovaAberta(false)} disabled={salvando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleCriar} disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
                {salvando ? 'Salvando...' : 'Criar fatura'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmarExclusao(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]">
              <Trash2 className="size-5" />
            </div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir fatura?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">Essa ação não pode ser desfeita.</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmarExclusao(null)} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e]">Cancelar</button>
              <button onClick={handleExcluir} className="flex-1 rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b91c1c]">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}