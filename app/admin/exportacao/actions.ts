'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'

export type ResumoExportacao = {
  alunos: number
  inscricoes: number
  usuarios: number
  notas: number
  ocorrencias: number
  faturas: number
  comunicados: number
  eventos: number
  autorizacoes: number
  formularios: number
  respostas_formularios: number
  albuns: number
  fotos: number
  videoaulas: number
  modulos: number
  aulas: number
  produtos: number
  pedidos: number
}

export type PacoteExportacao = {
  meta: {
    gerado_em: string
    escola: {
      id: string
      nome: string
      slug: string
      plano: string
      cnpj: string | null
      endereco: string | null
      cidade: string | null
      estado: string | null
      telefone: string | null
      email_contato: string | null
      criado_em: string
    }
  }
  dados: {
    alunos: any[]
    inscricoes: any[]
    usuarios: any[]
    notas: any[]
    ocorrencias: any[]
    faturas: any[]
    comunicados: any[]
    eventos: any[]
    autorizacoes: any[]
    autorizacoes_respostas: any[]
    formularios: any[]
    formulario_campos: any[]
    formulario_respostas: any[]
    albuns: any[]
    fotos: any[]
    videoaulas: any[]
    modulos: any[]
    aulas: any[]
    aulas_progresso: any[]
    produtos: any[]
    pedidos: any[]
    pedido_itens: any[]
    mensagens_contato: any[]
  }
}

export async function getResumoExportacao(): Promise<ResumoExportacao> {
  const vazio: ResumoExportacao = {
    alunos: 0, inscricoes: 0, usuarios: 0, notas: 0, ocorrencias: 0,
    faturas: 0, comunicados: 0, eventos: 0, autorizacoes: 0,
    formularios: 0, respostas_formularios: 0, albuns: 0, fotos: 0,
    videoaulas: 0, modulos: 0, aulas: 0, produtos: 0, pedidos: 0,
  }

  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return vazio

    const admin = createAdminClient()

    const [
      { count: cAlunos },
      { count: cInscricoes },
      { count: cUsuarios },
      { count: cNotas },
      { count: cOcorrencias },
      { count: cFaturas },
      { count: cComunicados },
      { count: cEventos },
      { count: cAutorizacoes },
      { count: cFormularios },
      { data: forms },
      { count: cAlbuns },
      { count: cFotos },
      { count: cVideoaulas },
      { count: cModulos },
      { count: cAulas },
      { count: cProdutos },
      { count: cPedidos },
    ] = await Promise.all([
      admin.from('alunos').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
      admin.from('inscricoes').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
      admin.from('perfis').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
      admin.from('notas').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
      admin.from('ocorrencias').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
      admin.from('faturas').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
      admin.from('comunicados').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
      admin.from('eventos').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
      admin.from('autorizacoes').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
      admin.from('formularios').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
      admin.from('formularios').select('id').eq('escola_id', escola.id),
      admin.from('albuns').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
      admin.from('fotos').select('*', { count: 'exact', head: true }),
      admin.from('videoaulas').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
      admin.from('modulos').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
      admin.from('aulas').select('*', { count: 'exact', head: true }),
      admin.from('produtos').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
      admin.from('pedidos').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
    ])

    // Conta respostas de formulários + fotos dos álbuns + aulas dos módulos
    const idsForms = (forms || []).map((f) => f.id)
    const { count: cRespostas } = idsForms.length > 0
      ? await admin.from('formulario_respostas').select('*', { count: 'exact', head: true }).in('formulario_id', idsForms)
      : { count: 0 }

    const { data: albuns } = await admin.from('albuns').select('id').eq('escola_id', escola.id)
    const idsAlbuns = (albuns || []).map((a) => a.id)
    const { count: cFotosReais } = idsAlbuns.length > 0
      ? await admin.from('fotos').select('*', { count: 'exact', head: true }).in('album_id', idsAlbuns)
      : { count: 0 }

    const { data: modulos } = await admin.from('modulos').select('id').eq('escola_id', escola.id)
    const idsModulos = (modulos || []).map((m) => m.id)
    const { count: cAulasReais } = idsModulos.length > 0
      ? await admin.from('aulas').select('*', { count: 'exact', head: true }).in('modulo_id', idsModulos)
      : { count: 0 }

    return {
      alunos: cAlunos || 0,
      inscricoes: cInscricoes || 0,
      usuarios: cUsuarios || 0,
      notas: cNotas || 0,
      ocorrencias: cOcorrencias || 0,
      faturas: cFaturas || 0,
      comunicados: cComunicados || 0,
      eventos: cEventos || 0,
      autorizacoes: cAutorizacoes || 0,
      formularios: cFormularios || 0,
      respostas_formularios: cRespostas || 0,
      albuns: cAlbuns || 0,
      fotos: cFotosReais || 0,
      videoaulas: cVideoaulas || 0,
      modulos: cModulos || 0,
      aulas: cAulasReais || 0,
      produtos: cProdutos || 0,
      pedidos: cPedidos || 0,
    }
  } catch (e) {
    console.error('Erro no resumo de exportação:', e)
    return vazio
  }
}

