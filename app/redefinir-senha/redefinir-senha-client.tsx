'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Estado = 'verificando' | 'pronto' | 'invalido' | 'sucesso'

export function RedefinirSenhaClient() {
  const router = useRouter()
  const [estado, setEstado] = useState<Estado>('verificando')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    async function verificar() {
      try {
        const supabase = createClient()

        // Se o link de recuperação é válido, o Supabase já ativa a sessão temporária.
        const { data: { session } } = await supabase.auth.getSession()

        if (!ativo) return

        if (session) {
          setEstado('pronto')
        } else {
          // Alguns fluxos entregam um hash no client que precisa ser processado
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setEstado('pronto')
          } else {
            setEstado('invalido')
          }
        }
      } catch {
        if (ativo) setEstado('invalido')
      }
    }

    verificar()

    return () => {
      ativo = false
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmacao) {
      setErro('As senhas não coincidem.')
      return
    }

    setEnviando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })
    setEnviando(false)

    if (error) {
      setErro(error.message || 'Erro ao redefinir senha.')
      return
    }

    setEstado('sucesso')
    setTimeout(() => {
      router.push('/login')
      router.refresh()
    }, 3000)
  }

  if (estado === 'verificando') {
    return (
      <div className="text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#0d9488]/15 text-[#0d9488]">
          <Loader2 className="size-7 animate-spin" />
        </div>
        <h1 className="mt-6 text-xl font-bold text-white">Verificando link...</h1>
        <p className="mt-2 text-sm text-[#8aa0ad]">Só um instante.</p>
      </div>
    )
  }

  if (estado === 'invalido') {
    return (
      <div className="text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#fee2e2]/15 text-[#dc2626]">
          <AlertCircle className="size-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">Link expirado ou inválido</h1>
        <p className="mt-3 text-sm leading-6 text-[#8aa0ad]">
          Este link já foi usado ou expirou. Solicite um novo para continuar.
        </p>
        <Link
          href="/esqueci-senha"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0f766e]"
        >
          Pedir novo link <ArrowRight className="size-4" />
        </Link>
      </div>
    )
  }

  if (estado === 'sucesso') {
    return (
      <div className="text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#0d9488]/15 text-[#0d9488]">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">Senha redefinida!</h1>
        <p className="mt-3 text-sm leading-6 text-[#8aa0ad]">
          Sua senha foi alterada com sucesso. Você será redirecionado para o login.
        </p>
        <div className="mt-6 flex justify-center">
          <Loader2 className="size-5 animate-spin text-[#0d9488]" />
        </div>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-center text-2xl font-bold text-white">Definir nova senha</h1>
      <p className="mt-2 text-center text-sm text-[#8aa0ad]">
        Escolha uma senha forte com pelo menos 8 caracteres.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#c7d5db]">Nova senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5e7a94]" />
            <input
              type={showSenha ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg border border-white/10 bg-[#0b1115] py-2.5 pl-10 pr-20 text-sm text-white outline-none placeholder:text-[#5e7a94] focus:border-[#0d9488]"
            />
            <button
              type="button"
              onClick={() => setShowSenha(!showSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5e7a94] hover:text-white"
            >
              {showSenha ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#c7d5db]">Confirme a nova senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5e7a94]" />
            <input
              type={showSenha ? 'text' : 'password'}
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              required
              placeholder="Repita a senha"
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
            <><Loader2 className="size-4 animate-spin" /> Salvando...</>
          ) : (
            'Redefinir senha'
          )}
        </button>
      </form>
    </>
  )
}