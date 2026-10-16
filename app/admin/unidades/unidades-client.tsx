'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Building2, MapPin, Users, Phone, Mail, Trash2, X, Loader2,
  Check, Edit, Eye, EyeOff, User, Crown, AlertCircle,
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import {
  criarUnidade, atualizarUnidade, excluirUnidade, alternarAtivaUnidade,
  type Unidade, type NovaUnidade,
} from './actions'
import type { EscolaCompleta } from '@/lib/auth/escola-atual'

function formatarData(iso: string): string {
  try { return new Date(iso).toLocaleDateString('pt-BR') } catch { return '—' }
}

function gerarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

const initialForm: NovaUnidade = {
  nome: '',
  slug: '',
  endereco: '',
  cidade: '',
  estado: '',
  pais: 'Brasil',
  telefone: '',
  email_contato: '',
  responsavel_nome: '',
  responsavel_email: '',
  observacoes: '',
}

export function UnidadesClient({
  unidades,
  escola,
}: {
  unidades: Unidade[]
  escola: EscolaCompleta | null
}) {
  const router = useRouter()
  const [novoAberto, setNovoAberto] = useState(false)
  const [editando, setEditando] = useState<Unidade | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState<NovaUnidade>(initialForm)
  const [ativa, setAtiva] = useState(true)

  const totalAlunos = unidades.reduce((s, u) => s + (u.total_alunos || 0), 0)
  const totalUsuarios = unidades.reduce((s, u) => s + (u.total_usuarios || 0), 0)
  const unidadesAtivas = unidades.filter((u) => u.ativa).length

  function atualizar<K extends keyof NovaUnidade>(key: K, valor: NovaUnidade[K]) {
    setForm((f) => ({ ...f, [key]: valor }))
  }

  function abrirNova() {
    setForm(initialForm)
    setErro('')
    setNovoAberto(true)
  }

  function abrirEdicao(u: Unidade) {
    setForm({
      nome: u.nome,
      slug: u.slug || '',
      endereco: u.endereco || '',
      cidade: u.cidade || '',
      estado: u.estado || '',
      pais: u.pais || 'Brasil',
      telefone: u.telefone || '',
      email_contato: u.email_contato || '',
      responsavel_nome: u.responsavel_nome || '',
      responsavel_email: u.responsavel_email || '',
      observacoes: u.observacoes || '',
    })
    setAtiva(u.ativa)
    setErro('')
    setEditando(u)
  }

  async function handleCriar() {
    setErro('')
    if (!form.nome.trim()) return setErro('Informe o nome da unidade.')

    setProcessando(true)
    const r = await criarUnidade(form)
    setProcessando(false)
    if (!r.success) return setErro(r.error || 'Erro.')

    setNovoAberto(false)
    setForm(initialForm)
    router.refresh()
  }

  async function handleSalvarEdicao() {
    if (!editando) return
    setErro('')
    if (!form.nome.trim()) return setErro('Informe o nome da unidade.')

    setProcessando(true)
    const r = await atualizarUnidade(editando.id, { ...form, ativa })
    setProcessando(false)
    if (!r.success) return setErro(r.error || 'Erro.')

    setEditando(null)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    setProcessando(true)
    const r = await excluirUnidade(confirmarExclusao)
    setProcessando(false)
    if (!r.success) { alert(r.error || 'Erro.'); return }
    setConfirmarExclusao(null)
    router.refresh()
  }

  async function handleToggleAtiva(u: Unidade) {
    setProcessando(true)
    await alternarAtivaUnidade(u.id, !u.ativa)
    setProcessando(false)
    router.refresh()
  }

  return (
    <AdminShell mode="school" active="Unidades">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Administração"
            title="Unidades"
            description="Gerencie as unidades da sua escola (bairro, cidade, estado ou país)."
          />
          <button
            onClick={abrirNova}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e]"
          >
            <Plus className="size-4" /> Nova unidade
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]"><Building2 className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Unidades</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#0d9488]">{unidades.length}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]"><Check className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Ativas</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#065f46]">{unidadesAtivas}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]"><Users className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Alunos</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#3b82f6]">{totalAlunos}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ede9fe] text-[#5b21b6]"><Users className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Usuários</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#5b21b6]">{totalUsuarios}</p>
            </div>
          </Panel>
        </div>

        {unidades.length === 0 ? (
          <Panel className="mt-8">
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]"><Building2 className="size-6" /></div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhuma unidade cadastrada</h3>
              <p className="mt-1 max-w-md text-sm leading-6 text-[#82939a]">
                Se a sua escola funciona em uma única sede, você não precisa cadastrar unidades aqui.
                Cadastre quando houver uma segunda unidade física (mesmo bairro, outra cidade, outro estado ou país).
              </p>
              <button
                onClick={abrirNova}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0f766e]"
              >
                <Plus className="size-4" /> Cadastrar primeira unidade
              </button>
            </div>
          </Panel>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unidades.map((u) => (
              <Panel key={u.id} className={`relative p-5 ${!u.ativa ? 'opacity-70' : ''}`}>
                {!u.ativa && (
                  <div className="absolute -top-2.5 left-4 rounded-full bg-[#e5ecee] px-2.5 py-0.5 text-[10px] font-bold text-[#5e7a94]">
                    Inativa
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
                    <Building2 className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-[#12232b]">{u.nome}</h3>
                    {u.slug && (
                      <p className="mt-0.5 truncate font-mono text-[11px] text-[#0d9488]">/{u.slug}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  {(u.endereco || u.cidade) && (
                    <div className="flex items-start gap-2 text-[#536871]">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#82939a]" />
                      <span className="line-clamp-2">
                        {[u.endereco, u.cidade, u.estado].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                  )}
                  {u.telefone && (
                    <div className="flex items-center gap-2 text-[#536871]">
                      <Phone className="size-3.5 shrink-0 text-[#82939a]" />
                      <span>{u.telefone}</span>
                    </div>
                  )}
                  {u.email_contato && (
                    <div className="flex items-center gap-2 text-[#536871]">
                      <Mail className="size-3.5 shrink-0 text-[#82939a]" />
                      <span className="truncate">{u.email_contato}</span>
                    </div>
                  )}
                  {u.responsavel_nome && (
                    <div className="flex items-center gap-2 text-[#536871]">
                      <User className="size-3.5 shrink-0 text-[#82939a]" />
                      <span className="truncate">{u.responsavel_nome}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#e5ecee] pt-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Alunos</p>
                    <p className="mt-0.5 text-lg font-bold text-[#12232b]">{u.total_alunos || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Usuários</p>
                    <p className="mt-0.5 text-lg font-bold text-[#12232b]">{u.total_usuarios || 0}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => abrirEdicao(u)}
                    className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#30454e] hover:border-[#0d9488] hover:text-[#0f766e]"
                  >
                    <Edit className="mr-1 inline size-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => handleToggleAtiva(u)}
                    disabled={processando}
                    className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee] disabled:opacity-50"
                    title={u.ativa ? 'Desativar' : 'Ativar'}
                  >
                    {u.ativa ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                  <button
                    onClick={() => setConfirmarExclusao(u.id)}
                    className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                    title="Excluir"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </Panel>
            ))}
          </div>
        )}

        {escola && (
          <div className="mt-8 rounded-xl border border-[#e5ecee] bg-[#fafcfc] p-5">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]">
                <Crown className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#12232b]">Matriz: {escola.nome}</p>
                <p className="mt-1 text-xs leading-5 text-[#82939a]">
                  A matriz centraliza a visão consolidada de toda a rede. As unidades cadastradas acima
                  compartilham o mesmo banco de dados, mantendo autonomia operacional e relatórios isolados.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Drawer criar/editar */}
      {(novoAberto || editando) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !processando && (novoAberto ? setNovoAberto(false) : setEditando(null))} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">
                  {editando ? editando.nome : 'Nova unidade'}
                </h2>
                <p className="mt-0.5 text-xs text-[#82939a]">
                  {editando ? 'Editar dados da unidade' : 'Cadastre uma nova sede da sua escola'}
                </p>
              </div>
              <button
                onClick={() => { setNovoAberto(false); setEditando(null) }}
                disabled={processando}
                className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                <section>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#82939a]">Identificação</p>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Nome da unidade *</label>
                      <input
                        type="text"
                        value={form.nome}
                        onChange={(e) => {
                          atualizar('nome', e.target.value)
                          if (!editando && (!form.slug || form.slug === gerarSlug(form.nome))) {
                            atualizar('slug', gerarSlug(e.target.value))
                          }
                        }}
                        placeholder="Ex: Colégio Horizonte - Unidade Centro"
                        className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Slug (URL de identificação)</label>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => atualizar('slug', e.target.value)}
                        disabled={!!editando}
                        placeholder="unidade-centro"
                        className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 font-mono text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488] disabled:bg-[#f0f4f5] disabled:text-[#82939a]"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#82939a]">Endereço</p>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Endereço</label>
                      <input
                        type="text"
                        value={form.endereco}
                        onChange={(e) => atualizar('endereco', e.target.value)}
                        placeholder="Rua, número, bairro"
                        className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Cidade</label>
                        <input
                          type="text"
                          value={form.cidade}
                          onChange={(e) => atualizar('cidade', e.target.value)}
                          className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Estado</label>
                        <input
                          type="text"
                          value={form.estado}
                          onChange={(e) => atualizar('estado', e.target.value)}
                          maxLength={2}
                          placeholder="RJ"
                          className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-[#536871]">País</label>
                        <input
                          type="text"
                          value={form.pais}
                          onChange={(e) => atualizar('pais', e.target.value)}
                          className="w-full rounded-lg border border-[#d5e0d3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#82939a]">Contato</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Telefone</label>
                      <input
                        type="tel"
                        value={form.telefone}
                        onChange={(e) => atualizar('telefone', e.target.value)}
                        placeholder="(21) 90000-0000"
                        className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#536871]">E-mail</label>
                      <input
                        type="email"
                        value={form.email_contato}
                        onChange={(e) => atualizar('email_contato', e.target.value)}
                        placeholder="unidade@escola.com.br"
                        className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#82939a]">Responsável local</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Nome</label>
                      <input
                        type="text"
                        value={form.responsavel_nome}
                        onChange={(e) => atualizar('responsavel_nome', e.target.value)}
                        className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#536871]">E-mail</label>
                      <input
                        type="email"
                        value={form.responsavel_email}
                        onChange={(e) => atualizar('responsavel_email', e.target.value)}
                        className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#82939a]">Observações</p>
                  <textarea
                    value={form.observacoes}
                    onChange={(e) => atualizar('observacoes', e.target.value)}
                    rows={3}
                    placeholder="Informações internas sobre esta unidade"
                    className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                  />
                </section>

                {editando && (
                  <label className="flex items-center gap-2 text-sm text-[#243942]">
                    <input
                      type="checkbox"
                      checked={ativa}
                      onChange={(e) => setAtiva(e.target.checked)}
                      className="size-4 accent-[#0d9488]"
                    />
                    Unidade ativa
                  </label>
                )}

                {erro && (
                  <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">
                    {erro}
                  </p>
                )}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button
                onClick={() => { setNovoAberto(false); setEditando(null) }}
                disabled={processando}
                className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={editando ? handleSalvarEdicao : handleCriar}
                disabled={processando}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50"
              >
                {processando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {processando ? 'Salvando...' : editando ? 'Salvar' : 'Criar unidade'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmarExclusao(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]">
              <AlertCircle className="size-5" />
            </div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir unidade?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">
              Se houver alunos ou usuários vinculados, a exclusão será bloqueada. Nesse caso, prefira desativar.
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmarExclusao(null)} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e]">
                Cancelar
              </button>
              <button onClick={handleExcluir} disabled={processando} className="flex-1 rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-50">
                {processando ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}