export async function exportarTudo(): Promise<{ success: true; pacote: PacoteExportacao } | { success: false; error: string }> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const escolaId = escola.id

    // Coleta em paralelo
    const [
      { data: alunos },
      { data: inscricoes },
      { data: usuarios },
      { data: notas },
      { data: ocorrencias },
      { data: faturas },
      { data: comunicados },
      { data: eventos },
      { data: autorizacoes },
      { data: formularios },
      { data: albuns },
      { data: videoaulas },
      { data: modulos },
      { data: produtos },
      { data: pedidos },
      { data: mensagens },
    ] = await Promise.all([
      admin.from('alunos').select('*').eq('escola_id', escolaId),
      admin.from('inscricoes').select('*').eq('escola_id', escolaId),
      admin.from('perfis').select('id, escola_id, nome, email, papel, disciplinas, telefone, ativo, criado_em').eq('escola_id', escolaId),
      admin.from('notas').select('*').eq('escola_id', escolaId),
      admin.from('ocorrencias').select('*').eq('escola_id', escolaId),
      admin.from('faturas').select('*').eq('escola_id', escolaId),
      admin.from('comunicados').select('*').eq('escola_id', escolaId),
      admin.from('eventos').select('*').eq('escola_id', escolaId),
      admin.from('autorizacoes').select('*').eq('escola_id', escolaId),
      admin.from('formularios').select('*').eq('escola_id', escolaId),
      admin.from('albuns').select('*').eq('escola_id', escolaId),
      admin.from('videoaulas').select('*').eq('escola_id', escolaId),
      admin.from('modulos').select('*').eq('escola_id', escolaId),
      admin.from('produtos').select('*').eq('escola_id', escolaId),
      admin.from('pedidos').select('*').eq('escola_id', escolaId),
      admin.from('mensagens_contato').select('*').eq('escola_id', escolaId),
    ])

    // Derivados
    const idsFormularios = (formularios || []).map((f) => f.id)
    const idsAlbuns = (albuns || []).map((a) => a.id)
    const idsModulos = (modulos || []).map((m) => m.id)
    const idsPedidos = (pedidos || []).map((p) => p.id)
    const idsAutorizacoes = (autorizacoes || []).map((a) => a.id)

    const [
      { data: formCampos },
      { data: formRespostas },
      { data: fotos },
      { data: aulas },
      { data: pedidoItens },
      { data: autorizacoesRespostas },
    ] = await Promise.all([
      idsFormularios.length > 0 ? admin.from('formulario_campos').select('*').in('formulario_id', idsFormularios) : Promise.resolve({ data: [] }),
      idsFormularios.length > 0 ? admin.from('formulario_respostas').select('*').in('formulario_id', idsFormularios) : Promise.resolve({ data: [] }),
      idsAlbuns.length > 0 ? admin.from('fotos').select('*').in('album_id', idsAlbuns) : Promise.resolve({ data: [] }),
      idsModulos.length > 0 ? admin.from('aulas').select('*').in('modulo_id', idsModulos) : Promise.resolve({ data: [] }),
      idsPedidos.length > 0 ? admin.from('pedido_itens').select('*').in('pedido_id', idsPedidos) : Promise.resolve({ data: [] }),
      idsAutorizacoes.length > 0 ? admin.from('autorizacoes_respostas').select('*').in('autorizacao_id', idsAutorizacoes) : Promise.resolve({ data: [] }),
    ])

    // Aulas progresso (por responsavel_email dos alunos da escola)
    const emails = Array.from(new Set((alunos || []).map((a) => a.responsavel_email).filter(Boolean)))
    const { data: progresso } = emails.length > 0
      ? await admin.from('aulas_progresso').select('*').in('responsavel_email', emails)
      : { data: [] }

    const pacote: PacoteExportacao = {
      meta: {
        gerado_em: new Date().toISOString(),
        escola: {
          id: escola.id,
          nome: escola.nome,
          slug: escola.slug,
          plano: escola.plano,
          cnpj: escola.cnpj,
          endereco: escola.endereco,
          cidade: escola.cidade,
          estado: escola.estado,
          telefone: escola.telefone,
          email_contato: escola.email_contato,
          criado_em: escola.criado_em,
        },
      },
      dados: {
        alunos: alunos || [],
        inscricoes: inscricoes || [],
        usuarios: usuarios || [],
        notas: notas || [],
        ocorrencias: ocorrencias || [],
        faturas: faturas || [],
        comunicados: comunicados || [],
        eventos: eventos || [],
        autorizacoes: autorizacoes || [],
        autorizacoes_respostas: autorizacoesRespostas || [],
        formularios: formularios || [],
        formulario_campos: formCampos || [],
        formulario_respostas: formRespostas || [],
        albuns: albuns || [],
        fotos: fotos || [],
        videoaulas: videoaulas || [],
        modulos: modulos || [],
        aulas: aulas || [],
        aulas_progresso: progresso || [],
        produtos: produtos || [],
        pedidos: pedidos || [],
        pedido_itens: pedidoItens || [],
        mensagens_contato: mensagens || [],
      },
    }

    return { success: true, pacote }
  } catch (e) {
    console.error('Erro ao exportar:', e)
    return { success: false, error: 'Erro ao exportar dados.' }
  }
}

