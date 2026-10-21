'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, Copy, ArrowRight, Mail, Loader2 } from 'lucide-react'
import { PublicHeader, PublicFooter } from '@/components/arxum-brand'
import { createClient } from '@/lib/supabase/client'

function SucessoContent() {
  const params = useSearchParams()
  const protocolo = params.get('protocolo') || ''
  const email = params.get('email') || ''
  const [copiado, setCopiado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  function copiar() {
    navigator.clipboard.writeText(protocolo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function enviarAcesso() {
    if (!email) {
      setErro('E-mail não informado.')
      return
    }
    setEnviando(true)
    setErro('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/responsavel`,
      },
    })

    setEnviando(false)

    if (error) {
      setErro('Não foi possível enviar o link. Tente novamente em alguns minutos.')
      return
    }

    setEnviado(true)
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 lg:px-8">
      <div
        className="grid size-16 place-items-center rounded-full"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, transparent)',
          color: 'var(--cor-primaria, #0d9488)',
        }}
      >
        <Check className="size-8" />
      </div>
      <h1 className="mt-6 text-center font-syne text-4xl font-bold tracking-[-.04em] text-white">
        Inscrição enviada!
      </h1>
      <p className="mt-4 max-w-md text-center text-sm leading-6 text-[#8aa0ad]">
        Recebemos os dados do aluno. A escola fará a análise das informações e entrará em contato.
      </p>

      <div className="mt-10 w-full rounded-xl border border-white/[.08] bg-[#0e151a] p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#5e7a94]">Número de protocolo</p>
        <div className="mt-3 flex items-center justify-between gap-4">
          <span className="font-mono text-2xl font-bold tracking-wider text-white">{protocolo || '—'}</span>
          <button
            onClick={copiar}
            disabled={!protocolo}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#c7d5db] transition hover:border-[var(--cor-primaria,#0d9488)] hover:text-white disabled:opacity-40"
          >
            {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <p className="mt-4 text-xs leading-5 text-[#82939a]">
          Guarde este número. Você poderá usá-lo para consultar o status da inscrição.
        </p>
      </div>

      <div className="mt-8 w-full rounded-xl border border-white/[.08] bg-[#0e151a] p-6">
        <div className="flex items-start gap-3">
          <div
            className="grid size-9 shrink-0 place-items-center rounded-lg"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, transparent)',
              color: 'var(--cor-primaria, #0d9488)',
            }}
          >
            <Mail className="size-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">Acompanhe pela área do responsável</h3>
            <p className="mt-1 text-xs leading-5 text-[#82939a]">
              Enviaremos um link de acesso para <strong className="text-[#c7d5db]">{email || 'seu e-mail'}</strong>. Por lá você acompanha o status da matrícula, envia documentos e recebe comunicados.
            </p>

            {!enviado ? (
              <button
                onClick={enviarAcesso}
                disabled={enviando || !email}
                className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
              >
                {enviando ? <><Loader2 className="size-4 animate-spin" /> Enviando...</> : <>Receber link de acesso <ArrowRight className="size-4" /></>}
              </button>
            ) : (
              <div
                className="mt-4 flex items-start gap-2 rounded-lg border px-3 py-2.5"
                style={{
                  borderColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 30%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 10%, transparent)',
                }}
              >
                <Check
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: 'var(--cor-primaria, #0d9488)' }}
                />
                <p className="text-xs leading-5 text-[#c7d5db]">
                  Link enviado! Verifique sua caixa de entrada (e a pasta de spam) e clique no link para acessar.
                </p>
              </div>
            )}

            {erro && <p className="mt-3 text-xs text-red-400">{erro}</p>}
          </div>
        </div>
      </div>

      <Link
        href="/"
        className="mt-10 flex items-center gap-2 rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-[#c7d5db] transition hover:border-white/30"
      >
        Voltar para a página inicial
      </Link>
    </main>
  )
}

export default function SucessoPage() {
  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]">
      <PublicHeader />
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <p className="text-sm text-[#5e7a94]">Carregando...</p>
          </div>
        }
      >
        <SucessoContent />
      </Suspense>
      <PublicFooter />
    </div>
  )
}