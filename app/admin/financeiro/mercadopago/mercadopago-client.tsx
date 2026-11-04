'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { salvarAccessToken, removerAccessToken } from './actions'

type Dados = {
  configurado: boolean
  usaTokenPadrao: boolean
  tokenFinal: string | null
  conta: string | null
  modoTeste: boolean
  temPublicKey: boolean
} | null

export function MercadoPagoClient({ dados }: { dados: Dados }) {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')

  async function salvar() {
    setErro(''); setOk(''); setLoading(true)
    const r = await salvarAccessToken(token, publicKey)
    setLoading(false)
    if (!r.success) { setErro(r.error || 'Erro ao salvar.'); return }
    setToken(''); setPublicKey('')
    setOk(r.modoTeste ? 'Conectado em modo de teste.' : 'Conta conectada com sucesso.')
    router.refresh()
  }

  async function remover() {
    if (!confirm('Remover a conta de recebimento? Novas faturas não poderão ser geradas.')) return
    setErro(''); setOk(''); setLoading(true)
    const r = await removerAccessToken()
    setLoading(false)
    if (!r.success) { setErro(r.error || 'Erro ao remover.'); return }
    router.refresh()
  }

  const conectado = !!dados?.configurado

  return (
    <AdminShell mode="school" active="Financeiro">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="Financeiro"
          title="Conta de Recebimento"
          description="Conecte a conta que vai receber as mensalidades. Os pagamentos por PIX caem direto nela."
        />

        <Panel className="mt-8 p-6 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            {conectado
              ? <CheckCircle2 className="size-5 text-[#087f5b]" />
              : <AlertCircle className="size-5 text-[#a16207]" />}
            <div>
              <p className="text-sm font-semibold text-[#12232b]">
                {conectado ? 'Conta de recebimento conectada' : 'Nenhuma conta conectada'}
              </p>
              {conectado && (
                <p className="text-xs text-[#82939a]">
                  {dados?.usaTokenPadrao
                    ? 'Usando a conta padrão da plataforma.'
                    : `${dados?.conta || 'Conta'} · chave terminada em ${dados?.tokenFinal}${dados?.modoTeste ? ' · modo de teste' : ''}`}
                </p>
              )}
            </div>
          </div>

          <label className="block text-xs font-semibold uppercase tracking-wider text-[#536871] mb-1.5">
            Access Token de produção
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#a0afb4]" />
            <input
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="APP_USR-... (Access Token)"
              className="w-full rounded-lg border border-[#d5e0e3] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--cor-primaria,#0d9488)]"
            />
          </div>

          <label className="block text-xs font-semibold uppercase tracking-wider text-[#536871] mb-1.5 mt-4">
            Public Key de produção
          </label>
          <input
            type="text"
            autoComplete="off"
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            placeholder="APP_USR-... (Public Key)"
            className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--cor-primaria,#0d9488)]"
          />

          <button
            onClick={salvar}
            disabled={loading || !token.trim() || !publicKey.trim()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
          >
            {loading && <Loader2 className="size-4 animate-spin" />} Conectar
          </button>

          {erro && <p className="mt-3 text-sm text-[#991b1b]">{erro}</p>}
          {ok && <p className="mt-3 text-sm text-[#087f5b]">{ok}</p>}

          <p className="mt-4 text-xs text-[#82939a] leading-relaxed">
            Onde encontrar: no painel do Mercado Pago, acesse <strong>Seu negócio → Configurações → Credenciais</strong>
            {' '}(ou developers.mercadopago.com → Suas integrações) e copie o <strong>Access Token</strong> e a <strong>Public Key</strong> de produção. A Public Key libera o pagamento por cartão; PIX e boleto usam só o Access Token.
            Ele fica guardado de forma segura no servidor e nunca é exibido novamente.
          </p>

          {dados?.tokenFinal && (
            <button onClick={remover} disabled={loading} className="mt-4 text-xs font-semibold text-[#991b1b] hover:underline disabled:opacity-50">
              Remover conta conectada
            </button>
          )}
        </Panel>
      </main>
    </AdminShell>
  )
}
