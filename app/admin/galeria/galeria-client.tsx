'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Image as ImageIcon, Trash2, X, Loader2, Upload } from 'lucide-react'
import { UploadDropzone } from '@/lib/uploadthing'
import { AdminShell, SectionHeading, Panel, ActionButton } from '@/components/admin-shell'
import { criarAlbum, adicionarFotos, excluirFoto, excluirAlbum, type Album } from './actions'

const publicos = [
  { key: 'todos', label: 'Toda a escola' },
  { key: 'infantil', label: 'Educação Infantil' },
  { key: 'fundamental1', label: 'Fundamental I' },
  { key: 'fundamental2', label: 'Fundamental II' },
  { key: 'medio', label: 'Ensino Médio' },
]

const publicoLabel: Record<string, string> = {
  todos: 'Toda a escola',
  infantil: 'Educação Infantil',
  fundamental1: 'Fundamental I',
  fundamental2: 'Fundamental II',
  medio: 'Ensino Médio',
}

export function GaleriaClient({ albuns }: { albuns: Album[] }) {
  const router = useRouter()
  const [novoAberto, setNovoAberto] = useState(false)
  const [albumAberto, setAlbumAberto] = useState<Album | null>(null)
  const [confirmarAlbum, setConfirmarAlbum] = useState<string | null>(null)
  const [confirmarFoto, setConfirmarFoto] = useState<string | null>(null)

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [publico, setPublico] = useState('todos')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function limpar() {
    setTitulo('')
    setDescricao('')
    setPublico('todos')
    setErro('')
  }

  async function handleCriar() {
    if (!titulo.trim()) return setErro('Informe o título.')

    setSalvando(true)
    setErro('')
    const result = await criarAlbum({ titulo, descricao, publico })
    setSalvando(false)

    if (!result.success) return setErro(result.error || 'Erro.')

    limpar()
    setNovoAberto(false)
    router.refresh()
  }

  async function handleUpload(albumId: string, files: Array<{ url: string; name: string }>) {
    const urls = files.map((f) => f.url)
    await adicionarFotos(albumId, urls)
    router.refresh()
  }

  async function handleExcluirAlbum() {
    if (!confirmarAlbum) return
    await excluirAlbum(confirmarAlbum)
    setConfirmarAlbum(null)
    router.refresh()
  }

  async function handleExcluirFoto() {
    if (!confirmarFoto) return
    await excluirFoto(confirmarFoto)
    setConfirmarFoto(null)
    router.refresh()
  }

  const totalFotos = albuns.reduce((s, a) => s + a.fotos.length, 0)

  return (
    <AdminShell mode="school" active="Galeria">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Mídia"
            title="Galeria de fotos"
            description="Organize fotos por turma ou evento para os responsáveis verem."
          />
          <ActionButton variant="primary">
            <button onClick={() => { limpar(); setNovoAberto(true) }} className="inline-flex items-center gap-1.5">
              <Plus className="size-4" />
              Novo álbum
            </button>
          </ActionButton>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
              <ImageIcon className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Álbuns</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#0d9488]">{albuns.length}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
              <ImageIcon className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Fotos publicadas</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#3b82f6]">{totalFotos}</p>
          </Panel>
        </div>

        {albuns.length === 0 ? (
          <Panel className="mt-8">
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]">
                <ImageIcon className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhum álbum ainda</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">Crie o primeiro álbum e adicione fotos.</p>
            </div>
          </Panel>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albuns.map((a) => (
              <Panel key={a.id} className="overflow-hidden">
                <div className="relative aspect-video bg-[#f0f4f5]">
                  {a.capa_url ? (
                    <img src={a.capa_url} alt={a.titulo} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="size-10 text-[#a0afb4]" />
                    </div>
                  )}
                  <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {a.fotos.length} {a.fotos.length === 1 ? 'foto' : 'fotos'}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-[#243942]">{a.titulo}</h3>
                  {a.descricao && <p className="mt-1 line-clamp-2 text-xs text-[#82939a]">{a.descricao}</p>}
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-[#0d9488]">{publicoLabel[a.publico]}</p>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => setAlbumAberto(a)}
                      className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#30454e] hover:border-[#0d9488] hover:text-[#0f766e]"
                    >
                      Gerenciar fotos
                    </button>
                    <button
                      onClick={() => setConfirmarAlbum(a.id)}
                      className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </main>

      {novoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !salvando && setNovoAberto(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Novo álbum</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Depois de criar, você adiciona as fotos</p>
              </div>
              <button onClick={() => setNovoAberto(false)} disabled={salvando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Título</label>
                  <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Festa Junina 2026" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição</label>
                  <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes do álbum (opcional)" rows={3} className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Público</label>
                  <div className="grid grid-cols-2 gap-2">
                    {publicos.map((p) => (
                      <button key={p.key} type="button" onClick={() => setPublico(p.key)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${publico === p.key ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[#0d9488]'}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovoAberto(false)} disabled={salvando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleCriar} disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
                {salvando ? 'Salvando...' : 'Criar álbum'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {albumAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAlbumAberto(null)} />
          <aside className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">{albumAberto.titulo}</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">{albumAberto.fotos.length} fotos</p>
              </div>
              <button onClick={() => setAlbumAberto(null)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-6 rounded-lg border-2 border-dashed border-[#d5e0e3] bg-[#fafcfc] p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#536871]">
                  <Upload className="size-4" />
                  Adicionar fotos ao álbum
                </div>
                <UploadDropzone
                  endpoint="fotoGaleria"
                  onClientUploadComplete={(res) => handleUpload(albumAberto.id, res || [])}
                  onUploadError={(err) => alert(err.message)}
                  appearance={{
                    container: 'border-none bg-transparent p-0 cursor-pointer',
                    label: 'text-xs text-[#82939a] hover:text-[#0d9488]',
                    allowedContent: 'text-[10px] text-[#a0afb4]',
                    button: 'bg-[#0d9488] text-white text-xs font-semibold rounded px-3 py-1.5 hover:bg-[#0f766e] ut-uploading:bg-[#0f766e]',
                  }}
                />
              </div>

              {albumAberto.fotos.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#82939a]">Nenhuma foto ainda. Use a área acima para enviar.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {albumAberto.fotos.map((f) => (
                    <div key={f.id} className="group relative aspect-square overflow-hidden rounded-lg border border-[#e5ecee]">
                      <img src={f.url} alt="" className="h-full w-full object-cover" />
                      <button
                        onClick={() => setConfirmarFoto(f.id)}
                        className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {confirmarAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmarAlbum(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]"><Trash2 className="size-5" /></div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir álbum?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">Todas as fotos serão removidas. Essa ação não pode ser desfeita.</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmarAlbum(null)} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e]">Cancelar</button>
              <button onClick={handleExcluirAlbum} className="flex-1 rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b91c1c]">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {confirmarFoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmarFoto(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]"><Trash2 className="size-5" /></div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir foto?</h3>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmarFoto(null)} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e]">Cancelar</button>
              <button onClick={handleExcluirFoto} className="flex-1 rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b91c1c]">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}