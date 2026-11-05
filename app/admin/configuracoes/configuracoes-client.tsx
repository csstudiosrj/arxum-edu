'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  School, Users, Palette, Bell, CreditCard, Shield, Globe,
  Save, Loader2, Check, ArrowRight, Sparkles, Wrench, Lock, CheckCircle2, XCircle
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import type { EscolaCompleta } from '@/lib/auth/escola-atual'
import { salvarDadosEscola, solicitarRecursoFuturo, salvarConfiguracaoPagamento, desconectarMercadoPago } from './actions'

// ... (mantenha os tipos e os arrays de cardsAtivos e cardsDesenvolvimento iguais)

function formatarCNPJ(v: string): string { /* ... */ }
function formatarTelefone(v: string): string { /* ... */ }

export function ConfiguracoesClient({ escola }: { escola: EscolaCompleta | null }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ... (mantenha os states do formulário de dados da escola)
  const [salvandoPagamento, setSalvandoPagamento] = useState(false)
  const [salvouPagamento, setSalvouPagamento] = useState(false)
  const [desconectando, setDesconectando] = useState(false)
  
  // States para os alertas do OAuth
  const [msgOauth, setMsgOauth] = useState<{tipo: 'sucesso' | 'erro', texto: string} | null>(null)

  useEffect(() => {
    const mp = searchParams.get('mp')
    const erro = searchParams.get('erro')
    
    if (mp === 'sucesso') {
      setMsgOauth({ tipo: 'sucesso', texto: 'Conta do Mercado Pago conectada com sucesso! O desconto será aplicado automaticamente.' })
    } else if (erro) {
      setMsgOauth({ tipo: 'erro', texto: 'Ocorreu um erro ao conectar o Mercado Pago. Tente novamente.' })
    }
  }, [searchParams])

  async function handleSalvarPagamento() {
    // ... (mesma lógica, mas sem o token e public key, apenas o ciclo)
  }

  async function handleDesconectarMP() {
    if (!confirm('Tem certeza que deseja desconectar a conta do Mercado Pago? Você perderá o desconto na taxa.')) return
    setDesconectando(true)
    const r = await desconectarMercadoPago()
    setDesconectando(false)
    if (r.success) {
      setMsgOauth(null)
      router.refresh()
    } else {
      alert(r.error)
    }
  }

  if (!escola) return null

  const isMpConectado = !!escola.mercadopago_access_token

  return (
    <AdminShell mode="school" active="Configurações">
      <main className="px-5 py-8 lg:px-8">
        {/* ... (Mantenha o SectionHeading e o Bloco 1 - Dados da Escola) */}

        {/* BLOCO 2: PAGAMENTOS E LOJA */}
        <Panel className="mt-8">
          <div className="flex items-center justify-between border-b border-[#e5ecee] px-5 py-4">
             {/* ... (Cabeçalho igual) */}
          </div>

          <div className="space-y-5 p-5 lg:p-6">
            {msgOauth && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${msgOauth.tipo === 'sucesso' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                {msgOauth.tipo === 'sucesso' ? <CheckCircle2 className="size-5 shrink-0" /> : <XCircle className="size-5 shrink-0" />}
                <p className="text-sm font-semibold">{msgOauth.texto}</p>
              </div>
            )}

            <div className="rounded-lg border border-[#d5e0e3] p-5 bg-white">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#12232b] flex items-center gap-2">
                    Mercado Pago
                    {isMpConectado && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Conectado</span>}
                  </h3>
                  <p className="text-sm text-[#82939a] mt-1 max-w-lg">
                    Conecte sua conta do Mercado Pago para receber pagamentos com Split automático. Escolas conectadas recebem <strong>desconto na taxa de intermediação</strong>.
                  </p>
                </div>

                {isMpConectado ? (
                  <button onClick={handleDesconectarMP} disabled={desconectando} className="shrink-0 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition">
                    {desconectando ? 'Desconectando...' : 'Desconectar Conta'}
                  </button>
                ) : (
                  <a href="/api/auth/mercadopago" className="shrink-0 bg-[#009ee3] text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#008ecc] transition">
                    Conectar Mercado Pago
                  </a>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Ciclo de Cobrança das Taxas ARXUM</label>
              <select
                value={escola.ciclo_cobranca_taxas || 'junto_assinatura'}
                onChange={(e) => {
                  // Aqui você pode adicionar uma função para salvar o ciclo
                  // setCicloLoja(e.target.value)
                }}
                className="w-full max-w-md rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]"
              >
                <option value="junto_assinatura">Junto com a mensalidade (Próxima fatura do plano)</option>
                <option value="proprio">Fatura separada (No final do mês)</option>
              </select>
              <p className="mt-1 text-xs text-[#82939a]">
                Como você prefere pagar as taxas da ARXUM (vendas da loja, excedentes, etc).
              </p>
            </div>
          </div>
        </Panel>

        {/* ... (Mantenha os blocos de Recursos Ativos e Em Desenvolvimento) */}
      </main>
    </AdminShell>
  )
}
