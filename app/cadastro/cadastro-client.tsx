'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Building2, User, Mail, Lock, Phone, FileText, Check, Loader2, CheckCircle2 } from 'lucide-react'
import { cadastrarEscola, verificarSlug } from './actions'

const planos = [
  { key: 'semente', label: 'Semente', preco: 'R$ 199/mês', desc: 'Até 100 alunos' },
  { key: 'raiz', label: 'Raiz', preco: 'R$ 399/mês', desc: 'Até 300 alunos' },
  { key: 'copa', label: 'Copa', preco: 'R$ 699/mês', desc: 'Até 800 alunos' },
  { key: 'rede', label: 'Rede', preco: 'Sob consulta', desc: 'Multiunidade' },
]

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

function formatarCNPJ(v: string): string {
  const n = v.replace(/\D/g, '').slice(0, 14)
  if (n.length <= 2) return n
  if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`
  if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`
  if (n.length <= 12) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`
}

function formatarTelefone(v: string): string {
  const n = v.replace(/\D/g, '').slice(0, 11)
  if (n.length <= 2) return n
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
}

export function CadastroClient() {
  const router = useRouter()
  const [plano, setPlano] = useState('raiz')
  const [escolaNome, setEscolaNome] = useState('')
  const [escolaCnpj, setEscolaCnpj] = useState('')
  const [adminNome, setAdminNome] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminSenha, setAdminSenha] = useState('')
  const [adminTelefone, setAdminTelefone] = useState('')
  const [aceitou, setAceitou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const slugSugerido = slugify(escolaNome)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!escolaNome.trim()) return setErro('Informe o nome da escola.')
    if (!adminNome.trim()) return setErro('Informe seu nome.')
    if (!adminEmail.trim()) return setErro('Informe seu e-mail.')
    if (adminSenha.length < 8) return setErro('A senha deve ter pelo menos 8 caracteres.')
    if (!aceitou) return setErro('Você precisa aceitar os termos.')

    setEnviando(true)

    // Verificar se slug está disponível
    const slugLivre = await verificarSlug(slugSugerido)
    if (!slugLivre) {
      setEnviando(false)
      setErro('Já existe uma escola com esse nome. Tente adicionar uma palavra diferente.')
      return
    }

    const result = await cadastrarEscola({
      escola_nome: escolaNome,
      escola_cnpj: escolaCnpj,
      admin_nome: adminNome,
      admin_email: adminEmail,
      admin_senha: adminSenha,
      admin_telefone: adminTelefone,
      plano,
    })

    setEnviando(false)

    if (!result.success) {
      setErro(result.error || 'Erro ao criar conta.')
      return
    }

    setSucesso(true)
    setTimeout(() => {
      router.push(result.redirect || '/dashboard')
      router.refresh()
    }, 2000)
  }

  if (sucesso) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 lg:px-8">
        <div className="grid size-16 place-items-center rounded-full bg-[#0d9488]/15 text-[#0d9488]">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="mt-6 text-center font-syne text-4xl font-bold tracking-[-.04em] text-white">Conta criada!</h1>
        <p className="mt-4 max-w-md text-center text-sm leading-6 text-[#8aa0ad]">
          Estamos preparando tudo para você. Em instantes você será redirecionado para o painel da sua escola.
        </p>
        <div className="mt-8"><Loader2 className="size-6 animate-spin text-[#0d9488]" /></div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-20">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#8aa0ad] hover:text-white">
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <div className="mt-8 mb-12">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0d9488]">Comece agora</p>
        <h1 className="mt-3 font-syne text-4xl font-bold tracking-[-.04em] text-white md:text-5xl">
          Crie a conta da sua escola
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#8aa0ad]">
          Preencha os dados abaixo. Sua escola estará pronta para uso em menos de 2 minutos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-white/[.08] bg-[#0e151a] p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#0d9488]/15 text-[#0d9488]">
                <Building2 className="size-4" />
              </div>
              <h2 className="text-base font-bold text-white">Dados da escola</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">
                  Nome da escola <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  value={escolaNome}
                  onChange={(e) => setEscolaNome(e.target.value)}
                  placeholder="Ex: Colégio Horizonte"
                  className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#5e7a94] focus:border-[#0d9488]"
                />
                {escolaNome && (
                  <p className="mt-1.5 text-xs text-[#5e7a94]">
                    Endereço: <span className="font-mono text-[#0d9488]">edu.arxum.com.br/{slugSugerido}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">CNPJ (opcional)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5e7a94]" />
                  <input
                    type="text"
                    value={escolaCnpj}
                    onChange={(e) => setEscolaCnpj(formatarCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    className="w-full rounded-lg border border-white/10 bg-[#0b1115] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#5e7a94] focus:border-[#0d9488]"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/[.08] bg-[#0e151a] p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#0d9488]/15 text-[#0d9488]">
                <User className="size-4" />
              </div>
              <h2 className="text-base font-bold text-white">Seus dados (administrador)</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">
                  Nome completo <span className="text-[#dc2626]">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5e7a94]" />
                  <input
                    type="text"
                    value={adminNome}
                    onChange={(e) => setAdminNome(e.target.value)}
                    placeholder="Como você quer ser chamado"
                    className="w-full rounded-lg border border-white/10 bg-[#0b1115] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#5e7a94] focus:border-[#0d9488]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">
                    E-mail <span className="text-[#dc2626]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5e7a94]" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full rounded-lg border border-white/10 bg-[#0b1115] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#5e7a94] focus:border-[#0d9488]"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5e7a94]" />
                    <input
                      type="text"
                      value={adminTelefone}
                      onChange={(e) => setAdminTelefone(formatarTelefone(e.target.value))}
                      placeholder="(21) 90000-0000"
                      className="w-full rounded-lg border border-white/10 bg-[#0b1115] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#5e7a94] focus:border-[#0d9488]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">
                  Senha <span className="text-[#dc2626]">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5e7a94]" />
                  <input
                    type="password"
                    value={adminSenha}
                    onChange={(e) => setAdminSenha(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full rounded-lg border border-white/10 bg-[#0b1115] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#5e7a94] focus:border-[#0d9488]"
                  />
                </div>
                <p className="mt-1.5 text-xs text-[#5e7a94]">Use pelo menos 8 caracteres com letras e números.</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/[.08] bg-[#0e151a] p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#0d9488]/15 text-[#0d9488]">
                <Check className="size-4" />
              </div>
              <h2 className="text-base font-bold text-white">Escolha seu plano</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {planos.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPlano(p.key)}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    plano === p.key ? 'border-[#0d9488] bg-[#0d9488]/10' : 'border-white/[.08] bg-[#0b1115] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-syne text-base font-bold text-white">{p.label}</span>
                    {plano === p.key && (
                      <div className="grid size-5 place-items-center rounded-full bg-[#0d9488] text-white">
                        <Check className="size-3" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#82939a]">{p.desc}</p>
                  <p className="mt-3 font-syne text-lg font-bold text-[#0d9488]">{p.preco}</p>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#5e7a94]">
              Você não será cobrado agora. A cobrança só começa depois do período de teste.
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-8 lg:h-fit">
          <div className="rounded-xl border border-white/[.08] bg-[#0e151a] p-6">
            <h2 className="text-base font-bold text-white">Resumo</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#82939a]">Escola</dt>
                <dd className="max-w-[160px] truncate text-right font-semibold text-white">{escolaNome || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#82939a]">Endereço</dt>
                <dd className="max-w-[160px] truncate text-right font-mono text-xs text-[#0d9488]">
                  {slugSugerido ? `/edu/${slugSugerido}` : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#82939a]">Admin</dt>
                <dd className="max-w-[160px] truncate text-right font-semibold text-white">{adminNome || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#82939a]">Plano</dt>
                <dd className="text-right font-semibold text-[#0d9488]">
                  {planos.find((p) => p.key === plano)?.label}
                </dd>
              </div>
              <div className="flex justify-between border-t border-white/[.08] pt-3">
                <dt className="text-[#82939a]">Mensalidade</dt>
                <dd className="text-right font-syne text-base font-bold text-white">
                  {planos.find((p) => p.key === plano)?.preco}
                </dd>
              </div>
            </dl>

            <label className="mt-6 flex items-start gap-3 text-xs leading-5 text-[#82939a]">
              <input
                type="checkbox"
                checked={aceitou}
                onChange={(e) => setAceitou(e.target.checked)}
                className="mt-0.5 size-4 rounded border-white/20 bg-[#0b1115] accent-[#0d9488]"
              />
              <span>
                Aceito os <a href="#" className="text-[#0d9488] hover:underline">termos de uso</a> e a{' '}
                <a href="#" className="text-[#0d9488] hover:underline">política de privacidade</a>.
              </span>
            </label>

            {erro && (
              <p className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0d9488] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-50"
            >
              {enviando ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar minha escola
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs text-[#5e7a94]">
              Já tem conta?{' '}
              <Link href="/login" className="font-semibold text-[#0d9488] hover:text-[#14b8a6]">
                Entrar
              </Link>
            </p>
          </div>
        </aside>
      </form>
    </main>
  )
}