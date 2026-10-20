'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Loader2, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ArxumBrand } from '@/components/arxum-brand'

type Estado = 'verificando' | 'pronto' | 'erro'

export function PrimeiroAcessoClient() {
  const router = useRouter()
  const [estado, setEstado] = useState<Estado>('verificando')
  const [nome, setNome] = useState<string>('')
  const [papel, setPapel] = useState<string>('')
  
  // Estados de Senha
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [senhaCriada, setSenhaCriada] = useState(false)
  const [erroSenha, setErroSenha] = useState('')

  useEffect(() => {
    let ativo = true

    async function verificar() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!ativo) return
        if (!user) {
          setEstado('erro')
          return
        }

        const nomeUsuario = user.user_metadata?.nome || user.email?.split('@')[0] || ''
        const papelUsuario = user.user_metadata?.papel || 'responsavel'
        
        setNome(nomeUsuario)
        setPapel(papelUsuario)
        setEstado('pronto')
      } catch {
        if (ativo) setEstado('erro')
      }
    }

    verificar()

    return () => { ativo = false }
  }, [])

  async function handleCriarSenha(e: React.FormEvent) {
    e.preventDefault()
    setErroSenha('')

    if (senha.length < 8) return setErroSenha('A senha deve ter pelo menos 8 caracteres.')
    if (senha !== confirmarSenha) return setErroSenha('As senhas não coincidem.')

    setSalvandoSenha(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvandoSenha(false)

    if (error) {
      setErroSenha(error.message)
      return
    }

    setSenhaCriada(true)
    
    // Redireciona baseado no papel
    setTimeout(() => {
      if (papel === 'professor') router.push('/professor')
      else if (papel === 'admin_escola' || papel === 'direcao' || papel === 'coordenacao') router.push('/dashboard')
      else if (papel === 'aluno') router.push('/aluno')
      else router.push('/responsavel')
      router.refresh()
    }, 2500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b0f] px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/[.08] bg-[#111820] p-8 text-center">
        <div className="mb-8 flex justify-center">
          <ArxumBrand />
        </div>

        {estado === 'verificando' && (
          <>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#0d9488]/15 text-[#0d9488]">
              <Loader2 className="size-7 animate-spin" />
            </div>
            <h1 className="mt-6 text-xl font-bold text-white">Verificando seu acesso...</h1>
            <p className="mt-2 text-sm text-[#8aa0ad]">Só um instante.</p>
          </>
        )}

        {estado === 'pronto' && !senhaCriada && (
          <>
            <h1 className="text-2xl font-bold text-white">
              Bem-vindo{nome ? `, ${nome.split(' ')[0]}` : ''}!
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#8aa0ad]">
              Seu e-mail foi confirmado. Para garantir seu acesso futuro, crie uma senha de 8 dígitos.
            </p>

            <form onSubmit={handleCriarSenha} className="mt-8 space-y-4 text-left">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#c7d5db]">Crie sua senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5e7a94]" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full rounded-lg border border-white/10 bg-[#0b1115] py-2.5 pl-10 pr-10 text-sm text-white outline-none focus:border-[#0d9488]"
                  />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5e7a94] hover:text-white">
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#c7d5db]">Confirme a senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5e7a94]" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full rounded-lg border border-white/10 bg-[#0b1115] py-2.5 pl-10 pr-10 text-sm text-white outline-none focus:border-[#0d9488]"
                  />
                </div>
              </div>

              {erroSenha && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {erroSenha}
                </p>
              )}

              <button
                type="submit"
                disabled={salvandoSenha}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0d9488] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-50"
              >
                {salvandoSenha ? <Loader2 className="size-4 animate-spin" /> : null}
                {salvandoSenha ? 'Salvando...' : 'Criar senha e acessar'}
              </button>
            </form>
          </>
        )}

        {estado === 'pronto' && senhaCriada && (
          <>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#d1fae5]/15 text-[#065f46]">
              <CheckCircle2 className="size-8 text-[#0d9488]" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-white">Tudo pronto!</h1>
            <p className="mt-3 text-sm leading-6 text-[#8aa0ad]">
              Sua senha foi criada com sucesso. Estamos abrindo o seu portal...
            </p>
            <div className="mt-6 flex justify-center">
              <Loader2 className="size-5 animate-spin text-[#0d9488]" />
            </div>
          </>
        )}

        {estado === 'erro' && (
          <>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#fee2e2]/15 text-[#dc2626]">
              <CheckCircle2 className="size-8" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-white">Link expirado ou inválido</h1>
            <p className="mt-3 text-sm leading-6 text-[#8aa0ad]">
              Este link já foi usado ou expirou. Entre em contato com a escola para receber um novo convite.
            </p>
            <div className="mt-8">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-[#c7d5db] hover:border-white/30"
              >
                Ir para o login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}