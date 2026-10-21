'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { BannerUpload } from '@/components/banner-upload'
import type { Formulario, CampoFormulario } from '@/lib/cms/tipos-formulario'
import { submitFormularioPublico } from './actions'

function formatarCPF(v: string): string {
  const n = v.replace(/\D/g, '').slice(0, 11)
  if (n.length <= 3) return n
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`
}

function formatarTelefone(v: string): string {
  const n = v.replace(/\D/g, '').slice(0, 11)
  if (n.length <= 2) return n
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
}

export function FormularioPublicoClient({
  formulario,
  campos,
  escolaNome,
}: {
  formulario: Formulario
  campos: CampoFormulario[]
  escolaNome: string
}) {
  const cor = formulario.cor_primaria || '#0d9488'
  const [respostas, setRespostas] = useState<Record<string, any>>({})
  const [uploads, setUploads] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  // Expõe --cor-primaria no wrapper para que qualquer componente interno
  // (BannerUpload, por exemplo) herde a cor própria deste formulário.
  const estiloWrapper = {
    backgroundColor: '#f6f8f9',
    '--cor-primaria': cor,
  } as React.CSSProperties

  function atualizar(id: string, valor: any) {
    setRespostas((atual) => ({ ...atual, [id]: valor }))
  }

  function validar(): string | null {
    for (const c of campos) {
      if (!c.obrigatorio) continue
      const v = c.tipo === 'upload' ? uploads[c.id] : respostas[c.id]
      if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) {
        return `Preencha o campo: ${c.label}`
      }
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    const erroValidacao = validar()
    if (erroValidacao) {
      setErro(erroValidacao)
      return
    }

    const dadosFinais: Record<string, any> = {}
    for (const c of campos) {
      dadosFinais[c.id] = c.tipo === 'upload' ? uploads[c.id] || null : respostas[c.id] ?? null
    }

    setEnviando(true)
    const r = await submitFormularioPublico(formulario.slug, dadosFinais)
    setEnviando(false)

    if (!r.success) {
      setErro(r.error || 'Erro ao enviar.')
      return
    }

    setSucesso(true)

    if (r.redirecionar_url) {
      setTimeout(() => { window.location.href = r.redirecionar_url! }, 2000)
    }
  }

  if (sucesso) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-12" style={estiloWrapper}>
        <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-sm">
          <div
            className="mx-auto grid size-16 place-items-center rounded-full"
            style={{ backgroundColor: `${cor}20`, color: cor }}
          >
            <CheckCircle2 className="size-8" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-[#12232b]">Obrigado!</h1>
          <p className="mt-3 text-sm leading-6 text-[#536871]">
            {formulario.mensagem_sucesso || 'Recebemos sua resposta.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12" style={estiloWrapper}>
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: cor }}>{escolaNome}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b] sm:text-4xl">{formulario.titulo}</h1>
          {formulario.descricao && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#536871]">{formulario.descricao}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm lg:p-8">
          <div className="space-y-6">
            {campos.map((c) => (
              <CampoRenderer
                key={c.id}
                campo={c}
                cor={cor}
                valor={respostas[c.id]}
                onChange={(v) => atualizar(c.id, v)}
                uploadUrl={uploads[c.id]}
                onUpload={(url) => {
                  setUploads((u) => ({ ...u, [c.id]: url }))
                  atualizar(c.id, url)
                }}
              />
            ))}
          </div>

          {erro && (
            <p className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600">{erro}</p>
          )}

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
              style={{ backgroundColor: cor }}
            >
              {enviando ? <><Loader2 className="size-4 animate-spin" /> Enviando...</> : 'Enviar resposta'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-[#a0afb4]">Desenvolvido com ARXUM Edu</p>
      </div>
    </div>
  )
}

function CampoRenderer({
  campo,
  cor,
  valor,
  onChange,
  uploadUrl,
  onUpload,
}: {
  campo: CampoFormulario
  cor: string
  valor: any
  onChange: (v: any) => void
  uploadUrl?: string
  onUpload: (url: string) => void
}) {
  // Focus usa --cor-primaria (definida no wrapper com a cor do formulário)
  const baseInput = 'w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2.5 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]'

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#243942]">
        {campo.label} {campo.obrigatorio && <span className="text-[#dc2626]">*</span>}
      </label>

      {campo.tipo === 'texto_curto' && (
        <input type="text" value={valor || ''} onChange={(e) => onChange(e.target.value)} placeholder={campo.placeholder || ''} className={baseInput} />
      )}

      {campo.tipo === 'texto_longo' && (
        <textarea value={valor || ''} onChange={(e) => onChange(e.target.value)} placeholder={campo.placeholder || ''} rows={4} className={`${baseInput} resize-none`} />
      )}

      {campo.tipo === 'multipla_escolha' && (
        <div className="space-y-2">
          {campo.opcoes.map((op) => (
            <label key={op} className="flex items-center gap-2 text-sm text-[#243942] cursor-pointer">
              <input type="radio" name={campo.id} value={op} checked={valor === op} onChange={() => onChange(op)} className="size-4" style={{ accentColor: cor }} />
              {op}
            </label>
          ))}
        </div>
      )}

      {campo.tipo === 'checkbox' && (
        <div className="space-y-2">
          {campo.opcoes.map((op) => {
            const arr = Array.isArray(valor) ? valor : []
            const marcado = arr.includes(op)
            return (
              <label key={op} className="flex items-center gap-2 text-sm text-[#243942] cursor-pointer">
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => {
                    const novo = marcado ? arr.filter((v) => v !== op) : [...arr, op]
                    onChange(novo)
                  }}
                  className="size-4"
                  style={{ accentColor: cor }}
                />
                {op}
              </label>
            )
          })}
        </div>
      )}

      {campo.tipo === 'sim_nao' && (
        <div className="flex gap-3">
          {['Sim', 'Não'].map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => onChange(op)}
              className={`rounded-lg border-2 px-6 py-2 text-sm font-semibold transition ${
                valor === op
                  ? 'text-white'
                  : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[var(--cor-primaria,#0d9488)]'
              }`}
              style={valor === op ? { backgroundColor: cor, borderColor: cor } : undefined}
            >
              {op}
            </button>
          ))}
        </div>
      )}

      {campo.tipo === 'numero' && (
        <input type="number" value={valor || ''} onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : null)} placeholder={campo.placeholder || ''} className={baseInput} />
      )}

      {campo.tipo === 'data' && (
        <input type="date" value={valor || ''} onChange={(e) => onChange(e.target.value)} className={baseInput} />
      )}

      {campo.tipo === 'cpf' && (
        <input type="text" value={valor || ''} onChange={(e) => onChange(formatarCPF(e.target.value))} placeholder="000.000.000-00" className={baseInput} />
      )}

      {campo.tipo === 'telefone' && (
        <input type="tel" value={valor || ''} onChange={(e) => onChange(formatarTelefone(e.target.value))} placeholder="(21) 90000-0000" className={baseInput} />
      )}

      {campo.tipo === 'email' && (
        <input type="email" value={valor || ''} onChange={(e) => onChange(e.target.value)} placeholder={campo.placeholder || 'seu@email.com'} className={baseInput} />
      )}

      {campo.tipo === 'upload' && (
        <BannerUpload urlAtual={uploadUrl || ''} onUploaded={onUpload} />
      )}

      {campo.texto_ajuda && (
        <p className="mt-1.5 text-xs text-[#82939a]">{campo.texto_ajuda}</p>
      )}
    </div>
  )
}