import { getConteudoHomeAdmin, getConteudoPaginasAdmin } from '@/lib/cms/actions'
import { getDadosEscola } from '../configuracoes/actions'
import { getAddonsDaEscola } from '../addons/actions'
import { SiteClient } from './site-client'

export const dynamic = 'force-dynamic'

export default async function SitePage() {
  const [conteudo, paginas, escola, addonsData] = await Promise.all([
    getConteudoHomeAdmin(),
    getConteudoPaginasAdmin(),
    getDadosEscola(),
    getAddonsDaEscola(),
  ])

  // 1. Definir páginas base do plano (Home, A Escola, Contato = 3. + Estrutura = 4)
  // Vamos simplificar: Limitamos APENAS as Páginas Extras criadas pelo usuário.
  const plano = escola?.plano || 'basico'
  let limiteExtras = 0
  
  if (plano === 'pro') limiteExtras = 1
  if (plano === 'premium' || plano === 'enterprise') limiteExtras = 3

  // 2. Verificar se tem o add-on de páginas extras
  const temAddonPaginas = addonsData.addons.find(a => a.slug === 'paginas_extras')?.ativo
  if (temAddonPaginas) limiteExtras += 5

  return <SiteClient
    conteudoInicial={conteudo}
    paginasInicial={paginas}
    fontePar={escola?.fonte_par || 'institucional'}
    slug={escola?.slug || ''}
    escolaNome={escola?.nome || 'Escola'}
    plano={plano}
    limiteExtras={limiteExtras}
    temAddonPaginas={!!temAddonPaginas}
  />
}