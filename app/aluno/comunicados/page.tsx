import { redirect } from 'next/navigation'
import { getAlunoDoUsuario } from '@/lib/auth/aluno-atual'
import { getMeusComunicadosAluno } from '../actions'
import { AlunoShell } from '../aluno-shell'

export const dynamic = 'force-dynamic'

const setorStyles: Record<string, string> = {
  'Coordenação': 'bg-[#dbeafe] text-[#1e40af]',
  'Secretaria': 'bg-[#ccfbf1] text-[#0f766e]',
  'Financeiro': 'bg-[#fef3c7] text-[#92400e]',
  'Direção': 'bg-[#ede9fe] text-[#5b21b6]',
}

function formatarDataHora(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

export default async function ComunicadosAlunoPage() {
  const aluno = await getAlunoDoUsuario()
  if (!aluno) redirect('/login')

  const comunicados = await getMeusComunicadosAluno()

  return (
    <AlunoShell
      alunoNome={aluno.nome}
      alunoSerie={aluno.serie || 'Sem série'}
      escolaNome={aluno.escola_nome}
      escolaSlug={aluno.escola_slug}
    >
      <main className="px-5 py-8 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0d9488]">Comunicação</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">Comunicados</h1>
          <p className="mt-2 text-sm text-[#71838b]">Avisos e novidades da escola.</p>
        </div>

        {comunicados.length === 0 ? (
          <div className="rounded-xl border border-[#dce5e8] bg-white p-12 text-center">
            <p className="text-sm text-[#82939a]">Nenhum comunicado ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comunicados.map((c) => (
              <article
                key={c.id}
                className={`rounded-xl border bg-white p-5 ${!c.lido ? 'border-[#dc2626]/30' : 'border-[#dce5e8]'}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${setorStyles[c.setor] || 'bg-[#e6faf3] text-[#087f5b]'}`}>
                    {c.setor}
                  </span>
                  {c.prioridade === 'alta' && (
                    <span className="rounded-full bg-[#fee2e2] px-2.5 py-1 text-[10px] font-bold text-[#991b1b]">
                      Alta prioridade
                    </span>
                  )}
                  {!c.lido && (
                    <span className="rounded-full bg-[#dc2626] px-2.5 py-1 text-[10px] font-bold text-white">
                      Novo
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-base font-semibold text-[#243942]">{c.titulo}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#536871]">{c.mensagem}</p>
                <p className="mt-4 text-xs text-[#82939a]">
                  Por {c.autor_nome} · {formatarDataHora(c.criado_em)}
                </p>
              </article>
            ))}
          </div>
        )}
      </main>
    </AlunoShell>
  )
}