'use client'

import { useState } from 'react'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function EsqueciSenhaClient() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!email.includes('@')) {
      setErro('Informe um e-mail válido.')
      return
    }

    setEnviando(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://arxum.com.br/redefinir-senha',
    })

    setEnviando(false)

    if (error) {
      setErro(error.message || 'Erro ao enviar e-mail. Tente novamente.')
      return
    }

    setSucesso(true)
  }

  if (sucesso) {
    return (
      <div className="text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#0d9488]/15 text-[#0d9488]">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">Verifique seu e-mail</h1>
        <p className="mt-3 text-sm leading-6 text-[#8aa0ad]">
          Se existir uma conta com o e-mail <strong className="text-[#c7d5db]">{email}</strong>, você receberá um link para redefinir sua senha em instantes.
        </p>
        <p className="mt-4 text-xs text-[#5e7a94]">
          Não recebeu? Verifique a pasta de spam ou tente novamente em alguns minutos.
        </p>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-center text-2xl font-bold text-white">Recuperar senha</h1>
      <p className="mt-2 text-center text-sm text-[#8aa0ad]">
        Informe seu e-mail e enviaremos um link para redefinir sua senha.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#c7d5db]">
            E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5e7a94]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-white/10 bg-[#0b1115] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#5e7a94] focus:border-[#0d9488]"
            />
          </div>
        </div>

        {erro && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-50"
        >
          {enviando ? (
            <><Loader2 className="size-4 animate-spin" /> Enviando...</>
          ) : (
            'Enviar link de recuperação'
          )}
        </button>
      </form>
    </>
  )
}