'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ChevronUp, ChevronDown, Edit, Trash2, Plus, X, Loader2, Save, Check,
  Eye, ExternalLink, Type, AlignLeft, CircleDot, CheckSquare, ToggleLeft, Hash,
  Calendar, IdCard, Phone, Mail, Upload, Settings, FileText,
} from 'lucide-react'
import { AdminShell, Panel } from '@/components/admin-shell'
import { BannerUpload } from '@/components/banner-upload'
import {
  TIPOS_CAMPO, TIPOS_FORMULARIO, tipoInfo, gerarSlugFormulario,
  type Formulario, type CampoFormulario, type TipoCampo,
} from '@/lib/cms/tipos-formulario'
import { salvarCampos, atualizarFormulario } from '../actions'

const ICONES_MAP: Record<string, typeof Type> = {
  Type, AlignLeft, CircleDot, CheckSquare, ToggleLeft, Hash,
  Calendar, IdCard, Phone, Mail, Upload,
}

function gerarId(): string {
  return 'tmp-' + Math.random().toString(36).slice(2, 12)
}

function novoCampo(tipo: TipoCampo, ordem: number): CampoFormulario {
  const info = tipoInfo(tipo)
  return {
    id: gerarId(),
    formulario_id: '',
    tipo,
    label: info.label,
    placeholder: '',
    texto_ajuda: '',
    obrigatorio: false,
    unico: false,
    opcoes: info.tem_opcoes ? ['Opção 1', 'Opção 2'] : [],
    validacao_min: null,
    validacao_max: null,
    ordem,
    secao: null,
  }
}

