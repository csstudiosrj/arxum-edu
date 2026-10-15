'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronRight, CircleDollarSign, FileText, Home, ImageIcon, LogOut, MessageSquare, MoreHorizontal, Search, Settings, ShieldCheck, WalletCards, Bell, BookOpen, ClipboardCheck, Users, X, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { ArxumBrand } from '@/components/arxum-brand'
import { createClient } from '@/lib/supabase/client'
import type { InscricaoResponsavel } from './actions'

const menu = [[Home,'Início'],[Users,'Meus filhos'],[FileText,'Matrículas'],[BookOpen,'Boletim'],[WalletCards,'Financeiro'],[MessageSquare,'Comunicação'],[CalendarDays,'Agenda'],[ImageIcon,'Fotos'],[ShieldCheck,'Autorizações'],[Settings,'Configurações']] as const

const statusMap: Record<string, { label: string; style: string; icon: typeof Clock }> = {
  inscrito: { label: 'Inscrito', style: 'bg-[#e5ecee] text-[#5e7a94]', icon: Clock },
  em_analise: { label: 'Em análise', style: 'bg-[#fef3c7] text-[#92400e]', icon: Clock },
  entrevista: { label: 'Entrevista agendada', style: 'bg-[#dbeafe] text-[#1e40af]', icon: CalendarDays },
  aprovado: { label: 'Aprovado', style: 'bg-[#ccfbf1] text-[#0f766e]', icon: CheckCircle2 },
  matriculado: { label: 'Matriculado', style: 'bg-[#d1fae5] text-[#065f46]', icon: CheckCircle2 },
  lista_espera: { label: 'Lista de espera', style: 'bg-[#fef3c7] text-[#92400e]', icon: Clock },
  nao_aprovado: { label: 'Não aprovado', style: 'bg-[#fee2e2] text-[#991b1b]', icon: AlertCircle },
  cancelado: { label: 'Cancelado', style: 'bg-[#e5ecee] text-[#5e7a94]', icon: X },
}

const eventos = [
  ['18','OUT','Prova de Matemática','Lucas · 9º Ano A',BookOpen],
  ['21','OUT','Reunião de pais','Auditório principal',Users],
  ['25','OUT','Passeio pedagógico','Sofia · 4º Ano B',CalendarDays],
  ['02','NOV','Feira de Ciências','Quadra da escola',CalendarDays],
]

const comunicados = [
  ['Secretaria','Rematrícula 2027: primeira chamada','Confira o calendário e os documentos necessários para garantir a vaga.','Hoje',true],
  ['Coordenação','Semana de avaliações','As avaliações do segundo bimestre começam na próxima segunda-feira.','Ontem',true],
  ['Financeiro','Boleto de outubro disponível','A fatura já está disponível para consulta e pagamento no portal.','12 out',false],
]

function Sidebar({ onLogout, saindo }: { onLogout: () => void; saindo: boolean }) {
  return <aside className="hidden w-64 shrink-0 border-r border-[#dbe5e8] bg-white lg:flex lg:flex-col">
    <div className="p-6"><ArxumBrand light/></div>
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
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}

