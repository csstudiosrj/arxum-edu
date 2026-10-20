'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, FileText, HelpCircle, Loader2, Save, Video, Check } from 'lucide-react'
import type { AulaDetalhe } from '../../actions'
import { salvarAnotacaoAluno, marcarAulaConcluida } from '../../actions'

export function AulaClient({ aula }: { aula: AulaDetalhe }) {
  const router = useRouter()
  const [anotacao, setAnotacao] = useState(aula.anotacao || '')
  const [salvando, setSalvando] = useState(false)
  const [salvou, setSalvou] = useState(false)
  const [concluindo, setConcluindo] = useState(false)
  const [concluida, setConcluida] = useState(aula.concluida)

  async function handleSalvarAnotacao() {
    setSalvando(true)
    const r = await salvarAnotacaoAluno(aula.id, anotacao)
    setSalvando(false)
    if (r.success) {
      setSalvou(true)
      setTimeout(() => setSalvou(false), 2000)
    } else {
      alert(r.error || 'Erro ao salvar.')
    }
  }

  async function handleMarcarConcluida() {
    setConcluindo(true)
    const r = await marcarAulaConcluida(aula.id, !concluida)
    setConcluindo(false)
    if (r.success) {
      setConcluida(!concluida)
      router.refresh()
    }
  }

  // Helper para renderizar o conteúdo da aula
  function renderConteudo() {
    if (!aula.conteudo_url) {
      return <p className="text-sm text-[#82939a]">Nenhum conteúdo anexado a esta aula.</p>
    }

    if (aula.tipo === 'video') {
      // Se for YouTube ou Vimeo, transforma em embed. Senão, tenta tocar como vídeo direto.
      let embedUrl = aula.conteudo_url
      if (aula.conteudo_url.includes('youtube.com/watch?v=')) {
        embedUrl = aula.conteudo_url.replace('watch?v=', 'embed/')
      } else if (aula.conteudo_url.includes('youtu.be/')) {
        embedUrl = aula.conteudo_url.replace('youtu.be/', 'youtube.com/embed/')
      }

      return (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            src={embedUrl}
            className="absolute inset-0 h-full w-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )
    }

    if (aula.tipo === 'pdf') {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#dce5e8] bg-[#fafcfc] p-12 text-center">
          <FileText className="size-12 text-[#0d9488]" />
          <p className="mt-4 text-sm font-semibold text-[#243942]">Material em PDF</p>
          <a href={aula.conteudo_url} target="_blank" rel="noopener noreferrer" className="mt-4 rounded-lg bg-[#0d9488] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0f766e]">
            Abrir PDF
          </a>
        </div>
      )
    }

    if (aula.tipo === 'texto') {
      return (
        <div className="rounded-xl border border-[#dce5e8] bg-white p-6 lg:p-8">
          <div className="prose prose-sm max-w-none text-[#243942]" dangerouslySetInnerHTML={{ __html: aula.conteudo_url }} />
        </div>
      )
    }

    if (aula.tipo === 'quiz') {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#dce5e8] bg-[#fafcfc] p-12 text-center">
          <HelpCircle className="size-12 text-[#0d9488]" />
          <p className="mt-4 text-sm font-semibold text-[#243942]">Atividade Avaliativa</p>
          <a href={aula.conteudo_url} target="_blank" rel="noopener noreferrer" className="mt-4 rounded-lg bg-[#0d9488] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0f766e]">
            Responder Quiz
          </a>
        </div>
      )
    }

    return <p className="text-sm text-[#82939a]">Tipo de conteúdo não reconhecido.</p>
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <Link href="/aluno/aulas" className="inline-flex items-center gap-2 text-sm text-[#82939a] hover:text-[#0d9488]">
        <ArrowLeft className="size-4" /> Voltar para todas as aulas
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0d9488]">{aula.disciplina} · {aula.modulo_titulo}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">{aula.titulo}</h1>
            {aula.descricao && <p className="mt-2 text-sm leading-6 text-[#71838b]">{aula.descricao}</p>}
          </div>

          {renderConteudo()}

          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#12232b]">Minhas anotações</h2>
              <button
                onClick={handleSalvarAnotacao}
                disabled={salvando}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#0d9488] transition hover:bg-[#e6faf3] disabled:opacity-50"
              >
                {salvando ? <Loader2 className="size-3.5 animate-spin" /> : salvou ? <Check className="size-3.5" /> : <Save className="size-3.5" />}
                {salvando ? 'Salvando...' : salvou ? 'Salvo!' : 'Salvar anotação'}
              </button>
            </div>
            <textarea
              value={anotacao}
              onChange={(e) => setAnotacao(e.target.value)}
              placeholder="Faça suas anotações sobre esta aula aqui..."
              rows={6}
              className="w-full resize-none rounded-xl border border-[#dce5e8] bg-white p-4 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
            />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-[#dce5e8] bg-white p-5">
            <h3 className="text-sm font-bold text-[#12232b]">Progresso da aula</h3>
            <button
              onClick={handleMarcarConcluida}
              disabled={concluindo}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition disabled:opacity-50 ${
                concluida
                  ? 'border border-[#0d9488] bg-[#e6faf3] text-[#0d9488] hover:bg-[#ccfbf1]'
                  : 'bg-[#0d9488] text-white hover:bg-[#0f766e]'
              }`}
            >
              {concluindo ? <Loader2 className="size-5 animate-spin" /> : concluida ? <CheckCircle2 className="size-5" /> : <CheckCircle2 className="size-5" />}
              {concluindo ? 'Atualizando...' : concluida ? 'Aula concluída' : 'Marcar como concluída'}
            </button>
          </div>

          <div className="rounded-xl border border-[#dce5e8] bg-white">
            <div className="border-b border-[#e5ecee] px-5 py-3">
              <h3 className="text-sm font-bold text-[#12232b]">Aulas deste módulo</h3>
            </div>
            <div className="divide-y divide-[#f0f4f5]">
              {aula.aulas_do_modulo.map((a) => {
                const ativa = a.id === aula.id
                return (
                  <Link
                    key={a.id}
                    href={`/aluno/aulas/${a.id}`}
                    className={`flex items-center gap-3 px-5 py-3 transition hover:bg-[#fafcfc] ${ativa ? 'bg-[#fafcfc]' : ''}`}
                  >
                    <div className={`grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                      a.concluida ? 'bg-[#d1fae5] text-[#065f46]' : ativa ? 'bg-[#0d9488] text-white' : 'bg-[#f0f4f5] text-[#82939a]'
                    }`}>
                      {a.concluida ? <Check className="size-3.5" /> : a.ordem}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-xs font-semibold ${ativa ? 'text-[#0d9488]' : 'text-[#243942]'}`}>{a.titulo}</p>
                    </div>
                    {ativa && <Video className="size-3.5 text-[#0d9488]" />}
                  </Link>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}