export function ConstrutorClient({
  formulario,
  camposIniciais,
}: {
  formulario: Formulario
  camposIniciais: CampoFormulario[]
}) {
  const router = useRouter()
  const [aba, setAba] = useState<'campos' | 'configuracoes'>('campos')
  const [campos, setCampos] = useState<CampoFormulario[]>(camposIniciais)
  const [selecionadoIdx, setSelecionadoIdx] = useState<number | null>(camposIniciais.length > 0 ? 0 : null)
  const [adicionarAberto, setAdicionarAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [salvou, setSalvou] = useState(false)
  const [erro, setErro] = useState('')

  // Configurações do formulário
  const [titulo, setTitulo] = useState(formulario.titulo)
  const [descricao, setDescricao] = useState(formulario.descricao || '')
  const [tipo, setTipo] = useState(formulario.tipo)
  const [status, setStatus] = useState(formulario.status)
  const [corPrimaria, setCorPrimaria] = useState(formulario.cor_primaria || '#0d9488')
  const [mensagemSucesso, setMensagemSucesso] = useState(formulario.mensagem_sucesso || 'Recebemos sua resposta. Obrigado!')
  const [redirecionarUrl, setRedirecionarUrl] = useState(formulario.redirecionar_url || '')

  const campoSelecionado = selecionadoIdx !== null ? campos[selecionadoIdx] : null

  function adicionarCampo(tipo: TipoCampo) {
    const novo = novoCampo(tipo, campos.length)
    setCampos([...campos, novo])
    setSelecionadoIdx(campos.length)
    setAdicionarAberto(false)
  }

  function atualizarCampo<K extends keyof CampoFormulario>(key: K, valor: CampoFormulario[K]) {
    if (selecionadoIdx === null) return
    setCampos((atual) => atual.map((c, i) => i === selecionadoIdx ? { ...c, [key]: valor } : c))
  }

  function removerCampo(idx: number) {
    const novos = campos.filter((_, i) => i !== idx)
    setCampos(novos)
    setSelecionadoIdx(novos.length > 0 ? Math.max(0, idx - 1) : null)
  }

  function moverCampo(idx: number, dir: -1 | 1) {
    const alvo = idx + dir
    if (alvo < 0 || alvo >= campos.length) return
    const novos = [...campos]
    ;[novos[idx], novos[alvo]] = [novos[alvo], novos[idx]]
    setCampos(novos)
    setSelecionadoIdx(alvo)
  }

  function editarOpcao(idxOpcao: number, valor: string) {
    if (!campoSelecionado) return
    const novas = [...campoSelecionado.opcoes]
    novas[idxOpcao] = valor
    atualizarCampo('opcoes', novas)
  }

  function adicionarOpcao() {
    if (!campoSelecionado) return
    atualizarCampo('opcoes', [...campoSelecionado.opcoes, `Opção ${campoSelecionado.opcoes.length + 1}`])
  }

  function removerOpcao(idx: number) {
    if (!campoSelecionado) return
    atualizarCampo('opcoes', campoSelecionado.opcoes.filter((_, i) => i !== idx))
  }

  async function handleSalvar(publicar?: boolean) {
    setSalvando(true)
    setErro('')

    const novoStatus = publicar ? 'publicado' : status

    const rForm = await atualizarFormulario(formulario.id, {
      titulo,
      descricao,
      tipo,
      status: novoStatus,
      cor_primaria: corPrimaria,
      mensagem_sucesso: mensagemSucesso,
      redirecionar_url: redirecionarUrl || null,
    })

    if (!rForm.success) {
      setSalvando(false)
      setErro(rForm.error || 'Erro ao salvar formulário.')
      return
    }

    if (publicar) setStatus('publicado')

    const rCampos = await salvarCampos(formulario.id, campos)
    setSalvando(false)

    if (!rCampos.success) {
      setErro(rCampos.error || 'Erro ao salvar campos.')
      return
    }

    setSalvou(true)
    router.refresh()
    setTimeout(() => setSalvou(false), 2500)
  }

  return (
    <AdminShell mode="school" active="Formulários">
      <main className="px-5 py-8 lg:px-8">
        <Link
          href="/admin/formularios"
          className="inline-flex items-center gap-2 text-sm text-[#6b7d86] hover:brightness-75"
        >
          <ArrowLeft className="size-4" /> Todos os formulários
        </Link>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status === 'publicado' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                {status === 'publicado' ? 'Publicado' : 'Rascunho'}
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">{titulo}</h1>
            <p className="mt-1 text-sm text-[#71838b]">
              {campos.length} campos · URL:{' '}
              <span className="font-mono text-xs" style={{ color: 'var(--cor-primaria, #0d9488)' }}>/formulario/{formulario.slug}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {status === 'publicado' && (
              <Link
                href={`/formulario/${formulario.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] hover:border-[var(--cor-primaria,#0d9488)]"
              >
                <ExternalLink className="size-4" /> Ver público
              </Link>
            )}
            {salvou && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#d1fae5] px-3 py-1.5 text-xs font-semibold text-[#065f46]">
                <Check className="size-3.5" /> Salvo
              </span>
            )}
            <button
              onClick={() => handleSalvar(false)}
              disabled={salvando}
              className="inline-flex items-center gap-2 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] hover:border-[var(--cor-primaria,#0d9488)] disabled:opacity-50"
            >
              {salvando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar
            </button>
            {status !== 'publicado' && (
              <button
                onClick={() => handleSalvar(true)}
                disabled={salvando || campos.length === 0}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
              >
                {salvando ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
                Publicar
              </button>
            )}
          </div>
        </div>

        {erro && (
          <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">{erro}</div>
        )}

        <div className="mt-8 flex gap-1 border-b border-[#e5ecee]">
          {[
            { key: 'campos', label: 'Campos do formulário' },
            { key: 'configuracoes', label: 'Configurações' },
          ].map((t) => {
            const ativo = aba === t.key
            return (
              <button
                key={t.key}
                onClick={() => setAba(t.key as 'campos' | 'configuracoes')}
                className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${ativo ? '' : 'border-transparent text-[#6b7d86] hover:text-[#243942]'}`}
                style={ativo ? {
                  borderColor: 'var(--cor-primaria, #0d9488)',
                  color: 'var(--cor-primaria, #0d9488)',
                } : undefined}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {aba === 'campos' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Coluna de campos */}
            <div>
              <Panel>
                <div className="flex items-center justify-between border-b border-[#e5ecee] px-5 py-3">
                  <div>
                    <h2 className="text-sm font-bold text-[#12232b]">Campos</h2>
                    <p className="text-xs text-[#82939a]">Clique para editar as propriedades ao lado</p>
                  </div>
                  <button
                    onClick={() => setAdicionarAberto(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-90"
                    style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
                  >
                    <Plus className="size-3.5" /> Adicionar campo
                  </button>
                </div>

                {campos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                    <div
                      className="grid size-14 place-items-center rounded-full"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                        color: 'var(--cor-primaria, #0d9488)',
                      }}
                    >
                      <FileText className="size-6" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhum campo ainda</h3>
                    <p className="mt-1 max-w-xs text-sm text-[#82939a]">Clique em "Adicionar campo" para começar.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#f0f4f5]">
                    {campos.map((c, idx) => {
                      const info = tipoInfo(c.tipo)
                      const Icone = ICONES_MAP[info.icone] || Type
                      const ativo = selecionadoIdx === idx
                      return (
                        <div
                          key={c.id}
                          className={`flex items-start gap-3 px-4 py-3 transition cursor-pointer ${ativo ? '' : 'hover:bg-[#fafcfc]'}`}
                          onClick={() => setSelecionadoIdx(idx)}
                          style={ativo ? {
                            backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 8%, white)',
                          } : undefined}
                        >
                          <div className="flex flex-col gap-0.5 pt-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); moverCampo(idx, -1) }}
                              disabled={idx === 0}
                              className="rounded p-0.5 text-[#82939a] hover:bg-[#e5ecee] hover:text-[#12232b] disabled:opacity-30"
                            >
                              <ChevronUp className="size-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moverCampo(idx, 1) }}
                              disabled={idx === campos.length - 1}
                              className="rounded p-0.5 text-[#82939a] hover:bg-[#e5ecee] hover:text-[#12232b] disabled:opacity-30"
                            >
                              <ChevronDown className="size-3.5" />
                            </button>
                          </div>
                          <div
                            className="grid size-9 shrink-0 place-items-center rounded-lg bg-white border border-[#e5ecee]"
                            style={{ color: 'var(--cor-primaria, #0d9488)' }}
                          >
                            <Icone className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-[#243942]">{c.label}</p>
                              {c.obrigatorio && <span className="text-[10px] font-bold text-[#dc2626]">*</span>}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-[#82939a]">
                              {info.label}
                              {c.opcoes.length > 0 ? ` · ${c.opcoes.length} opções` : ''}
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); removerCampo(idx) }}
                            className="rounded p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                            title="Remover campo"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Panel>
            </div>

            {/* Coluna de propriedades */}
            <div>
              {campoSelecionado ? (
                <Panel>
                  <div className="flex items-center gap-3 border-b border-[#e5ecee] px-5 py-4">
                    <div
                      className="grid size-9 place-items-center rounded-lg"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                        color: 'var(--cor-primaria, #0d9488)',
                      }}
                    >
                      <Settings className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#12232b]">Propriedades</h2>
                      <p className="text-xs text-[#82939a]">{tipoInfo(campoSelecionado.tipo).label}</p>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Label (pergunta)</label>
                      <input
                        type="text"
                        value={campoSelecionado.label}
                        onChange={(e) => atualizarCampo('label', e.target.value)}
                        className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Placeholder</label>
                      <input
                        type="text"
                        value={campoSelecionado.placeholder || ''}
                        onChange={(e) => atualizarCampo('placeholder', e.target.value)}
                        placeholder="Texto dentro do campo"
                        className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Texto de ajuda</label>
                      <input
                        type="text"
                        value={campoSelecionado.texto_ajuda || ''}
                        onChange={(e) => atualizarCampo('texto_ajuda', e.target.value)}
                        placeholder="Aparece abaixo do campo"
                        className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]"
                      />
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <label className="flex items-center gap-2 text-sm text-[#243942]">
                        <input
                          type="checkbox"
                          checked={campoSelecionado.obrigatorio}
                          onChange={(e) => atualizarCampo('obrigatorio', e.target.checked)}
                          className="size-4"
                          style={{ accentColor: 'var(--cor-primaria, #0d9488)' }}
                        />
                        Campo obrigatório
                      </label>
                      {['texto_curto', 'texto_longo', 'email', 'cpf', 'telefone'].includes(campoSelecionado.tipo) && (
                        <label className="flex items-center gap-2 text-sm text-[#243942]">
                          <input
                            type="checkbox"
                            checked={campoSelecionado.unico}
                            onChange={(e) => atualizarCampo('unico', e.target.checked)}
                            className="size-4"
                            style={{ accentColor: 'var(--cor-primaria, #0d9488)' }}
                          />
                          Valor único (não aceita duplicatas)
                        </label>
                      )}
                    </div>

                    {['texto_curto', 'texto_longo'].includes(campoSelecionado.tipo) && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Mín. caracteres</label>
                          <input
                            type="number"
                            value={campoSelecionado.validacao_min || ''}
                            onChange={(e) => atualizarCampo('validacao_min', e.target.value ? parseInt(e.target.value, 10) : null)}
                            className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Máx. caracteres</label>
                          <input
                            type="number"
                            value={campoSelecionado.validacao_max || ''}
                            onChange={(e) => atualizarCampo('validacao_max', e.target.value ? parseInt(e.target.value, 10) : null)}
                            className="w-full rounded-lg border border-[#d5e0d3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]"
                          />
                        </div>
                      </div>
                    )}

                    {campoSelecionado.opcoes.length > 0 && (
                      <div className="pt-2">
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-xs font-semibold text-[#536871]">Opções</label>
                          <button
                            onClick={adicionarOpcao}
                            className="text-[11px] font-semibold transition hover:brightness-90"
                            style={{ color: 'var(--cor-primaria, #0d9488)' }}
                          >
                            + Adicionar
                          </button>
                        </div>
                        <div className="space-y-2">
                          {campoSelecionado.opcoes.map((op, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={op}
                                onChange={(e) => editarOpcao(i, e.target.value)}
                                className="flex-1 rounded-lg border border-[#d5e0e3] bg-white px-2.5 py-1.5 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]"
                              />
                              <button onClick={() => removerOpcao(i)} className="rounded p-1 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]">
                                <X className="size-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Panel>
              ) : (
                <Panel>
                  <div className="px-5 py-12 text-center">
                    <Settings className="mx-auto text-[#a0afb4]" size={28} />
                    <p className="mt-3 text-sm text-[#82939a]">Selecione um campo para editar</p>
                  </div>
                </Panel>
              )}
            </div>
          </div>
        )}

        {aba === 'configuracoes' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel>
              <div className="border-b border-[#e5ecee] px-5 py-4">
                <h2 className="text-base font-bold text-[#12232b]">Informações gerais</h2>
              </div>
              <div className="space-y-5 p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Título</label>
                  <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição</label>
                  <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Tipo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIPOS_FORMULARIO.map((t) => {
                      const sel = tipo === t.key
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setTipo(t.key)}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${sel ? '' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[var(--cor-primaria,#0d9488)]'}`}
                          style={sel ? {
                            borderColor: 'var(--cor-primaria, #0d9488)',
                            backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                            color: 'var(--cor-primaria, #0d9488)',
                          } : undefined}
                        >
                          {t.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">URL pública</label>
                  <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-[#fafcfc] px-3 py-2 text-sm">
                    <span className="text-[#82939a]">/formulario/</span>
                    <span className="font-mono font-semibold" style={{ color: 'var(--cor-primaria, #0d9488)' }}>{formulario.slug}</span>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel>
              <div className="border-b border-[#e5ecee] px-5 py-4">
                <h2 className="text-base font-bold text-[#12232b]">Aparência e comportamento</h2>
              </div>
              <div className="space-y-5 p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Cor primária</label>
                  <p className="mb-2 text-[10px] text-[#82939a]">Cor própria deste formulário (independente da marca da escola)</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={corPrimaria}
                      onChange={(e) => setCorPrimaria(e.target.value)}
                      className="size-10 cursor-pointer rounded-lg border border-[#d5e0e3] bg-white"
                    />
                    <input
                      type="text"
                      value={corPrimaria}
                      onChange={(e) => setCorPrimaria(e.target.value)}
                      className="flex-1 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 font-mono text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Mensagem de sucesso</label>
                  <textarea value={mensagemSucesso} onChange={(e) => setMensagemSucesso(e.target.value)} rows={2} className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Redirecionar após envio (opcional)</label>
                  <input type="url" value={redirecionarUrl} onChange={(e) => setRedirecionarUrl(e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'rascunho', label: 'Rascunho' },
                      { key: 'publicado', label: 'Publicado' },
                      { key: 'arquivado', label: 'Arquivado' },
                    ].map((s) => {
                      const sel = status === s.key
                      return (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => setStatus(s.key)}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${sel ? '' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[var(--cor-primaria,#0d9488)]'}`}
                          style={sel ? {
                            borderColor: 'var(--cor-primaria, #0d9488)',
                            backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                            color: 'var(--cor-primaria, #0d9488)',
                          } : undefined}
                        >
                          {s.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        )}
      </main>

      {adicionarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAdicionarAberto(false)} />
          <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Escolha o tipo de campo</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Você pode editar as propriedades depois</p>
              </div>
              <button onClick={() => setAdicionarAberto(false)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
            </header>
            <div className="grid gap-2 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {TIPOS_CAMPO.map((t) => {
                const Icone = ICONES_MAP[t.icone] || Type
                return (
                  <button
                    key={t.key}
                    onClick={() => adicionarCampo(t.key)}
                    className="flex items-start gap-3 rounded-lg border border-[#e5ecee] bg-white p-4 text-left transition hover:border-[var(--cor-primaria,#0d9488)] hover:bg-black/[0.02]"
                  >
                    <div
                      className="grid size-9 shrink-0 place-items-center rounded-lg"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                        color: 'var(--cor-primaria, #0d9488)',
                      }}
                    >
                      <Icone className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#243942]">{t.label}</p>
                      <p className="mt-0.5 text-xs text-[#82939a]">{t.descricao}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}