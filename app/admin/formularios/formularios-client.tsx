'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, FileText, Edit, Trash2, Eye, X, Loader2, Check, ExternalLink, Inbox } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { TIPOS_FORMULARIO } from '@/lib/cms/tipos-formulario'
import { criarFormulario, excluirFormulario } from './actions'

type FormularioComContagem = {
  id: string
  titulo: string
  slug: string
  descricao: string | null
  tipo: string
  status: string
  cor_primaria: string | null
  mensagem_sucesso: string | null
  redirecionar_url: string | null
  ativo: boolean
  criado_em: string
  atualizado_em: string
  total_respostas: number
}

const statusStyles: Record<string, string> = {
  rascunho: 'bg-[#fef3c7] text-[#92400e]',
  publicado: 'bg-[#d1fae5] text-[#065f46]',
  arquivado: 'bg-[#e5ecee] text-[#5e7a94]',
}

const statusLabel: Record<string, string> = {
  rascunho: 'Rascunho',
  publicado: 'Publicado',
  arquivado: 'Arquivado',
}

function tipoLabel(key: string): string {
  return TIPOS_FORMULARIO.find((t) => t.key === key)?.label || key
}

function formatarData(iso: string): string {
  try { return new Date(iso).toLocaleDateString('pt-BR') } catch { return '—' }
}

export function FormulariosClient({ formularios }: { formularios: FormularioComContagem[] }) {
  const router = useRouter()
  const [novoAberto, setNovoAberto] = useState(false)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState('matricula')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  function limpar() { setTitulo(''); setDescricao(''); setTipo('matricula'); setErro('') }

  async function handleCriar() {
    if (!titulo.trim()) return setErro('Informe o título.')
    setEnviando(true); setErro('')
    const r = await criarFormulario({ titulo, descricao, tipo })
    setEnviando(false)
    if (!r.success) return setErro(r.error || 'Erro.')
    router.push(`/admin/formularios/${r.id}`)
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    await excluirFormulario(confirmarExclusao)
    setConfirmarExclusao(null)
    router.refresh()
  }

  const totalRespostas = formularios.reduce((s, f) => s + f.total_respostas, 0)

  return (
    <AdminShell mode="school" active="Formulários">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Construtor"
            title="Formulários"
            description="Crie formulários personalizados de matrícula, anamnese, autorização e muito mais."
          />
          <button
            onClick={() => { limpar(); setNovoAberto(true) }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e]"
          >
            <Plus className="size-4" /> Novo formulário
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]"><FileText className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Formulários</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#0d9488]">{formularios.length}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]"><Eye className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Publicados</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#065f46]">{formularios.filter((f) => f.status === 'publicado').length}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]"><Inbox className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Respostas</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#3b82f6]">{totalRespostas}</p>
            </div>
          </Panel>
        </div>

        <Panel className="mt-8">
          {formularios.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]"><FileText className="size-6" /></div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhum formulário criado</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">
                Crie seu primeiro formulário personalizado e compartilhe com os responsáveis.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4f5]">
              {formularios.map((f) => (
                <div key={f.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#fafcfc]">
                  <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#243942]">{f.titulo}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyles[f.status]}`}>{statusLabel[f.status]}</span>
                      <span className="rounded-full bg-[#e5ecee] px-2 py-0.5 text-[10px] font-bold text-[#5e7a94]">{tipoLabel(f.tipo)}</span>
                    </div>
                    {f.descricao && <p className="mt-0.5 line-clamp-1 text-xs text-[#82939a]">{f.descricao}</p>}
                    <div className="mt-1 flex items-center gap-3 text-xs text-[#82939a]">
                      <span>{f.total_respostas} {f.total_respostas === 1 ? 'resposta' : 'respostas'}</span>
                      <span>·</span>
                      <span>Criado em {formatarData(f.criado_em)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {f.status === 'publicado' && (
                      <Link
                        href={`/formulario/${f.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]"
                        title="Ver publicado"
                      >
                        <ExternalLink className="size-4" />
                      </Link>
                    )}
                    <Link
                      href={`/admin/formularios/${f.id}/respostas`}
                      className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]"
                      title="Ver respostas"
                    >
                      <Inbox className="size-4" />
                    </Link>
                    <Link
                      href={`/admin/formularios/${f.id}`}
                      className="rounded-lg p-1.5 text-[#0d9488] hover:bg-[#ccfbf1]"
                      title="Editar"
                    >
                      <Edit className="size-4" />
                    </Link>
                    <button
                      onClick={() => setConfirmarExclusao(f.id)}
                      className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                      title="Excluir"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </main>

      {novoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !enviando && setNovoAberto(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Novo formulário</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Depois você adiciona os campos</p>
              </div>
              <button onClick={() => setNovoAberto(false)} disabled={enviando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Título</label>
                  <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Matrícula 2027" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição (opcional)</label>
                  <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} placeholder="Texto que aparece acima do formulário" className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Tipo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIPOS_FORMULARIO.map((t) => (
                      <button key={t.key} type="button" onClick={() => setTipo(t.key)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${tipo === t.key ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[#0d9488]'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovoAberto(false)} disabled={enviando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleCriar} disabled={enviando} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                {enviando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {enviando ? 'Criando...' : 'Criar e editar'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmarExclusao(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]"><Trash2 className="size-5" /></div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir formulário?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">Todos os campos e respostas serão removidos. Essa ação não pode ser desfeita.</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmarExclusao(null)} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e]">Cancelar</button>
              <button onClick={handleExcluir} className="flex-1 rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b91c1c]">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}