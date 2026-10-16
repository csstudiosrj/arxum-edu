import { notFound } from 'next/navigation'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { getConteudoPaginasPublico } from '@/lib/cms/actions'
import { ContatoClient } from './contato-client'

export const dynamic = 'force-dynamic'

export default async function ContatoPage() {
  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()

  const paginas = await getConteudoPaginasPublico()

  return (
    <ContatoClient
      escolaNome={escola.nome}
      slug={escola.slug}
      fontePar={escola.fonte_par}
      pagina={paginas.contato}
      escola={{
        endereco: escola.endereco,
        cidade: escola.cidade,
        estado: escola.estado,
        telefone: escola.telefone,
        email_contato: escola.email_contato,
      }}
    />
  )
}