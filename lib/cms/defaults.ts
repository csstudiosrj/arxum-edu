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
  
  export type Noticia = {
    id: string
    slug: string
    data: string
    titulo: string
    categoria: string
    resumo: string
    corpo: string
    imagem_url: string
  }
  
  export type BlocoNoticias = {
    ativo: boolean
    eyebrow: string
    titulo: string
    quantidade: number
    itens: Noticia[]
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
  
  // ── Páginas internas ───────────────────────────────────────────────
  
  export type ItemGaleria = {
    id: string
    url: string
    legenda: string
  }
  
  export type PaginaAEscola = {
    eyebrow: string
    titulo: string
    subtitulo: string
    texto: string
    imagem_url: string
    galeria: ItemGaleria[]
  }
  
  export type ItemEstrutura = {
    id: string
    titulo: string
    descricao: string
    imagem_url: string
  }
  
  export type PaginaEstrutura = {
    eyebrow: string
    titulo: string
    subtitulo: string
    itens: ItemEstrutura[]
  }
  
  export type PaginaContato = {
    eyebrow: string
    titulo: string
    subtitulo: string
    mensagem_sucesso: string
  }
  
  export type ConteudoPaginas = {
    a_escola: PaginaAEscola
    estrutura: PaginaEstrutura
    contato: PaginaContato
  }
  
  export const BLOCO_LABELS: Record<string, string> = {
    hero: 'Hero (topo)',
    segmentos: 'Segmentos',
    diferenciais: 'Por que escolher',
    noticias: 'Notícias',
    cta_final: 'Chamada final',
  }
  
  export const ORDEM_PADRAO = ['hero', 'segmentos', 'diferenciais', 'noticias', 'cta_final']
  
  export function gerarSlug(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60)
  }
  
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
        cta_secundario_href: '/a-escola',
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
        titulo: 'Por que escolher a {escola}',
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
        itens: [
          {
            id: 'n1',
            slug: 'como-a-tecnologia-amplia-o-jeito-de-aprender',
            data: '12 OUT 2026',
            titulo: 'Como a tecnologia amplia o jeito de aprender',
            categoria: 'Pedagógico',
            resumo: 'Ferramentas digitais estão transformando a sala de aula em um espaço de experimentação.',
            corpo: 'A tecnologia deixou de ser um acessório na educação e passou a fazer parte do cotidiano dos alunos.\n\nNeste ano, nossa escola incorporou novas ferramentas digitais que ampliam as possibilidades de pesquisa, criação e colaboração. Os alunos do Fundamental II têm acesso a laboratórios móveis, e os do Ensino Médio trabalham com projetos de programação e robótica.\n\nO resultado já pode ser sentido em sala: mais engajamento, mais perguntas e mais vontade de aprender.',
            imagem_url: '',
          },
          {
            id: 'n2',
            slug: 'novas-salas-de-criacao',
            data: '28 SET 2026',
            titulo: 'Novas salas de criação são inauguradas',
            categoria: 'Estrutura',
            resumo: 'Espaços dedicados a arte, música e experimentação foram abertos neste semestre.',
            corpo: 'A escola ganhou duas novas salas de criação: uma voltada para artes visuais e música, e outra para experimentação científica.\n\nOs ambientes foram desenhados para estimular a curiosidade e a autonomia dos alunos, com materiais acessíveis e estações de trabalho flexíveis.',
            imagem_url: '',
          },
          {
            id: 'n3',
            slug: 'semana-da-comunidade',
            data: '15 SET 2026',
            titulo: 'Famílias participam da Semana da Comunidade',
            categoria: 'Comunidade',
            resumo: 'Evento reuniu pais, alunos e educadores em atividades integradas.',
            corpo: 'Durante a Semana da Comunidade, famílias e educadores participaram juntos de oficinas, rodas de conversa e apresentações.\n\nFoi um momento de aproximação e troca que reforçou o vínculo entre a escola e as famílias.',
            imagem_url: '',
          },
        ],
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
  
  export const CONTEUDO_PAGINAS_PADRAO: ConteudoPaginas = {
    a_escola: {
      eyebrow: 'Nossa história',
      titulo: 'Uma escola feita de pessoas',
      subtitulo: 'Educação que olha para cada aluno como único.',
      texto: 'Nascemos com a missão de oferecer uma educação que une excelência acadêmica e cuidado humano.\n\nAqui, cada criança é vista em sua individualidade. Nossos educadores acompanham o desenvolvimento de perto, respeitando o ritmo de cada um e estimulando a curiosidade.\n\nAcreditamos que aprender é construir junto. Famílias, alunos e professores formam uma comunidade que se apoia e cresce em conjunto.',
      imagem_url: '',
      galeria: [],
    },
    estrutura: {
      eyebrow: 'Nossos espaços',
      titulo: 'Estrutura pensada para aprender',
      subtitulo: 'Ambientes que convidam à descoberta, ao movimento e à criação.',
      itens: [
        { id: 'biblioteca', titulo: 'Biblioteca', descricao: 'Acervo atualizado, espaços de leitura e estações de estudo.', imagem_url: '' },
        { id: 'laboratorio', titulo: 'Laboratório de Ciências', descricao: 'Experimentos de química, física e biologia com equipamento completo.', imagem_url: '' },
        { id: 'quadra', titulo: 'Quadra poliesportiva', descricao: 'Espaço coberto para esportes, educação física e eventos.', imagem_url: '' },
        { id: 'arte', titulo: 'Ateliê de Artes', descricao: 'Sala dedicada a pintura, escultura e projetos criativos.', imagem_url: '' },
        { id: 'musica', titulo: 'Sala de Música', descricao: 'Instrumentos, isolamento acústico e prática em grupo.', imagem_url: '' },
        { id: 'refeitorio', titulo: 'Refeitório', descricao: 'Alimentação balanceada em ambiente acolhedor.', imagem_url: '' },
      ],
    },
    contato: {
      eyebrow: 'Fale conosco',
      titulo: 'Estamos à disposição',
      subtitulo: 'Preencha o formulário e retornaremos em até 1 dia útil.',
      mensagem_sucesso: 'Mensagem enviada! Em breve entraremos em contato.',
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
      if (c.blocos.noticias) {
        base.blocos.noticias = { ...base.blocos.noticias, ...c.blocos.noticias }
        if (!Array.isArray(base.blocos.noticias.itens) || base.blocos.noticias.itens.length === 0) {
          base.blocos.noticias.itens = CONTEUDO_HOME_PADRAO.blocos.noticias.itens
        }
      }
      if (c.blocos.cta_final) base.blocos.cta_final = { ...base.blocos.cta_final, ...c.blocos.cta_final }
    }
  
    return base
  }
  
  export function normalizarPaginas(conteudo: unknown): ConteudoPaginas {
    const base = JSON.parse(JSON.stringify(CONTEUDO_PAGINAS_PADRAO)) as ConteudoPaginas
    if (!conteudo || typeof conteudo !== 'object') return base
  
    const c = conteudo as Partial<ConteudoPaginas>
    if (c.a_escola) base.a_escola = { ...base.a_escola, ...c.a_escola }
    if (c.estrutura) {
      base.estrutura = { ...base.estrutura, ...c.estrutura }
      if (!Array.isArray(base.estrutura.itens)) {
        base.estrutura.itens = CONTEUDO_PAGINAS_PADRAO.estrutura.itens
      }
    }
    if (c.contato) base.contato = { ...base.contato, ...c.contato }
  
    return base
  }