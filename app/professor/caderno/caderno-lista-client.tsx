'use client'

import Link from 'next/link'
import { BookOpen, ChevronRight, Users } from 'lucide-react'
import { SectionHeading, Panel } from '@/components/admin-shell'
import type { MinhaTurma } from './actions'

export function CadernoListaClient({ turmas }: { turmas: MinhaTurma[] }) {
  return (
    <main className="px-5 py-8 lg:px-8">
      <div className="mb-8">
        <SectionHeading
          eyebrow="Pedagógico"
          title="Meu Caderno de Notas"
          description="Selecione uma turma para lançar notas, avaliações e fechar o bimestre."
        />
      </div>

      {turmas.length === 0 ? (
        <div className="rounded-xl border border-[#dce5e8] bg-white p-12 text-center">
          <BookOpen className="mx-auto text-[#a0afb4]" size={32} />
          <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhuma turma vinculada</h3>
          <p className="mt-1 max-w-sm mx-auto text-sm text-[#82939a]">
            Você ainda não foi vinculado a nenhuma turma. Peça para a coordenação ou secretaria vincular o seu perfil.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {turmas.map((t) => (
            <Link 
              key={`${t.id}-${t.disciplina}`} 
              href={`/professor/caderno/${t.id}/${encodeURIComponent(t.disciplina)}`}
            >
              <Panel className="group p-5 transition hover:border-[var(--cor-primaria)] cursor-pointer h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="grid size-10 place-items-center rounded-lg bg-[#f0fdfa] text-[#0d9488]">
                      <Users size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-[#82939a] bg-[#f0f4f5] px-2 py-1 rounded-full uppercase">
                      {t.disciplina}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#12232b] text-lg group-hover:text-[var(--cor-primaria)] transition-colors">
                    {t.nome}
                  </h3>
                  <p className="text-sm text-[#82939a] mt-1">{t.serie} · {t.turno}</p>
                </div>

                <div className="mt-6 border-t border-[#e5ecee] pt-4 flex items-center justify-between text-xs font-semibold text-[var(--cor-primaria)]">
                  Abrir diário
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}