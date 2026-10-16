import { getConteudoHomeAdmin } from '@/lib/cms/actions'
import { getDadosEscola } from '../configuracoes/actions'
import { SiteClient } from './site-client'

export const dynamic = 'force-dynamic'

export default async function SitePage() {
  const [conteudo, escola] = await Promise.all([
    getConteudoHomeAdmin(),
    getDadosEscola(),
  ])

  return <SiteClient
    conteudoInicial={conteudo}
    fontePar={escola?.fonte_par || 'institucional'}
    slug={escola?.slug || ''}
    escolaNome={escola?.nome || 'Escola'}
  />
}