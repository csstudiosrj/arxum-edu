'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronRight, CircleDollarSign, FileText, Home, ImageIcon, LogOut, MessageSquare, Search, Settings, ShieldCheck, WalletCards, Bell, BookOpen, ClipboardCheck, Users, X, Clock, CheckCircle2, AlertCircle, ExternalLink, Calendar, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { ArxumBrand } from '@/components/arxum-brand'
import { createClient } from '@/lib/supabase/client'
import type { InscricaoResponsavel, DocumentosMatricula, ComunicadoResponsavel, FaturaResponsavel, EventoResponsavel } from './actions'
import { marcarComoLido } from './actions'

type MenuItem = readonly [LucideIcon, string]
type Atalho = readonly [string, LucideIcon, string]

const menu: MenuItem[] = [[Home,'Início'],[Users,'Meus filhos'],[FileText,'Matrículas'],[BookOpen,'Boletim'],[WalletCards,'Financeiro'],[MessageSquare,'Comunicação'],[CalendarDays,'Agenda'],[ImageIcon,'Fotos'],[ShieldCheck,'Autorizações'],[Settings,'Configurações']]

const statusMap: Record<string, { label: string; style: string; icon: LucideIcon }> = {
  inscrito: { label: 'Inscrito', style: 'bg-[#e5ecee] text-[#5e7a94]', icon: Clock },
  em_analise: { label: 'Em análise', style: 'bg-[#fef3c7] text-[#92400e]', icon: Clock },
  entrevista: { label: 'Entrevista agendada', style: 'bg-[#dbeafe] text-[#1e40af]', icon: CalendarDays },
  aprovado: { label: 'Aprovado', style: 'bg-[#ccfbf1] text-[#0f766e]', icon: CheckCircle2 },
  matriculado: { label: 'Matriculado', style: 'bg-[#d1fae5] text-[#065f46]', icon: CheckCircle2 },
  lista_espera: { label: 'Lista de espera', style: 'bg-[#fef3c7] text-[#92400e]', icon: Clock },
  nao_aprovado: { label: 'Não aprovado', style: 'bg-[#fee2e2] text-[#991b1b]', icon: AlertCircle },
  cancelado: { label: 'Cancelado', style: 'bg-[#e5ecee] text-[#5e7a94]', icon: X },
}

const setorStyles: Record<string, string> = {
  'Coordenação': 'bg-[#dbeafe] text-[#1e40af]',
  'Secretaria': 'bg-[#ccfbf1] text-[#0f766e]',
  'Financeiro': 'bg-[#fef3c7] text-[#92400e]',
  'Direção': 'bg-[#ede9fe] text-[#5b21b6]',
}

const tipoEvento: Record<string, { cor: string; label: string }> = {
  prova: { cor: '#3b82f6', label: 'Prova' },
  reuniao: { cor: '#7c3aed', label: 'Reunião' },
  passeio: { cor: '#0d9488', label: 'Passeio' },
  feriado: { cor: '#d97706', label: 'Feriado' },
  evento: { cor: '#dc2626', label: 'Evento' },
  outro: { cor: '#6b7d86', label: 'Outro' },
}

const atalhos: Atalho[] = [
  ['Solicitar matrícula',FileText,'/matricula'],
  ['Enviar documento',ClipboardCheck,'#'],
  ['Falar com a escola',MessageSquare,'#'],
  ['Autorizar saída',ShieldCheck,'#'],
]

const nomesDocumentos: Array<{ key: keyof DocumentosMatricula; label: string }> = [
  { key: 'rg_aluno', label: 'RG ou Certidão de nascimento do aluno' },
  { key: 'cpf_responsavel', label: 'CPF do responsável' },
  { key: 'comprovante_residencia', label: 'Comprovante de residência' },
  { key: 'historico_escolar', label: 'Histórico escolar' },
]

