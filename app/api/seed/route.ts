import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = createAdminClient()

    // 1. Limpar dados antigos de teste (se existirem)
    const { data: escolaAntiga } = await admin.from('escolas').select('id').eq('slug', 'escola-de-teste').maybeSingle()
    if (escolaAntiga) {
      await admin.from('escolas').delete().eq('id', escolaAntiga.id)
    }

    const { data: authUsers } = await admin.auth.admin.listUsers()
    const usersToDelete = (authUsers?.users || []).filter(u => 
      u.email === 'admin@teste.com' || 
      u.email === 'pai@teste.com' || 
      u.email === 'professor@teste.com'
    )
    for (const u of usersToDelete) {
      await admin.auth.admin.deleteUser(u.id)
    }

    // 2. Criar Escola
    const { data: escola, error: errEscola } = await admin
      .from('escolas')
      .insert({
        nome: 'Escola de Teste',
        razao_social: 'Escola de Teste Educação LTDA',
        slug: 'escola-de-teste',
        cnpj: '11222333000181',
        status_assinatura: 'trial',
        plano: 'raiz'
      })
      .select('id')
      .single()

    if (errEscola || !escola) throw new Error('Erro ao criar escola: ' + errEscola?.message)

    // 3. Criar Usuários (Auth + Perfis)
    // Admin
    const { data: adminAuth } = await admin.auth.admin.createUser({
      email: 'admin@teste.com',
      password: '12345678',
      email_confirm: true,
      user_metadata: { nome: 'Admin de Teste' }
    })
    if (adminAuth?.user) {
      await admin.from('perfis').upsert({
        id: adminAuth.user.id,
        escola_id: escola.id,
        nome: 'Admin de Teste',
        email: 'admin@teste.com',
        papel: 'admin_escola',
        ativo: true
      })
    }

    // Professor
    const { data: profAuth } = await admin.auth.admin.createUser({
      email: 'professor@teste.com',
      password: '12345678',
      email_confirm: true,
      user_metadata: { nome: 'Professor de Teste' }
    })
    if (profAuth?.user) {
      await admin.from('perfis').upsert({
        id: profAuth.user.id,
        escola_id: escola.id,
        nome: 'Professor de Teste',
        email: 'professor@teste.com',
        papel: 'professor',
        ativo: true
      })
    }

    // Responsável (Auth)
    const { data: paiAuth } = await admin.auth.admin.createUser({
      email: 'pai@teste.com',
      password: '12345678',
      email_confirm: true,
      user_metadata: { nome: 'Pai de Teste' }
    })
    if (paiAuth?.user) {
      await admin.from('perfis').upsert({
        id: paiAuth.user.id,
        escola_id: escola.id,
        nome: 'Pai de Teste',
        email: 'pai@teste.com',
        papel: 'responsavel',
        ativo: true
      })
    }

    // 4. Criar Aluno vinculado ao Pai e à Escola
    await admin.from('alunos').insert({
      escola_id: escola.id,
      nome: 'Aluno de Teste',
      serie: '9º Ano A',
      turno: 'Manhã',
      status: 'ativo',
      responsavel_nome: 'Pai de Teste',
      responsavel_email: 'pai@teste.com',
      data_nascimento: '2010-01-01'
    })

    // 5. Criar um Comunicado
    await admin.from('comunicados').insert({
      escola_id: escola.id,
      titulo: 'Bem-vindos ao ARXUM Edu',
      mensagem: 'Este é um comunicado de teste gerado automaticamente pelo sistema.',
      setor: 'Direção',
      prioridade: 'normal',
      autor_nome: 'Admin de Teste',
      ativo: true
    })

    return NextResponse.json({
      ok: true,
      mensagem: 'Banco de dados populado com sucesso!',
      credenciais: {
        escola_slug: 'escola-de-teste',
        admin: 'admin@teste.com / 12345678',
        professor: 'professor@teste.com / 12345678',
        responsavel: 'pai@teste.com / 12345678'
      }
    })

  } catch (e: any) {
    console.error('Erro no seed:', e)
    return NextResponse.json({ ok: false, erro: e.message }, { status: 500 })
  }
}