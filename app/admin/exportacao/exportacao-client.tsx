'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Download, FileJson, Search, User, Loader2, Check, Shield,
  Database, Info, AlertCircle,
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { exportarTudo, exportarAluno, type ResumoExportacao, type AlunoResumo } from './actions'

function baixarArquivo(nome: string, conteudo: string, tipo: string) {
  const blob = new Blob([conteudo], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  URL.revokeObjectURL(url)
}

function gerarNomeArquivo(slug: string): string {
  const data = new Date().toISOString().split('T')[0]
  return `arxum-${slug}-${data}.json`
}

export function ExportacaoClient({
  resumo,
  alunos,
}: {
  resumo: ResumoExportacao
  alunos: AlunoResumo[]
}) {
  const router = useRouter()
  const [exportando, setExportando] = useState(false)
  const [exportou, setExportou] = useState(false)
  const [erro, setErro] = useState('')

  const [buscaAluno, setBuscaAluno] = useState('')
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoResumo | null>(null)
  const [exportandoAluno, setExportandoAluno] = useState<string | null>(null)
  const [sucessoAluno, setSucessoAluno] = useState<string | null>(null)

  const alunosFiltrados = alunos.filter((a) => {
    const termo = buscaAluno.toLowerCase()
    return buscaAluno === '' || a.nome.toLowerCase().includes(termo) || a.responsavel_email.toLowerCase().includes(termo)
  })

  async function handleExportarTudo() {
    setExportando(true)
    setErro('')
    setExportou(false)

    const r = await exportarTudo()
    setExportando(false)

    if (!r.success) {
      setErro(r.error || 'Erro ao exportar.')
      return
    }

    baixarArquivo(
      gerarNomeArquivo(r.pacote.meta.escola.slug),
      JSON.stringify(r.pacote, null, 2),
      'application/json'
    )
    setExportou(true)
    setTimeout(() => setExportou(false), 4000)
  }

  async function handleExportarAluno(aluno: AlunoResumo) {
    setExportandoAluno(aluno.id)
    setSucessoAluno(null)

    const r = await exportarAluno(aluno.id)
    setExportandoAluno(null)

    if (!r.success) {
      alert(r.error || 'Erro ao exportar aluno.')
      return
    }

    const slug = aluno.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
    baixarArquivo(`arxum-aluno-${slug}.json`, JSON.stringify(r.dados, null, 2), 'application/json')

    setSucessoAluno(aluno.id)
    setTimeout(() => setSucessoAluno(null), 3000)
  }

  const totalRegistros = Object.values(resumo).reduce((s, n) => s + n, 0)

  return (
    <AdminShell mode="school" active="Exportação">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="Administração"
          title="Exportação de dados"
          description="Baixe uma cópia completa dos dados da sua escola. Atende aos requisitos de portabilidade da LGPD."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
              <Database className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Registros totais</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#12232b]">{totalRegistros.toLocaleString('pt-BR')}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
              <User className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold font-semibold uppercase tracking-wider text-[#6b7d86]">Alunos</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#12232b]">{resumo.alunos}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ede9fe] text-[#5b21b6]">
              <Shield className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Formato</p>
              <p className="text-lg font-bold tracking-[-.03em] text-[#5b21b6]">JSON</p>
            </div>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
                <FileJson className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Exportação completa</h2>
                <p className="text-xs text-[#82939a]">Gera um arquivo JSON com todos os dados da escola.</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 lg:p-6">
            <div className="grid gap-3 rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Alunos', valor: resumo.alunos },
                { label: 'Matrículas', valor: resumo.inscricoes },
                { label: 'Usuários', valor: resumo.usuarios },
                { label: 'Notas', valor: resumo.notas },
                { label: 'Ocorrências', valor: resumo.ocorrencias },
                { label: 'Faturas', valor: resumo.faturas },
                { label: 'Comunicados', valor: resumo.comunicados },
                { label: 'Eventos', valor: resumo.eventos },
                { label: 'Autorizações', valor: resumo.autorizacoes },
                { label: 'Formulários', valor: resumo.formularios },
                { label: 'Respostas', valor: resumo.respostas_formularios },
                { label: 'Álbuns', valor: resumo.albuns },
                { label: 'Fotos', valor: resumo.fotos },
                { label: 'Videoaulas', valor: resumo.videoaulas },
                { label: 'Módulos', valor: resumo.modulos },
                { label: 'Aulas', valor: resumo.aulas },
                { label: 'Produtos', valor: resumo.produtos },
                { label: 'Pedidos', valor: resumo.pedidos },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded border border-[#e5ecee] bg-white px-3 py-2">
                  <span className="text-xs text-[#82939a]">{item.label}</span>
                  <span className="text-sm font-bold text-[#243942]">{item.valor}</span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-[#0d9488]/20 bg-[#ccfbf1]/30 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 size-4 shrink-0 text-[#0f766e]" />
                <p className="text-xs leading-6 text-[#536871]">
                  O arquivo contém dados pessoais protegidos pela LGPD. Guarde em local seguro e utilize apenas para os fins previstos em lei.
                </p>
              </div>
            </div>

            {erro && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600">{erro}</p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3">
              {exportou && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#d1fae5] px-3 py-1.5 text-xs font-semibold text-[#065f46]">
                  <Check className="size-3.5" /> Download iniciado
                </span>
              )}
              <button
                onClick={handleExportarTudo}
                disabled={exportando}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-50"
              >
                {exportando ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                {exportando ? 'Preparando arquivo...' : 'Baixar todos os dados'}
              </button>
            </div>
          </div>
        </Panel>

        <Panel className="mt-6">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
                <User className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Exportação individual</h2>
                <p className="text-xs text-[#82939a]">Gera um JSON com todos os dados de um aluno específico (portabilidade LGPD).</p>
              </div>
            </div>
          </div>

          <div className="p-5 lg:p-6">
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-96">
              <Search className="size-4 text-[#9aaab0]" />
              <input
                type="text"
                value={buscaAluno}
                onChange={(e) => setBuscaAluno(e.target.value)}
                placeholder="Buscar por nome ou e-mail do responsável"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]"
              />
            </div>

            {alunos.length === 0 ? (
              <div className="py-12 text-center">
                <AlertCircle className="mx-auto text-[#a0afb4]" size={28} />
                <p className="mt-3 text-sm text-[#82939a]">Nenhum aluno cadastrado.</p>
              </div>
            ) : (
              <div className="max-h-[480px] overflow-y-auto rounded-lg border border-[#e5ecee]">
                <div className="divide-y divide-[#f0f4f5]">
                  {alunosFiltrados.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-[#82939a]">Nenhum aluno encontrado.</div>
                  ) : (
                    alunosFiltrados.map((a) => (
                      <div key={a.id} className="flex items-center gap-4 px-4 py-3 transition hover:bg-[#fafcfc]">
                        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dbeafe] text-xs font-bold text-[#1e40af]">
                          {a.nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#243942]">{a.nome}</p>
                          <p className="truncate text-xs text-[#82939a]">{a.serie || '—'} · {a.responsavel_email}</p>
                        </div>
                        <button
                          onClick={() => handleExportarAluno(a)}
                          disabled={exportandoAluno === a.id || sucessoAluno === a.id}
                          className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                            sucessoAluno === a.id
                              ? 'bg-[#d1fae5] text-[#065f46]'
                              : 'border border-[#b8c9ce] bg-white text-[#30454e] hover:border-[#0d9488] hover:text-[#0f766e]'
                          }`}
                        >
                          {exportandoAluno === a.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : sucessoAluno === a.id ? (
                            <Check className="size-3.5" />
                          ) : (
                            <Download className="size-3.5" />
                          )}
                          {exportandoAluno === a.id ? 'Preparando...' : sucessoAluno === a.id ? 'Baixado' : 'Exportar'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </Panel>

        <div className="mt-6 rounded-xl border border-[#e5ecee] bg-[#fafcfc] p-5">
          <p className="text-xs leading-6 text-[#82939a]">
            <strong className="text-[#536871]">Sobre a LGPD:</strong> a Lei Geral de Proteção de Dados garante aos titulares o direito à portabilidade e ao acesso aos seus dados.
            Esta tela permite atender solicitações de responsáveis e manter uma cópia de segurança dos dados da escola.
          </p>
        </div>
      </main>
    </AdminShell>
  )
}