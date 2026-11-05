'use client'

import { useState } from 'react'
import { Mail, Loader2, Edit, Send, Check, X, Code, Eye, AlertCircle } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { atualizarTemplate, enviarEmailManual, getFaturasDaEscola, type EmailTemplate } from './actions'

export function ComunicacaoClient({ templates, escolas }: { templates: EmailTemplate[], escolas: any[] }) {
  const [editando, setEditando] = useState<EmailTemplate | null>(null)
  const [enviandoManual, setEnviandoManual] = useState<EmailTemplate | null>(null)
  
  // Form states
  const [formAssunto, setFormAssunto] = useState('')
  const [formHtml, setFormHtml] = useState('')
  const [formAtivo, setFormAtivo] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Manual states
  const [escolaId, setEscolaId] = useState('')
  const [faturas, setFaturas] = useState<any[]>([])
  const [faturaId, setFaturaId] = useState('')
  const [carregandoFaturas, setCarregandoFaturas] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [sucessoMsg, setSucessoMsg] = useState('')

  function abrirEdicao(tpl: EmailTemplate) {
    setEditando(tpl)
    setFormAssunto(tpl.assunto)
    setFormHtml(tpl.corpo_html)
    setFormAtivo(tpl.ativo)
    setPreviewMode(false)
  }

  async function handleSalvar() {
    if (!editando) return
    setSalvando(true)
    const r = await atualizarTemplate(editando.id, { assunto: formAssunto, corpo_html: formHtml, ativo: formAtivo })
    setSalvando(false)
    if (r.success) {
      setEditando(null)
      window.location.reload()
    } else {
      alert(r.error)
    }
  }

  async function abrirEnvioManual(tpl: EmailTemplate) {
    setEnviandoManual(tpl)
    setEscolaId('')
    setFaturas([])
    setFaturaId('')
    setSucessoMsg('')
  }

  async function handleEscolaChange(id: string) {
    setEscolaId(id)
    setFaturaId('')
    if (!id) { setFaturas([]); return }
    
    setCarregandoFaturas(true)
    const data = await getFaturasDaEscola(id)
    setFaturas(data)
    setCarregandoFaturas(false)
  }

  async function handleEnviar() {
    if (!enviandoManual || !escolaId) return
    setEnviando(true)
    
    // CORREÇÃO AQUI: Removido o 'editandoManual?.id ||'
    const r = await enviarEmailManual(escolaId, enviandoManual.id, faturaId || undefined)
    
    setEnviando(false)
    
    if (r.success) {
      setSucessoMsg('E-mail enviado com sucesso!')
      setTimeout(() => { setEnviandoManual(null); setSucessoMsg('') }, 2000)
    } else {
      alert(r.error)
    }
  }

  return (
    <AdminShell mode="super" active="Comunicação">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading 
          eyebrow="ARXUM Admin" 
          title="Central de Comunicação" 
          description="Gerencie os e-mails automáticos da régua de cobrança." 
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(tpl => (
            <Panel key={tpl.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
                    <Mail className="size-5" />
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${tpl.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {tpl.ativo ? 'Ativo' : 'Suspenso'}
                  </span>
                </div>
                <h3 className="font-bold text-[#12232b]">{tpl.nome}</h3>
                <p className="text-xs text-[#82939a] mt-1 line-clamp-1">{tpl.assunto}</p>
              </div>

              <div className="mt-6 flex gap-2">
                <button onClick={() => abrirEdicao(tpl)} className="flex-1 bg-white border border-[#d5e0e3] text-[#30454e] py-2 rounded-lg text-xs font-semibold hover:border-[#0d9488] flex justify-center items-center gap-1">
                  <Edit className="size-3.5" /> Editar
                </button>
                <button onClick={() => abrirEnvioManual(tpl)} className="flex-1 bg-[#0d9488] text-white py-2 rounded-lg text-xs font-semibold hover:bg-[#0f766e] flex justify-center items-center gap-1">
                  <Send className="size-3.5" /> Enviar Manual
                </button>
              </div>
            </Panel>
          ))}
        </div>
      </main>

      {/* DRAWER EDITAR TEMPLATE */}
      {editando && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl relative">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">{editando.nome}</h2>
                <p className="text-xs text-[#82939a]">Editar conteúdo do e-mail</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#30454e] mr-4 cursor-pointer">
                  <input type="checkbox" checked={formAtivo} onChange={e => setFormAtivo(e.target.checked)} className="rounded text-[#0d9488]" />
                  Envio Automático Ativo
                </label>
                <button onClick={() => setEditando(null)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Assunto</label>
                <input type="text" value={formAssunto} onChange={e => setFormAssunto(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]" />
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold">Código HTML do E-mail</label>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setPreviewMode(false)} className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1 ${!previewMode ? 'bg-white shadow-sm' : 'text-gray-500'}`}><Code className="size-3" /> Código</button>
                    <button onClick={() => setPreviewMode(true)} className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1 ${previewMode ? 'bg-white shadow-sm' : 'text-gray-500'}`}><Eye className="size-3" /> Preview</button>
                  </div>
                </div>
                
                {previewMode ? (
                  <div className="border border-[#e5ecee] rounded-lg bg-[#fafcfc] p-4 h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: formHtml }} />
                ) : (
                  <textarea value={formHtml} onChange={e => setFormHtml(e.target.value)} className="w-full flex-1 border p-3 rounded-lg font-mono text-xs outline-none focus:border-[#0d9488] min-h-[320px]" />
                )}
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                <h4 className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1"><AlertCircle className="size-3" /> Variáveis Disponíveis</h4>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono text-blue-600">
                  <span className="bg-white px-2 py-1 rounded border border-blue-200">{'{{nome_escola}}'}</span>
                  <span className="bg-white px-2 py-1 rounded border border-blue-200">{'{{valor}}'}</span>
                  <span className="bg-white px-2 py-1 rounded border border-blue-200">{'{{vencimento}}'}</span>
                  <span className="bg-white px-2 py-1 rounded border border-blue-200">{'{{referencia}}'}</span>
                  <span className="bg-white px-2 py-1 rounded border border-blue-200">{'{{link_pagamento}}'}</span>
                </div>
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setEditando(null)} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e]">Cancelar</button>
              <button onClick={handleSalvar} disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                {salvando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Salvar Template
              </button>
            </footer>
          </aside>
        </div>
      )}

      {/* MODAL ENVIO MANUAL */}
      {enviandoManual && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full relative shadow-2xl">
            <button onClick={() => setEnviandoManual(null)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X className="size-4" /></button>
            <div className="mb-6">
              <h3 className="font-bold text-lg text-[#12232b]">Enviar E-mail Manual</h3>
              <p className="text-xs text-gray-500 mt-1">Modelo: <strong>{enviandoManual.nome}</strong></p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1 block">Selecione a Escola</label>
                <select value={escolaId} onChange={e => handleEscolaChange(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]">
                  <option value="">Selecione...</option>
                  {escolas.map(e => <option key={e.id} value={e.id}>{e.nome} ({e.email_contato || 'Sem e-mail'})</option>)}
                </select>
              </div>

              {escolaId && (
                <div>
                  <label className="text-xs font-bold mb-1 block">Vincular a uma Fatura (Opcional)</label>
                  {carregandoFaturas ? (
                    <div className="flex justify-center py-2"><Loader2 className="size-4 animate-spin text-gray-400" /></div>
                  ) : faturas.length === 0 ? (
                    <p className="text-xs text-gray-500">Nenhuma fatura recente encontrada.</p>
                  ) : (
                    <select value={faturaId} onChange={e => setFaturaId(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]">
                      <option value="">Não vincular fatura</option>
                      {faturas.map(f => <option key={f.id} value={f.id}>{f.descricao} - R$ {(f.valor_centavos/100).toFixed(2)} ({f.status})</option>)}
                    </select>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">Se vincular, as variáveis de valor e link de pagamento serão preenchidas.</p>
                </div>
              )}

              {sucessoMsg && (
                <div className="bg-green-50 text-green-700 text-xs p-3 rounded-lg flex items-center gap-2">
                  <Check className="size-4" /> {sucessoMsg}
                </div>
              )}

              <button onClick={handleEnviar} disabled={!escolaId || enviando || !!sucessoMsg} className="w-full bg-[#0d9488] text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-[#0f766e] mt-4 disabled:opacity-50">
                {enviando ? <Loader2 className="animate-spin size-4" /> : <Send className="size-4" />}
                {enviando ? 'Enviando...' : 'Disparar E-mail'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
