'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronRight, ChevronDown, CircleDollarSign, FileText, Home, ImageIcon, LogOut, MessageSquare, Search, Settings, ShieldCheck, WalletCards, Bell, BookOpen, ClipboardCheck, Users, X, Clock, CheckCircle2, AlertCircle, ExternalLink, Calendar, Loader2, ShieldAlert, Award, Heart, FileQuestion, UserCheck, type LucideIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { ArxumBrand, ByArxum } from '@/components/arxum-brand'
import { createClient } from '@/lib/supabase/client'
import type { InscricaoResponsavel, DocumentosMatricula, ComunicadoResponsavel, FaturaResponsavel, EventoResponsavel, AutorizacaoResponsavel, BoletimAluno, AlbumResponsavel, OcorrenciaResponsavel, Filho } from './actions'
import { marcarComoLido, responderAutorizacao, marcarOcorrenciaLida } from './actions'
import type { MarcaEscola } from '@/lib/auth/marca'

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

const tipoAutorizacao: Record<string, { cor: string; label: string }> = {
  passeio: { cor: '#0d9488', label: 'Passeio' },
  saida_antecipada: { cor: '#3b82f6', label: 'Saída antecipada' },
  uso_imagem: { cor: '#7c3aed', label: 'Uso de imagem' },
  medicamento: { cor: '#d97706', label: 'Medicamento' },
  outro: { cor: '#6b7d86', label: 'Outro' },
}

const tipoOcorrencia: Record<string, { cor: string; label: string; icone: LucideIcon }> = {
  pedagogica: { cor: '#3b82f6', label: 'Pedagógica', icone: BookOpen },
  disciplinar: { cor: '#dc2626', label: 'Disciplinar', icone: ShieldAlert },
  saude: { cor: '#d97706', label: 'Saúde', icone: Heart },
  elogio: { cor: '#0d9488', label: 'Elogio', icone: Award },
  outro: { cor: '#6b7d86', label: 'Outro', icone: FileQuestion },
}

const gravidadeStyles: Record<string, string> = {
  baixa: 'bg-[#e5ecee] text-[#5e7a94]',
  media: 'bg-[#fef3c7] text-[#92400e]',
  alta: 'bg-[#fee2e2] text-[#991b1b]',
}

const gravidadeLabel: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
}

