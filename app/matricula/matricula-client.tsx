'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Check, User, MapPin, Heart, FileText, ClipboardCheck } from 'lucide-react'
import { PublicHeader, PublicFooter } from '@/components/arxum-brand'
import { DocumentoUpload } from '@/components/documento-upload'
import { submitInscricao, type InscricaoInput, type DocumentosInput } from './actions'

const steps = [
  { num: 1, label: 'Dados do aluno', icon: User },
  { num: 2, label: 'Responsável', icon: User },
  { num: 3, label: 'Endereço e emergência', icon: MapPin },
  { num: 4, label: 'Documentos', icon: FileText },
  { num: 5, label: 'Anamnese', icon: Heart },
  { num: 6, label: 'Revisão', icon: ClipboardCheck },
]

const series = [
  'Berçário', 'Maternal', 'Pré-escola',
  '1º Ano Fundamental', '2º Ano Fundamental', '3º Ano Fundamental', '4º Ano Fundamental', '5º Ano Fundamental',
  '6º Ano Fundamental', '7º Ano Fundamental', '8º Ano Fundamental', '9º Ano Fundamental',
  '1º Ano Ensino Médio', '2º Ano Ensino Médio', '3º Ano Ensino Médio',
]

const turnos = ['Manhã', 'Tarde', 'Integral']
const parentescos = ['Mãe', 'Pai', 'Avó/Avô', 'Tio/Tia', 'Responsável legal', 'Outro']
const estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const initialForm: InscricaoInput = {
  aluno_nome: '',
  aluno_data_nascimento: '',
  aluno_serie: '',
  aluno_turno: '',
  aluno_escola_origem: '',
  responsavel_nome: '',
  responsavel_cpf: '',
  responsavel_email: '',
  responsavel_telefone: '',
  responsavel_parentesco: '',
  endereco_cep: '',
  endereco_rua: '',
  endereco_numero: '',
  endereco_complemento: '',
  endereco_bairro: '',
  endereco_cidade: '',
  endereco_estado: '',
  emergencia_nome: '',
  emergencia_telefone: '',
  emergencia_parentesco: '',
  anamnese_alergias: '',
  anamnese_condicoes: '',
  anamnese_medicamentos: '',
  anamnese_plano_saude: '',
}

