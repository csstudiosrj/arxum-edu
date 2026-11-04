'use client'

// Checkout 100% dentro do site: PIX, cartão (campos seguros do Mercado Pago em
// iframes, sem redirecionar e sem logo) e boleto.

import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Loader2, Copy, Check, QrCode, CreditCard, FileText, CheckCircle2, ExternalLink } from 'lucide-react'
import { getCheckoutFatura, gerarPix, gerarBoleto, pagarComCartao } from '@/app/responsavel/pagamento-actions'

type FaturaMin = { id: string; descricao: string; valor_centavos: number }
type Aba = 'pix' | 'cartao' | 'boleto'

const moeda = (c: number) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const cor = { backgroundColor: 'var(--cor-primaria, #0d9488)' }
const inputCls = 'w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--cor-primaria,#0d9488)]'
const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-[#536871] mb-1'

function BotaoCopiar({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(texto); setOk(true); setTimeout(() => setOk(false), 2000) }}
      className="shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white hover:brightness-90"
      style={cor}
    >
      {ok ? <Check size={16} /> : <Copy size={16} />} Copiar
    </button>
  )
}

function carregarSdk(): Promise<void> {
  const w = window as any
  if (w.MercadoPago) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://sdk.mercadopago.com/js/v2'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Não foi possível carregar o módulo de pagamento.'))
    document.head.appendChild(s)
  })
}

// ── Cartão ───────────────────────────────────────────────────────────
function AbaCartao({ fatura, publicKey, onAprovado, onAnalise }: {
  fatura: FaturaMin; publicKey: string; onAprovado: () => void; onAnalise: (m: string) => void
}) {
  const mpRef = useRef<any>(null)
  const [pronto, setPronto] = useState(false)
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [metodoId, setMetodoId] = useState('')
  const [emissorId, setEmissorId] = useState('')
  const [opcoes, setOpcoes] = useState<{ n: number; label: string }[]>([])
  const [parcelas, setParcelas] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let vivo = true
    const campos: any[] = []
    ;(async () => {
      try {
        await carregarSdk()
        if (!vivo) return
        const mp = new (window as any).MercadoPago(publicKey, { locale: 'pt-BR' })
        mpRef.current = mp
        const numero = mp.fields.create('cardNumber', { placeholder: 'Número do cartão' }).mount('mp-numero')
        const validade = mp.fields.create('expirationDate', { placeholder: 'MM/AA' }).mount('mp-validade')
        const cvv = mp.fields.create('securityCode', { placeholder: 'CVV' }).mount('mp-cvv')
        campos.push(numero, validade, cvv)

        numero.on('binChange', async (d: { bin?: string }) => {
          const bin = d?.bin
          if (!bin) { setMetodoId(''); setEmissorId(''); setOpcoes([]); return }
          try {
            const pm = await mp.getPaymentMethods({ bin })
            const m = pm?.results?.[0]
            if (!m) return
            setMetodoId(String(m.id))
            if (m.issuer?.id) setEmissorId(String(m.issuer.id))
            const inst = await mp.getInstallments({
              amount: (fatura.valor_centavos / 100).toFixed(2), bin, paymentTypeId: 'credit_card',
            })
            const custos = inst?.[0]?.payer_costs ?? []
            if (inst?.[0]?.issuer?.id) setEmissorId(String(inst[0].issuer.id))
            setOpcoes(custos.map((o: any) => ({ n: o.installments, label: o.recommended_message })))
            setParcelas(1)
          } catch { /* usuário ainda digitando */ }
        })
        setPronto(true)
      } catch (e: any) {
        setErro(e?.message || 'Erro ao carregar o formulário do cartão.')
      }
    })()
    return () => { vivo = false; campos.forEach((c) => { try { c.unmount() } catch {} }) }
  }, [publicKey, fatura.valor_centavos])

  async function pagar() {
    setErro('')
    if (!nome.trim()) { setErro('Informe o nome impresso no cartão.'); return }
    if (!metodoId) { setErro('Confira o número do cartão.'); return }
    setEnviando(true)
    try {
      const t = await mpRef.current.fields.createCardToken({
        cardholderName: nome.trim(),
        identificationType: 'CPF',
        identificationNumber: cpf.replace(/\D/g, ''),
      })
      const r = await pagarComCartao(fatura.id, { cardToken: t.id, parcelas, metodoId, emissorId, cpf })
      if (!r.success) { setErro(r.error); return }
      if (r.aprovado) onAprovado(); else onAnalise(r.mensagem)
    } catch (e: any) {
      const msg = Array.isArray(e) ? e.map((x: any) => x.message).filter(Boolean)[0] : e?.message
      setErro(msg || 'Confira os dados do cartão.')
    } finally {
      setEnviando(false)
    }
  }

  const campoFrame = 'h-11 rounded-lg border border-[#d5e0e3] bg-white overflow-hidden'
  return (
    <div className="space-y-3">
      {!pronto && !erro && <p className="text-xs text-[#82939a] flex items-center gap-2"><Loader2 className="size-3 animate-spin" /> Carregando formulário seguro…</p>}
      <div><label className={labelCls}>Número do cartão de crédito</label><div id="mp-numero" className={campoFrame} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>Validade</label><div id="mp-validade" className={campoFrame} /></div>
        <div><label className={labelCls}>CVV</label><div id="mp-cvv" className={campoFrame} /></div>
      </div>
      <div><label className={labelCls}>Nome no cartão</label><input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como está impresso" /></div>
      <div><label className={labelCls}>CPF do titular</label><input className={inputCls} value={cpf} onChange={(e) => setCpf(e.target.value)} inputMode="numeric" placeholder="000.000.000-00" /></div>
      {opcoes.length > 0 && (
        <div>
          <label className={labelCls}>Parcelas</label>
          <select className={inputCls} value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))}>
            {opcoes.map((o) => <option key={o.n} value={o.n}>{o.label}</option>)}
          </select>
        </div>
      )}
      {erro && <p className="text-sm text-[#991b1b]">{erro}</p>}
      <button onClick={pagar} disabled={enviando || !pronto} className="w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold text-white hover:brightness-90 disabled:opacity-50" style={cor}>
        {enviando ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
        {enviando ? 'Processando…' : `Pagar ${moeda(fatura.valor_centavos)}`}
      </button>
    </div>
  )
}

