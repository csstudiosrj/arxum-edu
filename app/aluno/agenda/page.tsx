import { redirect } from 'next/navigation'
import { getAlunoDoUsuario } from '@/lib/auth/aluno-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { getMeusEventosAluno } from '../actions'
import { AlunoShell } from '../aluno-shell'

export const dynamic = 'force-dynamic'

const tipoEvento: Record<string, { cor: string; label: string }> = {
  prova: { cor: '#3b82f6', label: 'Prova' },
  reuniao: { cor: '#7c3aed', label: 'Reunião' },
  passeio: { cor: '#0d9488', label: 'Passeio' },
  feriado: { cor: '#d97706', label: 'Feriado' },
  evento: { cor: '#dc2626', label: 'Evento' },
  outro: { cor: '#6b7d86', label: 'Outro' },
}

function diaMes(iso: string): { dia: string; mes: string; diaSemana: string } {
  try {
    const d = new Date(iso + 'T12:00:00')
    return { dia: String(d.getDate()).padStart(2, '0'), mes: d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', ''), diaSemana: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '') }
  } catch { return { dia: '--', mes: '---', diaSemana: '' } }
}

export default async function AgendaAlunoPage() {
  const aluno = await getAlunoDoUsuario()
  if (!aluno) redirect('/login')

  const [eventos, escola] = await Promise.all([
    getMeusEventosAluno(),
    getEscolaPorId(aluno.escola_id),
  ])

  const marca = escola ? marcaDaEscola(escola) : null

  return (
    <AlunoShell alunoNome={aluno.nome} alunoSerie={aluno.serie || 'Sem série'} escolaNome={aluno.escola_nome} escolaSlug={aluno.escola_slug} marca={marca}>
      <main className="px-5 py-8 lg:px-8">
        <div className="mb-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#0d9488]">Calendário</p><h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">Minha agenda</h1><p className="mt-2 text-sm text-[#71838b]">Provas, trabalhos, eventos e reuniões da escola.</p></div>
        {eventos.length === 0 ? (
          <div className="rounded-xl border border-[#dce5e8] bg-white p-12 text-center"><p className="text-sm text-[#82939a]">Nenhum evento agendado.</p></div>
        ) : (
          <div className="space-y-3">
            {eventos.map((e) => {
              const info = tipoEvento[e.tipo] || tipoEvento.outro
              const dt = diaMes(e.data_evento)
              return (
                <article key={e.id} className="flex items-center gap-4 rounded-xl border border-[#dce5e8] bg-white p-4">
                  <div className="w-14 shrink-0 rounded-lg py-2 text-center" style={{ backgroundColor: `${info.cor}15` }}><span className="text-[10px] font-bold uppercase" style={{ color: info.cor }}>{dt.diaSemana}</span><strong className="block text-xl font-bold leading-tight" style={{ color: info.cor }}>{dt.dia}</strong><span className="text-[10px] font-bold" style={{ color: info.cor }}>{dt.mes}</span></div>
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${info.cor}15`, color: info.cor }}>{info.label}</span>{e.hora_evento && <span className="text-xs text-[#82939a]">{e.hora_evento}</span>}</div><h3 className="mt-1.5 text-sm font-semibold text-[#243942]">{e.titulo}</h3>{e.descricao && <p className="mt-1 text-xs leading-5 text-[#82939a]">{e.descricao}</p>}</div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </AlunoShell>
  )
}