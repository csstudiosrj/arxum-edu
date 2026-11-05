'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Mail, Loader2, Edit, Send, Check, X, Plus, Trash2, Bold, Italic, Underline, Link as LinkIcon, List, Filter } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { atualizarTemplate, enviarEmailManual, getFaturasDaEscola, criarTemplate, excluirTemplate, type EmailTemplate } from './actions'

// Componente de Editor Visual (WYSIWYG) em React puro
function RichTextEditor({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  const execCommand = (command: string, val: string | undefined = undefined) => {
    document.execCommand(command, false, val)
    if (editorRef.current) {
      editorRef.current.focus()
      onChange(editorRef.current.innerHTML)
    }
  }

  return (
    <div className="border border-[#d5e0e3] rounded-lg overflow-hidden flex flex-col bg-white focus-within:border-[#0d9488] focus-within:ring-1 focus-within:ring-[#0d9488]">
      <div className="bg-gray-50 border-b border-[#d5e0e3] p-1.5 flex gap-1 flex-wrap">
        <button type="button" onClick={() => execCommand('bold')} className="p-1.5 hover:bg-gray-200 rounded px-2.5" title="Negrito"><Bold className="size-4 text-gray-700" /></button>
        <button type="button" onClick={() => execCommand('italic')} className="p-1.5 hover:bg-gray-200 rounded px-2.5" title="Itálico"><Italic className="size-4 text-gray-700" /></button>
        <button type="button" onClick={() => execCommand('underline')} className="p-1.5 hover:bg-gray-200 rounded px-2.5" title="Sublinhado"><Underline className="size-4 text-gray-700" /></button>
        <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-1.5 hover:bg-gray-200 rounded px-2.5" title="Lista"><List className="size-4 text-gray-700" /></button>
        <button type="button" onClick={() => { const url = prompt('URL do link:'); if (url) execCommand('createLink', url) }} className="p-1.5 hover:bg-gray-200 rounded px-2.5" title="Link"><LinkIcon className="size-4 text-gray-700" /></button>
      </div>
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 min-h-[300px] outline-none prose prose-sm max-w-none text-[#243942]"
        style={{ lineHeight: '1.6' }}
      />
    </div>
  )
}

const CATEGORIAS = ['Todas', 'Conta', 'Cobrança', 'Onboarding', 'Segurança', 'Relacionamento', 'Geral']

export function ComunicacaoClient({ templates, escolas }: { templates: EmailTemplate[], escolas: any[] }) {
  const [editando, setEditando] = useState<EmailTemplate | null>(null)
  const [criando, setCriando] = useState(false)
  const [enviandoManual, setEnviandoManual] = useState<EmailTemplate | null>(null)
  
  // Filtro
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  
  // Form states
  const [formAssunto, setFormAssunto] = useState('')
  const [formHtml, setFormHtml] = useState('')
  const [formAtivo, setFormAtivo] = useState(true)
  const [salvando, setSalvando] = useState(false)
  
  // Novo form
  const [novoNome, setNovoNome] = useState('')
  const [novoSlug, setNovoSlug] = useState('')
  const [novoAssunto, setNovoAssunto] = useState('')
  const [novoHtml, setNovoHtml] = useState('')
  const [novaCategoria, setNovaCategoria] = useState('Geral')

  // Manual states
  const [escolaId, setEscolaId] = useState('')
  const [faturas, setFaturas] = useState<any[]>([])
  const [faturaId, setFaturaId] = useState('')
  const [carregandoFaturas, setCarregandoFaturas] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [sucessoMsg, setSucessoMsg] = useState('')

  const templatesFiltrados = useMemo(() => {
    if (filtroCategoria === 'Todas') return templates
    return templates.filter(t => t.categoria === filtroCategoria)
  }, [templates, filtroCategoria])

  function abrirCriacao() {
    setCriando(true)
    setNovoNome('')
    setNovoSlug('')
    setNovoAssunto('')
    setNovoHtml('<p>Olá, {{nome_escola}}.</p><p>Digite seu texto aqui...</p>')
    setNovaCategoria('Geral')
  }

  function abrirEdicao(tpl: EmailTemplate) {
    setEditando(tpl)
    setFormAssunto(tpl.assunto)
    setFormHtml(tpl.corpo_html)
    setFormAtivo(tpl.ativo)
    setCriando(false)
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

  async function handleCriar() {
    if (!novoNome || !novoSlug || !novoAssunto) return alert('Preencha todos os campos.')
    setSalvando(true)
    const r = await criarTemplate({ nome: novoNome, slug: novoSlug.toLowerCase().replace(/\s+/g, '_'), assunto: novoAssunto, corpo_html: novoHtml, categoria: novaCategoria })
    setSalvando(false)
    if (r.success) {
      setCriando(false)
      window.location.reload()
    } else {
      alert(r.error)
    }
  }

  async function handleExcluir(id: string) {
    if (!confirm('Tem certeza que deseja excluir este template? Ele parará de ser enviado.')) return
    const r = await excluirTemplate(id)
    if (r.success) window.location.reload()
    else alert(r.error)
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading 
            eyebrow="ARXUM Admin" 
            title="Central de Comunicação" 
            description="Gerencie os e-mails automáticos e templates de mensagens." 
          />
          <button onClick={abrirCriacao} className="bg-[#0d9488] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#0f766e]">
            <Plus className="size-4" /> Novo Template
          </button>
        </div>

        {/* FILTROS POR CATEGORIA */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-[#536871] mr-2">
            <Filter className="size-4" /> Filtrar por:
          </div>
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                filtroCategoria === cat 
                  ? 'bg-[#0d9488] text-white shadow-sm' 
                  : 'bg-white border border-[#d5e0e3] text-[#6b7d86] hover:border-[#0d9488]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templatesFiltrados.map(tpl => (
            <Panel key={tpl.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
                    <Mail className="size-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${tpl.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {tpl.ativo ? 'Ativo' : 'Suspenso'}
                    </span>
                    <button onClick={() => handleExcluir(tpl.id)} className="text-gray-400 hover:text-red-500 transition"><Trash2 className="size-4" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0d9488] bg-[#f0fdfa] px-2 py-0.5 rounded-md border border-[#ccfbf1]">{tpl.categoria}</span>
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

      {/* DRAWER CRIAR NOVO TEMPLATE */}
      {criando && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="bg-white w-full max-w-xl h-full flex flex-col shadow-2xl relative">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <h2 className="text-lg font-bold text-[#12232b]">Criar Novo Template</h2>
              <button onClick={() => setCriando(false)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fafcfc]">
              <div>
                <label className="block text-xs font-bold mb-1 text-[#536871]">Nome do Template</label>
                <input type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Ex: Recuperação de Senha" className="w-full border border-[#d5e0e3] p-2.5 rounded-lg outline-none focus:border-[#0d9488] text-sm bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-[#536871]">Identificador (slug)</label>
                <input type="text" value={novoSlug} onChange={e => setNovoSlug(e.target.value)} placeholder="Ex: recuperacao_senha" className="w-full border border-[#d5e0e3] p-2.5 rounded-lg outline-none focus:border-[#0d9488] text-sm bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-[#536871]">Assunto do E-mail</label>
                <input type="text" value={novoAssunto} onChange={e => setNovoAssunto(e.target.value)} placeholder="Ex: Recupere sua senha - {{nome_escola}}" className="w-full border border-[#d5e0e3] p-2.5 rounded-lg outline-none focus:border-[#0d9488] text-sm bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-[#536871]">Categoria</label>
                <select value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} className="w-full border border-[#d5e0e3] p-2.5 rounded-lg outline-none focus:border-[#0d9488] text-sm bg-white">
                  {CATEGORIAS.filter(c => c !== 'Todas').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-bold mb-1 text-[#536871]">Conteúdo do E-mail</label>
                <RichTextEditor value={novoHtml} onChange={setNovoHtml} />
              </div>
            </div>
            <footer className="flex justify-end gap-2 border-t border-[#e5ecee] px-6 py-4 bg-white">
              <button onClick={() => setCriando(false)} className="px-4 py-2 text-sm font-semibold text-[#30454e]">Cancelar</button>
              <button onClick={handleCriar} disabled={salvando} className="bg-[#0d9488] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] disabled:opacity-50">
                {salvando ? 'Criando...' : 'Criar Template'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {/* DRAWER EDITAR TEMPLATE (EDITOR VISUAL) */}
      {editando && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="bg-white w-full max-w-3xl h-full flex flex-col shadow-2xl relative">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">{editando.nome}</h2>
                <p className="text-xs text-[#82939a]">Editor Visual de E-mail</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#30454e] cursor-pointer">
                  <input type="checkbox" checked={formAtivo} onChange={e => setFormAtivo(e.target.checked)} className="rounded text-[#0d9488]" />
                  Envio Automático Ativo
                </label>
                <button onClick={() => setEditando(null)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#fafcfc]">
              <div>
                <label className="block text-xs font-bold mb-1 text-[#536871]">Assunto</label>
                <input type="text" value={formAssunto} onChange={e => setFormAssunto(e.target.value)} className="w-full border border-[#d5e0e3] p-2.5 rounded-lg outline-none focus:border-[#0d9488] text-sm" />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-bold mb-1 text-[#536871]">Conteúdo do E-mail (Texto)</label>
                <RichTextEditor value={formHtml} onChange={setFormHtml} />
              </div>

              <div className="bg-white border border-[#d5e0e3] rounded-lg p-4">
                <h4 className="text-xs font-bold text-[#12232b] mb-2">Variáveis Disponíveis (copie e cole no texto)</h4>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono text-[#0d9488]">
                  <span className="bg-[#f0fdfa] px-2 py-1 rounded border border-[#ccfbf1]">{'{{nome_escola}}'}</span>
                  <span className="bg-[#f0fdfa] px-2 py-1 rounded border border-[#ccfbf1]">{'{{valor}}'}</span>
                  <span className="bg-[#f0fdfa] px-2 py-1 rounded border border-[#ccfbf1]">{'{{vencimento}}'}</span>
                  <span className="bg-[#f0fdfa] px-2 py-1 rounded border border-[#ccfbf1]">{'{{referencia}}'}</span>
                  <span className="bg-[#f0fdfa] px-2 py-1 rounded border border-[#ccfbf1]">{'{{link_pagamento}}'}</span>
                </div>
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-white px-6 py-4">
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
              <p className="text-xs text-gray-500 mt-1">Modelo: <strong>{enviandoManual.nome}</strong> ({enviandoManual.categoria})</p>
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
