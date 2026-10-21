import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Video, FileText, HelpCircle, ArrowRight } from 'lucide-react'
import { getAlunoDoUsuario } from '@/lib/auth/aluno-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { getMinhasAulas } from '../actions'
import { AlunoShell } from '../aluno-shell'

export const dynamic = 'force-dynamic'

const icones: Record<string, typeof Video> = { video: Video, pdf: FileText, texto: FileText, quiz: HelpCircle }

export default async function AulasAlunoPage() {
  const aluno = await getAlunoDoUsuario()
  if (!aluno) redirect('/login')

  const [aulas, escola] = await Promise.all([
    getMinhasAulas(),
    getEscolaPorId(aluno.escola_id),
  ])

  const marca = escola ? marcaDaEscola(escola) : null

  const porModulo: Record<string, typeof aulas> = {}
  aulas.forEach((a) => {
    const chave = `${a.disciplina}::${a.modulo_titulo}`
    if (!porModulo[chave]) porModulo[chave] = []
    porModulo[chave].push(a)
  })

  return (
    <AlunoShell alunoNome={aluno.nome} alunoSerie={aluno.serie || 'Sem série'} escolaNome={aluno.escola_nome} escolaSlug={aluno.escola_slug} marca={marca}>
      <main className="px-5 py-8 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: 'var(--cor-primaria, #0d9488)' }}>Sala de aula virtual</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">Minhas aulas</h1>
          <p className="mt-2 text-sm text-[#71838b]">Estude no seu ritmo e acompanhe seu progresso.</p>
        </div>

        {aulas.length === 0 ? (
          <div className="rounded-xl border border-[#dce5e8] bg-white p-12 text-center"><p className="text-sm text-[#82939a]">Nenhuma aula publicada ainda.</p></div>
        ) : (
          <div className="space-y-6">
            {Object.entries(porModulo).map(([chave, lista]) => {
              const [disciplina, modulo] = chave.split('::')
              const concluidas = lista.filter((a) => a.concluida).length
              const pct = Math.round((concluidas / lista.length) * 100)
              return (
                <div key={chave} className="rounded-xl border border-[#dce5e8] bg-white">
                  <div className="border-b border-[#e5ecee] px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--cor-primaria, #0d9488)' }}>{disciplina}</p>
                    <h2 className="mt-1 text-base font-bold text-[#12232b]">{modulo}</h2>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f0f4f5]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: 'var(--cor-primaria, #0d9488)' }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#82939a]">{pct}%</span>
                    </div>
                  </div>
                  <div className="divide-y divide-[#f0f4f5]">
                    {lista.map((a) => {
                      const Icone = icones[a.tipo] || Video
                      return (
                        <Link
                          key={a.id}
                          href={`/aluno/aulas/${a.id}`}
                          className="group flex items-center gap-4 px-5 py-4 transition hover:bg-[#fafcfc]"
                        >
                          <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${a.concluida ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#f0f4f5] text-[#536871]'}`}>
                            <Icone className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold text-[#243942]">{a.titulo}</h3>
                            {a.descricao && <p className="mt-0.5 truncate text-xs text-[#82939a]">{a.descricao}</p>}
                            {a.duracao_minutos && <p className="mt-0.5 text-[11px] text-[#a0afb4]">{a.duracao_minutos} min</p>}
                          </div>
                          {a.concluida ? (
                            <span className="rounded-full bg-[#d1fae5] px-2.5 py-1 text-[10px] font-bold text-[#065f46]">Concluída</span>
                          ) : (
                            <span className="rounded-full bg-[#e5ecee] px-2.5 py-1 text-[10px] font-bold text-[#5e7a94]">A fazer</span>
                          )}
                          <ArrowRight
                            className="size-4 shrink-0 text-[#a0afb4] transition group-hover:text-[var(--cor-primaria,#0d9488)]"
                          />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </AlunoShell>
  )
}