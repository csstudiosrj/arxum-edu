'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown, ChevronUp, Eye, EyeOff, Loader2, Save, Check, Type,
  LayoutTemplate, ExternalLink, Trash2, Plus, Image as ImageIcon, RefreshCw,
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { BannerUpload } from '@/components/banner-upload'
import { FONTES_PARES } from '@/lib/fonts'
import { BLOCO_LABELS, gerarSlug, type ConteudoHome, type BannerHero } from '@/lib/cms/defaults'
import { salvarConteudoHome, atualizarFontePar } from '@/lib/cms/actions'

type Props = {
  conteudoInicial: ConteudoHome
  fontePar: string
  slug: string
  escolaNome: string
}

function gerarId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function SiteClient({ conteudoInicial, fontePar, slug, escolaNome }: Props) {
  const router = useRouter()
  const [conteudo, setConteudo] = useState<ConteudoHome>(conteudoInicial)
  const [fonte, setFonte] = useState(fontePar)
  const [salvando, setSalvando] = useState(false)
  const [salvou, setSalvou] = useState(false)
  const [erro, setErro] = useState('')
  const [blocoAberto, setBlocoAberto] = useState<string | null>(null)
  const [fontePreview, setFontePreview] = useState(fontePar)

  const parPreview = FONTES_PARES.find((f) => f.key === fontePreview) || FONTES_PARES[0]

  function atualizarBloco<K extends keyof ConteudoHome['blocos']>(key: K, dados: Partial<ConteudoHome['blocos'][K]>) {
    setConteudo((c) => ({
      ...c,
      blocos: {
        ...c.blocos,
        [key]: { ...c.blocos[key], ...dados },
      },
    }))
  }

  function alternarAtivo(key: string) {
    setConteudo((c) => {
      const bloco = c.blocos[key as keyof typeof c.blocos]
      if (!bloco) return c
      return {
        ...c,
        blocos: {
          ...c.blocos,
          [key]: { ...bloco, ativo: !bloco.ativo },
        },
      }
    })
  }

  function moverBloco(index: number, direcao: -1 | 1) {
    setConteudo((c) => {
      const nova = [...c.ordem]
      const alvo = index + direcao
      if (alvo < 0 || alvo >= nova.length) return c
      ;[nova[index], nova[alvo]] = [nova[alvo], nova[index]]
      return { ...c, ordem: nova }
    })
  }

  async function handleSalvar() {
    setSalvando(true)
    setErro('')
    setSalvou(false)

    if (fonte !== fontePar) {
      const r = await atualizarFontePar(fonte)
      if (!r.success) {
        setSalvando(false)
        setErro(r.error || 'Erro ao salvar fonte.')
        return
      }
    }

    const r = await salvarConteudoHome(conteudo)
    setSalvando(false)

    if (!r.success) {
      setErro(r.error || 'Erro ao salvar conteúdo.')
      return
    }

    setSalvou(true)
    router.refresh()
    setTimeout(() => setSalvou(false), 2500)
  }

  return (
    <AdminShell mode="school" active="Site">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Conteúdo"
            title="Site institucional"
            description="Edite a home da sua escola, mude a ordem dos blocos e escolha a fonte."
          />
          <div className="flex items-center gap-2">
            {slug && (
              <a
                href={`/edu/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] hover:border-[#0d9488] hover:text-[#0f766e]"
              >
                <ExternalLink className="size-4" />
                Ver site
              </a>
            )}
            {salvou && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#d1fae5] px-3 py-1.5 text-xs font-semibold text-[#065f46]">
                <Check className="size-3.5" /> Salvo
              </span>
            )}
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-50"
            >
              {salvando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>

        {erro && (
          <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">{erro}</div>
        )}

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
                <Type className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Par de fontes</h2>
                <p className="text-xs text-[#82939a]">Escolha o par que combina com a identidade da sua escola.</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
            {FONTES_PARES.map((f) => {
              const ativo = fonte === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => { setFonte(f.key); setFontePreview(f.key) }}
                  onMouseEnter={() => setFontePreview(f.key)}
                  onMouseLeave={() => setFontePreview(fonte)}
                  className={`group relative overflow-hidden rounded-xl border-2 p-4 text-left transition ${
                    ativo ? 'border-[#0d9488] bg-[#ccfbf1]/30' : 'border-[#dce5e8] bg-white hover:border-[#0d9488]/50'
                  }`}
                >
                  {ativo && (
                    <div className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-[#0d9488] text-white">
                      <Check className="size-3" />
                    </div>
                  )}
                  <div className="mb-3 text-lg font-bold text-[#12232b]" style={{ fontFamily: `var(${f.headingVar})` }}>
                    {f.nome}
                  </div>
                  <p className="text-xs leading-5 text-[#82939a]">{f.descricao}</p>
                  <div className="mt-4 border-t border-[#e5ecee] pt-3 text-sm text-[#536871]" style={{ fontFamily: `var(${f.bodyVar})` }}>
                    {f.amostraBody}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="border-t border-[#e5ecee] bg-[#fafcfc] px-5 py-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#6b7d86]">Pré-visualização</p>
            <div className="rounded-lg border border-[#e5ecee] bg-white p-5">
              <h3 className="text-2xl font-bold text-[#12232b]" style={{ fontFamily: `var(${parPreview.headingVar})` }}>
                Educação que prepara para o futuro.
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#536871]" style={{ fontFamily: `var(${parPreview.bodyVar})` }}>
                Uma escola para formar pessoas curiosas, confiantes e prontas para transformar o mundo.
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="mt-6">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
                <LayoutTemplate className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Blocos da home</h2>
                <p className="text-xs text-[#82939a]">Reordene, ligue/desligue e edite cada seção.</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-[#f0f4f5]">
            {conteudo.ordem.map((key, index) => {
              const bloco = conteudo.blocos[key as keyof typeof conteudo.blocos]
              if (!bloco) return null
              const ativo = 'ativo' in bloco ? bloco.ativo : true
              const aberto = blocoAberto === key
              return (
                <div key={key}>
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moverBloco(index, -1)} disabled={index === 0} className="rounded p-0.5 text-[#82939a] hover:bg-[#f1f5f6] hover:text-[#12232b] disabled:opacity-30" title="Subir">
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button onClick={() => moverBloco(index, 1)} disabled={index === conteudo.ordem.length - 1} className="rounded p-0.5 text-[#82939a] hover:bg-[#f1f5f6] hover:text-[#12232b] disabled:opacity-30" title="Descer">
                        <ChevronDown className="size-3.5" />
                      </button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">#{index + 1}</span>
                        <h3 className={`text-sm font-semibold ${ativo ? 'text-[#243942]' : 'text-[#a0afb4] line-through'}`}>
                          {BLOCO_LABELS[key] || key}
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => alternarAtivo(key)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                        ativo ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]' : 'border-[#dce5e8] bg-white text-[#82939a]'
                      }`}
                    >
                      {ativo ? <><Eye className="size-3.5" /> Visível</> : <><EyeOff className="size-3.5" /> Oculto</>}
                    </button>
                    <button
                      onClick={() => setBlocoAberto(aberto ? null : key)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#b8c9ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#30454e] hover:border-[#0d9488] hover:text-[#0f766e]"
                    >
                      {aberto ? 'Fechar' : 'Editar'}
                    </button>
                  </div>

                  {aberto && (
                    <div className="border-t border-[#f0f4f5] bg-[#fafcfc] px-5 py-5">
                      {key === 'hero' && <EditorHero bloco={bloco as ConteudoHome['blocos']['hero']} onChange={(d) => atualizarBloco('hero', d)} />}
                      {key === 'segmentos' && <EditorSegmentos bloco={bloco as ConteudoHome['blocos']['segmentos']} onChange={(d) => atualizarBloco('segmentos', d)} />}
                      {key === 'diferenciais' && <EditorDiferenciais bloco={bloco as ConteudoHome['blocos']['diferenciais']} onChange={(d) => atualizarBloco('diferenciais', d)} />}
                      {key === 'noticias' && <EditorNoticias bloco={bloco as ConteudoHome['blocos']['noticias']} onChange={(d) => atualizarBloco('noticias', d)} />}
                      {key === 'cta_final' && <EditorCtaFinal bloco={bloco as ConteudoHome['blocos']['cta_final']} onChange={(d) => atualizarBloco('cta_final', d)} />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Panel>
      </main>
    </AdminShell>
  )
}

function CampoTexto({ label, valor, onChange, placeholder }: { label: string; valor: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-[#536871]">{label}</label>
      <input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
      />
    </div>
  )
}

function CampoTextoLongo({ label, valor, onChange, rows = 3, placeholder }: { label: string; valor: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-[#536871]">{label}</label>
      <textarea
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
      />
    </div>
  )
}

function EditorHero({ bloco, onChange }: { bloco: ConteudoHome['blocos']['hero']; onChange: (d: Partial<ConteudoHome['blocos']['hero']>) => void }) {
  function adicionarBanner() {
    const banner: BannerHero = { id: gerarId(), url: '', titulo: '', subtitulo: '' }
    onChange({ banners: [...bloco.banners, banner] })
  }

  function removerBanner(id: string) {
    onChange({ banners: bloco.banners.filter((b) => b.id !== id) })
  }

  function editarBanner(id: string, dados: Partial<BannerHero>) {
    onChange({ banners: bloco.banners.map((b) => b.id === id ? { ...b, ...dados } : b) })
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <CampoTexto label="Título principal" valor={bloco.titulo} onChange={(v) => onChange({ titulo: v })} />
        <CampoTexto label="Destaque do título (cor teal)" valor={bloco.titulo_destaque} onChange={(v) => onChange({ titulo_destaque: v })} />
      </div>
      <CampoTextoLongo label="Subtítulo" valor={bloco.subtitulo} onChange={(v) => onChange({ subtitulo: v })} rows={2} />
      <div className="grid gap-4 lg:grid-cols-2">
        <CampoTexto label="Botão primário (texto)" valor={bloco.cta_primario_label} onChange={(v) => onChange({ cta_primario_label: v })} />
        <CampoTexto label="Botão primário (destino)" valor={bloco.cta_primario_href} onChange={(v) => onChange({ cta_primario_href: v })} placeholder="/matricula" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CampoTexto label="Botão secundário (texto)" valor={bloco.cta_secundario_label} onChange={(v) => onChange({ cta_secundario_label: v })} />
        <CampoTexto label="Botão secundário (destino)" valor={bloco.cta_secundario_href} onChange={(v) => onChange({ cta_secundario_href: v })} placeholder="#a-escola" />
      </div>

      <div className="rounded-lg border border-[#e5ecee] bg-white p-4">
        <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Tempo de rotação do carrossel (segundos)</label>
        <input
          type="number"
          min={2}
          max={20}
          value={bloco.intervalo_segundos}
          onChange={(e) => onChange({ intervalo_segundos: parseInt(e.target.value, 10) || 5 })}
          className="w-32 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]"
        />
      </div>

      <div className="rounded-lg border border-[#e5ecee] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="size-4 text-[#0d9488]" />
            <p className="text-sm font-semibold text-[#243942]">Banners do carrossel ({bloco.banners.length})</p>
          </div>
          <button onClick={adicionarBanner} className="inline-flex items-center gap-1.5 rounded-lg border border-[#b8c9ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#30454e] hover:border-[#0d9488] hover:text-[#0f766e]">
            <Plus className="size-3.5" /> Adicionar banner
          </button>
        </div>
        <p className="mb-4 text-xs text-[#82939a]">
          Se você não adicionar banners, o hero mostra um card decorativo. Se adicionar, o carrossel é ativado.
        </p>

        {bloco.banners.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#a0afb4]">Nenhum banner adicionado ainda.</p>
        ) : (
          <div className="space-y-4">
            {bloco.banners.map((b, i) => (
              <div key={b.id} className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Banner {i + 1}</p>
                  <button onClick={() => removerBanner(b.id)} className="rounded p-1 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]" title="Remover banner">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <BannerUpload urlAtual={b.url} onUploaded={(url) => editarBanner(b.id, { url })} />
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={b.titulo}
                    onChange={(e) => editarBanner(b.id, { titulo: e.target.value })}
                    placeholder="Título sobre a imagem (opcional)"
                    className="w-full rounded border border-[#d5e0e3] bg-white px-2 py-1.5 text-xs text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                  />
                  <input
                    type="text"
                    value={b.subtitulo}
                    onChange={(e) => editarBanner(b.id, { subtitulo: e.target.value })}
                    placeholder="Subtítulo (opcional)"
                    className="w-full rounded border border-[#d5e0e3] bg-white px-2 py-1.5 text-xs text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EditorSegmentos({ bloco, onChange }: { bloco: ConteudoHome['blocos']['segmentos']; onChange: (d: Partial<ConteudoHome['blocos']['segmentos']>) => void }) {
  function editarItem(id: string, dados: Partial<{ titulo: string; descricao: string }>) {
    onChange({ itens: bloco.itens.map((i) => i.id === id ? { ...i, ...dados } : i) })
  }
  function adicionarItem() {
    onChange({ itens: [...bloco.itens, { id: gerarId(), titulo: 'Novo segmento', descricao: 'Descrição do segmento.' }] })
  }
  function removerItem(id: string) {
    onChange({ itens: bloco.itens.filter((i) => i.id !== id) })
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <CampoTexto label="Eyebrow" valor={bloco.eyebrow} onChange={(v) => onChange({ eyebrow: v })} />
        <CampoTexto label="Título" valor={bloco.titulo} onChange={(v) => onChange({ titulo: v })} />
      </div>
      <CampoTextoLongo label="Descrição" valor={bloco.descricao} onChange={(v) => onChange({ descricao: v })} rows={2} />

      <div className="rounded-lg border border-[#e5ecee] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#243942]">Segmentos ({bloco.itens.length})</p>
          <button onClick={adicionarItem} className="inline-flex items-center gap-1.5 rounded-lg border border-[#b8c9ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#30454e] hover:border-[#0d9488] hover:text-[#0f766e]">
            <Plus className="size-3.5" /> Adicionar
          </button>
        </div>
        <div className="space-y-2">
          {bloco.itens.map((i) => (
            <div key={i.id} className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <input type="text" value={i.titulo} onChange={(e) => editarItem(i.id, { titulo: e.target.value })} className="w-full rounded border border-[#d5e0e3] bg-white px-2 py-1.5 text-sm font-semibold text-[#243942] outline-none focus:border-[#0d9488]" />
                  <textarea value={i.descricao} onChange={(e) => editarItem(i.id, { descricao: e.target.value })} rows={2} className="w-full resize-none rounded border border-[#d5e0e3] bg-white px-2 py-1.5 text-xs text-[#243942] outline-none focus:border-[#0d9488]" />
                </div>
                <button onClick={() => removerItem(i.id)} className="rounded p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EditorDiferenciais({ bloco, onChange }: { bloco: ConteudoHome['blocos']['diferenciais']; onChange: (d: Partial<ConteudoHome['blocos']['diferenciais']>) => void }) {
  function editarItem(id: string, dados: Partial<{ titulo: string; descricao: string }>) {
    onChange({ itens: bloco.itens.map((i) => i.id === id ? { ...i, ...dados } : i) })
  }
  function adicionarItem() {
    onChange({ itens: [...bloco.itens, { id: gerarId(), titulo: 'Novo diferencial', descricao: 'Descrição.' }] })
  }
  function removerItem(id: string) {
    onChange({ itens: bloco.itens.filter((i) => i.id !== id) })
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <CampoTexto label="Eyebrow" valor={bloco.eyebrow} onChange={(v) => onChange({ eyebrow: v })} />
        <CampoTexto label="Título (use {escola} para inserir o nome da escola)" valor={bloco.titulo} onChange={(v) => onChange({ titulo: v })} />
      </div>

      <div className="rounded-lg border border-[#e5ecee] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#243942]">Diferenciais ({bloco.itens.length})</p>
          <button onClick={adicionarItem} className="inline-flex items-center gap-1.5 rounded-lg border border-[#b8c9ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#30454e] hover:border-[#0d9488] hover:text-[#0f766e]">
            <Plus className="size-3.5" /> Adicionar
          </button>
        </div>
        <div className="space-y-2">
          {bloco.itens.map((i) => (
            <div key={i.id} className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <input type="text" value={i.titulo} onChange={(e) => editarItem(i.id, { titulo: e.target.value })} className="w-full rounded border border-[#d5e0e3] bg-white px-2 py-1.5 text-sm font-semibold text-[#243942] outline-none focus:border-[#0d9488]" />
                  <textarea value={i.descricao} onChange={(e) => editarItem(i.id, { descricao: e.target.value })} rows={2} className="w-full resize-none rounded border border-[#d5e0e3] bg-white px-2 py-1.5 text-xs text-[#243942] outline-none focus:border-[#0d9488]" />
                </div>
                <button onClick={() => removerItem(i.id)} className="rounded p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EditorNoticias({ bloco, onChange }: { bloco: ConteudoHome['blocos']['noticias']; onChange: (d: Partial<ConteudoHome['blocos']['noticias']>) => void }) {
  function editarItem(id: string, dados: Partial<{ slug: string; data: string; titulo: string; categoria: string; resumo: string; corpo: string; imagem_url: string }>) {
    onChange({ itens: bloco.itens.map((i) => i.id === id ? { ...i, ...dados } : i) })
  }
  function adicionarItem() {
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace('.', '')
    onChange({
      itens: [
        ...bloco.itens,
        {
          id: gerarId(),
          slug: '',
          data: hoje,
          titulo: 'Nova notícia',
          categoria: 'Geral',
          resumo: '',
          corpo: '',
          imagem_url: '',
        },
      ],
    })
  }
  function removerItem(id: string) {
    onChange({ itens: bloco.itens.filter((i) => i.id !== id) })
  }
  function regerarSlug(id: string, titulo: string) {
    editarItem(id, { slug: gerarSlug(titulo) })
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <CampoTexto label="Eyebrow" valor={bloco.eyebrow} onChange={(v) => onChange({ eyebrow: v })} />
        <CampoTexto label="Título" valor={bloco.titulo} onChange={(v) => onChange({ titulo: v })} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Quantidade exibida na home</label>
        <input
          type="number"
          min={1}
          max={6}
          value={bloco.quantidade}
          onChange={(e) => onChange({ quantidade: parseInt(e.target.value, 10) || 3 })}
          className="w-32 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]"
        />
      </div>

      <div className="rounded-lg border border-[#e5ecee] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#243942]">Notícias ({bloco.itens.length})</p>
          <button onClick={adicionarItem} className="inline-flex items-center gap-1.5 rounded-lg border border-[#b8c9ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#30454e] hover:border-[#0d9488] hover:text-[#0f766e]">
            <Plus className="size-3.5" /> Adicionar notícia
          </button>
        </div>

        {bloco.itens.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#a0afb4]">Nenhuma notícia cadastrada.</p>
        ) : (
          <div className="space-y-4">
            {bloco.itens.map((n, i) => (
              <div key={n.id} className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Notícia {i + 1}</p>
                  <button onClick={() => removerItem(n.id)} className="rounded p-1 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={n.data}
                    onChange={(e) => editarItem(n.id, { data: e.target.value })}
                    placeholder="Data (ex: 12 OUT 2026)"
                    className="w-full rounded border border-[#d5e0e3] bg-white px-2 py-1.5 text-xs text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                  />
                  <input
                    type="text"
                    value={n.categoria}
                    onChange={(e) => editarItem(n.id, { categoria: e.target.value })}
                    placeholder="Categoria"
                    className="w-full rounded border border-[#d5e0e3] bg-white px-2 py-1.5 text-xs text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                  />
                </div>

                <input
                  type="text"
                  value={n.titulo}
                  onChange={(e) => editarItem(n.id, { titulo: e.target.value })}
                  placeholder="Título da notícia"
                  className="mt-2 w-full rounded border border-[#d5e0e3] bg-white px-2 py-1.5 text-sm font-semibold text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                />

                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={n.slug}
                    onChange={(e) => editarItem(n.id, { slug: e.target.value })}
                    placeholder="URL amigável (slug)"
                    className="flex-1 rounded border border-[#d5e0e3] bg-white px-2 py-1.5 text-xs text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                  />
                  <button
                    type="button"
                    onClick={() => regerarSlug(n.id, n.titulo)}
                    className="inline-flex items-center gap-1 rounded border border-[#b8c9ce] bg-white px-2 py-1.5 text-xs font-semibold text-[#30454e] hover:border-[#0d9488] hover:text-[#0f766e]"
                    title="Gerar slug a partir do título"
                  >
                    <RefreshCw className="size-3" /> Gerar
                  </button>
                </div>

                <textarea
                  value={n.resumo}
                  onChange={(e) => editarItem(n.id, { resumo: e.target.value })}
                  rows={2}
                  placeholder="Resumo curto (aparece no card da home)"
                  className="mt-2 w-full resize-none rounded border border-[#d5e0e3] bg-white px-2 py-1.5 text-xs text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                />

                <textarea
                  value={n.corpo}
                  onChange={(e) => editarItem(n.id, { corpo: e.target.value })}
                  rows={6}
                  placeholder="Conteúdo completo da notícia (aparece na página de detalhe)"
                  className="mt-2 w-full resize-none rounded border border-[#d5e0e3] bg-white px-2 py-1.5 text-xs leading-5 text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                />

                <div className="mt-2">
                  <BannerUpload urlAtual={n.imagem_url} onUploaded={(url) => editarItem(n.id, { imagem_url: url })} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EditorCtaFinal({ bloco, onChange }: { bloco: ConteudoHome['blocos']['cta_final']; onChange: (d: Partial<ConteudoHome['blocos']['cta_final']>) => void }) {
  return (
    <div className="space-y-5">
      <CampoTexto label="Eyebrow" valor={bloco.eyebrow} onChange={(v) => onChange({ eyebrow: v })} />
      <CampoTexto label="Título" valor={bloco.titulo} onChange={(v) => onChange({ titulo: v })} />
      <div className="grid gap-4 lg:grid-cols-2">
        <CampoTexto label="Botão (texto)" valor={bloco.cta_label} onChange={(v) => onChange({ cta_label: v })} />
        <CampoTexto label="Botão (destino)" valor={bloco.cta_href} onChange={(v) => onChange({ cta_href: v })} />
      </div>
    </div>
  )
}