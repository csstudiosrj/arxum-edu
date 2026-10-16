export type FontePar = {
    key: string
    nome: string
    descricao: string
    headingVar: string
    bodyVar: string
    amostraHeading: string
    amostraBody: string
  }
  
  export const FONTES_PARES: FontePar[] = [
    {
      key: 'institucional',
      nome: 'Institucional',
      descricao: 'Syne + DM Sans — moderna, geométrica, confiante',
      headingVar: '--font-syne',
      bodyVar: '--font-dm-sans',
      amostraHeading: 'Educação que prepara',
      amostraBody: 'Uma escola para formar pessoas curiosas.',
    },
    {
      key: 'classico',
      nome: 'Clássico',
      descricao: 'Playfair Display + Inter — tradição, elegância, sofisticação',
      headingVar: '--font-playfair',
      bodyVar: '--font-inter',
      amostraHeading: 'Educação que prepara',
      amostraBody: 'Uma escola para formar pessoas curiosas.',
    },
    {
      key: 'moderno',
      nome: 'Moderno',
      descricao: 'Space Grotesk + Inter — tecnológico, limpo, urbano',
      headingVar: '--font-space-grotesk',
      bodyVar: '--font-inter',
      amostraHeading: 'Educação que prepara',
      amostraBody: 'Uma escola para formar pessoas curiosas.',
    },
    {
      key: 'minimalista',
      nome: 'Minimalista',
      descricao: 'Inter em tudo — direto, sem ruído, foco no conteúdo',
      headingVar: '--font-inter',
      bodyVar: '--font-inter',
      amostraHeading: 'Educação que prepara',
      amostraBody: 'Uma escola para formar pessoas curiosas.',
    },
    {
      key: 'acolhedor',
      nome: 'Acolhedor',
      descricao: 'Fraunces + Nunito Sans — caloroso, humano, próximo',
      headingVar: '--font-fraunces',
      bodyVar: '--font-nunito-sans',
      amostraHeading: 'Educação que prepara',
      amostraBody: 'Uma escola para formar pessoas curiosas.',
    },
    {
      key: 'sobrio',
      nome: 'Sóbrio',
      descricao: 'Libre Baskerville + Source Sans 3 — formal, sério, tradicional',
      headingVar: '--font-libre-baskerville',
      bodyVar: '--font-source-sans',
      amostraHeading: 'Educação que prepara',
      amostraBody: 'Uma escola para formar pessoas curiosas.',
    },
    {
      key: 'contemporaneo',
      nome: 'Contemporâneo',
      descricao: 'Bricolage Grotesque + Inter — criativo, editorial, único',
      headingVar: '--font-bricolage',
      bodyVar: '--font-inter',
      amostraHeading: 'Educação que prepara',
      amostraBody: 'Uma escola para formar pessoas curiosas.',
    },
    {
      key: 'ludico',
      nome: 'Lúdico',
      descricao: 'Baloo 2 + Nunito Sans — infantil, amigável, divertido',
      headingVar: '--font-baloo',
      bodyVar: '--font-nunito-sans',
      amostraHeading: 'Educação que prepara',
      amostraBody: 'Uma escola para formar pessoas curiosas.',
    },
    {
      key: 'elegante',
      nome: 'Elegante',
      descricao: 'Cormorant Garamond + Montserrat — refinado, clássico, atemporal',
      headingVar: '--font-cormorant',
      bodyVar: '--font-montserrat',
      amostraHeading: 'Educação que prepara',
      amostraBody: 'Uma escola para formar pessoas curiosas.',
    },
    {
      key: 'neutro',
      nome: 'Neutro',
      descricao: 'Manrope em tudo — equilibrado, versátil, discreto',
      headingVar: '--font-manrope',
      bodyVar: '--font-manrope',
      amostraHeading: 'Educação que prepara',
      amostraBody: 'Uma escola para formar pessoas curiosas.',
    },
  ]
  
  export function getFontePar(key: string | null | undefined): FontePar {
    return FONTES_PARES.find((f) => f.key === key) || FONTES_PARES[0]
  }