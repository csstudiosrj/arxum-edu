'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Building2, User, Mail, Lock, Phone, FileText, Check, Loader2, CheckCircle2, RefreshCw, Eye, EyeOff, X } from 'lucide-react'
import { cadastrarEscola, reenviarConfirmacao } from './actions'

function slugify(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
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

function formatarCEP(v: string): string {
  const n = v.replace(/\D/g, '').slice(0, 8)
  if (n.length <= 5) return n
  return `${n.slice(0, 5)}-${n.slice(5)}`
}

const planosLabels: Record<string, string> = {
  semente: 'Semente (R$ 199/mês)',
  raiz: 'Raiz (R$ 399/mês)',
  copa: 'Copa (R$ 699/mês)',
  rede: 'Rede (Sob consulta)'
}

type Estado = 'formulario' | 'aguardando_email'

export function CadastroClient({ planoInicial }: { planoInicial: string }) {
  const [estado, setEstado] = useState<Estado>('formulario')
  const [emailCadastrado, setEmailCadastrado] = useState('')
  const [escolaNomeCadastrada, setEscolaNomeCadastrada] = useState('')

  const plano = planoInicial
  
  // Escola
  const [razaoSocial, setRazaoSocial] = useState('')
  const [escolaNome, setEscolaNome] = useState('')
  const [escolaCnpj, setEscolaCnpj] = useState('')
  
  // Endereço
  const [cep, setCep] = useState('')
  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estadoUf, setEstadoUf] = useState('')

  // Admin
  const [adminNome, setAdminNome] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminTelefone, setAdminTelefone] = useState('')
  const [adminSenha, setAdminSenha] = useState('')
  const [adminConfirmarSenha, setAdminConfirmarSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  
  const [aceitou, setAceitou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)
  const [modalLegal, setModalLegal] = useState<'termos' | 'privacidade' | null>(null)

  const slugSugerido = slugify(escolaNome)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!razaoSocial.trim()) return setErro('Informe a Razão Social.')
    if (!escolaNome.trim()) return setErro('Informe o Nome Fantasia da escola.')
    if (escolaCnpj.replace(/\D/g, '').length !== 14) return setErro('O CNPJ é obrigatório e deve ter 14 dígitos.')
    
    if (!cep || !rua || !numero || !bairro || !cidade || !estadoUf) return setErro('Preencha o endereço completo da escola.')
    if (!adminNome.trim()) return setErro('Informe seu nome.')
    if (!adminEmail.trim()) return setErro('Informe seu e-mail.')
    
    if (adminSenha.length < 8) return setErro('A senha deve ter pelo menos 8 caracteres.')
    if (adminSenha !== adminConfirmarSenha) return setErro('As senhas não coincidem.')
    
    if (!aceitou) return setErro('Você precisa aceitar os termos e a política de privacidade.')

    setEnviando(true)

    const result = await cadastrarEscola({
      escola_nome: escolaNome,
      escola_razao_social: razaoSocial,
      escola_cnpj: escolaCnpj,
      escola_cep: cep,
      escola_endereco: rua,
      escola_numero: numero,
      escola_bairro: bairro,
      escola_cidade: cidade,
      escola_estado: estadoUf,
      admin_nome: adminNome,
      admin_email: adminEmail,
      admin_senha: adminSenha,
      admin_telefone: adminTelefone,
      plano,
      aceite_termos: aceitou,
    })

    setEnviando(false)

    if (!result.success) {
      setErro(result.error || 'Erro ao criar conta.')
      return
    }

    if (result.proximo_passo === 'confirmar_email' && result.email) {
      setEmailCadastrado(result.email)
      setEscolaNomeCadastrada(escolaNome)
      setEstado('aguardando_email')
      return
    }

    setErro('Fluxo inesperado. Contate o suporte.')
  }

  async function handleReenviar() {
    setReenviando(true)
    setReenviado(false)
    const r = await reenviarConfirmacao(emailCadastrado)
    setReenviando(false)
    if (!r.success) {
      alert(r.error || 'Erro ao reenviar.')
      return
    }
    setReenviado(true)
    setTimeout(() => setReenviado(false), 5000)
  }

  // ── Tela de aguardando confirmação ─────────────────────────────
  if (estado === 'aguardando_email') {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 lg:px-8">
        <div className="grid size-16 place-items-center rounded-full bg-[#0d9488]/15 text-[#0d9488]">
          <Mail className="size-8" />
        </div>
        <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
          Confirme seu e-mail
        </h1>
        <p className="mt-4 max-w-md text-center text-sm leading-6 text-[#8aa0ad]">
          Enviamos um link de confirmação para <strong className="text-[#e7f1f5]">{emailCadastrado}</strong>.
          Clique no link para ativar a conta da <strong className="text-[#e7f1f5]">{escolaNomeCadastrada}</strong>.
        </p>

        <div className="mt-8 w-full rounded-xl border border-white/[.08] bg-[#0e151a] p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#5e7a94]">Próximos passos</p>
          <ol className="mt-3 space-y-3 text-sm text-[#c7d5db]">
            <li className="flex gap-3"><span className="text-[#0d9488]">1.</span> Abra o e-mail que enviamos para {emailCadastrado}.</li>
            <li className="flex gap-3"><span className="text-[#0d9488]">2.</span> Clique em "Confirmar e-mail".</li>
            <li className="flex gap-3"><span className="text-[#0d9488]">3.</span> Você será redirecionado para o painel da escola.</li>
          </ol>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={handleReenviar}
            disabled={reenviando || reenviado}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-[#c7d5db] transition hover:border-[#0d9488] hover:text-white disabled:opacity-50"
          >
            {reenviando ? <Loader2 className="size-4 animate-spin" /> : reenviado ? <CheckCircle2 className="size-4 text-[#0d9488]" /> : <RefreshCw className="size-4" />}
            {reenviando ? 'Reenviando...' : reenviado ? 'E-mail reenviado!' : 'Reenviar e-mail'}
          </button>
          <Link href="/login" className="text-xs text-[#5e7a94] transition hover:text-white">
            Voltar para o login
          </Link>
        </div>
      </main>
    )
  }

  // ── Formulário ─────────────────────────────────────────────────
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-20">
      <Link href="/planos" className="inline-flex items-center gap-2 text-sm text-[#8aa0ad] hover:text-white">
        <ArrowLeft className="size-4" /> Voltar para planos
      </Link>

      <div className="mt-8 mb-12">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0d9488]">Comece agora</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Crie a conta da sua escola
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#8aa0ad]">
          Preencha os dados abaixo. Vamos enviar um e-mail para confirmar sua conta.
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
                  Razão Social <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Ex: Colégio Horizonte Educação LTDA"
                  className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#5e7a94] focus:border-[#0d9488]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">
                  Nome Fantasia <span className="text-[#dc2626]">*</span>
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
                <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">
                  CNPJ <span className="text-[#dc2626]">*</span>
                </label>
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
                <Building2 className="size-4" />
              </div>
              <h2 className="text-base font-bold text-white">Endereço da escola</h2>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">CEP *</label>
                  <input type="text" value={cep} onChange={(e) => setCep(formatarCEP(e.target.value))} placeholder="00000-000" className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">Rua / Logradouro *</label>
                  <input type="text" value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Av. Paulista" className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">Número *</label>
                  <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123" className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">Bairro *</label>
                  <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Centro" className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">Cidade *</label>
                  <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="São Paulo" className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">Estado (UF) *</label>
                  <input type="text" value={estadoUf} onChange={(e) => setEstadoUf(e.target.value.toUpperCase())} maxLength={2} placeholder="SP" className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]" />
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
                <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">Nome completo *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5e7a94]" />
                  <input type="text" value={adminNome} onChange={(e) => setAdminNome(e.target.value)} placeholder="Como você quer ser chamado" className="w-full rounded-lg border border-white/10 bg-[#0b1115] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-[#0d9488]" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">E-mail *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5e7a94]" />
                    <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="seu@email.com" className="w-full rounded-lg border border-white/10 bg-[#0b1115] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-[#0d9488]" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5e7a94]" />
                    <input type="text" value={adminTelefone} onChange={(e) => setAdminTelefone(formatarTelefone(e.target.value))} placeholder="(21) 90000-0000" className="w-full rounded-lg border border-white/10 bg-[#0b1115] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-[#0d9488]" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">Senha *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5e7a94]" />
                    <input type={mostrarSenha ? 'text' : 'password'} value={adminSenha} onChange={(e) => setAdminSenha(e.target.value)} placeholder="Mínimo 8 caracteres" className="w-full rounded-lg border border-white/10 bg-[#0b1115] py-2.5 pl-10 pr-10 text-sm text-white outline-none focus:border-[#0d9488]" />
                    <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5e7a94] hover:text-white">
                      {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">Confirmar Senha *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5e7a94]" />
                    <input type={mostrarSenha ? 'text' : 'password'} value={adminConfirmarSenha} onChange={(e) => setAdminConfirmarSenha(e.target.value)} placeholder="Repita a senha" className="w-full rounded-lg border border-white/10 bg-[#0b1115] py-2.5 pl-10 pr-10 text-sm text-white outline-none focus:border-[#0d9488]" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#5e7a94]">Use pelo menos 8 caracteres com letras e números.</p>
            </div>
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
                <dt className="text-[#82939a]">Razão Social</dt>
                <dd className="max-w-[160px] truncate text-right text-xs text-white">{razaoSocial || '—'}</dd>
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
                  {planosLabels[plano] || plano}
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
                Aceito os{' '}
                <button type="button" onClick={() => setModalLegal('termos')} className="text-[#0d9488] hover:underline">
                  termos de uso
                </button>{' '}
                e a{' '}
                <button type="button" onClick={() => setModalLegal('privacidade')} className="text-[#0d9488] hover:underline">
                  política de privacidade
                </button>
                .
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
                <><Loader2 className="size-4 animate-spin" /> Criando conta...</>
              ) : (
                <>Criar minha escola <ArrowRight className="size-4" /></>
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

      {/* MODAL DE TERMOS E PRIVACIDADE */}
      {modalLegal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setModalLegal(null)} />
          <div className="relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <h2 className="text-lg font-bold text-[#12232b]">
                {modalLegal === 'termos' ? 'Termos de Uso' : 'Política de Privacidade'}
              </h2>
              <button onClick={() => setModalLegal(null)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]">
                <X className="size-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5 text-sm leading-6 text-[#536871]">
              <p className="mb-4 text-[#f59e0b]">
                Documento em revisão jurídica. Versão final será publicada antes do início da operação comercial.
              </p>
              <p>O ARXUM Edu é uma plataforma SaaS de gestão escolar...</p>
              <p className="mt-4">Para mais informações, entre em contato com contato@arxum.com.br.</p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}