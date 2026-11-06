'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Search, BookOpen, Rocket, FileText, WalletCards, MessageSquare, 
  PlayCircle, Globe, ChevronRight, X, Headphones, ArrowLeft 
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { BASE_CONHECIMENTO, type Artigo } from '@/lib/ajuda/dados'

const ICONES: Record<string, any> = {
  Rocket, FileText, WalletCards, MessageSquare, PlayCircle, Globe
}

export function CentralAjudaClient() {
  const [busca, setBusca] = useState('')
  const [artigoAberto, setArtigoAberto] = useState<Artigo | null>(null)

  const artigosFiltrados = BASE_CONHECIMENTO.map(cat => ({
    ...cat,
    artigos: cat.artigos.filter(a => 
      a.titulo.toLowerCase().includes(busca.toLowerCase()) || 
      a.resumo.toLowerCase().includes(busca.toLowerCase()) ||
      a.conteudo.toLowerCase().includes(busca.toLowerCase())
    )
  })).filter(cat => cat.artigos.length > 0)

  return (
    <AdminShell mode="school" active="Central de Ajuda">
      <main className="px-5 py-8 lg:px-8">
        
        {/* SE O ARTIGO ESTIVER ABERTO, MOSTRA O LEITOR */}
        {artigoAberto ? (
          <div className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => setArtigoAberto(null)}
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#6b7d86] hover:text-[#12232b]"
            >
              <ArrowLeft size={16} /> Voltar para a Central de Ajuda
            </button>
            
            <div className="rounded-2xl border border-[#e5ecee] bg-white p-8 shadow-sm">
              <div className="mb-8 border-b border-[#f0f4f5] pb-6">
                <h1 className="text-3xl font-bold text-[#12232b]">{artigoAberto.titulo}</h1>
                <p className="mt-2 text-lg text-[#82939a]">{artigoAberto.resumo}</p>
              </div>
              
              <div 
                className="prose prose-sm max-w-none text-[#243942] prose-p:leading-7 prose-li:leading-7 prose-strong:text-[#12232b]"
                dangerouslySetInnerHTML={{ __html: artigoAberto.conteudo }} 
              />

              <div className="mt-10 rounded-xl bg-[#f0fdfa] p-5 border border-[#ccfbf1] text-center">
                <p className="text-sm text-[#0f766e]">Isso resolveu seu problema?</p>
                <div className="mt-3 flex justify-center gap-3">
                  <button onClick={() => setArtigoAberto(null)} className="rounded-lg bg-white border border-[#0d9488] px-4 py-2 text-xs font-bold text-[#0d9488] hover:bg-[#ccfbf1]">Sim, resolvido!</button>
                  <Link href="/admin/suporte" className="rounded-lg bg-[#0d9488] px-4 py-2 text-xs font-bold text-white hover:brightness-90">Não, preciso falar com o suporte</Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TELA INICIAL DA CENTRAL DE AJUDA */
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-10">
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-[#f0fdfa] text-[#0d9488]">
                <BookOpen size={32} />
              </div>
              <h1 className="text-3xl font-bold text-[#12232b]">Como podemos ajudar?</h1>
              <p className="mt-2 text-[#82939a]">Pesquise por um recurso ou navegue pelas categorias abaixo.</p>
              
              <div className="mx-auto mt-6 flex items-center gap-2 rounded-xl border border-[#d5e0e3] bg-white px-4 py-3 shadow-sm max-w-2xl focus-within:border-[#0d9488] focus-within:ring-1 focus-within:ring-[#0d9488] transition">
                <Search className="size-5 text-[#82939a]" />
                <input 
                  type="text" 
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Ex: Como importar alunos, Como gerar boleto, Como criar formulário..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]"
                />
                {busca && (
                  <button onClick={() => setBusca('')} className="text-[#82939a] hover:text-[#12232b]"><X size={16}/></button>
                )}
              </div>
            </div>

            {busca && artigosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#82939a]">Nenhum artigo encontrado para "{busca}".</p>
                <Link href="/admin/suporte" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0d9488] hover:underline">
                  <Headphones size={16} /> Abrir um chamado para o suporte
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {artigosFiltrados.map(cat => {
                  const Icone = ICONES[cat.icone] || BookOpen
                  return (
                    <Panel key={cat.id} className="flex flex-col overflow-hidden">
                      <div className="bg-[#fafcfc] border-b border-[#e5ecee] px-5 py-4 flex items-center gap-3">
                        <div className="grid size-8 place-items-center rounded-lg bg-white border border-[#e5ecee] text-[#0d9488] shadow-sm">
                          <Icone size={16} />
                        </div>
                        <h2 className="font-bold text-[#12232b]">{cat.titulo}</h2>
                      </div>
                      <div className="flex-1 divide-y divide-[#f0f4f5]">
                        {cat.artigos.map(artigo => (
                          <button 
                            key={artigo.id}
                            onClick={() => setArtigoAberto(artigo)}
                            className="w-full flex items-start gap-3 p-4 text-left hover:bg-[#f0fdfa] transition group"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-[#243942] group-hover:text-[#0d9488]">{artigo.titulo}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-[#82939a]">{artigo.resumo}</p>
                            </div>
                            <ChevronRight size={16} className="shrink-0 mt-1 text-[#d5e0e3] group-hover:text-[#0d9488]" />
                          </button>
                        ))}
                      </div>
                    </Panel>
                  )
                })}
              </div>
            )}
            
            <div className="mt-12 rounded-2xl bg-gradient-to-r from-[#173b4a] to-[#0d2833] p-8 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
              <div>
                <h3 className="text-lg font-bold text-white">Ainda precisa de ajuda?</h3>
                <p className="mt-1 text-sm text-[#8aa0ad]">Nossa equipe técnica está pronta para atender você.</p>
              </div>
              <Link 
                href="/admin/suporte" 
                className="mt-5 sm:mt-0 inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
              >
                <Headphones size={18} /> Abrir chamado no Suporte
              </Link>
            </div>

          </div>
        )}
      </main>
    </AdminShell>
  )
}