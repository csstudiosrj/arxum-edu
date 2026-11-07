'use client'

import { useState, useEffect } from 'react'
import { Mail, Send, Users, User, GraduationCap, Briefcase, Loader2, CheckCircle2 } from 'lucide-react'
import { Editor } from 'react-simple-wysiwyg'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { dispararEmails, contarDestinatarios } from './actions'

const PUBLICOS = [
  { key: 'todos', label: 'Toda a escola', icon: Users, desc: 'Pais, alunos, professores e funcionários.' },
  { key: 'pais', label: 'Apenas Pais/Responsáveis', icon: User, desc: 'E-mails dos responsáveis dos alunos.' },
  { key: 'alunos', label: 'Apenas Alunos', icon: GraduationCap, desc: 'E-mails cadastrados dos próprios alunos.' },
  { key: 'professores', label: 'Apenas Professores', icon: GraduationCap, desc: 'E-mails dos professores.' },
  { key: 'funcionarios', label: 'Apenas Funcionários', icon: Briefcase, desc: 'Secretaria, coordenação, direção, etc.' },
]

export function EmailsClient({ turmas }: { turmas: any[] }) {
  const [publico, setPublico] = useState('pais')
  const [turmaId, setTurmaId] = useState('')
  const [assunto, setAssunto] = useState('')
  const [corpo, setCorpo] = useState('<p>Olá,</p><p>Escreva sua mensagem aqui...</p>')
  
  const [qtdDestinatarios, setQtdDestinatarios] = useState(0)
  const [contando, setContando] = useState(false)
  
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState<{ enviados: number } | null>(null)
  const [erro, setErro] = useState('')

  // Atualiza a contagem sempre que o público ou a turma muda
  useEffect(() => {
    let ativo = true
    setContando(true)
    contarDestinatarios(publico, turmaId || undefined).then(qtd => {
      if (ativo) {
        setQtdDestinatarios(qtd)
        setContando(false)
      }
    })
    return () => { ativo = false }
  }, [publico, turmaId])

  async function handleDisparar() {
    if (!assunto.trim()) return setErro('Informe o assunto do e-mail.')
    if (qtdDestinatarios === 0) return setErro('Não há destinatários para este filtro.')

    if (!confirm(`Você vai enviar este e-mail para ${qtdDestinatarios} pessoas. Confirmar?`)) return

    setEnviando(true)
    setErro('')
    setSucesso(null)

    const r = await dispararEmails({
      publico,
      turmaId: turmaId || undefined,
      assunto,
      corpo
    })

    setEnviando(false)

    if (r.success && r.enviados !== undefined) {
      setSucesso({ enviados: r.enviados })
      setAssunto('')
      setCorpo('<p>Olá,</p><p>Escreva sua mensagem aqui...</p>')
    } else {
      setErro(r.error || 'Erro ao disparar.')
    }
  }

  return (
    <AdminShell mode="school" active="Comunicação">
      <main className="px-5 py-8 lg:px-8 max-w-5xl">
        <SectionHeading
          eyebrow="Comunicação"
          title="Disparo de E-mails"
          description="Envie comunicados em massa para públicos específicos ou para toda a escola."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          
          {/* COLUNA ESQUERDA: EDITOR */}
          <div className="space-y-6">
            <Panel className="p-5">
              <h2 className="text-sm font-bold text-[#12232b] mb-4 flex items-center gap-2"><Mail size={16}/> Mensagem do E-mail</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Assunto</label>
                  <input 
                    type="text" 
                    value={assunto} 
                    onChange={e => setAssunto(e.target.value)} 
                    placeholder="Ex: Reunião de Pais e Mestres" 
                    className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[var(--cor-primaria)]" 
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Corpo do E-mail</label>
                  <div className="rounded-lg border border-[#d5e0e3] bg-white overflow-hidden">
                    <Editor 
                      value={corpo} 
                      onChange={(e: any) => setCorpo(e.target.value)}
                      containerProps={{ style: { minHeight: '300px', outline: 'none', padding: '12px' } }}
                    />
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          {/* COLUNA DIREITA: PÚBLICO E ENVIO */}
          <div className="space-y-6">
            <Panel className="p-5">
              <h2 className="text-sm font-bold text-[#12232b] mb-4 flex items-center gap-2"><Users size={16}/> Público-Alvo</h2>
              
              <div className="space-y-2 mb-4">
                {PUBLICOS.map(p => {
                  const ativo = publico === p.key
                  const Icon = p.icon
                  return (
                    <button
                      key={p.key}
                      onClick={() => { setPublico(p.key); setTurmaId('') }}
                      className={`w-full flex items-start gap-3 rounded-lg border p-3 text-left transition ${ativo ? 'border-[var(--cor-primaria)] bg-[color-mix(in_srgb,var(--cor-primaria)_5%,white)]' : 'border-[#e5ecee] hover:border-[#d5e0e3]'}`}
                    >
                      <Icon size={18} className={ativo ? 'text-[var(--cor-primaria)]' : 'text-[#82939a]'} />
                      <div>
                        <p className={`text-sm font-semibold ${ativo ? 'text-[var(--cor-primaria)]' : 'text-[#243942]'}`}>{p.label}</p>
                        <p className="text-[11px] text-[#82939a] mt-0.5">{p.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {['pais', 'alunos', 'todos'].includes(publico) && (
                <div className="pt-4 border-t border-[#e5ecee]">
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Filtrar por Turma (Opcional)</label>
                  <select value={turmaId} onChange={e => setTurmaId(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[var(--cor-primaria)]">
                    <option value="">Todas as turmas</option>
                    {turmas.map(t => <option key={t.id} value={t.id}>{t.nome} ({t.serie})</option>)}
                  </select>
                </div>
              )}
            </Panel>

            <Panel className="p-5 border-2 border-[var(--cor-primaria)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#536871]">Total de Destinatários</p>
                  {contando ? (
                    <Loader2 className="animate-spin text-[var(--cor-primaria)] mt-2" size={24} />
                  ) : (
                    <p className="text-3xl font-bold text-[var(--cor-primaria)] mt-1">{qtdDestinatarios}</p>
                  )}
                </div>
              </div>

              {erro && <p className="mb-4 text-xs text-red-600 bg-red-50 p-2 rounded">{erro}</p>}
              {sucesso && (
                <div className="mb-4 text-xs text-green-700 bg-green-50 p-3 rounded flex items-center gap-2 border border-green-200">
                  <CheckCircle2 size={16}/> E-mails enviados: {sucesso.enviados}
                </div>
              )}

              <button
                onClick={handleDisparar}
                disabled={enviando || contando || qtdDestinatarios === 0 || !assunto.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--cor-primaria)] px-4 py-3 text-sm font-bold text-white transition hover:brightness-90 disabled:opacity-50"
              >
                {enviando ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {enviando ? 'Disparando...' : 'Disparar E-mails'}
              </button>
            </Panel>
          </div>
        </div>
      </main>
    </AdminShell>
  )
}