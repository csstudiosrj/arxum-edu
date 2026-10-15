'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, ChevronDown, FileText, CheckCircle2, Loader2 } from 'lucide-react'
import { ArxumBrand } from '@/components/arxum-brand'
import { createClient } from '@/lib/supabase/client'
import { UploadButton } from '@uploadthing/react'

const steps = ['Dados do aluno', 'Dados do responsável', 'Endereço e emergência', 'Documentos', 'Anamnese', 'Revisão']

function Field({ label, placeholder, type = 'text', name, value, onChange }: { label: string; placeholder?: string; type?: string; name: string; value: string; onChange: (e: any) => void }) { 
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[#c7d5db]">
      {label}
      <input 
        type={type} 
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder} 
        className="h-11 rounded-lg border border-white/10 bg-[#0b1115] px-3 text-sm text-white outline-none placeholder:text-[#526773] focus:border-[#0d9488]" 
      />
    </label>
  ) 
}

export default function MatriculaPage() { 
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    aluno_nome: '', aluno_nascimento: '', serie: '', turno: 'Manhã', escola_origem: '',
    resp_nome: '', resp_cpf: '', resp_telefone: '', resp_email: '', resp_parentesco: '',
    cep: '', numero: '', rua: '', bairro: '', cidade: '', contato_emergencia: '', tel_emergencia: '',
    doc_rg_aluno: '', doc_cpf_resp: '', doc_residencia: '', doc_historico: '',
    alergias: '', condicoes_medicas: '', medicamentos: '', plano_saude: '',
    aceite_termos: false
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFormData(prev => ({ ...prev, [name]: val }))
  }

  const handleSubmit = async () => {
    if (!formData.aceite_termos) {
      alert("Você precisa declarar que as informações são verdadeiras.")
      return
    }

    setIsSubmitting(true)
    
    const { error } = await supabase
      .from('matriculas')
      .insert([{
        ...formData,
        status: 'Inscrito' // Status inicial conforme o PRD
      }])

    setIsSubmitting(false)

    if (error) {
      console.error("Erro ao salvar matrícula:", error)
      alert("Ocorreu um erro ao enviar sua inscrição. Tente novamente.")
    } else {
      setIsSuccess(true)
    }
  }

  if (isSuccess) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#070b0f] p-6 text-center text-[#e7f1f5]">
        <div className="mb-6 grid size-20 place-items-center rounded-full bg-[#0d9488]/20 text-[#0d9488]">
          <CheckCircle2 className="size-10" />
        </div>
        <h1 className="font-syne text-3xl font-bold text-white">Inscrição Recebida!</h1>
        <p className="mt-4 max-w-md text-[#8196a2]">
          Sua solicitação de matrícula foi enviada com sucesso. A escola analisará os documentos e entrará em contato em breve.
        </p>
        <Link href="/" className="mt-8 rounded-lg bg-[#0d9488] px-6 py-3 text-sm font-semibold text-[#061015] hover:bg-[#14b8a6]">
          Voltar para o início
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#070b0f] text-[#e7f1f5]">
      <header className="border-b border-white/[.08] px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <ArxumBrand />
          <Link href="/" className="text-sm text-[#8196a2] hover:text-white">Sair</Link>
        </div>
      </header>
      
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[240px_1fr] lg:gap-20 lg:py-16">
        <aside>
          <p className="font-syne text-base font-bold text-white">Etapas</p>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-3 lg:block lg:space-y-5 lg:overflow-visible lg:pb-0">
            {steps.map((item, index) => (
              <button 
                key={item} 
                onClick={() => index <= step && setStep(index)} 
                className={`flex shrink-0 items-center gap-3 text-left text-sm lg:w-full ${index === step ? 'text-white' : index < step ? 'text-[#0d9488]' : 'text-[#617783]'}`}
              >
                <span className={`grid size-7 place-items-center rounded-full border text-xs font-semibold ${index === step ? 'border-[#0d9488] bg-[#0d9488] text-[#061015]' : index < step ? 'border-[#0d9488] text-[#0d9488]' : 'border-white/15'}`}>
                  {index < step ? <Check className="size-3.5" /> : index + 1}
                </span>
                {item}
              </button>
            ))}
          </div>
          <p className="mt-10 hidden text-xs leading-5 text-[#617783] lg:block">Você pode salvar e continuar depois. Seus dados ficam protegidos.</p>
        </aside>

        <section className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#0d9488]">Inscrição escolar</p>
          <h1 className="mt-3 font-syne text-3xl font-bold tracking-[-.05em] text-white">Matrícula Online</h1>
          <p className="mt-2 text-sm text-[#8196a2]">Sua inscrição será analisada pela escola antes da efetivação da matrícula.</p>
          
          <div className="mt-8 rounded-2xl border border-white/[.08] bg-[#111820] p-6 sm:p-8">
            
            {step === 0 && (
              <div>
                <h2 className="font-syne text-xl font-bold text-white">Dados do aluno</h2>
                <p className="mt-1 text-sm text-[#8196a2]">Comece contando um pouco sobre quem vai estudar conosco.</p>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Nome completo" name="aluno_nome" value={formData.aluno_nome} onChange={handleChange} placeholder="Nome do aluno" />
                  </div>
                  <Field label="Data de nascimento" name="aluno_nascimento" value={formData.aluno_nascimento} onChange={handleChange} type="date" />
                  <label className="flex flex-col gap-2 text-sm font-medium text-[#c7d5db]">
                    Série pretendida
                    <div className="relative">
                      <select name="serie" value={formData.serie} onChange={handleChange} className="h-11 w-full appearance-none rounded-lg border border-white/10 bg-[#0b1115] px-3 text-sm text-[#8196a2] outline-none focus:border-[#0d9488]">
                        <option value="">Selecione a série</option>
                        <option value="Educação Infantil">Educação Infantil</option>
                        <option value="1º ano do Fundamental">1º ano do Fundamental</option>
                        <option value="1º ano do Ensino Médio">1º ano do Ensino Médio</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-4 text-[#617783]" />
                    </div>
                  </label>
                  <div className="sm:col-span-2">
                    <p className="mb-3 text-sm font-medium text-[#c7d5db]">Turno</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['Manhã', 'Tarde', 'Integral'].map((item) => (
                        <label key={item} className={`flex cursor-pointer items-center justify-center rounded-lg border p-3 text-sm ${formData.turno === item ? 'border-[#0d9488] bg-[#0d9488]/10 text-[#14b8a6]' : 'border-white/10 text-[#8196a2]'}`}>
                          <input type="radio" name="turno" value={item} checked={formData.turno === item} onChange={handleChange} className="sr-only" />
                          {item}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Escola de origem" name="escola_origem" value={formData.escola_origem} onChange={handleChange} placeholder="Nome da escola atual (opcional)" />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="font-syne text-xl font-bold text-white">Dados do responsável</h2>
                <p className="mt-1 text-sm text-[#8196a2]">Precisamos de um contato para acompanhar a inscrição.</p>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Nome completo" name="resp_nome" value={formData.resp_nome} onChange={handleChange} placeholder="Nome do responsável" />
                  </div>
                  <Field label="CPF" name="resp_cpf" value={formData.resp_cpf} onChange={handleChange} placeholder="000.000.000-00" />
                  <Field label="Telefone" name="resp_telefone" value={formData.resp_telefone} onChange={handleChange} placeholder="(00) 00000-0000" />
                  <div className="sm:col-span-2">
                    <Field label="E-mail" name="resp_email" value={formData.resp_email} onChange={handleChange} placeholder="responsavel@email.com" type="email" />
                  </div>
                  <Field label="Parentesco" name="resp_parentesco" value={formData.resp_parentesco} onChange={handleChange} placeholder="Mãe, pai, responsável" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-syne text-xl font-bold text-white">Endereço e emergência</h2>
                <p className="mt-1 text-sm text-[#8196a2]">Onde podemos encontrar sua família?</p>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <Field label="CEP" name="cep" value={formData.cep} onChange={handleChange} placeholder="00000-000" />
                  <Field label="Número" name="numero" value={formData.numero} onChange={handleChange} placeholder="123" />
                  <div className="sm:col-span-2">
                    <Field label="Rua" name="rua" value={formData.rua} onChange={handleChange} placeholder="Nome da rua" />
                  </div>
                  <Field label="Bairro" name="bairro" value={formData.bairro} onChange={handleChange} placeholder="Bairro" />
                  <Field label="Cidade" name="cidade" value={formData.cidade} onChange={handleChange} placeholder="Cidade" />
                  <Field label="Contato de emergência" name="contato_emergencia" value={formData.contato_emergencia} onChange={handleChange} placeholder="Nome completo" />
                  <Field label="Telefone de emergência" name="tel_emergencia" value={formData.tel_emergencia} onChange={handleChange} placeholder="(00) 00000-0000" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-syne text-xl font-bold text-white">Documentos</h2>
                <p className="mt-1 text-sm text-[#8196a2]">Envie os documentos necessários para análise.</p>
                <div className="mt-7 flex flex-col gap-3">
                  {[
                    { label: 'RG do aluno', key: 'doc_rg_aluno' },
                    { label: 'CPF do responsável', key: 'doc_cpf_resp' },
                    { label: 'Comprovante de residência', key: 'doc_residencia' },
                    { label: 'Histórico escolar', key: 'doc_historico' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-4 rounded-xl border border-dashed border-white/15 bg-[#0b1115] p-4">
                      <div className="grid size-10 place-items-center rounded-lg bg-[#0d9488]/10 text-[#0d9488]">
                        <FileText className="size-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="mt-1 text-xs text-[#617783]">
                          {formData[item.key as keyof typeof formData] ? 'Enviado' : 'Pendente'}
                        </p>
                      </div>
                      
                      {/* UPLOADTHING REAL AQUI */}
                      <div className="w-32">
                        <UploadButton
                          endpoint="imageUploader" // Certifique-se que este endpoint existe no seu core.ts do UploadThing
                          onClientUploadComplete={(res) => {
                            if (res && res[0]) {
                              setFormData(prev => ({ ...prev, [item.key]: res[0].url }))
                            }
                          }}
                          onUploadError={(error: Error) => {
                            alert(`Erro no upload: ${error.message}`)
                          }}
                          appearance={{
                            button: "bg-transparent border border-white/10 text-[#8196a2] text-xs h-9 px-3 hover:border-[#0d9488] hover:text-[#0d9488] w-full",
                            allowedContent: "hidden"
                          }}
                          content={{
                            button: formData[item.key as keyof typeof formData] ? "Trocar" : "Enviar"
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="font-syne text-xl font-bold text-white">Anamnese</h2>
                <p className="mt-1 text-sm text-[#8196a2]">Conte o que a escola precisa saber para acolher seu filho.</p>
                <div className="mt-7 flex flex-col gap-5">
                  {[
                    { label: 'Alergias', key: 'alergias' },
                    { label: 'Condições médicas', key: 'condicoes_medicas' },
                    { label: 'Medicamentos de uso contínuo', key: 'medicamentos' }
                  ].map((item) => (
                    <label key={item.key} className="flex flex-col gap-2 text-sm font-medium text-[#c7d5db]">
                      {item.label}
                      <textarea 
                        name={item.key}
                        value={formData[item.key as keyof typeof formData] as string}
                        onChange={handleChange}
                        rows={3} 
                        placeholder="Digite aqui..." 
                        className="resize-none rounded-lg border border-white/10 bg-[#0b1115] p-3 text-sm text-white outline-none placeholder:text-[#526773] focus:border-[#0d9488]" 
                      />
                    </label>
                  ))}
                  <Field label="Plano de saúde" name="plano_saude" value={formData.plano_saude} onChange={handleChange} placeholder="Nome do plano (opcional)" />
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 className="font-syne text-xl font-bold text-white">Revise sua inscrição</h2>
                <p className="mt-1 text-sm text-[#8196a2]">Confira os dados antes de enviar para a escola.</p>
                <div className="mt-7 flex flex-col gap-3">
                  {['Dados do aluno', 'Dados do responsável', 'Endereço e emergência', 'Documentos'].map((item, idx) => (
                    <div key={item} className="flex items-center justify-between rounded-lg border border-white/[.08] bg-[#0b1115] p-4">
                      <span className="text-sm text-white">{item}</span>
                      <button onClick={() => setStep(idx)} className="text-xs font-medium text-[#0d9488]">Editar</button>
                    </div>
                  ))}
                </div>
                <label className="mt-7 flex items-start gap-3 text-sm text-[#a7bac4] cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="aceite_termos"
                    checked={formData.aceite_termos}
                    onChange={handleChange}
                    className="mt-0.5 accent-[#0d9488]" 
                  />
                  Declaro que as informações são verdadeiras.
                </label>
              </div>
            )}

            <div className="mt-10 flex items-center justify-between border-t border-white/[.08] pt-6">
              <button disabled={step === 0 || isSubmitting} onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-sm font-medium text-[#8196a2] disabled:opacity-30">
                <ArrowLeft className="size-4" />
                Voltar
              </button>
              <div className="text-xs text-[#617783]">Etapa {step + 1} de 6</div>
              
              {step === 5 ? (
                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-[#0d9488] px-5 py-2.5 text-sm font-semibold text-[#061015] hover:bg-[#14b8a6] disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Enviar inscrição'}
                  {!isSubmitting && <ArrowRight className="size-4" />}
                </button>
              ) : (
                <button 
                  onClick={() => setStep(step + 1)} 
                  className="flex items-center gap-2 rounded-lg bg-[#0d9488] px-5 py-2.5 text-sm font-semibold text-[#061015] hover:bg-[#14b8a6]"
                >
                  Avançar
                  <ArrowRight className="size-4" />
                </button>
              )}
            </div>

          </div>
        </section>
      </div>
    </main>
  )
}