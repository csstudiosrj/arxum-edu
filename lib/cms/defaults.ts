export type BannerHero = {
    id: string
    url: string
    titulo: string
    subtitulo: string
  }
  
  export type BlocoHero = {
    ativo: boolean
    titulo: string
    titulo_destaque: string
    subtitulo: string
    cta_primario_label: string
    cta_primario_href: string
    cta_secundario_label: string
    cta_secundario_href: string
    banners: BannerHero[]
    intervalo_segundos: number
  }
  
  export type ItemSegmento = {
    id: string
    titulo: string
    descricao: string
  }
  
  export type BlocoSegmentos = {
    ativo: boolean
    eyebrow: string
    titulo: string
    descricao: string
    itens: ItemSegmento[]
  }
  
  export type ItemDiferencial = {
    id: string
    titulo: string
    descricao: string
  }
  
  export type BlocoDiferenciais = {
    ativo: boolean
    eyebrow: string
    titulo: string
    itens: ItemDiferencial[]
  }
  
  export type BlocoNoticias = {
    ativo: boolean
    eyebrow: string
    titulo: string
    quantidade: number
  }
  
  export type BlocoCtaFinal = {
    ativo: boolean
    eyebrow: string
    titulo: string
    cta_label: string
    cta_href: string
  }
  
  export type ConteudoHome = {
    ordem: string[]
    blocos: {
      hero: BlocoHero
      segmentos: BlocoSegmentos
      diferenciais: BlocoDiferenciais
      noticias: BlocoNoticias
      cta_final: BlocoCtaFinal
    }
  }
  
  export const BLOCO_LABELS: Record<string, string> = {
    hero: 'Hero (topo)',
    segmentos: 'Segmentos',
    diferenciais: 'Por que escolher',
    noticias: 'Notícias',
    cta_final: 'Chamada final',
  }
  
  export const ORDEM_PADRAO = ['hero', 'segmentos', 'diferenciais', 'noticias', 'cta_final']
  
  export const CONTEUDO_HOME_PADRAO: ConteudoHome = {
    ordem: [...ORDEM_PADRAO],
    blocos: {
      hero: {
        ativo: true,
        titulo: 'Educação que prepara',
        titulo_destaque: 'para o futuro.',
        subtitulo: 'Uma escola para formar pessoas curiosas, confiantes e prontas para transformar o mundo.',
        cta_primario_label: 'Matrícula Online',
        cta_primario_href: '/matricula',
        cta_secundario_label: 'Conheça a escola',
        cta_secundario_href: '#a-escola',
        banners: [],
        intervalo_segundos: 5,
      },
      segmentos: {
        ativo: true,
        eyebrow: 'Uma jornada completa',
        titulo: 'Nossos segmentos',
        descricao: 'Cada etapa tem seu ritmo, suas descobertas e um jeito único de florescer.',
        itens: [
          { id: 'infantil', titulo: 'Educação Infantil', descricao: 'Descobertas que constroem os primeiros passos.' },
          { id: 'fund1', titulo: 'Fundamental I', descricao: 'Aprendizagem com curiosidade e autonomia.' },
          { id: 'fund2', titulo: 'Fundamental II', descricao: 'Conhecimento para ampliar horizontes.' },
          { id: 'medio', titulo: 'Ensino Médio', descricao: 'Preparação para escolhas e novos caminhos.' },
        ],
      },
      diferenciais: {
        ativo: true,
        eyebrow: 'Nossa diferença',
        titulo: 'Por que escolher nossa escola',
        itens: [
          { id: 'cuidado', titulo: 'Cuidado que educa', descricao: 'Ambientes seguros, acolhedores e atentos a cada fase.' },
          { id: 'excelencia', titulo: 'Excelência acadêmica', descricao: 'Uma jornada de aprendizagem conectada ao mundo real.' },
          { id: 'comunidade', titulo: 'Comunidade viva', descricao: 'Famílias, educadores e alunos crescendo juntos.' },
        ],
      },
      noticias: {
        ativo: true,
        eyebrow: 'Fique por dentro',
        titulo: 'Últimas notícias',
        quantidade: 3,
      },
      cta_final: {
        ativo: true,
        eyebrow: 'O próximo capítulo começa agora',
        titulo: 'Pronto para matricular seu filho?',
        cta_label: 'Iniciar matrícula',
        cta_href: '/matricula',
      },
    },
  }
  
  export function normalizarConteudo(conteudo: unknown): ConteudoHome {
    const base = JSON.parse(JSON.stringify(CONTEUDO_HOME_PADRAO)) as ConteudoHome
    if (!conteudo || typeof conteudo !== 'object') return base
  
    const c = conteudo as Partial<ConteudoHome>
    if (Array.isArray(c.ordem) && c.ordem.length > 0) {
      const ordemValida = c.ordem.filter((k) => ORDEM_PADRAO.includes(k))
      const faltantes = ORDEM_PADRAO.filter((k) => !ordemValida.includes(k))
      base.ordem = [...ordemValida, ...faltantes]
    }
  
    if (c.blocos && typeof c.blocos === 'object') {
      if (c.blocos.hero) base.blocos.hero = { ...base.blocos.hero, ...c.blocos.hero }
      if (c.blocos.segmentos) base.blocos.segmentos = { ...base.blocos.segmentos, ...c.blocos.segmentos }
      if (c.blocos.diferenciais) base.blocos.diferenciais = { ...base.blocos.diferenciais, ...c.blocos.diferenciais }
      if (c.blocos.noticias) base.blocos.noticias = { ...base.blocos.noticias, ...c.blocos.noticias }
      if (c.blocos.cta_final) base.blocos.cta_final = { ...base.blocos.cta_final, ...c.blocos.cta_final }
    }
  
    return base
  }