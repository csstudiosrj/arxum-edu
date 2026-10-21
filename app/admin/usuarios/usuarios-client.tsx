'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Users, Mail, Phone, Trash2, X, Loader2, Check, Eye, EyeOff,
  ShieldCheck, Crown, Edit, Send, CheckCircle2, Lock, Building2, GraduationCap,
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { PAPEIS_INTERNOS, papelCor, papelLabel } from './papeis'
import {
  convidarUsuario, atualizarUsuario, excluirUsuario, reenviarConviteUsuario,
  type UsuarioInterno,
} from './actions'

function iniciais(nome: string): string {
  const partes = nome.trim().split(' ')
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function formatarData(iso: string): string {
  try { return new Date(iso).toLocaleDateString('pt-BR') } catch { return '—' }
}

export function UsuariosClient({
  usuarios,
  unidades,
}: {
  usuarios: UsuarioInterno[]
  unidades: Array<{ id: string; nome: string }>
}) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [filtroPapel, setFiltroPapel] = useState('todos')
  const [novoAberto, setNovoAberto] = useState(false)
  const [editando, setEditando] = useState<UsuarioInterno | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  const [novoNome, setNovoNome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novoPapel, setNovoPapel] = useState('secretaria')
  const [novoTelefone, setNovoTelefone] = useState('')
  const [novaUnidade, setNovaUnidade] = useState('')

  const [editNome, setEditNome] = useState('')
  const [editPapel, setEditPapel] = useState('')
  const [editTelefone, setEditTelefone] = useState('')
  const [editUnidade, setEditUnidade] = useState('')
  const [editAtivo, setEditAtivo] = useState(true)

  const [reenviando, setReenviando] = useState<string | null>(null)
  const [sucessoReenvio, setSucessoReenvio] = useState<string | null>(null)

  const filtrados = usuarios.filter((u) => {
    const matchPapel = filtroPapel === 'todos' || u.papel === filtroPapel
    const termo = busca.toLowerCase()
    const matchBusca = busca === '' || u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)
    return matchPapel && matchBusca
  })

  const ativos = usuarios.filter((u) => u.ativo).length
  const admins = usuarios.filter((u) => u.papel === 'admin_escola').length

  function limparNovo() {
    setNovoNome(''); setNovoEmail(''); setNovoPapel('secretaria'); setNovoTelefone(''); setNovaUnidade(''); setErro('')
  }

  function abrirEdicao(u: UsuarioInterno) {
    setEditando(u)
    setEditNome(u.nome)
    setEditPapel(u.papel)
    setEditTelefone(u.telefone || '')
    setEditUnidade(u.unidade_id || '')
    setEditAtivo(u.ativo)
    setErro('')
  }

  async function handleCriar() {
    setErro('')
    if (!novoNome.trim()) return setErro('Informe o nome.')
    if (!novoEmail.includes('@')) return setErro('E-mail inválido.')

    setProcessando(true)
    const r = await convidarUsuario({
      nome: novoNome,
      email: novoEmail,
      papel: novoPapel,
      telefone: novoTelefone,
      unidade_id: novaUnidade || null,
    })
    setProcessando(false)
    if (!r.success) return setErro(r.error || 'Erro.')

    setNovoAberto(false)
    limparNovo()
    router.refresh()
  }

  async function handleSalvarEdicao() {
    if (!editando) return
    setErro('')
    if (!editNome.trim()) return setErro('Informe o nome.')

    setProcessando(true)
    const r = await atualizarUsuario(editando.id, {
      nome: editNome,
      papel: editPapel,
      telefone: editTelefone || null,
      unidade_id: editUnidade || null,
      ativo: editAtivo,
    })
    setProcessando(false)
    if (!r.success) return setErro(r.error || 'Erro.')

    setEditando(null)
    router.refresh()
  }

  async function handleReenviar(u: UsuarioInterno) {
    setReenviando(u.id)
    setSucessoReenvio(null)
    const r = await reenviarConviteUsuario(u.id)
    setReenviando(null)
    if (!r.success) { alert(r.error || 'Erro ao reenviar.'); return }
    setSucessoReenvio(u.id)
    setTimeout(() => setSucessoReenvio(null), 3000)
  }

  async function handleToggleAtivo(u: UsuarioInterno) {
    if (u.e_admin) {
      alert('Não é possível desativar o administrador principal.')
      return
    }
    setProcessando(true)
    await atualizarUsuario(u.id, { ativo: !u.ativo })
    setProcessando(false)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    setProcessando(true)
    const r = await excluirUsuario(confirmarExclusao)
    setProcessando(false)
    if (!r.success) { alert(r.error || 'Erro.'); return }
    setConfirmarExclusao(null)
    router.refresh()
  }

  return (
    <AdminShell mode="school" active="Usuários">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Administração"
            title="Usuários e permissões"
            description="Gerencie quem tem acesso ao sistema e o que cada um pode fazer."
          />
          <button
            onClick={() => { limparNovo(); setNovoAberto(true) }}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90"
            style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
          >
            <Plus className="size-4" /> Convidar usuário
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="flex items-center gap-4 p-5">
            <div
              className="grid size-10 place-items-center rounded-lg"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                color: 'var(--cor-primaria, #0d9488)',
              }}
            >
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Usuários</p>
              <p className="text-2xl font-bold tracking-[-.03em]" style={{ color: 'var(--cor-primaria, #0d9488)' }}>{usuarios.length}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]"><Check className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Ativos</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#065f46]">{ativos}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#fee2e2] text-[#dc2626]"><Crown className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Administradores</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#dc2626]">{admins}</p>
            </div>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {[{ key: 'todos', label: 'Todos' }, ...PAPEIS_INTERNOS].map((p) => {
                  const ativo = filtroPapel === p.key
                  return (
                    <button
                      key={p.key}
                      onClick={() => setFiltroPapel(p.key)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${ativo ? '' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}
                      style={ativo ? {
                        backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                        color: 'var(--cor-primaria, #0d9488)',
                      } : undefined}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
                <Search className="size-4 text-[#9aaab0]" />
                <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
              </div>
            </div>
          </div>

          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div
                className="grid size-14 place-items-center rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                  color: 'var(--cor-primaria, #0d9488)',
                }}
              >
                <Users className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhum usuário encontrado</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">Ajuste os filtros ou convide um novo usuário.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Usuário</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Papel</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Contato</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Unidade</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Status</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Desde</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((u) => (
                    <tr key={u.id} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 place-items-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: papelCor(u.papel) }}>
                            {iniciais(u.nome)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-[#243942]">{u.nome}</span>
                              {u.e_admin && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-[#fee2e2] px-1.5 py-0.5 text-[9px] font-bold text-[#991b1b]" title="Administrador principal">
                                  <Crown className="size-2.5" /> PRINCIPAL
                                </span>
                              )}
                            </div>
                            <div className="truncate text-xs text-[#82939a]">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: `${papelCor(u.papel)}15`, color: papelCor(u.papel) }}>
                          {u.papel === 'professor' ? <GraduationCap className="size-3" /> : <ShieldCheck className="size-3" />}
                          {papelLabel(u.papel)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#4d626c]">
                        {u.telefone && <div className="flex items-center gap-1.5"><Phone className="size-3.5 text-[#82939a]" /> {u.telefone}</div>}
                        {!u.telefone && <span className="text-xs text-[#82939a]">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#4d626c]">
                        {u.unidade_nome ? (
                          <span className="inline-flex items-center gap-1 text-xs">
                            <Building2 className="size-3.5 text-[#82939a]" /> {u.unidade_nome}
                          </span>
                        ) : (
                          <span className="text-xs text-[#82939a]">Matriz</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${u.ativo ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#e5ecee] text-[#5e7a94]'}`}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#82939a]">{formatarData(u.criado_em)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleReenviar(u)}
                            disabled={reenviando === u.id || sucessoReenvio === u.id}
                            className={`rounded-lg p-1.5 transition ${sucessoReenvio === u.id ? 'bg-[#d1fae5] text-[#065f46]' : 'hover:brightness-90'} disabled:opacity-60`}
                            style={sucessoReenvio === u.id ? undefined : {
                              color: 'var(--cor-primaria, #0d9488)',
                            }}
                            title={sucessoReenvio === u.id ? 'Convite reenviado' : 'Reenviar convite'}
                          >
                            {reenviando === u.id ? <Loader2 className="size-4 animate-spin" /> : sucessoReenvio === u.id ? <CheckCircle2 className="size-4" /> : <Send className="size-4" />}
                          </button>
                          <button
                            onClick={() => abrirEdicao(u)}
                            className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]"
                            title="Editar"
                          >
                            <Edit className="size-4" />
                          </button>
                          <button
                            onClick={() => handleToggleAtivo(u)}
                            disabled={processando || u.e_admin}
                            className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee] disabled:opacity-30"
                            title={u.e_admin ? 'Administrador principal não pode ser desativado' : u.ativo ? 'Desativar' : 'Ativar'}
                          >
                            {u.e_admin ? <Lock className="size-4" /> : u.ativo ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                          <button
                            onClick={() => setConfirmarExclusao(u.id)}
                            disabled={u.e_admin}
                            className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#6b7d86]"
                            title={u.e_admin ? 'Administrador principal não pode ser excluído' : 'Excluir'}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel className="mt-6">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className="grid size-9 place-items-center rounded-lg"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                  color: 'var(--cor-primaria, #0d9488)',
                }}
              >
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Papéis disponíveis</h2>
                <p className="text-xs text-[#82939a]">O que cada papel pode fazer</p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {PAPEIS_INTERNOS.map((p) => (
              <div key={p.key} className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4">
                <div className="flex items-center gap-2">
                  <div className="grid size-7 place-items-center rounded-lg" style={{ backgroundColor: `${papelCor(p.key)}15`, color: papelCor(p.key) }}>
                    <ShieldCheck className="size-3.5" />
                  </div>
                  <span className="text-sm font-bold text-[#12232b]">{p.label}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-[#82939a]">{p.descricao}</p>
              </div>
            ))}
          </div>
        </Panel>
      </main>

      {novoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !processando && setNovoAberto(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Convidar usuário</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Enviaremos um link de acesso por e-mail</p>
              </div>
              <button onClick={() => setNovoAberto(false)} disabled={processando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Nome completo</label>
                  <input type="text" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex: Ana Paula" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">E-mail</label>
                  <input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="pessoa@escola.com.br" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Telefone (opcional)</label>
                  <input type="tel" value={novoTelefone} onChange={(e) => setNovoTelefone(e.target.value)} placeholder="(21) 90000-0000" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Papel</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PAPEIS_INTERNOS.map((p) => {
                      const sel = novoPapel === p.key
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setNovoPapel(p.key)}
                          className={`rounded-lg border p-3 text-left transition ${sel ? '' : 'border-[#d5e0e3] bg-white hover:border-[var(--cor-primaria,#0d9488)]'}`}
                          style={sel ? {
                            borderColor: 'var(--cor-primaria, #0d9488)',
                            backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                          } : undefined}
                        >
                          <div className="flex items-center gap-2">
                            <div className="grid size-6 place-items-center rounded" style={{ backgroundColor: `${papelCor(p.key)}15`, color: papelCor(p.key) }}>
                              <ShieldCheck className="size-3" />
                            </div>
                            <span className="text-xs font-bold text-[#12232b]">{p.label}</span>
                            {sel && <Check className="ml-auto size-3.5" style={{ color: 'var(--cor-primaria, #0d9488)' }} />}
                          </div>
                          <p className="mt-1 text-[10px] leading-4 text-[#82939a]">{p.descricao}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
                {unidades.length > 0 && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Unidade (opcional)</label>
                    <select value={novaUnidade} onChange={(e) => setNovaUnidade(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]">
                      <option value="">Matriz (todas as unidades)</option>
                      {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                    </select>
                  </div>
                )}
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovoAberto(false)} disabled={processando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button
                onClick={handleCriar}
                disabled={processando}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
              >
                {processando ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                {processando ? 'Enviando...' : 'Enviar convite'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {editando && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !processando && setEditando(null)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">{editando.nome}</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Editar dados e permissões</p>
              </div>
              <button onClick={() => setEditando(null)} disabled={processando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Nome completo</label>
                  <input type="text" value={editNome} onChange={(e) => setEditNome(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">E-mail</label>
                  <input type="email" value={editando.email} disabled className="w-full rounded-lg border border-[#d5e0e3] bg-[#f0f4f5] px-3 py-2 text-sm text-[#82939a] outline-none" />
                  <p className="mt-1 text-[10px] text-[#82939a]">O e-mail de login não pode ser alterado.</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Telefone</label>
                  <input type="tel" value={editTelefone} onChange={(e) => setEditTelefone(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Papel</label>
                  {editando.e_admin ? (
                    <div className="rounded-lg border border-[#fee2e2] bg-[#fee2e2]/30 p-3">
                      <div className="flex items-center gap-2">
                        <Crown className="size-3.5 text-[#991b1b]" />
                        <span className="text-xs font-bold text-[#991b1b]">Administrador principal</span>
                      </div>
                      <p className="mt-1 text-[10px] leading-4 text-[#536871]">
                        Este é o usuário criador da escola. Papel não pode ser alterado.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {PAPEIS_INTERNOS.filter((p) => p.key !== 'admin_escola').map((p) => {
                        const sel = editPapel === p.key
                        return (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => setEditPapel(p.key)}
                            className={`rounded-lg border p-3 text-left transition ${sel ? '' : 'border-[#d5e0e3] bg-white hover:border-[var(--cor-primaria,#0d9488)]'}`}
                            style={sel ? {
                              borderColor: 'var(--cor-primaria, #0d9488)',
                              backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                            } : undefined}
                          >
                            <div className="flex items-center gap-2">
                              <div className="grid size-6 place-items-center rounded" style={{ backgroundColor: `${papelCor(p.key)}15`, color: papelCor(p.key) }}>
                                <ShieldCheck className="size-3" />
                              </div>
                              <span className="text-xs font-bold text-[#12232b]">{p.label}</span>
                              {sel && <Check className="ml-auto size-3.5" style={{ color: 'var(--cor-primaria, #0d9488)' }} />}
                            </div>
                            <p className="mt-1 text-[10px] leading-4 text-[#82939a]">{p.descricao}</p>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                {unidades.length > 0 && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Unidade</label>
                    <select value={editUnidade} onChange={(e) => setEditUnidade(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]">
                      <option value="">Matriz (todas as unidades)</option>
                      {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                    </select>
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm text-[#243942]">
                  <input type="checkbox" checked={editAtivo} onChange={(e) => setEditAtivo(e.target.checked)} disabled={editando.e_admin} className="size-4 disabled:opacity-50" style={{ accentColor: 'var(--cor-primaria, #0d9488)' }} />
                  Usuário ativo
                </label>
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setEditando(null)} disabled={processando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button
                onClick={handleSalvarEdicao}
                disabled={processando}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
              >
                {processando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {processando ? 'Salvando...' : 'Salvar'}
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
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir usuário?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">
              O acesso será removido. Notas, ocorrências e movimentações que essa pessoa registrou permanecem no sistema.
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmarExclusao(null)} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e]">Cancelar</button>
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