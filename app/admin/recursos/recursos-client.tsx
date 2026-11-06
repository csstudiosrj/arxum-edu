'use client'

import { useState } from 'react'
import { HeartPulse, PlayCircle, Video, Save, Check, Loader2 } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { salvarConfiguracaoRecursos } from './actions'

export function RecursosClient({ configInicial, seriesDisponiveis }: { configInicial: any, seriesDisponiveis: string[] }) {
  const [config, setConfig] = useState({
    saude: configInicial.saude || [],
    eduflix: configInicial.eduflix || [],
    sala_virtual: configInicial.sala_virtual || []
  })
  const [salvando, setSalvando] = useState(false)
  const [salvou, setSalvou] = useState(false)

  function toggle(modulo: 'saude' | 'eduflix' | 'sala_virtual', serie: string) {
    const atual = config[modulo]
    let novo
    if (atual.includes(serie)) {
      novo = atual.filter((s: string) => s !== serie)
    } else {
      novo = [...atual, serie]
    }
    setConfig({ ...config, [modulo]: novo })
  }

  async function handleSalvar() {
    setSalvando(true)
    setSalvou(false)
    const r = await salvarConfiguracaoRecursos(config)
    setSalvando(false)
    if (r.success) {
      setSalvou(true)
      setTimeout(() => setSalvou(false), 2500)
    } else {
      alert(r.error)
    }
  }

  const modulos = [
    { key: 'saude', label: 'Diário de Saúde', desc: 'Registro de febre, medicação e ocorrências médicas.', icon: HeartPulse },
    { key: 'eduflix', label: 'EduFlix', desc: 'Catálogo de videoaulas gravadas e lives.', icon: PlayCircle },
    { key: 'sala_virtual', label: 'Sala Virtual', desc: 'Módulos, aulas, conteúdos e atividades.', icon: Video },
  ] as const

  return (
    <AdminShell mode="school" active="Recursos">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Configurações"
            title="Recursos por Série"
            description="Escolha quais módulos estão disponíveis para cada série da escola."
          />
          <div className="flex items-center gap-2">
            {salvou && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#d1fae5] px-3 py-1.5 text-xs font-semibold text-[#065f46]">
                <Check className="size-3.5" /> Salvo
              </span>
            )}
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
            >
              {salvando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {salvando ? 'Salvando...' : 'Salvar configuração'}
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {seriesDisponiveis.length === 0 ? (
            <Panel className="p-8 text-center text-sm text-[#82939a]">
              Nenhum aluno ativo cadastrado para listar as séries.
            </Panel>
          ) : (
            modulos.map((mod) => (
              <Panel key={mod.key}>
                <div className="border-b border-[#e5ecee] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-lg bg-teal-50 text-teal-600">
                      <mod.icon className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#12232b]">{mod.label}</h2>
                      <p className="text-xs text-[#82939a]">{mod.desc}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {seriesDisponiveis.map(serie => {
                      const ativo = config[mod.key].includes(serie)
                      return (
                        <button
                          key={serie}
                          onClick={() => toggle(mod.key, serie)}
                          className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${ativo ? 'border-[var(--cor-primaria)] bg-[color-mix(in_srgb,var(--cor-primaria)_10%,white)]' : 'border-[#e5ecee] bg-white hover:border-[#b8c9ce]'}`}
                        >
                          <span className={`text-sm font-semibold ${ativo ? 'text-[var(--cor-primaria)]' : 'text-[#243942]'}`}>{serie}</span>
                          <div className={`flex size-5 items-center justify-center rounded-full border ${ativo ? 'border-[var(--cor-primaria)] bg-[var(--cor-primaria)] text-white' : 'border-[#dce5e8]'}`}>
                            {ativo && <Check className="size-3" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </Panel>
            ))
          )}
        </div>
      </main>
    </AdminShell>
  )
}