// ── Exportação individual por aluno (LGPD — portabilidade individual) ──

export async function exportarAluno(alunoId: string): Promise<{ success: true; dados: any } | { success: false; error: string }> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    const { data: aluno } = await admin
      .from('alunos')
      .select('*')
      .eq('id', alunoId)
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (!aluno) return { success: false, error: 'Aluno não encontrado.' }

    const [
      { data: notas },
      { data: ocorrencias },
      { data: faturas },
      { data: inscricoes },
      { data: pedidos },
      { data: progresso },
    ] = await Promise.all([
      admin.from('notas').select('*').eq('aluno_id', alunoId),
      admin.from('ocorrencias').select('*').eq('aluno_id', alunoId),
      admin.from('faturas').select('*').eq('aluno_id', alunoId),
      admin.from('inscricoes').select('*').eq('responsavel_email', aluno.responsavel_email),
      admin.from('pedidos').select('*').eq('responsavel_email', aluno.responsavel_email),
      admin.from('aulas_progresso').select('*').eq('aluno_nome', aluno.nome).eq('responsavel_email', aluno.responsavel_email),
    ])

    return {
      success: true,
      dados: {
        meta: {
          gerado_em: new Date().toISOString(),
          escola: escola.nome,
          aluno_id: alunoId,
          aluno_nome: aluno.nome,
        },
        aluno,
        notas: notas || [],
        ocorrencias: ocorrencias || [],
        faturas: faturas || [],
        inscricoes: inscricoes || [],
        pedidos: pedidos || [],
        aulas_progresso: progresso || [],
      },
    }
  } catch (e) {
    return { success: false, error: 'Erro ao exportar aluno.' }
  }
}

// ── Lista de alunos para seleção ──────────────────────────────────

export type AlunoResumo = {
  id: string
  nome: string
  serie: string | null
  responsavel_email: string
}

export async function getAlunosParaExportar(): Promise<AlunoResumo[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data } = await admin
      .from('alunos')
      .select('id, nome, serie, responsavel_email')
      .eq('escola_id', escola.id)
      .eq('status', 'ativo')
      .order('nome', { ascending: true })

    return (data || []) as AlunoResumo[]
  } catch (e) {
    return []
  }
}