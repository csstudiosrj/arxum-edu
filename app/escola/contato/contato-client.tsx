'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, MapPin, Phone, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { PublicFooter, PublicHeader } from '@/components/arxum-brand'
import { getFontePar } from '@/lib/fonts'
import type { PaginaContato } from '@/lib/cms/defaults'
import { enviarMensagemContato } from '@/lib/cms/actions'

type EscolaInfo = {
  endereco: string | null
  cidade: string | null
  estado: string | null
  telefone: string | null
  email_contato: string | null
}

export function ContatoClient({
  escolaNome,
  slug,
  fontePar,
  pagina,
  cor,
  logoUrl,
  escola,
}: {
  escolaNome: string
  slug: string
  fontePar: string | null
  pagina: PaginaContato
  cor: string
  logoUrl: string | null
  escola: EscolaInfo
}) {
  const base = `/edu/${slug}`
  const par = getFontePar(fontePar)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  const estiloFontes = {
    '--font-heading-active': `var(${par.headingVar})`,
    '--font-body-active': `var(${par.bodyVar})`,
    '--cor-primaria': cor,
  } as React.CSSProperties

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) return setErro('Informe seu nome.')
    if (!email.trim()) return setErro('Informe seu e-mail.')
    if (!mensagem.trim()) return setErro('Escreva sua mensagem.')

    setEnviando(true)
    const r = await enviarMensagemContato({ nome, email, telefone, assunto, mensagem })
    setEnviando(false)

    if (!r.success) {
      setErro(r.error || 'Erro ao enviar.')
      return
    }

    setSucesso(true)
    setNome(''); setEmail(''); setTelefone(''); setAssunto(''); setMensagem('')
    setTimeout(() => setSucesso(false), 6000)
  }

  const enderecoCompleto = [escola.endereco, escola.cidade, escola.estado].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]" style={estiloFontes}>
      <PublicHeader slug={slug} cor={cor} logoUrl={logoUrl} escolaNome={escolaNome} />

      <main className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <Link href={base} className="inline-flex items-center gap-2 text-sm text-[#8aa0ad] hover:text-white">
          <ArrowLeft className="size-4" /> Voltar para a home
        </Link>

        <div className="mt-10 mb-12 max-w-3xl">
          {pagina.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[.18em]" style={{ color: cor }}>{pagina.eyebrow}</p>
          )}
          <h1 className="mt-3 font-heading text-4xl font-bold tracking-[-.04em] text-white sm:text-5xl">
            {pagina.titulo}
          </h1>
          {pagina.subtitulo && (
            <p className="mt-5 text-lg leading-8 text-[#8aa0ad]">{pagina.subtitulo}</p>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <form onSubmit={handleSubmit} className="rounded-xl border border-white/[.08] bg-[#0e151a] p-6 lg:p-8">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">
                    Seu nome <span className="text-[#dc2626]">*</span>
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#5e7a94]"
                    placeholder="Como podemos te chamar"
                    style={{ '--tw-ring-color': cor } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">
                    E-mail <span className="text-[#dc2626]">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#5e7a94]"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">Telefone</label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#5e7a94]"
                    placeholder="(21) 90000-0000"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">Assunto</label>
                  <input
                    type="text"
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#5e7a94]"
                    placeholder="Ex: Informações sobre matrícula"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">
                  Mensagem <span className="text-[#dc2626]">*</span>
                </label>
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  rows={6}
                  className="w-full resize-none rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#5e7a94]"
                  placeholder="Como podemos ajudar?"
                />
              </div>

              {erro && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</p>
              )}

              {sucesso && (
                <div className="flex items-center gap-3 rounded-lg border px-3 py-3 text-sm text-[#c7d5db]" style={{ borderColor: `${cor}30`, backgroundColor: `${cor}10` }}>
                  <CheckCircle2 className="size-5 shrink-0" style={{ color: cor }} />
                  {pagina.mensagem_sucesso}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
                style={{ backgroundColor: cor }}
              >
                {enviando ? <><Loader2 className="size-4 animate-spin" /> Enviando...</> : <><Send className="size-4" /> Enviar mensagem</>}
              </button>
            </div>
          </form>

          <aside className="space-y-4">
            {(escola.telefone || escola.email_contato) && (
              <div className="rounded-xl border border-white/[.08] bg-[#0e151a] p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: cor }}>Contato direto</h3>
                <div className="mt-4 space-y-3">
                  {escola.telefone && (
                    <div className="flex items-center gap-3 text-sm text-[#c7d5db]">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${cor}15`, color: cor }}>
                        <Phone className="size-4" />
                      </div>
                      <a href={`tel:${escola.telefone.replace(/\D/g, '')}`} className="hover:text-white">
                        {escola.telefone}
                      </a>
                    </div>
                  )}
                  {escola.email_contato && (
                    <div className="flex items-center gap-3 text-sm text-[#c7d5db]">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${cor}15`, color: cor }}>
                        <Mail className="size-4" />
                      </div>
                      <a href={`mailto:${escola.email_contato}`} className="break-all hover:text-white">
                        {escola.email_contato}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {enderecoCompleto && (
              <div className="rounded-xl border border-white/[.08] bg-[#0e151a] p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: cor }}>Endereço</h3>
                <div className="mt-4 flex gap-3 text-sm text-[#c7d5db]">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${cor}15`, color: cor }}>
                    <MapPin className="size-4" />
                  </div>
                  <p className="leading-6">{enderecoCompleto}</p>
                </div>
              </div>
            )}

            <div className="rounded-xl border p-5" style={{ borderColor: `${cor}30`, backgroundColor: `${cor}10` }}>
              <h3 className="font-heading text-base font-bold text-white">Prefere matrícula direta?</h3>
              <p className="mt-2 text-xs leading-5 text-[#c7d5db]/80">
                Faça a inscrição online em menos de 10 minutos.
              </p>
              <Link
                href={`${base}/matricula`}
                className="mt-4 inline-block rounded-lg px-4 py-2 text-xs font-semibold text-white transition hover:brightness-90"
                style={{ backgroundColor: cor }}
              >
                Ir para matrícula
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <PublicFooter slug={slug} cor={cor} escolaNome={escolaNome} />
    </div>
  )
}