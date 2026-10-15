'use client'

import { useState } from 'react'
import { Search, Plus, Play, Eye, Clock, Users, TrendingUp, Video, Upload } from 'lucide-react'
import { AdminShell, SectionHeading, Panel, ActionButton } from '@/components/admin-shell'

const videos = [
  { titulo: 'Introdução às frações', serie: '9º Ano A', disciplina: 'Matemática', duracao: '18 min', views: 245, conclusao: 78, thumb: 'from-[#0d9488] to-[#0f766e]' },
  { titulo: 'Frações equivalentes', serie: '9º Ano A', disciplina: 'Matemática', duracao: '22 min', views: 218, conclusao: 65, thumb: 'from-[#0e7490] to-[#155e75]' },
  { titulo: 'Operações com frações', serie: '9º Ano A', disciplina: 'Matemática', duracao: '25 min', views: 192, conclusao: 48, thumb: 'from-[#155e75] to-[#164e63]' },
  { titulo: 'Análise sintática', serie: '1º Ano EM', disciplina: 'Português', duracao: '15 min', views: 178, conclusao: 82, thumb: 'from-[#7c3aed] to-[#5b21b6]' },
  { titulo: 'Figuras de linguagem', serie: '1º Ano EM', disciplina: 'Português', duracao: '20 min', views: 156, conclusao: 71, thumb: 'from-[#9333ea] to-[#6b21a8]' },
  { titulo: 'Leis de Newton', serie: '2º Ano EM', disciplina: 'Física', duracao: '28 min', views: 134, conclusao: 55, thumb: 'from-[#d97706] to-[#b45309]' },
  { titulo: 'Cinemática', serie: '2º Ano EM', disciplina: 'Física', duracao: '24 min', views: 121, conclusao: 62, thumb: 'from-[#ea580c] to-[#c2410c]' },
  { titulo: 'Revolução Francesa', serie: '3º Ano EM', disciplina: 'História', duracao: '32 min', views: 98, conclusao: 44, thumb: 'from-[#dc2626] to-[#991b1b]' },
]

const disciplinas = ['Todas', 'Matemática', 'Português', 'Física', 'História', 'Biologia', 'Química']

export default function EduflixAdminPage() {
  const [disciplina, setDisciplina] = useState('Todas')
  const [busca, setBusca] = useState('')

  const filtrados = videos.filter((v) => {
    const matchDisc = disciplina === 'Todas' || v.disciplina === disciplina
    const matchBusca = busca === '' || v.titulo.toLowerCase().includes(busca.toLowerCase())
    return matchDisc && matchBusca
  })

  return (
    <AdminShell mode="school" active="EduFlix">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Conteúdo"
            title="EduFlix"
            description="Gerencie as videoaulas disponíveis para os alunos."
          />
          <ActionButton variant="primary">
            <Upload className="mr-1.5 inline size-4" />
            Publicar videoaula
          </ActionButton>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Videoaulas publicadas', value: '48', icon: Video, color: '#0d9488' },
            { label: 'Total de visualizações', value: '3.240', icon: Eye, color: '#3b82f6' },
            { label: 'Conclusão média', value: '63%', icon: TrendingUp, color: '#065f46' },
            { label: 'Alunos assistindo', value: '187', icon: Users, color: '#d97706' },
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
                {disciplinas.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDisciplina(d)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      disciplina === d ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
                <Search className="size-4 text-[#9aaab0]" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar videoaula"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtrados.map((v) => (
              <div key={v.titulo} className="group overflow-hidden rounded-xl border border-[#e5ecee] bg-white transition hover:border-[#0d9488]">
                <div className={`relative flex aspect-video items-center justify-center bg-gradient-to-br ${v.thumb}`}>
                  <div className="grid size-12 place-items-center rounded-full bg-white/20 backdrop-blur transition group-hover:scale-110">
                    <Play className="size-5 fill-white text-white" />
                  </div>
                  <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {v.duracao}
                  </span>
                </div>
                <div className="p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0d9488]">{v.disciplina}</span>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-[#243942]">{v.titulo}</h3>
                  <p className="mt-1 text-xs text-[#82939a]">{v.serie}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#82939a]">
                    <span className="flex items-center gap-1"><Eye className="size-3.5" /> {v.views}</span>
                    <span className="flex items-center gap-1"><TrendingUp className="size-3.5" /> {v.conclusao}%</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#e5ecee]">
                    <div className="h-full rounded-full bg-[#0d9488]" style={{ width: `${v.conclusao}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </main>
    </AdminShell>
  )
}