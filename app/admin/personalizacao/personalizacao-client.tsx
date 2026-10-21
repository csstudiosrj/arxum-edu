'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Palette, Image as ImageIcon, Check, Loader2, Save, Globe, Sparkles,
  ArrowRight, Info, Lock, Crown,
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { BannerUpload } from '@/components/banner-upload'
import { ativarAddon, desativarAddon, salvarIdentidade, type AddonDisponivel } from './actions'
import type { EscolaCompleta } from '@/lib/auth/escola-atual'

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

// Paleta de cores sugeridas. O primeiro item (#0d9488) é o teal ARXUM padrão,
// mantido hardcoded porque é uma opção da paleta — não a cor da marca.
const CORES_SUGERIDAS = [
  '#0d9488', '#2563eb', '#7c3aed', '#dc2626', '#d97706',
  '#059669', '#0891b2', '#be185d', '#4f46e5', '#b45309',
]

export function PersonalizacaoClient({
  escola,
  addons,
}: {
  escola: EscolaCompleta | null
  addons: AddonDisponivel[]
}) {
  const router = useRouter()

  const [logoUrl, setLogoUrl] = useState(escola?.logo_url || '')
  const [cor, setCor] = useState(escola?.cor_primaria || '#0d9488')
  const [salvando, setSalvando] = useState(false)
  const [salvou, setSalvou] = useState(false)
  const [erro, setErro] = useState('')
  const [processandoAddon, setProcessandoAddon] = useState<string | null>(null)

  const brandingAtivo = addons.find((a) => a.slug === 'branding')?.ativo_para_escola || false

  async function handleSalvar() {
    setSalvando(true)
    setErro('')
    setSalvou(false)

    const r = await salvarIdentidade({
      logo_url: logoUrl || null,
      cor_primaria: cor,
    })

    setSalvando(false)

    if (!r.success) {
      setErro(r.error || 'Erro ao salvar.')
      return
    }

    setSalvou(true)
    router.refresh()
    setTimeout(() => setSalvou(false), 2500)
  }

  async function handleToggleAddon(addon: AddonDisponivel) {
    setProcessandoAddon(addon.slug)
    const r = addon.ativo_para_escola
      ? await desativarAddon(addon.slug)
      : await ativarAddon(addon.slug)
    setProcessandoAddon(null)
    if (!r.success) { alert(r.error || 'Erro.'); return }
    router.refresh()
  }

  if (!escola) {
    return (
      <AdminShell mode="school" active="Personalização">
        <main className="px-5 py-8 lg:px-8">
          <SectionHeading eyebrow="Administração" title="Personalização" />
          <div className="mt-8 rounded-xl border border-[#dce5e8] bg-white p-8 text-center">
            <p className="text-sm text-[#82939a]">Escola não encontrada.</p>
          </div>
        </main>
      </AdminShell>
    )
  }

  return (
    <AdminShell mode="school" active="Personalização">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Administração"
            title="Personalização"
            description="Customize a identidade visual da sua escola e gerencie os add-ons ativos."
          />
          <div className="flex items-center gap-2">
            {salvou && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#d1fae5] px-3 py-1.5 text-xs font-semibold text-[#065f46]">
                <Check className="size-3.5" /> Salvo
              </span>
            )}
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
            >
              {salvando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {salvando ? 'Salvando...' : 'Salvar identidade'}
            </button>
          </div>
        </div>

        {erro && (
          <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">{erro}</div>
        )}

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className="grid size-9 place-items-center rounded-lg"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                  color: 'var(--cor-primaria, #0d9488)',
                }}
              >
                <Palette className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Identidade visual</h2>
                <p className="text-xs text-[#82939a]">Logo e cor primária da escola.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 lg:p-6">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#536871]">
                <ImageIcon className="size-3.5" /> Logotipo da escola
              </label>
              <p className="mb-3 text-xs text-[#82939a]">
                Aparece no cabeçalho do site, na tela de login e nas sidebars dos portais (quando o add-on "Branding" está ativo).
                Recomendado: PNG com fundo transparente, altura mínima de 200px.
              </p>
              <BannerUpload urlAtual={logoUrl} onUploaded={setLogoUrl} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Cor primária</label>
              <p className="mb-3 text-xs text-[#82939a]">
                Aplicada em botões, links e detalhes no site público da escola e nos portais (quando o branding está ativo).
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="color"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  className="size-14 cursor-pointer rounded-lg border border-[#d5e0e3] bg-white"
                />
                <input
                  type="text"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  className="w-32 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 font-mono text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]"
                />
                <div className="flex gap-1.5">
                  {CORES_SUGERIDAS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCor(c)}
                      className={`size-8 rounded-lg border-2 transition ${cor === c ? 'border-[#12232b]' : 'border-transparent hover:border-[#d5e0e3]'}`}
                      style={{ backgroundColor: c }}
                      aria-label={`Usar cor ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#82939a]">Pré-visualização</p>
              <div className="rounded-lg border border-[#e5ecee] bg-white p-4">
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-8 w-auto max-w-[140px] object-contain" />
                  ) : (
                    <div className="font-syne text-lg font-black tracking-[-.03em]" style={{ color: cor }}>
                      {escola.nome.split(' ')[0]}
                    </div>
                  )}
                  <button
                    className="ml-auto rounded-lg px-4 py-2 text-xs font-semibold text-white"
                    style={{ backgroundColor: cor }}
                  >
                    Botão primário
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="mt-6">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]">
                <Crown className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Add-ons disponíveis</h2>
                <p className="text-xs text-[#82939a]">Ative recursos extras e expanda a experiência da sua escola.</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#f0f4f5]">
            {addons.map((a) => (
              <div key={a.slug} className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#12232b]">{a.nome}</h3>
                    {a.ativo_para_escola && (
                      <span className="rounded-full bg-[#d1fae5] px-2 py-0.5 text-[10px] font-bold text-[#065f46]">Ativo</span>
                    )}
                  </div>
                  {a.descricao && (
                    <p className="mt-1 text-xs leading-5 text-[#82939a]">{a.descricao}</p>
                  )}
                  <p
                    className="mt-2 font-syne text-base font-bold"
                    style={{ color: a.ativo_para_escola ? '#065f46' : 'var(--cor-primaria, #0d9488)' }}
                  >
                    {a.preco_centavos > 0 ? `${formatarMoeda(a.preco_centavos)}/mês` : 'Incluso'}
                  </p>
                </div>

                <button
                  onClick={() => handleToggleAddon(a)}
                  disabled={processandoAddon === a.slug}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition hover:brightness-90 disabled:opacity-50 ${
                    a.ativo_para_escola
                      ? 'border border-[#dc2626] bg-white text-[#dc2626] hover:bg-[#fee2e2]'
                      : 'text-white'
                  }`}
                  style={!a.ativo_para_escola ? { backgroundColor: 'var(--cor-primaria, #0d9488)' } : undefined}
                >
                  {processandoAddon === a.slug ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : a.ativo_para_escola ? (
                    <Lock className="size-4" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {processandoAddon === a.slug ? 'Processando...' : a.ativo_para_escola ? 'Desativar' : 'Ativar add-on'}
                </button>
              </div>
            ))}

            {addons.length === 0 && (
              <div className="px-5 py-12 text-center">
                <Info className="mx-auto text-[#a0afb4]" size={28} />
                <p className="mt-3 text-sm text-[#82939a]">Nenhum add-on disponível no momento.</p>
              </div>
            )}
          </div>

          {brandingAtivo && (
            <div className="border-t border-[#e5ecee] bg-[#f0fbf8] px-5 py-4">
              <div className="flex items-start gap-3">
                <div
                  className="grid size-8 shrink-0 place-items-center rounded-lg"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                    color: 'var(--cor-primaria, #0d9488)',
                  }}
                >
                  <Check className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--cor-primaria, #0d9488)' }}>Branding ativo nos portais</p>
                  <p className="mt-0.5 text-xs leading-5 text-[#536871]">
                    Seu logo e cor serão aplicados nas telas do responsável, do aluno e do professor. A assinatura "by ARXUM Edu" continua visível em todas as telas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Panel>

        <div className="mt-6 rounded-xl border border-[#e5ecee] bg-[#fafcfc] p-5">
          <p className="text-xs leading-6 text-[#82939a]">
            <strong className="text-[#536871]">Precisa de mais?</strong> Domínio próprio, integrações customizadas e onboarding assistido estão disponíveis sob consulta.
            {' '}
            <a href="mailto:contato@arxum.com.br" className="font-semibold transition hover:brightness-90" style={{ color: 'var(--cor-primaria, #0d9488)' }}>
              Fale com o time ARXUM <ArrowRight className="ml-0.5 inline size-3" />
            </a>
          </p>
        </div>
      </main>
    </AdminShell>
  )
}