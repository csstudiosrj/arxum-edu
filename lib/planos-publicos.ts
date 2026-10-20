import { createAdminClient } from '@/lib/supabase/admin'

export type PlanoPublico = {
  id: string
  slug: string
  nome: string
  descricao: string | null
  preco_centavos: number
  max_alunos: number | null
  max_unidades: number | null
  recursos: string[]
  destaque: boolean
  ordem: number
}

const PLANOS_PADRAO: PlanoPublico[] = [
  {
    id: 'default-semente',
    slug: 'semente',
    nome: 'Semente',
    descricao: 'Para escolas que estão começando a digitalizar a gestão.',
    preco_centavos: 19900,
    max_alunos: 100,
    max_unidades: 1,
    recursos: [
      'Até 100 alunos',
      'Site institucional incluso',
      'Gestão de matrículas',
      'Portal do responsável',
      'Suporte por e-mail',
    ],
    destaque: false,
    ordem: 1,
  },
  {
    id: 'default-raiz',
    slug: 'raiz',
    nome: 'Raiz',
    descricao: 'O equilíbrio perfeito para escolas em crescimento.',
    preco_centavos: 39900,
    max_alunos: 300,
    max_unidades: 1,
    recursos: [
      'Até 300 alunos',
      'Todos os recursos do Semente',
      'Módulo Financeiro completo',
      'Loja Virtual (uniformes)',
      'Portal do professor',
    ],
    destaque: true,
    ordem: 2,
  },
  {
    id: 'default-copa',
    slug: 'copa',
    nome: 'Copa',
    descricao: 'Para escolas consolidadas que exigem controle total.',
    preco_centavos: 69900,
    max_alunos: 800,
    max_unidades: 1,
    recursos: [
      'Até 800 alunos',
      'Todos os recursos do Raiz',
      'Sala de aula virtual',
      'Relatórios avançados (BI)',
      'API de integração',
    ],
    destaque: false,
    ordem: 3,
  },
  {
    id: 'default-rede',
    slug: 'rede',
    nome: 'Rede',
    descricao: 'Solução para redes de ensino com múltiplas unidades.',
    preco_centavos: 0,
    max_alunos: null,
    max_unidades: null,
    recursos: [
      'Alunos ilimitados',
      'Multiunidade',
      'Dashboard executivo consolidado',
      'Gerente de conta dedicado',
      'Onboarding personalizado',
    ],
    destaque: false,
    ordem: 4,
  },
]

export async function getPlanosPublicos(): Promise<PlanoPublico[]> {
  try {
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('planos')
      .select('id, slug, nome, descricao, preco_centavos, max_alunos, max_unidades, recursos, destaque, ativo, ordem')
      .order('ordem', { ascending: true })

    if (error) return PLANOS_PADRAO
    if (!data || data.length === 0) return PLANOS_PADRAO

    return data
      .filter((p) => p.ativo)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        nome: p.nome,
        descricao: p.descricao,
        preco_centavos: p.preco_centavos,
        max_alunos: p.max_alunos,
        max_unidades: p.max_unidades,
        recursos: Array.isArray(p.recursos) ? p.recursos : [],
        destaque: p.destaque,
        ordem: p.ordem,
      }))
  } catch {
    return PLANOS_PADRAO
  }
}