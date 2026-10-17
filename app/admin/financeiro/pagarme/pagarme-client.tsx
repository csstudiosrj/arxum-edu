'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, CreditCard, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, Loader2 } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { cadastrarRecebedor, sincronizarStatusRecebedor } from './actions'
import type { EscolaCompleta } from '@/lib/auth/escola-atual'

// ── MÁSCARAS ────────────────────────────────────────────────────────
function formatarCNPJ(v: string): string {
  const n = v.replace(/\D/g, '').slice(0, 14)
  if (n.length <= 2) return n
  if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`
  if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`
  if (n.length <= 12) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`
}

function formatarCPF(v: string): string {
  const n = v.replace(/\D/g, '').slice(0, 11)
  if (n.length <= 3) return n
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`
}

function formatarCEP(v: string): string {
  const n = v.replace(/\D/g, '').slice(0, 8)
  if (n.length <= 5) return n
  return `${n.slice(0, 5)}-${n.slice(5)}`
}

export function PagarmeClient({
  escola,
  dados,
}: {
  escola: EscolaCompleta
  dados: any
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [erro, setErro] = useState('')
  const [detalhesErro, setDetalhesErro] = useState<any>(null)
  
  const temRecebedor = !!dados?.pagarme_recipient_id
  const status = dados?.pagarme_recipient_status || 'pendente'
  const kycUrl = dados?.pagarme_kyc_url

  // Empresa
  const [nome, setNome] = useState(escola.nome)
  const [documento, setDocumento] = useState(escola.cnpj ? formatarCNPJ(escola.cnpj) : '')
  const [email, setEmail] = useState(escola.email_contato || '')
  const [faturamentoAnual, setFaturamentoAnual] = useState('')
  
  // Endereço da empresa
  const [rua, setRua] = useState(escola.endereco || '')
  const [numero, setNumero] = useState(escola.numero || '')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState(escola.bairro || '')
  const [cidade, setCidade] = useState(escola.cidade || '')
  const [estado, setEstado] = useState(escola.estado || '')
  const [cep, setCep] = useState(escola.cep ? formatarCEP(escola.cep) : '')
  const [pontoReferencia, setPontoReferencia] = useState('')

  // Banco
  const [banco, setBanco] = useState('')
  const [agencia, setAgencia] = useState('')
  const [conta, setConta] = useState('')
  const [digito, setDigito] = useState('')
  const [tipoConta, setTipoConta] = useState('checking')

  // Sócio
  const [socioNome, setSocioNome] = useState('')
  const [socioCpf, setSocioCpf] = useState('')
  const [socioNascimento, setSocioNascimento] = useState('')

  // ── AUTO-PREENCHER CEP ──────────────────────────────────────────
  async function buscarCep(valor: string) {
    const cepLimpo = valor.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return

    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setRua(data.logradouro || '')
        setBairro(data.bairro || '')
        setCidade(data.localidade || '')
        setEstado(data.uf || '')
      }
    } catch (e) {
      console.error('Erro ao buscar CEP', e)
    } finally {
      setBuscandoCep(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setDetalhesErro(null)
    
    if (!rua || !numero || !bairro || !cidade || !estado || !cep) {
      return setErro('Preencha o endereço completo da empresa.')
    }
    if (!faturamentoAnual) {
      return setErro('Informe o faturamento anual estimado.')
    }
    if (socioCpf.replace(/\D/g, '').length !== 11) {
      return setErro('O CPF do sócio deve ter 11 dígitos.')
    }

    setLoading(true)

    const payload = {
      nome,
      email,
      documento: documento.replace(/\D/g, ''),
      tipo: 'company' as const,
      telefone: { country_code: '55', area_code: '21', number: '999999999' },
      endereco: {
        line_1: `${rua}, ${numero}, ${bairro}`,
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
        titular_documento: documento.replace(/\D/g, ''),
      },
      registerInformation: {
        type: 'corporation' as const,
        company_name: nome,
        trading_name: nome,
        annual_revenue: faturamentoAnual, // Adicionado
        document: documento.replace(/\D/g, ''),
        email: email,
        phone_numbers: [{ ddd: '21', number: '999999999', type: 'mobile' }],
        main_address: { // Substitui 'address' por 'main_address'
          street: rua,
          complementary: complemento || 'N/A',
          street_number: numero,
          neighborhood: bairro,
          city: cidade,
          state: estado,
          zip_code: cep.replace(/\D/g, ''),
          reference_point: pontoReferencia || 'N/A',
        },
        managing_partners: [
          {
            type: 'individual' as const,
            name: socioNome,
            document: socioCpf.replace(/\D/g, ''),
            birthdate: socioNascimento,
            email: email,
            monthly_income: '10000',
            professional_occupation: 'Empresário',
            self_declared_legal_representative: true,
            address: {
              street: rua,
              complementary: complemento || 'N/A',
              street_number: numero,
              neighborhood: bairro,
              city: cidade,
              state: estado,
              zip_code: cep.replace(/\D/g, ''),
              reference_point: pontoReferencia || 'N/A',
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
      if (r.detalhes) setDetalhesErro(r.detalhes)
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
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">CNPJ</label>
                  <input type="text" value={documento} onChange={e => setDocumento(formatarCNPJ(e.target.value))} required placeholder="00.000.000/0000-00" className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">E-mail financeiro</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Faturamento Anual (R$)</label>
                  <input type="text" value={faturamentoAnual} onChange={e => setFaturamentoAnual(e.target.value)} required placeholder="Ex: 500000" className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">CEP da empresa</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={cep} 
                      onChange={e => {
                        const formatado = formatarCEP(e.target.value)
                        setCep(formatado)
                        if (formatado.length === 9) buscarCep(formatado)
                      }} 
                      required 
                      placeholder="00000-000" 
                      className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488] disabled:bg-[#f0f4f5]" 
                    />
                    {buscandoCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-[#0d9488]" />}
                  </div>
                </div>
              </div>

              {/* ENDEREÇO DA EMPRESA */}
              <div className="grid gap-5 md:grid-cols-4">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Rua / Logradouro</label>
                  <input type="text" value={rua} onChange={e => setRua(e.target.value)} required className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Número</label>
                  <input type="text" value={numero} onChange={e => setNumero(e.target.value)} required className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Bairro</label>
                  <input type="text" value={bairro} onChange={e => setBairro(e.target.value)} required className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Complemento</label>
                  <input type="text" value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Sala, bloco (opcional)" className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Ponto de Referência</label>
                  <input type="text" value={pontoReferencia} onChange={e => setPontoReferencia(e.target.value)} placeholder="Ex: Próximo ao metrô (opcional)" className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Cidade</label>
                  <input type="text" value={cidade} onChange={e => setCidade(e.target.value)} required className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Estado (UF)</label>
                  <input type="text" value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} required maxLength={2} className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                </div>
              </div>

              <div className="border-t border-[#e5ecee] pt-6">
                <h3 className="mb-4 text-sm font-bold text-[#12232b]">Dados Bancários</h3>
                <div className="grid gap-5 md:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Código do Banco</label>
                    <input type="text" value={banco} onChange={e => setBanco(e.target.value)} required placeholder="Ex: 341" maxLength={3} className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
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
                    <input type="text" value={socioCpf} onChange={e => setSocioCpf(formatarCPF(e.target.value))} required placeholder="000.000.000-00" className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Data de Nascimento</label>
                    <input type="date" value={socioNascimento} onChange={e => setSocioNascimento(e.target.value)} required className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[#0d9488]" />
                  </div>
                </div>
              </div>

              {erro && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-sm font-bold text-red-600">{erro}</p>
                  {detalhesErro && (
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-red-500/5 p-3 text-[11px] text-red-500">
                      {JSON.stringify(detalhesErro, null, 2)}
                    </pre>
                  )}
                </div>
              )}

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