function Field({ label, value, onChange, type = 'text', placeholder = '', required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-[#c7d5db]">
        {label} {required && <span className="text-[#dc2626]">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#5e7a94] focus:border-[#0d9488]"
      />
    </div>
  )
}

function Select({ label, value, onChange, options, required = false }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-[#c7d5db]">
        {label} {required && <span className="text-[#dc2626]">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]"
      >
        <option value="">Selecione</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder = '', rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-[#c7d5db]">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#5e7a94] focus:border-[#0d9488]"
      />
    </div>
  )
}

export function MatriculaClient({ escolaNome }: { escolaNome: string }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<InscricaoInput>(initialForm)
  const [docs, setDocs] = useState<DocumentosInput>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update<K extends keyof InscricaoInput>(key: K, value: InscricaoInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateDoc(key: keyof DocumentosInput, url: string | null, nome: string | null) {
    setDocs((prev) => ({ ...prev, [key]: url && nome ? { url, nome } : null }))
  }

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.aluno_nome.trim()) return 'Informe o nome do aluno.'
      if (!form.aluno_data_nascimento) return 'Informe a data de nascimento.'
      if (!form.aluno_serie) return 'Selecione a série pretendida.'
      if (!form.aluno_turno) return 'Selecione o turno.'
    }
    if (step === 2) {
      if (!form.responsavel_nome.trim()) return 'Informe o nome do responsável.'
      if (!form.responsavel_email.trim()) return 'Informe o e-mail do responsável.'
      if (!form.responsavel_telefone.trim()) return 'Informe o telefone do responsável.'
    }
    return null
  }

  function next() {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setStep((s) => Math.min(s + 1, 6))
  }

  function back() {
    setError('')
    setStep((s) => Math.max(s - 1, 1))
  }

  async function submit() {
    setLoading(true)
    setError('')
    const result = await submitInscricao(form, docs)
    setLoading(false)

    if (!result.success) {
      setError(result.error || 'Erro ao enviar inscrição.')
      return
    }

    router.push(`/matricula/sucesso?protocolo=${result.protocolo}&email=${encodeURIComponent(form.responsavel_email)}`)
  }

  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#0d9488]">{escolaNome}</p>
          <h1 className="mt-3 font-syne text-4xl font-bold tracking-[-.04em] text-white">Matrícula Online</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8aa0ad]">
            Sua inscrição será analisada pela escola antes da efetivação da matrícula.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside>
            <div className="rounded-xl border border-white/[.08] bg-[#0e151a] p-5">
              <h2 className="mb-5 text-sm font-semibold text-white">Etapas</h2>
              <ol className="space-y-3">
                {steps.map((s) => {
                  const done = step > s.num
                  const active = step === s.num
                  const Icon = s.icon
                  return (
                    <li key={s.num} className="flex items-center gap-3">
                      <div className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
                        done ? 'bg-[#0d9488] text-white' : active ? 'bg-[#0d9488] text-white' : 'bg-[#1a232b] text-[#5e7a94]'
                      }`}>
                        {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                      </div>
                      <span className={`text-sm ${active ? 'font-semibold text-white' : done ? 'text-[#c7d5db]' : 'text-[#5e7a94]'}`}>
                        {s.label}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>
          </aside>

          <section className="rounded-xl border border-white/[.08] bg-[#0e151a] p-6 lg:p-8">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="mb-6 font-syne text-xl font-bold text-white">Dados do aluno</h2>
                <Field label="Nome completo do aluno" value={form.aluno_nome} onChange={(v) => update('aluno_nome', v)} required placeholder="Como consta na certidão" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Data de nascimento" type="date" value={form.aluno_data_nascimento} onChange={(v) => update('aluno_data_nascimento', v)} required />
                  <Select label="Série pretendida" value={form.aluno_serie} onChange={(v) => update('aluno_serie', v)} options={series} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select label="Turno" value={form.aluno_turno} onChange={(v) => update('aluno_turno', v)} options={turnos} required />
                  <Field label="Escola de origem" value={form.aluno_escola_origem} onChange={(v) => update('aluno_escola_origem', v)} placeholder="Opcional" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="mb-6 font-syne text-xl font-bold text-white">Dados do responsável</h2>
                <Field label="Nome completo" value={form.responsavel_nome} onChange={(v) => update('responsavel_nome', v)} required />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="CPF" value={form.responsavel_cpf} onChange={(v) => update('responsavel_cpf', v)} placeholder="000.000.000-00" />
                  <Select label="Parentesco" value={form.responsavel_parentesco} onChange={(v) => update('responsavel_parentesco', v)} options={parentescos} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="E-mail" type="email" value={form.responsavel_email} onChange={(v) => update('responsavel_email', v)} required placeholder="seu@email.com" />
                  <Field label="Telefone / WhatsApp" value={form.responsavel_telefone} onChange={(v) => update('responsavel_telefone', v)} required placeholder="(21) 90000-0000" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="mb-6 font-syne text-xl font-bold text-white">Endereço e contato de emergência</h2>
                <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                  <Field label="CEP" value={form.endereco_cep} onChange={(v) => update('endereco_cep', v)} placeholder="00000-000" />
                  <Field label="Rua / Logradouro" value={form.endereco_rua} onChange={(v) => update('endereco_rua', v)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                  <Field label="Número" value={form.endereco_numero} onChange={(v) => update('endereco_numero', v)} />
                  <Field label="Complemento" value={form.endereco_complemento} onChange={(v) => update('endereco_complemento', v)} placeholder="Apto, bloco, etc. (opcional)" />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Bairro" value={form.endereco_bairro} onChange={(v) => update('endereco_bairro', v)} />
                  <Field label="Cidade" value={form.endereco_cidade} onChange={(v) => update('endereco_cidade', v)} />
                  <Select label="Estado" value={form.endereco_estado} onChange={(v) => update('endereco_estado', v)} options={estados} />
                </div>
                <div className="mt-6 border-t border-white/[.08] pt-6">
                  <h3 className="mb-4 text-sm font-semibold text-white">Contato de emergência</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Nome" value={form.emergencia_nome} onChange={(v) => update('emergencia_nome', v)} />
                    <Field label="Telefone" value={form.emergencia_telefone} onChange={(v) => update('emergencia_telefone', v)} />
                    <Select label="Parentesco" value={form.emergencia_parentesco} onChange={(v) => update('emergencia_parentesco', v)} options={parentescos} />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="mb-2 font-syne text-xl font-bold text-white">Documentos</h2>
                <p className="mb-6 text-sm leading-6 text-[#8aa0ad]">
                  Anexe os documentos abaixo. Aceitamos PDF (até 8 MB) ou imagem (até 4 MB).
                  Você também pode enviar depois, pela área restrita.
                </p>
                <DocumentoUpload label="RG ou Certidão de nascimento do aluno" onUploaded={(url, nome) => updateDoc('rg_aluno', url, nome)} />
                <DocumentoUpload label="CPF do responsável" onUploaded={(url, nome) => updateDoc('cpf_responsavel', url, nome)} />
                <DocumentoUpload label="Comprovante de residência" onUploaded={(url, nome) => updateDoc('comprovante_residencia', url, nome)} />
                <DocumentoUpload label="Histórico escolar" onUploaded={(url, nome) => updateDoc('historico_escolar', url, nome)} />
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h2 className="mb-6 font-syne text-xl font-bold text-white">Anamnese</h2>
                <TextArea label="Alergias" value={form.anamnese_alergias} onChange={(v) => update('anamnese_alergias', v)} placeholder="Alimentos, medicamentos, etc. Deixe em branco se não houver." />
                <TextArea label="Condições médicas" value={form.anamnese_condicoes} onChange={(v) => update('anamnese_condicoes', v)} placeholder="Asma, diabetes, etc." />
                <TextArea label="Medicamentos de uso contínuo" value={form.anamnese_medicamentos} onChange={(v) => update('anamnese_medicamentos', v)} placeholder="Se houver" />
                <Field label="Plano de saúde" value={form.anamnese_plano_saude} onChange={(v) => update('anamnese_plano_saude', v)} placeholder="Nome do plano e número da carteirinha" />
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <h2 className="font-syne text-xl font-bold text-white">Revisão</h2>
                <div className="space-y-4 rounded-lg border border-white/[.08] bg-[#0b1115] p-5">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0d9488]">Dados do aluno</p>
                    <p className="text-sm text-[#c7d5db]"><strong>Nome:</strong> {form.aluno_nome || '—'}</p>
                    <p className="text-sm text-[#c7d5db]"><strong>Nascimento:</strong> {form.aluno_data_nascimento || '—'}</p>
                    <p className="text-sm text-[#c7d5db]"><strong>Série:</strong> {form.aluno_serie || '—'}</p>
                    <p className="text-sm text-[#c7d5db]"><strong>Turno:</strong> {form.aluno_turno || '—'}</p>
                  </div>
                  <div className="border-t border-white/[.08] pt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0d9488]">Responsável</p>
                    <p className="text-sm text-[#c7d5db]"><strong>Nome:</strong> {form.responsavel_nome || '—'}</p>
                    <p className="text-sm text-[#c7d5db]"><strong>E-mail:</strong> {form.responsavel_email || '—'}</p>
                    <p className="text-sm text-[#c7d5db]"><strong>Telefone:</strong> {form.responsavel_telefone || '—'}</p>
                  </div>
                  <div className="border-t border-white/[.08] pt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0d9488]">Documentos anexados</p>
                    {(['rg_aluno', 'cpf_responsavel', 'comprovante_residencia', 'historico_escolar'] as const).map((k) => (
                      <p key={k} className="text-sm text-[#c7d5db]">
                        {k === 'rg_aluno' && 'RG/Certidão do aluno'}{k === 'cpf_responsavel' && 'CPF do responsável'}{k === 'comprovante_residencia' && 'Comprovante de residência'}{k === 'historico_escolar' && 'Histórico escolar'}:
                        {' '}{docs[k]?.nome || <span className="text-[#5e7a94]">Não anexado</span>}
                      </p>
                    ))}
                  </div>
                </div>
                <label className="flex items-start gap-3 text-sm text-[#c7d5db]">
                  <input type="checkbox" required className="mt-0.5 size-4 rounded border-white/20 bg-[#0b1115] accent-[#0d9488]" />
                  <span>Declaro que as informações fornecidas são verdadeiras e autorizo a escola a utilizá-las para fins de análise da inscrição, conforme a LGPD.</span>
                </label>
              </div>
            )}

            {error && (
              <p className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
            )}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/[.08] pt-6">
              <button onClick={back} disabled={step === 1 || loading} className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-[#c7d5db] transition hover:border-white/30 disabled:opacity-30">
                <ArrowLeft className="size-4" /> Voltar
              </button>
              <span className="hidden text-xs text-[#5e7a94] sm:block">Etapa {step} de 6</span>
              {step < 6 ? (
                <button onClick={next} className="flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f766e]">
                  Avançar <ArrowRight className="size-4" />
                </button>
              ) : (
                <button onClick={submit} disabled={loading} className="flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-50">
                  {loading ? 'Enviando...' : 'Enviar inscrição'} <ArrowRight className="size-4" />
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}