// ── Boleto ───────────────────────────────────────────────────────────
function AbaBoleto({ fatura, existente, onGerado }: {
  fatura: FaturaMin
  existente: { linha: string | null; url: string | null } | null
  onGerado: (b: { linha: string | null; url: string | null }) => void
}) {
  const [f, setF] = useState({ nome: '', cpf: '', cep: '', rua: '', numero: '', bairro: '', cidade: '', uf: '' })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }))

  async function buscarCep(valor: string) {
    const c = valor.replace(/\D/g, '')
    if (c.length !== 8) return
    try {
      const r = await fetch(`https://viacep.com.br/ws/${c}/json/`)
      const d = await r.json()
      if (!d.erro) setF((p) => ({ ...p, rua: d.logradouro || p.rua, bairro: d.bairro || p.bairro, cidade: d.localidade || p.cidade, uf: d.uf || p.uf }))
    } catch { /* preenchimento manual */ }
  }

  async function gerar() {
    setErro(''); setEnviando(true)
    const r = await gerarBoleto(fatura.id, f)
    setEnviando(false)
    if (!r.success) { setErro(r.error); return }
    onGerado(r.boleto)
  }

  if (existente) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[#536871]">Copie a linha digitável para pagar no app do seu banco, ou abra o boleto para imprimir.</p>
        {existente.linha && (
          <div className="flex gap-2">
            <input readOnly value={existente.linha} className="w-full rounded-lg border border-[#d5e0e3] bg-[#fafcfc] px-3 py-2 text-xs font-mono outline-none" />
            <BotaoCopiar texto={existente.linha} />
          </div>
        )}
        {existente.url && (
          <a href={existente.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#30454e] hover:underline">
            <ExternalLink className="size-4" /> Abrir boleto em PDF
          </a>
        )}
        <p className="text-xs text-[#82939a]">A baixa do boleto pode levar até 2 dias úteis após o pagamento.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div><label className={labelCls}>Nome completo</label><input className={inputCls} value={f.nome} onChange={set('nome')} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>CPF</label><input className={inputCls} value={f.cpf} onChange={set('cpf')} inputMode="numeric" /></div>
        <div><label className={labelCls}>CEP</label><input className={inputCls} value={f.cep} onChange={(e) => { set('cep')(e); buscarCep(e.target.value) }} inputMode="numeric" /></div>
      </div>
      <div className="grid grid-cols-[1fr_90px] gap-3">
        <div><label className={labelCls}>Rua</label><input className={inputCls} value={f.rua} onChange={set('rua')} /></div>
        <div><label className={labelCls}>Número</label><input className={inputCls} value={f.numero} onChange={set('numero')} /></div>
      </div>
      <div><label className={labelCls}>Bairro</label><input className={inputCls} value={f.bairro} onChange={set('bairro')} /></div>
      <div className="grid grid-cols-[1fr_70px] gap-3">
        <div><label className={labelCls}>Cidade</label><input className={inputCls} value={f.cidade} onChange={set('cidade')} /></div>
        <div><label className={labelCls}>UF</label><input className={inputCls} value={f.uf} onChange={set('uf')} maxLength={2} /></div>
      </div>
      {erro && <p className="text-sm text-[#991b1b]">{erro}</p>}
      <button onClick={gerar} disabled={enviando} className="w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold text-white hover:brightness-90 disabled:opacity-50" style={cor}>
        {enviando ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
        {enviando ? 'Gerando…' : 'Gerar boleto'}
      </button>
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────────────
export function CheckoutFatura({ fatura, onClose, onPago }: {
  fatura: FaturaMin; onClose: () => void; onPago: () => void
}) {
  const [aba, setAba] = useState<Aba>('pix')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [pix, setPix] = useState<{ copiaCola: string | null; qr: string | null } | null>(null)
  const [gerandoPix, setGerandoPix] = useState(false)
  const [boleto, setBoleto] = useState<{ linha: string | null; url: string | null } | null>(null)
  const [pago, setPago] = useState(false)
  const [aviso, setAviso] = useState('')

  const iniciouPix = useRef(false)

  const gerarNovoPix = useCallback(async () => {
    setGerandoPix(true); setErro('')
    const r = await gerarPix(fatura.id)
    setGerandoPix(false)
    if (!r.success) { setErro(r.error); return }
    setPix(r.pix)
  }, [fatura.id])

  useEffect(() => {
    (async () => {
      const r = await getCheckoutFatura(fatura.id)
      setCarregando(false)
      if (!r.success) { setErro(r.error); return }
      if (r.pago) { setPago(true); return }
      setPublicKey(r.publicKey)
      setBoleto(r.boleto)
      if (r.pix) setPix(r.pix)
    })()
  }, [fatura.id])

  // Gera o PIX automaticamente ao abrir a aba, se ainda não houver um válido.
  useEffect(() => {
    if (!carregando && aba === 'pix' && !pix && !pago && !iniciouPix.current && !erro) {
      iniciouPix.current = true
      gerarNovoPix()
    }
  }, [carregando, aba, pix, pago, erro, gerarNovoPix])

  // Enquanto há PIX ou boleto em aberto, confere a cada 5s se o pagamento caiu.
  useEffect(() => {
    if (pago || (!pix && !boleto)) return
    const t = setInterval(async () => {
      const r = await getCheckoutFatura(fatura.id)
      if (r.success && r.pago) setPago(true)
    }, 5000)
    return () => clearInterval(t)
  }, [pago, pix, boleto, fatura.id])

  function fechar() { if (pago) onPago(); onClose() }

  const abas: { id: Aba; label: string; icon: typeof QrCode }[] = [
    { id: 'pix', label: 'PIX', icon: QrCode },
    ...(publicKey ? [{ id: 'cartao' as Aba, label: 'Cartão', icon: CreditCard }] : []),
    { id: 'boleto', label: 'Boleto', icon: FileText },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={fechar} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#12232b]">Pagamento · {moeda(fatura.valor_centavos)}</h2>
            <p className="mt-0.5 text-xs text-[#82939a]">{fatura.descricao}</p>
          </div>
          <button onClick={fechar} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
        </header>

        <div className="overflow-y-auto p-6">
          {pago ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="size-14 text-[#087f5b]" />
              <p className="mt-3 text-lg font-bold text-[#12232b]">Pagamento confirmado!</p>
              <p className="mt-1 text-sm text-[#82939a]">Obrigado. Sua fatura foi quitada.</p>
              <button onClick={fechar} className="mt-6 rounded-lg px-6 py-2.5 text-sm font-bold text-white hover:brightness-90" style={cor}>Fechar</button>
            </div>
          ) : aviso ? (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto size-10 text-[#a16207]" />
              <p className="mt-3 text-sm text-[#536871]">{aviso}</p>
              <button onClick={fechar} className="mt-6 rounded-lg px-6 py-2.5 text-sm font-bold text-white hover:brightness-90" style={cor}>Fechar</button>
            </div>
          ) : carregando ? (
            <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-[#82939a]" /></div>
          ) : (
            <>
              <div className="mb-5 flex gap-2">
                {abas.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setErro(''); setAba(id) }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${aba === id ? 'text-white border-transparent' : 'border-[#d5e0e3] text-[#30454e] hover:border-[var(--cor-primaria,#0d9488)]'}`}
                    style={aba === id ? cor : undefined}
                  >
                    <Icon className="size-4" /> {label}
                  </button>
                ))}
              </div>

              {aba === 'pix' && (
                <div className="flex flex-col items-center">
                  {gerandoPix || (!pix && !erro) ? (
                    <div className="flex size-48 items-center justify-center"><Loader2 className="size-6 animate-spin text-[#82939a]" /></div>
                  ) : pix ? (
                    <>
                      <p className="mb-4 text-center text-sm text-[#536871]">Abra o app do seu banco e escaneie o QR Code, ou use o Copia e Cola.</p>
                      {pix.qr && <div className="mb-4 rounded-xl border border-[#e5ecee] bg-[#fafcfc] p-4"><img src={pix.qr} alt="QR Code PIX" className="size-48 object-contain" /></div>}
                      {pix.copiaCola && (
                        <div className="flex w-full gap-2">
                          <input readOnly value={pix.copiaCola} className="w-full rounded-lg border border-[#d5e0e3] bg-[#fafcfc] px-3 py-2 text-xs font-mono outline-none" />
                          <BotaoCopiar texto={pix.copiaCola} />
                        </div>
                      )}
                      <p className="mt-4 text-center text-xs text-[#82939a]">O pagamento é identificado automaticamente em alguns segundos.</p>
                    </>
                  ) : (
                    <button onClick={gerarNovoPix} className="rounded-lg px-5 py-2.5 text-sm font-bold text-white" style={cor}>Tentar gerar o PIX novamente</button>
                  )}
                </div>
              )}

              {aba === 'cartao' && publicKey && (
                <AbaCartao fatura={fatura} publicKey={publicKey} onAprovado={() => setPago(true)} onAnalise={setAviso} />
              )}

              {aba === 'boleto' && (
                <AbaBoleto fatura={fatura} existente={boleto} onGerado={setBoleto} />
              )}

              {erro && aba !== 'cartao' && aba !== 'boleto' && <p className="mt-3 text-center text-sm text-[#991b1b]">{erro}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
