'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, CreditCard, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, Loader2 } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { cadastrarRecebedor, sincronizarStatusRecebedor } from './actions'
import type { EscolaCompleta } from '@/lib/auth/escola-atual'

export function PagarmeClient({
  escola,
  dados,
}: {
  escola: EscolaCompleta
  dados: any
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  
  const temRecebedor = !!dados?.pagarme_recipient_id
  const status = dados?.pagarme_recipient_status || 'pendente'
  const kycUrl = dados?.pagarme_kyc_url

  // Form (simplificado para a tela)
  const [nome, setNome] = useState(escola.nome)
  const [documento, setDocumento] = useState(escola.cnpj?.replace(/\D/g, '') || '')
  const [email, setEmail] = useState(escola.email_contato || '')
  
  const [banco, setBanco] = useState('')
  const [agencia, setAgencia] = useState('')
  const [conta, setConta] = useState('')
  const [digito, setDigito] = useState('')
  const [tipoConta, setTipoConta] = useState('checking')

  const [rua, setRua] = useState(escola.endereco || '')
  const [cidade, setCidade] = useState(escola.cidade || '')
  const [estado, setEstado] = useState(escola.estado || '')
  const [cep, setCep] = useState('') // Precisaria do CEP real

  const [socioNome, setSocioNome] = useState('')
  const [socioCpf, setSocioCpf] = useState('')
  const [socioNascimento, setSocioNascimento] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    // Monta o payload exigido pela nova API da Pagar.me
    const payload = {
      nome,
      email,
      documento,
      tipo: 'company' as const,
      telefone: { country_code: '55', area_code: '21', number: '999999999' },
      endereco: {
        line_1: rua,
        zip_code: cep.replace(/\D/g, ''),
        city: cidade,
        state: estado,
        country: 'BR',
      },
      banco: {
        codigo: banco,
        agencia,
        conta,
        digito,
        tipo: tipoConta as 'checking' | 'savings',
        titular_nome: nome,
        titular_documento: documento,
      },
      registerInformation: {
        type: 'corporation' as const,
        company_name: nome,
        trading_name: nome,
        document_number: documento,
        email: email,
        phone_numbers: [{ ddd: '21', number: '999999999', type: 'mobile' }],
        address: {
          street: rua,
          complementary: 'Sala 1',
          street_number: '100',
          neighborhood: 'Centro',
          city: cidade,
          state: estado,
          zipcode: cep.replace(/\D/g, ''),
        },
        managing_partners: [
          {
            type: 'individual' as const,
            name: socioNome,
            document_number: socioCpf.replace(/\D/g, ''),
            birthdate: socioNascimento,
            email: email,
            monthly_income: '10000',
            professional_occupation: 'Empresário',
            self_declared_legal_representative: true,
            address: {
              street: rua,
              complementary: 'Sala 1',
              street_number: '100',
              neighborhood: 'Centro',
              city: cidade,
              state: estado,
              zipcode: cep.replace(/\D/g, ''),
            },
            phone_numbers: [{ ddd: '21', number: '999999999', type: 'mobile' }],
          }
        ]
      }
    }

    const r = await cadastrarRecebedor(payload)
    setLoading(false)

    if (!r.success) {
      setErro(r.error || 'Erro ao cadastrar. Verifique os dados.')
      return
    }

    router.refresh()
  }

  async function handleSincronizar() {
    setLoading(true)
    await sincronizarStatusRecebedor()
    setLoading(false)
    router.refresh()
  }

  return (
    <AdminShell mode="school" active="Financeiro">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="Financeiro"
          title="Conta de Recebimento (Pagar.me)"
          description="Configure os dados bancários para receber os repasses das mensalidades e vendas da loja."
        />

        {temRecebedor ? (
          <Panel className="mt-8 p-6">
            <div className="flex items-start gap-4">
              <div className={`grid size-12 shrink-0 place-items-center rounded-xl ${
                status === 'active' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fef3c7] text-[#92400e]'
              }`}>
                {status === 'active' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#12232b]">
                  {status === 'active' ? 'Conta ativa e verificada' : 'Conta em análise'}
                </h2>
                <p className="mt-1 text-sm text-[#82939a]">
                  Seu ID de recebedor é <code className="rounded bg-[#f0f4f5] px-1.5 py-0.5 text-xs font-mono">{dados.pagarme_recipient_id}</code>.
                  {status === 'active' 
                    ? ' Você já está apto a receber os pagamentos via PIX e cartão.'
                    : ' A Pagar.me está validando seus dados. Se precisar enviar documentos, use o botão abaixo.'}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  {kycUrl && (
                    <a href={kycUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e]">
                      <ExternalLink size={16} /> Enviar documentos (KYC)
                    </a>
                  )}
                  <button onClick={handleSincronizar} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] hover:border-[#0d9488] disabled:opacity-50">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar status
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        ) : (
          <Panel className="mt-8 p-6 lg:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-[#e5ecee] pb-4">
              <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#1e40af]">
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Cadastrar dados de recebimento</h2>
                <p className="text-xs text-[#82939a]">Essas informações são validadas pela Pagar.me e pela Receita Federal.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Razão Social</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} required className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">CNPJ (apenas números)</label>
                  <input type="text" value={documento} onChange={e => setDocumento(e.target.value)} required placeholder="00000000000000" className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">E-mail financeiro</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">CEP da empresa</label>
                  <input type="text" value={cep} onChange={e => setCep(e.target.value)} required placeholder="00000000" className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Código do Banco</label>
                  <input type="text" value={banco} onChange={e => setBanco(e.target.value)} required placeholder="Ex: 341" className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Agência</label>
                  <input type="text" value={agencia} onChange={e => setAgencia(e.target.value)} required placeholder="0001" className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Conta</label>
                  <input type="text" value={conta} onChange={e => setConta(e.target.value)} required placeholder="12345" className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Dígito</label>
                  <input type="text" value={digito} onChange={e => setDigito(e.target.value)} required placeholder="6" className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
              </div>

              <div className="border-t border-[#e5ecee] pt-6">
                <h3 className="mb-4 text-sm font-bold text-[#12232b]">Sócio Responsável (Exigido pela Pagar.me)</h3>
                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Nome completo do sócio</label>
                    <input type="text" value={socioNome} onChange={e => setSocioNome(e.target.value)} required className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">CPF do sócio</label>
                    <input type="text" value={socioCpf} onChange={e => setSocioCpf(e.target.value)} required placeholder="00000000000" className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Data de Nascimento</label>
                    <input type="date" value={socioNascimento} onChange={e => setSocioNascimento(e.target.value)} required className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                  </div>
                </div>
              </div>

              {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">{erro}</p>}

              <div className="flex justify-end">
                <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                  {loading ? 'Enviando para Pagar.me...' : 'Criar conta de recebimento'}
                </button>
              </div>
            </form>
          </Panel>
        )}
      </main>
    </AdminShell>
  )
}