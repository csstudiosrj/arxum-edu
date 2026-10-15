'use client'

import { useEffect, useState } from 'react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { createClient } from '@/lib/supabase/client'
import { Search, Eye, X, FileText, CheckCircle, XCircle, Clock, Calendar, User, Phone, ExternalLink } from 'lucide-react'

type Matricula = {
  id: string
  created_at: string
  aluno_nome: string
  aluno_nascimento: string
  serie: string
  turno: string
  escola_origem: string
  resp_nome: string
  resp_cpf: string
  resp_telefone: string
  resp_email: string
  resp_parentesco: string
  cep: string
  numero: string
  rua: string
  bairro: string
  cidade: string
  doc_rg_aluno: string
  doc_cpf_resp: string
  doc_residencia: string
  doc_historico: string
  alergias: string
  condicoes_medicas: string
  medicamentos: string
  plano_saude: string
  status: string
}

const statusColors: Record<string, string> = {
  'Inscrito': 'bg-slate-100 text-slate-700 border-slate-200',
  'Em análise': 'bg-blue-50 text-blue-700 border-blue-200',
  'Entrevista agendada': 'bg-purple-50 text-purple-700 border-purple-200',
  'Aprovado': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Não aprovado': 'bg-red-50 text-red-700 border-red-200',
  'Matriculado': 'bg-teal-50 text-teal-700 border-teal-200',
}