export function ResponsavelClient({ inscricoes }: { inscricoes: InscricaoResponsavel[] }) {
  const router = useRouter()
  const [saindo, setSaindo] = useState(false)

  async function handleLogout() {
    setSaindo(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return <div className="min-h-screen bg-[#f7fafb] text-[#18313c]">
    <div className="flex min-h-screen">
      <Sidebar onLogout={handleLogout} saindo={saindo} />
      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-[#dbe5e8] bg-white px-5 py-4 md:px-8">
          <div>
            <p className="text-sm text-[#8aa0ad]">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <h1 className="font-syne text-xl font-bold text-[#18313c]">Olá, responsável</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden rounded-lg border border-[#dbe5e8] bg-[#f7fafb] p-2.5 text-[#617783] sm:block"><Search size={18}/></button>
            <button className="relative rounded-lg border border-[#dbe5e8] bg-[#f7fafb] p-2.5 text-[#617783]"><Bell size={18}/><span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#0d9488]"/></button>
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
                          <p className="text-[#8aa0ad]">Última atualização</p>
                          <p className="mt-0.5 font-semibold text-[#243942]">{formatarData(i.atualizado_em)}</p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <button className="rounded-lg bg-[#f1f8f6] px-2 py-2 text-center text-xs font-semibold text-[#087f5b]">Ver detalhes</button>
                        <button className="rounded-lg bg-[#f7fafb] px-2 py-2 text-center text-xs font-semibold text-[#617783]">Documentos</button>
                        <button className="rounded-lg bg-[#f7fafb] px-2 py-2 text-center text-xs font-semibold text-[#617783]">Comunicados</button>
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
              <div className="flex flex-col gap-3">
                {eventos.map(([day,month,title,desc,Icon]) => (
                  <article key={title as string} className="flex items-center gap-4 rounded-xl border border-[#dbe5e8] bg-white p-4">
                    <div className="w-12 shrink-0 rounded-lg bg-[#e6faf3] py-2 text-center">
                      <strong className="block font-syne text-lg text-[#087f5b]">{day as string}</strong>
                      <span className="text-[10px] font-bold text-[#087f5b]">{month as string}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold">{title as string}</h4>
                      <p className="mt-1 truncate text-xs text-[#8aa0ad]">{desc as string}</p>
                    </div>
                    <Icon className="text-[#0d9488]" size={19}/>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-4 font-syne text-lg font-bold">Últimos comunicados</h3>
              <div className="flex flex-col gap-3">
                {comunicados.map(([sector,title,preview,date,unread]) => (
                  <article key={title as string} className="rounded-xl border border-[#dbe5e8] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#e6faf3] px-2 py-1 text-[10px] font-bold text-[#087f5b]">{sector as string}</span>
                      <span className="text-xs text-[#8aa0ad]">{date as string}</span>
                    </div>
                    <h4 className="mt-3 text-sm font-semibold">
                      {unread as boolean && <span className="mr-2 inline-block size-2 rounded-full bg-[#0d9488]"/>}
                      {title as string}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8aa0ad]">{preview as string}</p>
                    <a href="#" className="mt-3 inline-block text-xs font-semibold text-[#087f5b]">Ler completo <ChevronRight className="inline" size={13}/></a>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-syne text-lg font-bold">Financeiro</h3>
              <a href="#" className="text-sm font-medium text-[#087f5b]">Ver todas as faturas</a>
            </div>
            <div className="rounded-xl border border-[#dbe5e8] bg-white">
              <div className="flex items-center gap-3 border-b border-[#edf1f2] p-5">
                <CircleDollarSign className="text-[#0d9488]"/>
                <div>
                  <h4 className="font-semibold">Próximas faturas</h4>
                  <p className="text-xs text-[#8aa0ad]">Acompanhe os pagamentos da sua família</p>
                </div>
              </div>
              {[['Mensalidade · Lucas Oliveira','Vencimento 10 nov','R$ 1.280,00','Em aberto'],['Mensalidade · Sofia Oliveira','Pago em 10 out','R$ 980,00','Pago']].map(([desc,date,value,status]) => (
                <div key={desc as string} className="flex flex-wrap items-center gap-4 border-b border-[#edf1f2] p-5 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{desc as string}</p>
                    <p className="mt-1 text-xs text-[#8aa0ad]">{date as string}</p>
                  </div>
                  <strong className="font-syne text-base">{value as string}</strong>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status==='Pago'?'bg-[#e6faf3] text-[#087f5b]':'bg-[#fff7df] text-[#a16207]'}`}>{status as string}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h3 className="mb-4 font-syne text-lg font-bold">Atalhos rápidos</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[['Solicitar matrícula',FileText,'/matricula'],['Enviar documento',ClipboardCheck,'#'],['Falar com a escola',MessageSquare,'#'],['Autorizar saída',ShieldCheck,'#']].map(([label,Icon,href]) => (
                <Link href={href as string} key={label as string} className="flex items-center gap-3 rounded-xl border border-[#dbe5e8] bg-white p-4 text-sm font-semibold hover:border-[#0d9488]">
                  <span className="grid size-9 place-items-center rounded-lg bg-[#e6faf3] text-[#087f5b]"><Icon size={17}/></span>
                  {label as string}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
}