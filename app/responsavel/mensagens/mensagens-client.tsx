'use client'

import { useState } from 'react'
import { MessageSquare, ArrowLeft, Send, Loader2 } from 'lucide-react'

// Reaproveitando a lógica básica, mas em tela cheia para o responsável
export function ResponsavelMensagensClient({ conversasIniciais }: { conversasIniciais: any[] }) {
  const [conversas] = useState(conversasIniciais)
  const [conversaAtiva, setConversaAtiva] = useState<any | null>(null)
  const [mensagens, setMensagens] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Importação dinâmica das ações
  const { getMensagensResponsavel, enviarMensagemResponsavel } = require('./actions')

  async function abrir(c: any) {
    setConversaAtiva(c)
    setCarregando(true)
    const msgs = await getMensagensResponsavel(c.id)
    setMensagens(msgs)
    setCarregando(false)
  }

  async function handleEnviar() {
    if (!conversaAtiva || !texto.trim()) return
    setEnviando(true)
    const r = await enviarMensagemResponsavel(conversaAtiva.id, texto)
    setEnviando(false)
    if (r.success) {
      setTexto('')
      const msgs = await getMensagensResponsavel(conversaAtiva.id)
      setMensagens(msgs)
    } else alert(r.error)
  }

  if (conversaAtiva) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm border border-[#e5ecee] overflow-hidden m-6">
        <header className="bg-[#fafcfc] border-b border-[#e5ecee] px-6 py-4 flex items-center gap-4 shrink-0">
          <button onClick={() => setConversaAtiva(null)} className="p-2 hover:bg-gray-100 rounded-full transition"><ArrowLeft className="size-5" /></button>
          <div><h2 className="font-bold">{conversaAtiva.aluno_nome}</h2><p className="text-xs text-gray-500">{conversaAtiva.assunto}</p></div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f6f8f9]">
          {carregando ? <div className="flex justify-center"><Loader2 className="animate-spin text-[#0d9488]"/></div> : 
           mensagens.length === 0 ? <div className="text-center text-sm text-gray-500">Nenhuma mensagem.</div> :
           mensagens.map(m => {
             const isEu = m.remetente_tipo === 'responsavel'
             return (
               <div key={m.id} className={`flex flex-col max-w-[80%] ${isEu ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                 <span className="text-[10px] text-gray-400 mb-1">{m.remetente_nome} • {new Date(m.criado_em).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                 <div className={`p-3 rounded-2xl text-sm ${isEu ? 'bg-[#0d9488] text-white rounded-tr-sm' : 'bg-white border text-[#243942] rounded-tl-sm'}`}>{m.conteudo}</div>
               </div>
             )
           })
          }
        </div>

        <div className="p-4 bg-white border-t border-[#e5ecee] shrink-0">
           <div className="flex gap-2">
             <input type="text" value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleEnviar()} placeholder="Digite sua mensagem..." className="flex-1 border rounded-full px-4 py-2 outline-none focus:border-[#0d9488] text-sm"/>
             <button onClick={handleEnviar} disabled={enviando || !texto.trim()} className="bg-[#0d9488] text-white p-2 rounded-full"><Send className="size-5"/></button>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#12232b] mb-6">Minhas Mensagens</h1>
      <div className="bg-white border border-[#e5ecee] rounded-xl overflow-hidden">
         {conversas.length === 0 ? <div className="p-10 text-center text-sm text-[#82939a]">Nenhuma conversa iniciada pela escola.</div> :
          conversas.map(c => (
            <button key={c.id} onClick={() => abrir(c)} className="w-full flex items-center gap-4 p-5 border-b border-[#f0f4f5] hover:bg-[#fafcfc] text-left">
              <div className="grid size-10 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]"><MessageSquare className="size-5"/></div>
              <div className="flex-1"><p className="font-bold text-sm">{c.aluno_nome}</p><p className="text-xs text-[#82939a]">{c.assunto}</p></div>
              {c.nao_lidas > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{c.nao_lidas}</span>}
            </button>
          ))
         }
      </div>
    </div>
  )
}