export default function MatriculasPage() {
  const [matriculas, setMatriculas] = useState<Matricula[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<Matricula | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchMatriculas()
  }, [])

  async function fetchMatriculas() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('matriculas')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setMatriculas(data)
    if (error) console.error('Erro ao buscar matrículas:', error)
    setIsLoading(false)
  }

  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from('matriculas')
      .update({ status: newStatus })
      .eq('id', id)
    
    if (!error) {
      setMatriculas(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m))
      if (selected?.id === id) {
        setSelected({ ...selected, status: newStatus })
      }
    } else {
      alert('Erro ao atualizar o status.')
    }
  }

  const filteredMatriculas = matriculas.filter(m => 
    m.aluno_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.resp_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminShell active="Matrículas">
      <div className="mx-auto max-w-6xl p-5 lg:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeading 
            title="Matrículas Recebidas" 
            description="Gerencie as inscrições, analise documentos e efetive matrículas." 
          />
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9aaab0]" />
            <input 
              type="text" 
              placeholder="Buscar aluno ou responsável..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#d5e0e3] bg-white pl-10 pr-4 text-sm text-[#243942] outline-none focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488]"
            />
          </div>
        </div>

        <Panel className="overflow-hidden">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-[#71838b]">Carregando matrículas...</div>
          ) : filteredMatriculas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-4 size-12 text-[#d5e0e3]" />
              <h3 className="text-lg font-semibold text-[#12232b]">Nenhuma matrícula encontrada</h3>
              <p className="mt-1 text-sm text-[#71838b]">As inscrições feitas pelo site aparecerão aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#dce5e8] bg-[#f9fafb] text-[#536871]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Aluno</th>
                    <th className="px-6 py-4 font-semibold">Série / Turno</th>
                    <th className="px-6 py-4 font-semibold">Data da Inscrição</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce5e8]">
                  {filteredMatriculas.map((m) => (
                    <tr key={m.id} className=" transition-colors hover:bg-[#f9fafb]">
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#12232b]">{m.aluno_nome}</div>
                        <div className="text-xs text-[#71838b]">Resp: {m.resp_nome}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[#243942]">{m.serie}</div>
                        <div className="text-xs text-[#71838b]">{m.turno}</div>
                      </td>
                      <td className="px-6 py-4 text-[#71838b]">
                        {new Date(m.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[m.status] || statusColors['Inscrito']}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelected(m)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-[#0d9488] shadow-sm ring-1 ring-inset ring-[#dce5e8] hover:bg-[#f9fafb]"
                        >
                          <Eye className="size-3.5" />
                          Analisar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* Modal de Detalhes da Matrícula */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#12232b]/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#dce5e8] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Análise de Matrícula</h2>
                <p className="text-sm text-[#71838b]">Inscrição realizada em {new Date(selected.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full p-2 text-[#71838b] hover:bg-[#f1f5f6]">
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-8 md:grid-cols-2">
                
                {/* Coluna 1: Dados */}
                <div className="space-y-6">
                  <section>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#12232b]"><User className="size-4 text-[#0d9488]" /> Dados do Aluno</h3>
                    <div className="rounded-xl border border-[#dce5e8] bg-[#f9fafb] p-4 text-sm">
                      <div className="grid grid-cols-2 gap-y-3">
                        <div><span className="block text-xs text-[#71838b]">Nome</span><span className="font-medium text-[#243942]">{selected.aluno_nome}</span></div>
                        <div><span className="block text-xs text-[#71838b]">Nascimento</span><span className="font-medium text-[#243942]">{selected.aluno_nascimento ? new Date(selected.aluno_nascimento).toLocaleDateString('pt-BR') : '-'}</span></div>
                        <div><span className="block text-xs text-[#71838b]">Série pretendida</span><span className="font-medium text-[#243942]">{selected.serie}</span></div>
                        <div><span className="block text-xs text-[#71838b]">Turno</span><span className="font-medium text-[#243942]">{selected.turno}</span></div>
                        <div className="col-span-2"><span className="block text-xs text-[#71838b]">Escola de origem</span><span className="font-medium text-[#243942]">{selected.escola_origem || 'Não informada'}</span></div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#12232b]"><Phone className="size-4 text-[#0d9488]" /> Responsável e Contato</h3>
                    <div className="rounded-xl border border-[#dce5e8] bg-[#f9fafb] p-4 text-sm">
                      <div className="grid grid-cols-2 gap-y-3">
                        <div className="col-span-2"><span className="block text-xs text-[#71838b]">Nome</span><span className="font-medium text-[#243942]">{selected.resp_nome} ({selected.resp_parentesco})</span></div>
                        <div><span className="block text-xs text-[#71838b]">CPF</span><span className="font-medium text-[#243942]">{selected.resp_cpf}</span></div>
                        <div><span className="block text-xs text-[#71838b]">Telefone</span><span className="font-medium text-[#243942]">{selected.resp_telefone}</span></div>
                        <div className="col-span-2"><span className="block text-xs text-[#71838b]">E-mail</span><span className="font-medium text-[#243942]">{selected.resp_email}</span></div>
                        <div className="col-span-2 mt-2 border-t border-[#dce5e8] pt-2"><span className="block text-xs text-[#71838b]">Endereço</span><span className="font-medium text-[#243942]">{selected.rua}, {selected.numero} - {selected.bairro}, {selected.cidade} ({selected.cep})</span></div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Coluna 2: Documentos e Anamnese */}
                <div className="space-y-6">
                  <section>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#12232b]"><FileText className="size-4 text-[#0d9488]" /> Documentos Anexados</h3>
                    <div className="flex flex-col gap-2">
                      {[
                        { label: 'RG do Aluno', url: selected.doc_rg_aluno },
                        { label: 'CPF do Responsável', url: selected.doc_cpf_resp },
                        { label: 'Comprovante de Residência', url: selected.doc_residencia },
                        { label: 'Histórico Escolar', url: selected.doc_historico },
                      ].map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg border border-[#dce5e8] p-3 text-sm">
                          <span className="font-medium text-[#243942]">{doc.label}</span>
                          {doc.url ? (
                            <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-[#0d9488] hover:underline">
                              Ver anexo <ExternalLink className="size-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-[#a0afb4]">Não enviado</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#12232b]"><CheckCircle className="size-4 text-[#0d9488]" /> Anamnese</h3>
                    <div className="rounded-xl border border-[#dce5e8] bg-[#f9fafb] p-4 text-sm">
                      <div className="space-y-3">
                        <div><span className="block text-xs text-[#71838b]">Alergias</span><span className="font-medium text-[#243942]">{selected.alergias || 'Nenhuma'}</span></div>
                        <div><span className="block text-xs text-[#71838b]">Condições Médicas</span><span className="font-medium text-[#243942]">{selected.condicoes_medicas || 'Nenhuma'}</span></div>
                        <div><span className="block text-xs text-[#71838b]">Medicamentos</span><span className="font-medium text-[#243942]">{selected.medicamentos || 'Nenhum'}</span></div>
                        <div><span className="block text-xs text-[#71838b]">Plano de Saúde</span><span className="font-medium text-[#243942]">{selected.plano_saude || 'Não possui'}</span></div>
                      </div>
                    </div>
                  </section>
                </div>

              </div>
            </div>

            {/* Modal Footer (Ações de Status) */}
            <div className="border-t border-[#dce5e8] bg-[#f9fafb] px-6 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#71838b]">Alterar Status da Matrícula</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => updateStatus(selected.id, 'Em análise')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${selected.status === 'Em análise' ? 'bg-blue-600 text-white' : 'bg-white border border-[#dce5e8] text-[#243942] hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'}`}>Em análise</button>
                <button onClick={() => updateStatus(selected.id, 'Entrevista agendada')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${selected.status === 'Entrevista agendada' ? 'bg-purple-600 text-white' : 'bg-white border border-[#dce5e8] text-[#243942] hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'}`}>Entrevista agendada</button>
                <button onClick={() => updateStatus(selected.id, 'Aprovado')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${selected.status === 'Aprovado' ? 'bg-emerald-600 text-white' : 'bg-white border border-[#dce5e8] text-[#243942] hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'}`}>Aprovado</button>
                <button onClick={() => updateStatus(selected.id, 'Não aprovado')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${selected.status === 'Não aprovado' ? 'bg-red-600 text-white' : 'bg-white border border-[#dce5e8] text-[#243942] hover:bg-red-50 hover:text-red-700 hover:border-red-200'}`}>Não aprovado</button>
                
                <div className="ml-auto border-l border-[#dce5e8] pl-2">
                  <button onClick={() => updateStatus(selected.id, 'Matriculado')} className={`rounded-lg px-6 py-2 text-sm font-semibold transition-colors ${selected.status === 'Matriculado' ? 'bg-teal-700 text-white' : 'bg-[#0d9488] text-white hover:bg-[#0f766e]'}`}>
                    Efetivar Matrícula
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </AdminShell>
  )
}