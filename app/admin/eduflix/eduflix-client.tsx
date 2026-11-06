'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, PlayCircle, Radio, Eye, EyeOff, Trash2, X, Loader2, Check, Video, Clock, Users, UploadCloud } from 'lucide-react'
import { SectionHeading } from '@/components/admin-shell'
import { criarVideoAdmin, alternarPublicacaoVideo, excluirVideo, type VideoAdmin } from './actions'
import { UploadButton } from '@/lib/uploadthing'

export function EduflixAdminClient({ videosIniciais }: { videosIniciais: VideoAdmin[] }) {
  const router = useRouter()
  const [videos, setVideos] = useState(videosIniciais)
  const [modalAberto, setModalAberto] = useState(false)
  const [processando, setProcessando] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Formulário
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [disciplina, setDisciplina] = useState('')
  const [serie, setSerie] = useState('')
  const [tipo, setTipo] = useState<'video' | 'live'>('video')
  
  // URLs dos arquivos
  const [videoUrl, setVideoUrl] = useState('')
  const [capaUrl, setCapaUrl] = useState('')
  
  // Dados da Live
  const [linkLive, setLinkLive] = useState('')
  const [dataLive, setDataLive] = useState('')
  const [duracao, setDuracao] = useState('')

  // Estados de upload
  const [enviandoVideo, setEnviandoVideo] = useState(false)
  const [enviandoCapa, setEnviandoCapa] = useState(false)

  function limpar() {
    setTitulo(''); setDescricao(''); setDisciplina(''); setSerie('')
    setTipo('video'); setVideoUrl(''); setCapaUrl(''); setLinkLive(''); setDataLive(''); setDuracao(''); setErro('')
  }

  async function handleCriar() {
    if (!titulo.trim()) return setErro('Informe o título.')
    if (tipo === 'video' && !videoUrl) return setErro('Faça o upload do arquivo de vídeo.')
    if (tipo === 'live' && !linkLive) return setErro('Informe o link da transmissão ao vivo.')

    setSalvando(true)
    setErro('')

    const r = await criarVideoAdmin({
      titulo,
      descricao,
      disciplina,
      serie,
      tipo,
      video_url: videoUrl,
      capa_url: capaUrl,
      link_live: linkLive,
      data_live: dataLive,
      duracao_minutos: duracao ? parseInt(duracao, 10) : null
    })
    
    setSalvando(false)
    if (!r.success) return setErro(r.error || 'Erro ao salvar.')

    limpar()
    setModalAberto(false)
    router.refresh()
  }

  async function handleAlternarPublicacao(id: string, atual: boolean) {
    setProcessando(id)
    await alternarPublicacaoVideo(id, !atual)
    setProcessando(null)
    router.refresh()
  }

  async function handleExcluir(id: string) {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) return
    setProcessando(id)
    await excluirVideo(id)
    setProcessando(null)
    router.refresh()
  }

  return (
    <div className="px-5 py-8 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading 
          eyebrow="Módulo Extra" 
          title="EduFlix" 
          description="Gerencie o catálogo de videoaulas e transmissões ao vivo da escola." 
        />
        <button onClick={() => { limpar(); setModalAberto(true) }} className="bg-[#0d9488] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#0f766e]">
          <Plus className="size-4" /> Novo Vídeo / Live
        </button>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {videos.map(v => (
          <div key={v.id} className="group flex flex-col overflow-hidden rounded-xl border border-[#e5ecee] bg-white shadow-sm transition hover:shadow-md">
            <div className="relative aspect-video bg-[#0f172a] flex items-center justify-center overflow-hidden">
              {v.capa_url ? (
                <img src={v.capa_url} alt={v.titulo} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition" />
              ) : (
                <Video className="size-8 text-white/20" />
              )}
              <div className="absolute top-2 left-2 flex gap-1">
                {v.tipo === 'live' ? (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><Radio className="size-3"/> LIVE</span>
                ) : (
                  <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><PlayCircle className="size-3"/> VÍDEO</span>
                )}
                {v.publicado ? (
                  <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">Ativo</span>
                ) : (
                  <span className="bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">Rascunho</span>
                )}
              </div>
              {v.duracao_minutos && (
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">{v.duracao_minutos} min</span>
              )}
            </div>
            
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-bold text-[#12232b] line-clamp-1">{v.titulo}</h3>
              <p className="text-xs text-[#82939a] mt-1 line-clamp-2">{v.descricao || 'Sem descrição'}</p>
              
              <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#f0f4f5]">
                <div className="flex items-center gap-1 text-xs text-[#82939a]">
                  <Users className="size-3" /> {v.visualizacoes} views
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleAlternarPublicacao(v.id, v.publicado)} disabled={processando === v.id} className={`p-1.5 rounded-lg transition ${v.publicado ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`} title={v.publicado ? 'Ocultar do aluno' : 'Publicar para o aluno'}>
                    {processando === v.id ? <Loader2 className="size-4 animate-spin" /> : v.publicado ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                  <button onClick={() => handleExcluir(v.id)} disabled={processando === v.id} className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition" title="Excluir">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {videos.length === 0 && (
          <div className="col-span-full py-16 text-center text-[#82939a] bg-white border border-[#dce5e8] rounded-xl">
            Nenhum vídeo cadastrado. Clique em "Novo Vídeo / Live" para começar.
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl relative">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Novo Conteúdo</h2>
                <p className="text-xs text-[#82939a] mt-0.5">Adicione um vídeo sob demanda ou uma transmissão ao vivo.</p>
              </div>
              <button onClick={() => setModalAberto(false)} disabled={salvando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-[#f0fdfa] p-2 rounded-lg border border-[#ccfbf1]">
                <button type="button" onClick={() => setTipo('video')} className={`py-2 rounded-md text-sm font-semibold flex justify-center items-center gap-2 transition ${tipo === 'video' ? 'bg-white shadow-sm text-[#0d9488]' : 'text-[#0f766e]/60 hover:bg-white/50'}`}>
                  <PlayCircle className="size-4" /> Vídeo Gravado
                </button>
                <button type="button" onClick={() => setTipo('live')} className={`py-2 rounded-md text-sm font-semibold flex justify-center items-center gap-2 transition ${tipo === 'live' ? 'bg-white shadow-sm text-[#0d9488]' : 'text-[#0f766e]/60 hover:bg-white/50'}`}>
                  <Radio className="size-4" /> Transmissão ao Vivo
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Título</label>
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full border p-2 rounded-lg outline-none focus:border-[#0d9488]" placeholder="Ex: Aula Magna de Matemática" />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Descrição</label>
                <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} className="w-full border p-2 rounded-lg outline-none focus:border-[#0d9488] resize-none" placeholder="Do que se trata o vídeo ou live?" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Disciplina</label>
                  <input type="text" value={disciplina} onChange={e => setDisciplina(e.target.value)} className="w-full border p-2 rounded-lg outline-none focus:border-[#0d9488]" placeholder="Ex: Matemática" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Série Alvo</label>
                  <input type="text" value={serie} onChange={e => setSerie(e.target.value)} className="w-full border p-2 rounded-lg outline-none focus:border-[#0d9488]" placeholder="Ex: 9º Ano (vazio = todos)" />
                </div>
              </div>

              {tipo === 'video' ? (
                <div className="border border-[#e5ecee] bg-[#fafcfc] p-4 rounded-lg space-y-4">
                  <p className="text-xs font-bold text-[#0d9488] uppercase">Arquivos do Vídeo</p>
                  
                  <div>
                    <label className="block text-xs font-bold mb-2">Arquivo de Vídeo</label>
                    {videoUrl ? (
                      <div className="flex items-center gap-2 bg-green-50 text-green-700 p-2 rounded border border-green-200 text-sm">
                        <Check className="size-4" /> Vídeo carregado com sucesso!
                      </div>
                    ) : (
                      <UploadButton
                        endpoint="videoEduflix"
                        onUploadBegin={() => setEnviandoVideo(true)}
                        onClientUploadComplete={(res) => {
                          if (res && res[0]) {
                            setVideoUrl(res[0].url)
                            setEnviandoVideo(false)
                          }
                        }}
                        onUploadError={(error: Error) => {
                          alert(`Erro no upload: ${error.message}`)
                          setEnviandoVideo(false)
                        }}
                        appearance={{
                          button: "bg-[#0d9488] text-white w-full py-2 rounded-lg font-semibold text-sm hover:bg-[#0f766e] transition",
                          allowedContent: "text-xs text-gray-500 mt-1"
                        }}
                        content={{
                          button({ ready }) {
                            if (ready) return <div className="flex items-center justify-center gap-2"><UploadCloud className="size-4"/> Enviar Vídeo (MP4)</div>;
                            return "Carregando...";
                          }
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-2">Imagem de Capa (Thumbnail)</label>
                    {capaUrl ? (
                      <div className="flex items-center gap-2 bg-green-50 text-green-700 p-2 rounded border border-green-200 text-sm">
                        <Check className="size-4" /> Capa carregada!
                        <button onClick={() => setCapaUrl('')} className="ml-auto text-red-500 hover:underline text-xs">Remover</button>
                      </div>
                    ) : (
                      <UploadButton
                        endpoint="capaEduflix"
                        onUploadBegin={() => setEnviandoCapa(true)}
                        onClientUploadComplete={(res) => {
                          if (res && res[0]) {
                            setCapaUrl(res[0].url)
                            setEnviandoCapa(false)
                          }
                        }}
                        onUploadError={(error: Error) => {
                          alert(`Erro no upload: ${error.message}`)
                          setEnviandoCapa(false)
                        }}
                        appearance={{
                          button: "bg-white text-gray-700 border border-gray-300 w-full py-2 rounded-lg font-semibold text-sm hover:bg-gray-50 transition",
                          allowedContent: "text-xs text-gray-500 mt-1"
                        }}
                        content={{
                          button({ ready }) {
                            if (ready) return <div className="flex items-center justify-center gap-2"><UploadCloud className="size-4"/> Enviar Capa (JPG/PNG)</div>;
                            return "Carregando...";
                          }
                        }}
                      />
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold mb-1">Duração (minutos)</label>
                    <input type="number" value={duracao} onChange={e => setDuracao(e.target.value)} className="w-full border p-2 rounded-lg outline-none focus:border-[#0d9488]" placeholder="Ex: 45" />
                  </div>
                </div>
              ) : (
                <div className="border border-[#e5ecee] bg-[#fafcfc] p-4 rounded-lg space-y-4">
                  <p className="text-xs font-bold text-red-600 uppercase">Transmissão ao Vivo</p>
                  <div>
                    <label className="block text-xs font-bold mb-1">Link da Live (YouTube, Twitch, etc)</label>
                    <input type="text" value={linkLive} onChange={e => setLinkLive(e.target.value)} className="w-full border p-2 rounded-lg outline-none focus:border-red-400" placeholder="https://youtube.com/live/..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Data e Hora de Início</label>
                    <input type="datetime-local" value={dataLive} onChange={e => setDataLive(e.target.value)} className="w-full border p-2 rounded-lg outline-none focus:border-red-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">URL da Capa (Imagem)</label>
                    <input type="text" value={capaUrl} onChange={e => setCapaUrl(e.target.value)} className="w-full border p-2 rounded-lg outline-none focus:border-red-400" placeholder="https://..." />
                  </div>
                </div>
              )}

              {erro && <p className="text-sm text-red-500">{erro}</p>}
            </div>

            <footer className="flex justify-end gap-2 border-t border-[#e5ecee] p-6 bg-white">
              <button onClick={() => setModalAberto(false)} disabled={salvando || enviandoVideo || enviandoCapa} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleCriar} disabled={salvando || enviandoVideo || enviandoCapa} className="bg-[#0d9488] text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#0f766e] disabled:opacity-50">
                {salvando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} 
                {enviandoVideo || enviandoCapa ? 'Aguardando Upload...' : 'Salvar Conteúdo'}
              </button>
            </footer>
          </aside>
        </div>
      )}
    </div>
  )
}