const periodosLabel: Record<string, string> = {
  '1_bimestre': '1º Bim', '2_bimestre': '2º Bim', '3_bimestre': '3º Bim', '4_bimestre': '4º Bim',
  '1_semestre': '1º Sem', '2_semestre': '2º Sem',
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

function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(' ')
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function Sidebar({ onLogout, saindo, marca }: { onLogout: () => void; saindo: boolean; marca: MarcaEscola | null }) {
  const temBranding = marca?.usaBranding && marca.logoUrl

  return <aside className="hidden w-64 shrink-0 border-r border-[#dbe5e8] bg-white lg:flex lg:flex-col">
    <div className="p-6">
      {temBranding ? (
        <div className="flex flex-col items-start gap-2">
          <img src={marca!.logoUrl!} alt={marca!.nome} className="h-10 w-auto max-w-[180px] object-contain" />
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#82939a]">{marca!.nome}</p>
        </div>
      ) : (
        <ArxumBrand light />
      )}
    </div>
    <div className="px-3">
      <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#8aa0ad]">Área do responsável</p>
      {menu.map(([Icon,label],i) => <Link key={label} href="#" className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${i===0?'bg-[#e6faf3] text-[#087f5b]':'text-[#617783] hover:bg-[#f4f7f8]'}`}><Icon size={18}/>{label}</Link>)}
    </div>
    <div className="mt-auto border-t border-[#dbe5e8] p-4">
      <button onClick={onLogout} disabled={saindo} className="flex w-full items-center gap-3 px-3 py-2 text-sm text-[#617783] disabled:opacity-50">
        <LogOut size={17}/>{saindo ? 'Saindo...' : 'Sair'}
      </button>
      <div className="mt-3 flex justify-center">
        <ByArxum light />
      </div>
    </div>
  </aside>
}

function formatarData(iso: string): string {
  try { return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR') } catch { return '—' }
}
function formatarDataHora(iso: string): string {
  try { const d = new Date(iso); return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) } catch { return '—' }
}
function formatarMoeda(centavos: number): string { return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function diaMes(iso: string): { dia: string; mes: string } {
  try {
    const d = new Date(iso + 'T12:00:00')
    return { dia: String(d.getDate()).padStart(2, '0'), mes: d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '') }
  } catch { return { dia: '--', mes: '---' } }
}
function corNota(nota: number | null): string {
  if (nota === null) return 'text-[#82939a]'
  if (nota >= 7) return 'text-[#065f46]'
  if (nota >= 5) return 'text-[#92400e]'
  return 'text-[#991b1b]'
}

export function ResponsavelClient({
  inscricoes, comunicados, faturas, eventos, autorizacoes, boletins, albuns, ocorrencias, filhos, marca,
}: {
  inscricoes: InscricaoResponsavel[]
  comunicados: ComunicadoResponsavel[]
  faturas: FaturaResponsavel[]
  eventos: EventoResponsavel[]
  autorizacoes: AutorizacaoResponsavel[]
  boletins: BoletimAluno[]
  albuns: AlbumResponsavel[]
  ocorrencias: OcorrenciaResponsavel[]
  filhos: Filho[]
  marca: MarcaEscola | null
}) {
  const router = useRouter()
  const [saindo, setSaindo] = useState(false)
  const [detalhes, setDetalhes] = useState<InscricaoResponsavel | null>(null)
  const [comunicadoAberto, setComunicadoAberto] = useState<ComunicadoResponsavel | null>(null)
  const [autorizacaoAberta, setAutorizacaoAberta] = useState<AutorizacaoResponsavel | null>(null)
  const [boletimAberto, setBoletimAberto] = useState<BoletimAluno | null>(null)
  const [albumAberto, setAlbumAberto] = useState<AlbumResponsavel | null>(null)
  const [fotoAberta, setFotoAberta] = useState<string | null>(null)
  const [ocorrenciaAberta, setOcorrenciaAberta] = useState<OcorrenciaResponsavel | null>(null)
  const [observacao, setObservacao] = useState('')
  const [enviandoResposta, setEnviandoResposta] = useState(false)
  const [filhoAtivo, setFilhoAtivo] = useState<Filho | null>(filhos[0] || null)
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [alunoResposta, setAlunoResposta] = useState<string>(filhos[0]?.nome || '')

  // Persiste o filho ativo em localStorage
  useEffect(() => {
    if (!filhos.length) return
    const salvo = typeof window !== 'undefined' ? localStorage.getItem('arxum_filho_ativo') : null
    if (salvo) {
      const encontrado = filhos.find((f) => f.id === salvo)
      if (encontrado) {
        setFilhoAtivo(encontrado)
        setAlunoResposta(encontrado.nome)
        return
      }
    }
    setFilhoAtivo(filhos[0])
    setAlunoResposta(filhos[0].nome)
  }, [filhos])

  function selecionarFilho(f: Filho) {
    setFilhoAtivo(f)
    setAlunoResposta(f.nome)
    setDropdownAberto(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('arxum_filho_ativo', f.id)
    }
  }

  async function handleLogout() {
    setSaindo(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function abrirComunicado(c: ComunicadoResponsavel) {
    setComunicadoAberto(c)
    if (!c.lido) await marcarComoLido(c.id)
  }

  function abrirAutorizacao(a: AutorizacaoResponsavel) {
    setAutorizacaoAberta(a)
    setObservacao(a.observacao || '')
    // Pré-seleciona o filho ativo
    setAlunoResposta(filhoAtivo?.nome || filhos[0]?.nome || '')
  }

  async function abrirOcorrencia(o: OcorrenciaResponsavel) {
    setOcorrenciaAberta(o)
    if (!o.lida) {
      await marcarOcorrenciaLida(o.id)
    }
  }

  async function handleResponder(resposta: 'autorizado' | 'recusado') {
    if (!autorizacaoAberta) return
    if (!alunoResposta) {
      alert('Selecione o aluno.')
      return
    }

    setEnviandoResposta(true)
    const result = await responderAutorizacao(autorizacaoAberta.id, alunoResposta, resposta, observacao)
    setEnviandoResposta(false)
    if (result.success) {
      setAutorizacaoAberta(null); setObservacao(''); router.refresh()
    } else { alert(result.error || 'Erro ao responder.') }
  }

  const naoLidos = comunicados.filter((c) => !c.lido).length
  const faturasEmAberto = faturas.filter((f) => f.status === 'em_aberto' || f.status === 'vencido')
  const autorizacoesPendentes = autorizacoes.filter((a) => !a.resposta)
  const ocorrenciasNaoLidas = ocorrencias.filter((o) => !o.lida)
  const temBranding = marca?.usaBranding && marca.logoUrl

  const estiloMarca = marca?.usaBranding
    ? ({ '--cor-primaria': marca.corPrimaria } as React.CSSProperties)
    : undefined

  return <div className="min-h-screen bg-[#f7fafb] text-[#18313c]" style={estiloMarca}>
    <div className="flex min-h-screen">
      <Sidebar onLogout={handleLogout} saindo={saindo} marca={marca} />
      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-[#dbe5e8] bg-white px-5 py-4 md:px-8">
          <div className="min-w-0">
            <p className="text-sm text-[#8aa0ad] capitalize">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <h1 className="font-syne text-xl font-bold text-[#18313c]">Olá, responsável</h1>
          </div>
          <div className="flex items-center gap-3">
            {filhos.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setDropdownAberto(!dropdownAberto)}
                  className="flex items-center gap-2 rounded-lg border border-[#dbe5e8] bg-[#f7fafb] px-3 py-2 transition hover:border-[#0d9488]"
                >
                  <div className="grid size-7 place-items-center rounded-full bg-[#0d9488] text-[10px] font-bold text-white">
                    {iniciaisDe(filhoAtivo?.nome || '')}
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Vendo por</p>
                    <p className="text-xs font-semibold text-[#243942]">{filhoAtivo?.nome || 'Selecionar'}</p>
                  </div>
                  <ChevronDown className="size-4 text-[#82939a]" />
                </button>

                {dropdownAberto && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setDropdownAberto(false)} />
                    <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-[#dbe5e8] bg-white p-2 shadow-xl">
                      <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Selecionar filho</p>
                      {filhos.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => selecionarFilho(f)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${filhoAtivo?.id === f.id ? 'bg-[#f0fbf8]' : 'hover:bg-[#f7fafb]'}`}
                        >
                          <div className="grid size-8 place-items-center rounded-full bg-[#0d9488] text-[10px] font-bold text-white">
                            {iniciaisDe(f.nome)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#243942]">{f.nome}</p>
                            <p className="truncate text-xs text-[#82939a]">{f.serie || '—'}{f.turno ? ` · ${f.turno}` : ''}</p>
                          </div>
                          {filhoAtivo?.id === f.id && <CheckCircle2 className="size-4 text-[#0d9488]" />}
                        </button>
                      ))}
                      <div className="mt-2 border-t border-[#edf1f2] pt-2">
                        <Link href="/matricula" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#0d9488] hover:bg-[#f0fbf8]">
                          <Users className="size-3.5" /> Adicionar outro filho
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <button className="hidden rounded-lg border border-[#dbe5e8] bg-[#f7fafb] p-2.5 text-[#617783] sm:block"><Search size={18}/></button>
            <button className="relative rounded-lg border border-[#dbe5e8] bg-[#f7fafb] p-2.5 text-[#617783]">
              <Bell size={18}/>
              {naoLidos > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-[#dc2626]"/>}
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[.15em] text-[#0d9488]">Visão geral</p>
            <h2 className="mt-1 font-syne text-3xl font-bold tracking-[-.04em]">Tudo em um só lugar</h2>
            {filhoAtivo && (
              <p className="mt-2 text-sm text-[#82939a]">
                Exibindo dados de <strong className="text-[#18313c]">{filhoAtivo.nome}</strong>. Use o seletor acima para trocar de filho.
              </p>
            )}
          </div>

          {filhos.length > 1 && (
            <section className="mb-8">
              <h3 className="mb-4 font-syne text-lg font-bold">Meus filhos</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filhos.map((f) => {
                  const ativo = filhoAtivo?.id === f.id
                  return (
                    <button
                      key={f.id}
                      onClick={() => selecionarFilho(f)}
                      className={`flex items-center gap-3 rounded-xl border-2 bg-white p-4 text-left transition ${
                        ativo ? 'border-[#0d9488] bg-[#f0fbf8]' : 'border-[#dbe5e8] hover:border-[#0d9488]/40'
                      }`}
                    >
                      <div className={`grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${ativo ? 'bg-[#0d9488]' : 'bg-[#173b4a]'}`}>
                        {iniciaisDe(f.nome)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#243942]">{f.nome}</p>
                        <p className="mt-0.5 truncate text-xs text-[#82939a]">{f.serie || '—'}{f.turno ? ` · ${f.turno}` : ''}</p>
                      </div>
                      {ativo && <CheckCircle2 className="size-5 shrink-0 text-[#0d9488]" />}
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {autorizacoesPendentes.length > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-syne text-lg font-bold">Autorizações pendentes</h3>
                <span className="rounded-full bg-[#dc2626] px-2.5 py-0.5 text-[10px] font-bold text-white">{autorizacoesPendentes.length}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {autorizacoesPendentes.map((a) => {
                  const info = tipoAutorizacao[a.tipo] || tipoAutorizacao.outro
                  return (
                    <article key={a.id} className="rounded-xl border-2 border-[#dc2626]/20 bg-white p-5">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${info.cor}15`, color: info.cor }}>{info.label}</span>
                      <h4 className="mt-2 font-syne text-base font-bold">{a.titulo}</h4>
                      {a.descricao && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#82939a]">{a.descricao}</p>}
                      {a.prazo_resposta && <p className="mt-2 text-xs font-semibold text-[#dc2626]">Responder até {formatarData(a.prazo_resposta)}</p>}
                      <button onClick={() => abrirAutorizacao(a)} className="mt-4 w-full rounded-lg bg-[#0d9488] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f766e]">Responder</button>
                    </article>
                  )
                })}
              </div>
            </section>
          )}

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-syne text-lg font-bold">Minhas matrículas</h3>
              <Link href="/matricula" className="text-sm font-medium text-[#087f5b]">Nova matrícula <ChevronRight className="inline" size={15}/></Link>
            </div>
            {inscricoes.length === 0 ? (
              <div className="rounded-xl border border-[#dbe5e8] bg-white p-10 text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#e6faf3] text-[#0d9488]"><FileText size={24}/></div>
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
                          <p className="mt-0.5 text-sm text-[#8aa0ad]">{i.aluno_serie || 'Série não definida'}{i.aluno_turno ? ` · ${i.aluno_turno}` : ''}</p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${st.style}`}><Icone size={12} />{st.label}</span>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#edf1f2] pt-4 text-xs">
                        <div><p className="text-[#8aa0ad]">Enviada em</p><p className="mt-0.5 font-semibold text-[#243942]">{formatarData(i.criado_em)}</p></div>
                        <div><p className="text-[#8aa0ad]">Documentos</p><p className="mt-0.5 font-semibold text-[#243942]">{docsEnviados} de 4 enviados</p></div>
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

          {boletins.length > 0 && (
            <section className="mt-10">
              <h3 className="mb-4 font-syne text-lg font-bold">Boletim escolar</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {boletins.map((b) => (
                  <article key={b.aluno_nome} className="rounded-xl border border-[#dbe5e8] bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-syne text-lg font-bold">{b.aluno_nome}</h4>
                        <p className="mt-0.5 text-sm text-[#8aa0ad]">{b.notas.length} avaliações lançadas</p>
                      </div>
                      {b.media !== null && (
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa0ad]">Média</p>
                          <p className={`font-syne text-2xl font-bold ${corNota(b.media)}`}>{b.media.toFixed(1)}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#edf1f2] pt-4 text-xs">
                      <div><p className="text-[#8aa0ad]">Disciplinas avaliadas</p><p className="mt-0.5 font-semibold text-[#243942]">{new Set(b.notas.map((n) => n.disciplina)).size}</p></div>
                      <div><p className="text-[#8aa0ad]">Total de faltas</p><p className={`mt-0.5 font-semibold ${b.total_faltas > 10 ? 'text-[#991b1b]' : 'text-[#243942]'}`}>{b.total_faltas}</p></div>
                    </div>
                    <button onClick={() => setBoletimAberto(b)} className="mt-4 w-full rounded-lg bg-[#0d9488] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f766e]">Ver boletim completo</button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {ocorrencias.length > 0 && (
            <section className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-syne text-lg font-bold">Ocorrências</h3>
                {ocorrenciasNaoLidas.length > 0 && <span className="rounded-full bg-[#dc2626] px-2 py-0.5 text-[10px] font-bold text-white">{ocorrenciasNaoLidas.length} novas</span>}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {ocorrencias.slice(0, 6).map((o) => {
                  const info = tipoOcorrencia[o.tipo] || tipoOcorrencia.outro
                  const Icone = info.icone
                  return (
                    <button key={o.id} onClick={() => abrirOcorrencia(o)} className={`flex items-start gap-3 rounded-xl border bg-white p-4 text-left transition hover:border-[#0d9488] ${!o.lida ? 'border-[#dc2626]/30' : 'border-[#dbe5e8]'}`}>
                      <div className="grid size-10 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${info.cor}15`, color: info.cor }}><Icone className="size-5" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${info.cor}15`, color: info.cor }}>{info.label}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${gravidadeStyles[o.gravidade]}`}>{gravidadeLabel[o.gravidade]}</span>
                          {!o.lida && <span className="rounded-full bg-[#dc2626] px-2 py-0.5 text-[10px] font-bold text-white">Nova</span>}
                        </div>
                        <h4 className="mt-2 text-sm font-semibold text-[#243942]">{o.titulo}</h4>
                        <p className="mt-0.5 truncate text-xs text-[#82939a]">{o.aluno_nome} · {formatarData(o.criado_em)}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          <div className="mt-10 grid gap-8 xl:grid-cols-[1.15fr_.85fr]">
            <section>
              <h3 className="mb-4 font-syne text-lg font-bold">Próximos eventos</h3>
              {eventos.length === 0 ? (
                <div className="rounded-xl border border-[#dbe5e8] bg-white p-8 text-center"><Calendar className="mx-auto text-[#a0afb4]" size={28}/><p className="mt-3 text-sm text-[#8aa0ad]">Nenhum evento agendado pela escola.</p></div>
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
                          <p className="mt-1 truncate text-xs text-[#8aa0ad]">{e.hora_evento ? `${e.hora_evento} · ` : ''}{info.label}{e.descricao ? ` · ${e.descricao}` : ''}</p>
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
                <div className="rounded-xl border border-[#dbe5e8] bg-white p-8 text-center"><MessageSquare className="mx-auto text-[#a0afb4]" size={28}/><p className="mt-3 text-sm text-[#8aa0ad]">Nenhum comunicado recebido ainda.</p></div>
              ) : (
                <div className="flex flex-col gap-3">
                  {comunicados.slice(0, 5).map((c) => (
                    <button key={c.id} onClick={() => abrirComunicado(c)} className="rounded-xl border border-[#dbe5e8] bg-white p-4 text-left transition hover:border-[#0d9488]">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${setorStyles[c.setor] || 'bg-[#e6faf3] text-[#087f5b]'}`}>{c.setor}</span>
                        <span className="text-xs text-[#8aa0ad]">{formatarData(c.criado_em)}</span>
                      </div>
                      <h4 className="mt-3 text-sm font-semibold">{!c.lido && <span className="mr-2 inline-block size-2 rounded-full bg-[#dc2626]"/>}{c.titulo}</h4>
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
                <div><h4 className="font-semibold">Minhas faturas</h4><p className="text-xs text-[#8aa0ad]">Acompanhe os pagamentos da sua família</p></div>
              </div>
              {faturas.length === 0 ? (
                <div className="p-8 text-center"><p className="text-sm text-[#8aa0ad]">Nenhuma fatura emitida até o momento.</p></div>
              ) : (
                faturas.slice(0, 5).map((f) => {
                  const statusStyle = f.status === 'pago' ? 'bg-[#e6faf3] text-[#087f5b]' : f.status === 'vencido' ? 'bg-[#fee2e2] text-[#991b1b]' : f.status === 'cancelado' ? 'bg-[#e5ecee] text-[#5e7a94]' : 'bg-[#fff7df] text-[#a16207]'
                  const statusLabel = f.status === 'pago' ? 'Pago' : f.status === 'vencido' ? 'Vencido' : f.status === 'cancelado' ? 'Cancelado' : 'Em aberto'
                  return (
                    <div key={f.id} className="flex flex-wrap items-center gap-4 border-b border-[#edf1f2] p-5 last:border-0">
                      <div className="flex-1"><p className="text-sm font-semibold">{f.descricao} · {f.aluno_nome}</p><p className="mt-1 text-xs text-[#8aa0ad]">{f.status === 'pago' && f.pago_em ? `Pago em ${formatarData(f.pago_em)}` : `Vencimento ${formatarData(f.vencimento)}`}</p></div>
                      <strong className="font-syne text-base">{formatarMoeda(f.valor_centavos)}</strong>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}>{statusLabel}</span>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          {albuns.length > 0 && (
            <section className="mt-10">
              <h3 className="mb-4 font-syne text-lg font-bold">Galeria de fotos</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {albuns.map((a) => (
                  <button key={a.id} onClick={() => setAlbumAberto(a)} className="group overflow-hidden rounded-xl border border-[#dbe5e8] bg-white text-left transition hover:border-[#0d9488]">
                    <div className="relative aspect-video bg-[#f0f4f5]">
                      {a.capa_url ? (<img src={a.capa_url} alt={a.titulo} className="h-full w-full object-cover transition group-hover:scale-105" />) : (<div className="flex h-full items-center justify-center"><ImageIcon className="size-10 text-[#a0afb4]" /></div>)}
                      <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">{a.fotos.length} {a.fotos.length === 1 ? 'foto' : 'fotos'}</span>
                    </div>
                    <div className="p-4">
                      <h4 className="text-sm font-semibold text-[#243942]">{a.titulo}</h4>
                      {a.descricao && <p className="mt-1 line-clamp-2 text-xs text-[#82939a]">{a.descricao}</p>}
                      <p className="mt-2 text-xs text-[#82939a]">{formatarData(a.criado_em)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

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

    {/* Modais - mantidos iguais, com ajuste apenas no de autorização */}
    {ocorrenciaAberta && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => setOcorrenciaAberta(null)} />
        <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
          <header className="flex items-start justify-between border-b border-[#e5ecee] px-6 py-4">
            <div>
              {(() => {
                const info = tipoOcorrencia[ocorrenciaAberta.tipo] || tipoOcorrencia.outro
                const Icone = info.icone
                return (
                  <div className="flex items-center gap-2">
                    <div className="grid size-8 place-items-center rounded-lg" style={{ backgroundColor: `${info.cor}15`, color: info.cor }}><Icone className="size-4" /></div>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${info.cor}15`, color: info.cor }}>{info.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${gravidadeStyles[ocorrenciaAberta.gravidade]}`}>{gravidadeLabel[ocorrenciaAberta.gravidade]}</span>
                  </div>
                )
              })()}
              <h2 className="mt-3 font-syne text-xl font-bold text-[#12232b]">{ocorrenciaAberta.titulo}</h2>
              <p className="mt-1 text-xs text-[#82939a]">{ocorrenciaAberta.aluno_nome} · {formatarDataHora(ocorrenciaAberta.criado_em)}</p>
            </div>
            <button onClick={() => setOcorrenciaAberta(null)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div><p className="text-xs font-bold uppercase tracking-wider text-[#82939a]">Descrição</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#243942]">{ocorrenciaAberta.descricao}</p></div>
            {ocorrenciaAberta.providencias && (<div className="mt-5 rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4"><p className="text-xs font-bold uppercase tracking-wider text-[#82939a]">Providências</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#243942]">{ocorrenciaAberta.providencias}</p></div>)}
            <p className="mt-4 text-xs text-[#a0afb4]">Registrado por {ocorrenciaAberta.autor_nome}</p>
          </div>
        </div>
      </div>
    )}

    {albumAberto && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => setAlbumAberto(null)} />
        <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl">
          <header className="flex items-start justify-between border-b border-[#e5ecee] px-6 py-4">
            <div><h2 className="font-syne text-xl font-bold text-[#12232b]">{albumAberto.titulo}</h2>{albumAberto.descricao && <p className="mt-1 text-sm text-[#82939a]">{albumAberto.descricao}</p>}<p className="mt-1 text-xs text-[#82939a]">{albumAberto.fotos.length} fotos · {formatarData(albumAberto.criado_em)}</p></div>
            <button onClick={() => setAlbumAberto(null)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {albumAberto.fotos.map((f) => (
                <button key={f.id} onClick={() => setFotoAberta(f.url)} className="group aspect-square overflow-hidden rounded-lg border border-[#e5ecee]"><img src={f.url} alt={f.legenda || ''} className="h-full w-full object-cover transition group-hover:scale-105" /></button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}

    {fotoAberta && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4" onClick={() => setFotoAberta(null)}>
        <button onClick={() => setFotoAberta(null)} className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"><X className="size-6" /></button>
        <img src={fotoAberta} alt="" className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
      </div>
    )}

    {boletimAberto && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => setBoletimAberto(null)} />
        <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl">
          <header className="flex items-start justify-between border-b border-[#e5ecee] px-6 py-4">
            <div><p className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Boletim escolar</p><h2 className="mt-1 font-syne text-xl font-bold text-[#12232b]">{boletimAberto.aluno_nome}</h2></div>
            <button onClick={() => setBoletimAberto(null)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-5 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Média geral</p><p className={`mt-1 font-syne text-2xl font-bold ${corNota(boletimAberto.media)}`}>{boletimAberto.media !== null ? boletimAberto.media.toFixed(1) : '—'}</p></div>
              <div className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Avaliações</p><p className="mt-1 font-syne text-2xl font-bold text-[#243942]">{boletimAberto.notas.length}</p></div>
              <div className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Faltas</p><p className={`mt-1 font-syne text-2xl font-bold ${boletimAberto.total_faltas > 10 ? 'text-[#991b1b]' : 'text-[#243942]'}`}>{boletimAberto.total_faltas}</p></div>
            </div>
            <div className="overflow-hidden rounded-lg border border-[#e5ecee]">
              <table className="w-full">
                <thead className="bg-[#fafcfc]"><tr className="border-b border-[#e5ecee]"><th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Disciplina</th><th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Período</th><th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Nota</th><th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Faltas</th></tr></thead>
                <tbody>{boletimAberto.notas.map((n, i) => (<tr key={i} className="border-b border-[#f0f4f5] last:border-0"><td className="px-4 py-2.5 text-sm text-[#243942]">{n.disciplina}</td><td className="px-4 py-2.5 text-xs text-[#82939a]">{periodosLabel[n.periodo] || n.periodo}</td><td className={`px-4 py-2.5 text-center font-syne text-base font-bold ${corNota(n.nota)}`}>{n.nota !== null ? n.nota.toFixed(1) : '—'}</td><td className="px-4 py-2.5 text-center text-sm text-[#243942]">{n.faltas}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )}

    {detalhes && (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={() => setDetalhes(null)} />
        <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
            <div><p className="font-mono text-xs text-[#82939a]">{detalhes.protocolo}</p><h2 className="mt-1 text-lg font-bold text-[#12232b]">{detalhes.aluno_nome}</h2></div>
            <button onClick={() => setDetalhes(null)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-6"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${(statusMap[detalhes.status] || statusMap.inscrito).style}`}>{(statusMap[detalhes.status] || statusMap.inscrito).label}</span></div>
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Dados da inscrição</h3>
              <dl className="space-y-2 rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4 text-sm">
                <div><dt className="text-xs text-[#82939a]">Aluno</dt><dd className="text-[#243942]">{detalhes.aluno_nome}</dd></div>
                <div><dt className="text-xs text-[#82939a]">Série pretendida</dt><dd className="text-[#243942]">{detalhes.aluno_serie || '—'}</dd></div>
                <div><dt className="text-xs text-[#82939a]">Turno</dt><dd className="text-[#243942]">{detalhes.aluno_turno || '—'}</dd></div>
                <div><dt className="text-xs text-[#82939a]">Enviada em</dt><dd className="text-[#243942]">{formatarData(detalhes.criado_em)}</dd></div>
              </dl>
            </section>
            <section className="mt-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Documentos enviados</h3>
              <div className="space-y-2">
                {nomesDocumentos.map(({ key, label }) => {
                  const doc = detalhes.documentos?.[key]
                  const temArquivo = doc && doc.url
                  return (
                    <div key={key} className={`flex items-center justify-between rounded-lg border p-3 ${temArquivo ? 'border-[#0d9488]/30 bg-[#ccfbf1]/40' : 'border-[#e5ecee] bg-[#fafcfc]'}`}>
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${temArquivo ? 'bg-[#0d9488] text-white' : 'bg-[#e5ecee] text-[#82939a]'}`}><FileText className="size-4" /></div>
                        <div className="min-w-0"><p className="truncate text-xs font-semibold text-[#243942]">{label}</p><p className="truncate text-xs text-[#82939a]">{temArquivo ? doc.nome : 'Não enviado'}</p></div>
                      </div>
                      {temArquivo && <a href={doc.url} target="_blank" rel="noopener noreferrer" className="ml-2 shrink-0 rounded-lg border border-[#0d9488] px-2.5 py-1.5 text-[11px] font-semibold text-[#0d9488] transition hover:bg-[#0d9488] hover:text-white"><ExternalLink className="mr-1 inline size-3" />Abrir</a>}
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
            <button onClick={() => setComunicadoAberto(null)} className="ml-3 rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
          </header>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-5"><p className="whitespace-pre-wrap text-sm leading-7 text-[#243942]">{comunicadoAberto.mensagem}</p></div>
        </div>
      </div>
    )}

    {autorizacaoAberta && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => !enviandoResposta && setAutorizacaoAberta(null)} />
        <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
          <header className="flex items-start justify-between border-b border-[#e5ecee] px-6 py-4">
            <div className="flex-1">
              {(() => { const info = tipoAutorizacao[autorizacaoAberta.tipo] || tipoAutorizacao.outro; return <span className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: `${info.cor}15`, color: info.cor }}>{info.label}</span> })()}
              <h2 className="mt-3 font-syne text-xl font-bold text-[#12232b]">{autorizacaoAberta.titulo}</h2>
              {autorizacaoAberta.prazo_resposta && <p className="mt-1 text-xs text-[#dc2626]">Responder até {formatarData(autorizacaoAberta.prazo_resposta)}</p>}
            </div>
            <button onClick={() => setAutorizacaoAberta(null)} disabled={enviandoResposta} className="ml-3 rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
          </header>
          <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-[#243942]">{autorizacaoAberta.descricao}</p>

            {/* Seletor de aluno quando há mais de um filho */}
            {filhos.length > 1 && (
              <div className="mt-5 rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4">
                <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#536871]">
                  <UserCheck className="size-3.5" /> Aluno desta autorização
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {filhos.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setAlunoResposta(f.nome)}
                      className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition ${
                        alunoResposta === f.nome ? 'border-[#0d9488] bg-[#ccfbf1]' : 'border-[#d5e0e3] bg-white hover:border-[#0d9488]'
                      }`}
                    >
                      <div className={`grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white ${alunoResposta === f.nome ? 'bg-[#0d9488]' : 'bg-[#173b4a]'}`}>
                        {iniciaisDe(f.nome)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-[#243942]">{f.nome}</p>
                        <p className="truncate text-[10px] text-[#82939a]">{f.serie || '—'}</p>
                      </div>
                      {alunoResposta === f.nome && <CheckCircle2 className="size-4 shrink-0 text-[#0d9488]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filhos.length === 1 && (
              <div className="mt-5 rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-3">
                <p className="text-xs text-[#82939a]">Esta resposta será registrada para <strong className="text-[#243942]">{filhos[0].nome}</strong>.</p>
              </div>
            )}

            <div className="mt-5">
              <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Observação (opcional)</label>
              <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex: Meu filho não poderá participar..." rows={3} className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
            </div>
          </div>
          <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
            <button onClick={() => handleResponder('recusado')} disabled={enviandoResposta} className="inline-flex items-center gap-2 rounded-lg border border-[#dc2626] bg-white px-4 py-2 text-sm font-semibold text-[#dc2626] hover:bg-[#fee2e2] disabled:opacity-50">{enviandoResposta ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}Recusar</button>
            <button onClick={() => handleResponder('autorizado')} disabled={enviandoResposta} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">{enviandoResposta ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}Autorizar</button>
          </footer>
        </div>
      </div>
    )}
  </div>
}