function Sidebar({ onLogout, saindo }: { onLogout: () => void; saindo: boolean }) {
  return <aside className="hidden w-64 shrink-0 border-r border-[#dbe5e8] bg-white lg:flex lg:flex-col">
    <div className="p-6"><ArxumBrand light /></div>
    <div className="px-3">
      <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#8aa0ad]">Área do responsável</p>
      {menu.map(([Icon,label],i) => <Link key={label} href="#" className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${i===0?'bg-[#e6faf3] text-[#087f5b]':'text-[#617783] hover:bg-[#f4f7f8]'}`}><Icon size={18}/>{label}</Link>)}
    </div>
    <div className="mt-auto border-t border-[#dbe5e8] p-4">
      <button onClick={onLogout} disabled={saindo} className="flex w-full items-center gap-3 px-3 py-2 text-sm text-[#617783] disabled:opacity-50">
        <LogOut size={17}/>{saindo ? 'Saindo...' : 'Sair'}
      </button>
    </div>
  </aside>
}

function formatarData(iso: string): string {
  try {
    return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}

function formatarDataHora(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function diaMes(iso: string): { dia: string; mes: string } {
  try {
    const d = new Date(iso + 'T12:00:00')
    return {
      dia: String(d.getDate()).padStart(2, '0'),
      mes: d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', ''),
    }
  } catch {
    return { dia: '--', mes: '---' }
  }
}

export function ResponsavelClient({
  inscricoes,
  comunicados,
  faturas,
  eventos,
}: {
  inscricoes: InscricaoResponsavel[]
  comunicados: ComunicadoResponsavel[]
  faturas: FaturaResponsavel[]
  eventos: EventoResponsavel[]
}) {
  const router = useRouter()
  const [saindo, setSaindo] = useState(false)
  const [detalhes, setDetalhes] = useState<InscricaoResponsavel | null>(null)
  const [comunicadoAberto, setComunicadoAberto] = useState<ComunicadoResponsavel | null>(null)

  async function handleLogout() {
    setSaindo(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function abrirComunicado(c: ComunicadoResponsavel) {
    setComunicadoAberto(c)
    if (!c.lido) {
      await marcarComoLido(c.id)
    }
  }

  const naoLidos = comunicados.filter((c) => !c.lido).length
  const faturasEmAberto = faturas.filter((f) => f.status === 'em_aberto' || f.status === 'vencido')

  return <div className="min-h-screen bg-[#f7fafb] text-[#18313c]">
    <div className="flex min-h-screen">
      <Sidebar onLogout={handleLogout} saindo={saindo} />
      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-[#dbe5e8] bg-white px-5 py-4 md:px-8">
          <div>
            <p className="text-sm text-[#8aa0ad] capitalize">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <h1 className="font-syne text-xl font-bold text-[#18313c]">Olá, responsável</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden rounded-lg border border-[#dbe5e8] bg-[#f7fafb] p-2.5 text-[#617783] sm:block"><Search size={18}/></button>
            <button className="relative rounded-lg border border-[#dbe5e8] bg-[#f7fafb] p-2.5 text-[#617783]">
              <Bell size={18}/>
              {naoLidos > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-[#dc2626]"/>}
            </button>
            <div className="grid size-9 place-items-center rounded-full bg-[#173b4a] text-sm font-bold text-white">MO</div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[.15em] text-[#0d9488]">Visão geral</p>
            <h2 className="mt-1 font-syne text-3xl font-bold tracking-[-.04em]">Tudo em um só lugar</h2>
          </div>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-syne text-lg font-bold">Minhas matrículas</h3>
              <Link href="/matricula" className="text-sm font-medium text-[#087f5b]">Nova matrícula <ChevronRight className="inline" size={15}/></Link>
            </div>

            {inscricoes.length === 0 ? (
              <div className="rounded-xl border border-[#dbe5e8] bg-white p-10 text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#e6faf3] text-[#0d9488]">
                  <FileText size={24}/>
                </div>
                <h4 className="mt-4 font-syne text-lg font-bold">Nenhuma inscrição ainda</h4>
                <p className="mt-1 text-sm text-[#8aa0ad]">Quando você enviar uma matrícula pelo site, ela aparecerá aqui para acompanhamento.</p>
                <Link href="/matricula" className="mt-6 inline-block rounded-lg bg-[#0d9488] px-5 py-2.5 text-sm font-semibold text-white">Iniciar matrícula</Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {inscricoes.map((i) => {
                  const st = statusMap[i.status] || statusMap.inscrito
                  const Icone = st.icon
                  const docsEnviados = i.documentos ? nomesDocumentos.filter(({ key }) => i.documentos?.[key]?.url).length : 0
                  return (
                    <article key={i.id} className="rounded-xl border border-[#dbe5e8] bg-white p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-[11px] text-[#8aa0ad]">{i.protocolo}</p>
                          <h4 className="mt-1 font-syne text-lg font-bold">{i.aluno_nome}</h4>
                          <p className="mt-0.5 text-sm text-[#8aa0ad]">
                            {i.aluno_serie || 'Série não definida'}{i.aluno_turno ? ` · ${i.aluno_turno}` : ''}
                          </p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${st.style}`}>
                          <Icone size={12} />{st.label}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#edf1f2] pt-4 text-xs">
                        <div>
                          <p className="text-[#8aa0ad]">Enviada em</p>
                          <p className="mt-0.5 font-semibold text-[#243942]">{formatarData(i.criado_em)}</p>
                        </div>
                        <div>
                          <p className="text-[#8aa0ad]">Documentos</p>
                          <p className="mt-0.5 font-semibold text-[#243942]">{docsEnviados} de 4 enviados</p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <button onClick={() => setDetalhes(i)} className="rounded-lg bg-[#f1f8f6] px-2 py-2 text-center text-xs font-semibold text-[#087f5b] hover:bg-[#d9f2e7]">Ver detalhes</button>
                        <button onClick={() => setDetalhes(i)} className="rounded-lg bg-[#f7fafb] px-2 py-2 text-center text-xs font-semibold text-[#617783] hover:bg-[#edf1f2]">Documentos</button>
                        <button className="rounded-lg bg-[#f7fafb] px-2 py-2 text-center text-xs font-semibold text-[#617783] hover:bg-[#edf1f2]">Comunicados</button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <div className="mt-10 grid gap-8 xl:grid-cols-[1.15fr_.85fr]">
            <section>
              <h3 className="mb-4 font-syne text-lg font-bold">Próximos eventos</h3>
              {eventos.length === 0 ? (
                <div className="rounded-xl border border-[#dbe5e8] bg-white p-8 text-center">
                  <Calendar className="mx-auto text-[#a0afb4]" size={28}/>
                  <p className="mt-3 text-sm text-[#8aa0ad]">Nenhum evento agendado pela escola.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {eventos.map((e) => {
                    const info = tipoEvento[e.tipo] || tipoEvento.outro
                    const dt = diaMes(e.data_evento)
                    return (
                      <article key={e.id} className="flex items-center gap-4 rounded-xl border border-[#dbe5e8] bg-white p-4">
                        <div className="w-12 shrink-0 rounded-lg py-2 text-center" style={{ backgroundColor: `${info.cor}15` }}>
                          <strong className="block font-syne text-lg" style={{ color: info.cor }}>{dt.dia}</strong>
                          <span className="text-[10px] font-bold" style={{ color: info.cor }}>{dt.mes}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold">{e.titulo}</h4>
                          <p className="mt-1 truncate text-xs text-[#8aa0ad]">
                            {e.hora_evento ? `${e.hora_evento} · ` : ''}{info.label}{e.descricao ? ` · ${e.descricao}` : ''}
                          </p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-syne text-lg font-bold">Últimos comunicados</h3>
                {naoLidos > 0 && <span className="rounded-full bg-[#dc2626] px-2 py-0.5 text-[10px] font-bold text-white">{naoLidos} novos</span>}
              </div>
              {comunicados.length === 0 ? (
                <div className="rounded-xl border border-[#dbe5e8] bg-white p-8 text-center">
                  <MessageSquare className="mx-auto text-[#a0afb4]" size={28}/>
                  <p className="mt-3 text-sm text-[#8aa0ad]">Nenhum comunicado recebido ainda.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {comunicados.slice(0, 5).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => abrirComunicado(c)}
                      className="rounded-xl border border-[#dbe5e8] bg-white p-4 text-left transition hover:border-[#0d9488]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${setorStyles[c.setor] || 'bg-[#e6faf3] text-[#087f5b]'}`}>{c.setor}</span>
                        <span className="text-xs text-[#8aa0ad]">{formatarData(c.criado_em)}</span>
                      </div>
                      <h4 className="mt-3 text-sm font-semibold">
                        {!c.lido && <span className="mr-2 inline-block size-2 rounded-full bg-[#dc2626]"/>}
                        {c.titulo}
                      </h4>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8aa0ad]">{c.mensagem}</p>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-syne text-lg font-bold">Financeiro</h3>
              <span className="text-sm text-[#8aa0ad]">{faturasEmAberto.length} em aberto</span>
            </div>
            <div className="rounded-xl border border-[#dbe5e8] bg-white">
              <div className="flex items-center gap-3 border-b border-[#edf1f2] p-5">
                <CircleDollarSign className="text-[#0d9488]"/>
                <div>
                  <h4 className="font-semibold">Minhas faturas</h4>
                  <p className="text-xs text-[#8aa0ad]">Acompanhe os pagamentos da sua família</p>
                </div>
              </div>
              {faturas.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-[#8aa0ad]">Nenhuma fatura emitida até o momento.</p>
                </div>
              ) : (
                faturas.slice(0, 5).map((f) => {
                  const statusStyle =
                    f.status === 'pago' ? 'bg-[#e6faf3] text-[#087f5b]' :
                    f.status === 'vencido' ? 'bg-[#fee2e2] text-[#991b1b]' :
                    f.status === 'cancelado' ? 'bg-[#e5ecee] text-[#5e7a94]' :
                    'bg-[#fff7df] text-[#a16207]'
                  const statusLabel =
                    f.status === 'pago' ? 'Pago' :
                    f.status === 'vencido' ? 'Vencido' :
                    f.status === 'cancelado' ? 'Cancelado' :
                    'Em aberto'
                  return (
                    <div key={f.id} className="flex flex-wrap items-center gap-4 border-b border-[#edf1f2] p-5 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{f.descricao} · {f.aluno_nome}</p>
                        <p className="mt-1 text-xs text-[#8aa0ad]">
                          {f.status === 'pago' && f.pago_em ? `Pago em ${formatarData(f.pago_em)}` : `Vencimento ${formatarData(f.vencimento)}`}
                        </p>
                      </div>
                      <strong className="font-syne text-base">{formatarMoeda(f.valor_centavos)}</strong>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}>{statusLabel}</span>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          <section className="mt-10">
            <h3 className="mb-4 font-syne text-lg font-bold">Atalhos rápidos</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {atalhos.map(([label,Icon,href]) => (
                <Link href={href} key={label} className="flex items-center gap-3 rounded-xl border border-[#dbe5e8] bg-white p-4 text-sm font-semibold hover:border-[#0d9488]">
                  <span className="grid size-9 place-items-center rounded-lg bg-[#e6faf3] text-[#087f5b]"><Icon size={17}/></span>
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>

    {detalhes && (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={() => setDetalhes(null)} />
        <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
            <div>
              <p className="font-mono text-xs text-[#82939a]">{detalhes.protocolo}</p>
              <h2 className="mt-1 text-lg font-bold text-[#12232b]">{detalhes.aluno_nome}</h2>
            </div>
            <button onClick={() => setDetalhes(null)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]">
              <X className="size-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-6">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${(statusMap[detalhes.status] || statusMap.inscrito).style}`}>
                {(statusMap[detalhes.status] || statusMap.inscrito).label}
              </span>
            </div>

            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Dados da inscrição</h3>
              <dl className="space-y-2 rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4 text-sm">
                <div><dt className="text-xs text-[#82939a]">Aluno</dt><dd className="text-[#243942]">{detalhes.aluno_nome}</dd></div>
                <div><dt className="text-xs text-[#82939a]">Série pretendida</dt><dd className="text-[#243942]">{detalhes.aluno_serie || '—'}</dd></div>
                <div><dt className="text-xs text-[#82939a]">Turno</dt><dd className="text-[#243942]">{detalhes.aluno_turno || '—'}</dd></div>
                <div><dt className="text-xs text-[#82939a]">Enviada em</dt><dd className="text-[#243942]">{formatarData(detalhes.criado_em)}</dd></div>
                <div><dt className="text-xs text-[#82939a]">Última atualização</dt><dd className="text-[#243942]">{formatarData(detalhes.atualizado_em)}</dd></div>
              </dl>
            </section>

            <section className="mt-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Documentos enviados</h3>
              <div className="space-y-2">
                {nomesDocumentos.map(({ key, label }) => {
                  const doc = detalhes.documentos?.[key]
                  const temArquivo = doc && doc.url
                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        temArquivo ? 'border-[#0d9488]/30 bg-[#ccfbf1]/40' : 'border-[#e5ecee] bg-[#fafcfc]'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                          temArquivo ? 'bg-[#0d9488] text-white' : 'bg-[#e5ecee] text-[#82939a]'
                        }`}>
                          <FileText className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#243942]">{label}</p>
                          <p className="truncate text-xs text-[#82939a]">
                            {temArquivo ? doc.nome : 'Não enviado'}
                          </p>
                        </div>
                      </div>
                      {temArquivo && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 shrink-0 rounded-lg border border-[#0d9488] px-2.5 py-1.5 text-[11px] font-semibold text-[#0d9488] transition hover:bg-[#0d9488] hover:text-white"
                        >
                          <ExternalLink className="mr-1 inline size-3" />
                          Abrir
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </aside>
      </div>
    )}

    {comunicadoAberto && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => setComunicadoAberto(null)} />
        <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
          <header className="flex items-start justify-between border-b border-[#e5ecee] px-6 py-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${setorStyles[comunicadoAberto.setor] || 'bg-[#e6faf3] text-[#087f5b]'}`}>{comunicadoAberto.setor}</span>
                {comunicadoAberto.prioridade === 'alta' && <span className="rounded-full bg-[#fee2e2] px-2 py-1 text-[10px] font-bold text-[#991b1b]">Alta prioridade</span>}
              </div>
              <h2 className="mt-3 font-syne text-xl font-bold text-[#12232b]">{comunicadoAberto.titulo}</h2>
              <p className="mt-1 text-xs text-[#82939a]">Por {comunicadoAberto.autor_nome} · {formatarDataHora(comunicadoAberto.criado_em)}</p>
            </div>
            <button onClick={() => setComunicadoAberto(null)} className="ml-3 rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]">
              <X className="size-5" />
            </button>
          </header>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-[#243942]">{comunicadoAberto.mensagem}</p>
          </div>
        </div>
      </div>
    )}
  </div>
}