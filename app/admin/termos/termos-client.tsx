'use client'

import { useState } from 'react'
import { FileSignature, Plus, Trash2, CheckCircle2, Clock, X, Loader2, Search, ShieldCheck } from 'lucide-react'
import { Editor } from 'react-simple-wysiwyg'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { criarTermo, excluirTermo, Termo } from './actions'

export function TermosClient({ termosIniciais, alunos }: { termosIniciais: Termo[], alunos: any[] }) {
  const [termos, setTermos] = useState(termosIniciais)
  const [modalAberto, setModalAberto] = useState(false)
  const [alunoSelecionado, setAlunoSelecionado] = useState('')
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('<p>Escreva o contrato ou termo aqui...</p>')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  
  const [termoAuditoria, setTermoAuditoria] = useState<Termo | null>(null)

  async function handleCriarTermo(e: React.FormEvent) {
    e.preventDefault()
    if (!alunoSelecionado || !titulo.trim() || !conteudo.trim()) {
      return setErro('Preencha todos os campos obrigatórios.')
    }

    setSalvando(true)
    setErro('')
    
    const r = await criarTermo({
      aluno_id: alunoSelecionado,
      titulo,
      conteudo_html: conteudo
    })

    setSalvando(false)

    if (r.success) {
      setModalAberto(false)
      setTitulo('')
      setConteudo('<p>Escreva o contrato ou termo aqui...</p>')
      window.location.reload() // Recarrega para trazer o novo termo
    } else {
      setErro(r.error || 'Erro ao salvar.')
    }
  }

  async function handleExcluir(id: string) {
    if (!confirm('Tem certeza que deseja excluir este termo?')) return
    const r = await excluirTermo(id)
    if (r.success) {
      setTermos(termos.filter(t => t.id !== id))
    } else {
      alert(r.error)
    }
  }

  return (
    <AdminShell mode="school" active="Termos">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Secretaria Digital"
            title="Termos e Assinaturas"
            description="Envie contratos e autorizações para os pais assinarem eletronicamente."
          />
          <button
            onClick={() => setModalAberto(true)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90"
            style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
          >
            <Plus className="size-4" /> Novo Termo
          </button>
        </div>

        <div className="mt-8 grid gap-4">
          {termos.length === 0 ? (
            <Panel className="p-12 text-center text-sm text-[#82939a]">
              Nenhum termo criado ainda.
            </Panel>
          ) : (
            termos.map(t => (
              <Panel key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                <div className="flex items-start gap-4">
                  <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${t.status === 'assinado' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                    {t.status === 'assinado' ? <CheckCircle2 size={20}/> : <Clock size={20}/>}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#12232b]">{t.titulo}</h3>
                    <p className="text-xs text-[#82939a]">Para: <strong className="text-[#243942]">{t.aluno_nome}</strong> ({t.responsavel_email})</p>
                    <p className="text-xs text-[#82939a] mt-1">Enviado em: {new Date(t.criado_em).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {t.status === 'assinado' ? (
                    <button 
                      onClick={() => setTermoAuditoria(t)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#0d9488] px-3 py-1.5 text-xs font-semibold text-[#0d9488] hover:bg-[#ccfbf1]"
                    >
                      <ShieldCheck className="size-3.5" /> Ver Auditoria
                    </button>
                  ) : (
                    <>
                      <span className="rounded-full bg-[#fef3c7] px-2 py-1 text-[10px] font-bold text-[#92400e]">Aguardando</span>
                      <button onClick={() => handleExcluir(t.id)} className="p-1.5 text-[#dc2626] hover:bg-red-50 rounded">
                        <Trash2 className="size-4" />
                      </button>
                    </>
                  )}
                </div>
              </Panel>
            ))
          )}
        </div>
      </main>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#e5ecee] bg-[#fafcfc] px-5 py-4">
              <h3 className="font-bold text-[#12232b]">Criar Novo Termo</h3>
              <button onClick={() => setModalAberto(false)} className="text-[#82939a] hover:text-[#12232b]"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleCriarTermo} className="p-5 flex-1 overflow-y-auto space-y-4">
              {erro && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{erro}</p>}
              
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#536871]">Selecione o Aluno</label>
                <select
                  value={alunoSelecionado}
                  onChange={(e) => setAlunoSelecionado(e.target.value)}
                  className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]"
                >
                  <option value="">Selecione...</option>
                  {alunos.map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#536871]">Título do Termo</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Contrato de Matrícula 2026, Autorização de Imagem..."
                  className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#536871]">Conteúdo do Termo</label>
                <div className="rounded-lg border border-[#d5e0e3] bg-white overflow-hidden">
                  <Editor 
                    value={conteudo} 
                    onChange={(e: any) => setConteudo(e.target.value)}
                    containerProps={{ style: { minHeight: '200px', outline: 'none', padding: '12px' } }}
                  />
                </div>
              </div>
            </form>

            <div className="border-t border-[#e5ecee] bg-[#fafcfc] px-5 py-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalAberto(false)} className="px-4 py-2 text-sm font-semibold text-[#6b7d86] hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button type="submit" onClick={handleCriarTermo} disabled={salvando} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0d9488] hover:brightness-90 rounded-lg disabled:opacity-50">
                {salvando ? <Loader2 className="size-4 animate-spin" /> : 'Enviar Termo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {termoAuditoria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#e5ecee] bg-[#fafcfc] px-5 py-4">
              <h3 className="font-bold text-[#12232b] flex items-center gap-2"><ShieldCheck className="text-[#0d9488]"/> Trilha de Auditoria</h3>
              <button onClick={() => setTermoAuditoria(null)} className="text-[#82939a] hover:text-[#12232b]"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#f0fdfa] border border-[#ccfbf1] rounded-lg p-4 text-center">
                <CheckCircle2 className="size-8 mx-auto text-[#0d9488] mb-2" />
                <p className="text-sm font-bold text-[#0f766e]">Documento Assinado Digitalmente</p>
                <p className="text-xs text-[#0f766e]/80 mt-1">Assinado por {termoAuditoria.responsavel_email}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-2"><span className="text-[#82939a]">Data/Hora:</span> <span className="font-semibold text-[#243942]">{new Date(termoAuditoria.assinado_em!).toLocaleString('pt-BR')}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-[#82939a]">Endereço IP:</span> <span className="font-mono text-[#243942]">{termoAuditoria.ip_assinatura}</span></div>
                <div>
                  <p className="text-[#82939a] mb-1">Hash de Autenticidade (SHA-256):</p>
                  <p className="font-mono text-[10px] bg-gray-100 p-2 rounded break-all text-[#243942]">{termoAuditoria.hash_assinatura}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}