'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, AlertTriangle, CheckCircle2, Loader2, Users, BookOpen, TrendingUp, X, UserMinus } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { fecharAnoLetivo, inativarAluno, type ResumoAno } from './actions'

export function AnoLetivoClient({ resumoInicial, alunosIniciais }: { 
  resumoInicial: ResumoAno
  alunosIniciais: any[]
}) {
  const [resumo] = useState(resumoInicial)
  const [alunos, setAlunos] = useState(alunosIniciais)
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [processandoAluno, setProcessandoAluno] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  const proximoAno = String(parseInt(resumo.anoAtivo) + 1)

  async function handleVirarAno() {
    setProcessando(true)
    setMensagem(null)
    const r = await fecharAnoLetivo(proximoAno, true)
    setProcessando(false)
    if (r.success) {
      setMensagem({ tipo: 'ok', texto: `Ano letivo ${proximoAno} iniciado com sucesso!` })
      setModalConfirmacaoAberto(false)
      setTimeout(() => window.location.reload(), 2000)
    } else {
      setMensagem({ tipo: 'erro', texto: r.error || 'Erro ao virar ano.' })
    }
  }

  async function handleInativarAluno(alunoId: string) {
    setProcessandoAluno(alunoId)
    const r = await inativarAluno(alunoId)
    setProcessandoAluno(null)
    if (r.success) {
      setAlunos(alunos.filter(a => a.id !== alunoId))
    } else {
      alert(r.error)
    }
  }

  return (
    <AdminShell mode="school" active="Configurações">
      <main className="px-5 py-8 lg:px-8">
        <Link href="/admin/configuracoes" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--cor-primaria)] hover:underline mb-6">
          <ArrowLeft className="size-4" /> Voltar para configurações
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Configurações"
            title="Ano Letivo"
            description="Gerencie o fechamento do ano atual e a abertura do próximo."
          />
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#0d9488]/10 px-4 py-2 text-sm font-bold text-[#0d9488]">
              Ano Ativo: {resumo.anoAtivo}
            </span>
          </div>
        </div>

        {mensagem && (
          <div className={`mt-6 rounded-lg border p-4 text-sm flex items-center gap-2 ${mensagem.tipo === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {mensagem.tipo === 'ok' ? <CheckCircle2 size={18}/> : <AlertTriangle size={18}/>} {mensagem.texto}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Panel className="p-5">
            <div className="grid size-9 place-items-center rounded-lg bg-[#dbeafe] text-[#1e40af] mb-3"><Users size={18}/></div>
            <p className="text-xs font-semibold uppercase text-[#6b7d86]">Alunos Ativos</p>
            <p className="mt-1 text-2xl font-bold text-[#1e40af]">{resumo.totalAlunosAtivos}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-9 place-items-center rounded-lg bg-[#f0fdfa] text-[#0d9488] mb-3"><BookOpen size={18}/></div>
            <p className="text-xs font-semibold uppercase text-[#6b7d86]">Turmas</p>
            <p className="mt-1 text-2xl font-bold text-[#0d9488]">{resumo.totalTurmas}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-9 place-items-center rounded-lg bg-[#ede9fe] text-[#5b21b6] mb-3"><TrendingUp size={18}/></div>
            <p className="text-xs font-semibold uppercase text-[#6b7d86]">Notas Lançadas</p>
            <p className="mt-1 text-2xl font-bold text-[#5b21b6]">{resumo.totalNotas}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-9 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e] mb-3"><Calendar size={18}/></div>
            <p className="text-xs font-semibold uppercase text-[#6b7d86]">Faturas Emitidas</p>
            <p className="mt-1 text-2xl font-bold text-[#92400e]">{resumo.totalFaturas}</p>
          </Panel>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Panel className="p-6">
            <h3 className="font-bold text-[#12232b] flex items-center gap-2 mb-2"><AlertTriangle className="size-5 text-[#d97706]" /> Fechar Ano Letivo {resumo.anoAtivo}</h3>
            <p className="text-sm text-[#82939a] leading-relaxed mb-4">
              Ao virar o ano, o sistema:
            </p>
            <ul className="text-sm text-[#536871] space-y-2 mb-6">
              <li className="flex items-start gap-2"><CheckCircle2 className="size-4 text-[#0d9488] shrink-0 mt-0.5"/> Arquiva os dados de {resumo.anoAtivo} (notas, faturas, turmas);</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="size-4 text-[#0d9488] shrink-0 mt-0.5"/> Mantém o histórico acessível para consulta;</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="size-4 text-[#0d9488] shrink-0 mt-0.5"/> Cria o ano letivo {proximoAno} zerado para nova configuração;</li>
              <li className="flex items-start gap-2"><AlertTriangle className="size-4 text-[#d97706] shrink-0 mt-0.5"/> Você precisará criar as novas turmas de {proximoAno}.</li>
            </ul>
            <button 
              onClick={() => setModalConfirmacaoAberto(true)}
              className="w-full bg-[#d97706] text-white py-3 rounded-lg font-bold hover:bg-[#b45309] transition"
            >
              Iniciar Virada para {proximoAno}
            </button>
          </Panel>

          <Panel className="p-6">
            <h3 className="font-bold text-[#12232b] flex items-center gap-2 mb-2"><UserMinus className="size-5 text-[#dc2626]" /> Arquivar Alunos Inativos</h3>
            <p className="text-sm text-[#82939a] leading-relaxed mb-4">
              Selecione os alunos que saíram (formados, transferidos) para marcá-los como inativos antes da virada.
            </p>
            <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
              {alunos.length === 0 ? (
                <p className="text-sm text-center py-6 text-[#82939a]">Nenhum aluno ativo para inativar.</p>
              ) : (
                alunos.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 hover:bg-[#fafcfc]">
                    <div>
                      <p className="text-sm font-semibold text-[#243942]">{a.nome}</p>
                      <p className="text-xs text-[#82939a]">{a.serie || '—'} · {a.turno || '—'}</p>
                    </div>
                    <button 
                      onClick={() => handleInativarAluno(a.id)}
                      disabled={processandoAluno === a.id}
                      className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded font-semibold disabled:opacity-50"
                    >
                      {processandoAluno === a.id ? <Loader2 className="size-3 animate-spin" /> : 'Inativar'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      </main>

      {modalConfirmacaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#fef3c7] text-[#d97706] mb-4">
              <AlertTriangle className="size-7" />
            </div>
            <h3 className="text-center font-bold text-lg text-[#12232b] mb-2">Confirmar Virada de Ano</h3>
            <p className="text-center text-sm text-[#82939a] mb-6">
              Você está prestes a encerrar o ano letivo {resumo.anoAtivo} e abrir {proximoAno}. Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setModalConfirmacaoAberto(false)} className="flex-1 border rounded-lg py-2.5 font-semibold text-[#536871]">Cancelar</button>
              <button onClick={handleVirarAno} disabled={processando} className="flex-1 bg-[#d97706] text-white rounded-lg py-2.5 font-bold disabled:opacity-50">
                {processando ? 'Processando...' : 'Confirmar Virada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}