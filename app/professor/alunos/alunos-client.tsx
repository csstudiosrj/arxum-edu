'use client'

import { useState } from 'react'
import { AlertCircle, Heart, FileText, Loader2, Plus, X, Activity, HeartPulse } from 'lucide-react'
import { criarOcorrenciaProfessor, getOcorrenciasSaudeAluno } from '../actions'

export function AlunosClient({ alunos, configRecursos }: { alunos: any[], configRecursos: any }) {
  const [alunoSelecionado, setAlunoSelecionado] = useState<any | null>(null)
  const [ocorrencias, setOcorrencias] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)
  
  const [modalNovaOcorrencia, setModalNovaOcorrencia] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [providencias, setProvidencias] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const seriesComSaude = configRecursos?.saude || []

  async function abrirAluno(aluno: any) {
    setAlunoSelecionado(aluno)
    setCarregando(true)
    setOcorrencias([])
    
    // Só busca ocorrências se a série do aluno estiver liberada
    if (seriesComSaude.includes(aluno.serie)) {
      const oc = await getOcorrenciasSaudeAluno(aluno.id)
      setOcorrencias(oc)
    }
    
    setCarregando(false)
  }

  async function handleSalvarOcorrencia(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim() || !descricao.trim()) return setErro('Preencha título e descrição.')
    
    setSalvando(true)
    setErro('')
    
    const r = await criarOcorrenciaProfessor({
      aluno_id: alunoSelecionado.id,
      tipo: 'saude',
      gravidade: 'media',
      titulo,
      descricao,
      providencias
    })

    setSalvando(false)

    if (r.success) {
      setModalNovaOcorrencia(false)
      setTitulo(''); setDescricao(''); setProvidencias('')
      const oc = await getOcorrenciasSaudeAluno(alunoSelecionado.id)
      setOcorrencias(oc)
    } else {
      setErro(r.error || 'Erro ao salvar.')
    }
  }

  return (
    <main className="px-5 py-8 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0d9488]">Equipe</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">Alunos</h1>
        <p className="mt-2 text-sm text-[#71838b]">Todos os alunos ativos da escola.</p>
      </div>

      {alunos.length === 0 ? (
        <div className="rounded-xl border border-[#dce5e8] bg-white p-12 text-center">
          <p className="text-sm text-[#82939a]">Nenhum aluno cadastrado.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alunos.map((a) => {
            const temAlergia = !!a.anamnese_alergias?.trim()
            return (
              <div 
                key={a.id} 
                onClick={() => abrirAluno(a)}
                className="group relative flex cursor-pointer items-center gap-3 rounded-xl border border-[#dce5e8] bg-white p-4 transition hover:border-[#0d9488] hover:shadow-sm"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#ccfbf1] text-xs font-bold text-[#0f766e]">
                  {a.nome.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#243942]">{a.nome}</p>
                  <p className="mt-0.5 truncate text-xs text-[#82939a]">
                    {a.serie || '—'}{a.turno ? ` · ${a.turno}` : ''}
                  </p>
                </div>
                {temAlergia && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    <AlertCircle className="size-3" /> Alergia
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {alunoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e5ecee] bg-[#fafcfc] px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">{alunoSelecionado.nome}</h2>
                <p className="text-xs text-[#82939a]">{alunoSelecionado.serie} · {alunoSelecionado.turno}</p>
              </div>
              <button onClick={() => setAlunoSelecionado(null)} className="rounded-full p-2 text-[#6b7d86] hover:bg-[#f1f5f6]">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <section className="mb-8">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0d9488]">
                  <Heart className="size-4" /> Ficha de Saúde (Anamnese)
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-3">
                    <p className="text-[10px] font-bold uppercase text-[#82939a]">Alergias</p>
                    <p className="mt-1 text-sm text-[#243942]">{alunoSelecionado.anamnese_alergias || 'Nenhuma registrada'}</p>
                  </div>
                  <div className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-3">
                    <p className="text-[10px] font-bold uppercase text-[#82939a]">Medicamentos</p>
                    <p className="mt-1 text-sm text-[#243942]">{alunoSelecionado.anamnese_medicamentos || 'Nenhum'}</p>
                  </div>
                  <div className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-3 sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase text-[#82939a]">Plano de Saúde</p>
                    <p className="mt-1 text-sm text-[#243942]">{alunoSelecionado.anamnese_plano_saude || 'Não informado'}</p>
                  </div>
                </div>
              </section>

              {seriesComSaude.includes(alunoSelecionado.serie) ? (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0d9488]">
                      <Activity className="size-4" /> Diário de Saúde
                    </h3>
                    <button
                      onClick={() => setModalNovaOcorrencia(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d9488] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-90"
                    >
                      <Plus className="size-3.5" /> Novo Registro
                    </button>
                  </div>

                  {carregando ? (
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin text-[#0d9488]" /></div>
                  ) : ocorrencias.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-[#dce5e8] bg-[#fafcfc] p-6 text-center text-xs text-[#82939a]">
                      Nenhuma ocorrência de saúde registrada.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {ocorrencias.map((oc) => (
                        <div key={oc.id} className="rounded-lg border border-[#e5ecee] bg-white p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-bold text-[#12232b]">{oc.titulo}</p>
                              <p className="mt-0.5 text-xs text-[#82939a]">{new Date(oc.criado_em).toLocaleString('pt-BR')} · por {oc.autor_nome}</p>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-[#243942]">{oc.descricao}</p>
                          {oc.providencias && (
                            <div className="mt-2 rounded bg-[#f0fdfa] p-2 text-xs text-[#0f766e]">
                              <strong>Providências:</strong> {oc.providencias}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ) : (
                <div className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4 flex items-center gap-3 text-[#82939a]">
                  <HeartPulse className="size-5 shrink-0" />
                  <p className="text-xs">O Diário de Saúde não está habilitado para a série <strong>{alunoSelecionado.serie}</strong>.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modalNovaOcorrencia && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e5ecee] bg-[#fafcfc] px-5 py-4">
              <h3 className="font-bold text-[#12232b]">Registrar Ocorrência de Saúde</h3>
              <button onClick={() => setModalNovaOcorrencia(false)} className="text-[#82939a] hover:text-[#12232b]">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSalvarOcorrencia} className="p-5 space-y-4">
              {erro && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{erro}</p>}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#536871]">Título / Motivo</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Febre, Queda no pátio, Dor de cabeça..."
                  className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#536871]">Descrição / Sintomas</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  placeholder="Descreva o que aconteceu..."
                  className="w-full resize-none rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#536871]">Providências (opcional)</label>
                <textarea
                  value={providencias}
                  onChange={(e) => setProvidencias(e.target.value)}
                  rows={2}
                  placeholder="Ex: Administrado antitérmico, pais contactados..."
                  className="w-full resize-none rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovaOcorrencia(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-[#6b7d86] hover:bg-[#f1f5f6]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-50"
                >
                  {salvando ? <Loader2 className="size-4 animate-spin" /> : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}