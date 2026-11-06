import Link from 'next/link'

export function ArxumBrand({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`font-syne text-lg font-black tracking-[-.03em] ${light ? 'text-[#12232b]' : 'text-white'}`}>ARXUM</span>
      <span className="font-syne text-lg font-black tracking-[-.03em] text-[#0d9488]">Edu</span>
    </div>
  )
}

export function ByArxum({ light = false }: { light?: boolean }) {
  return (
    <p className={`text-[10px] font-medium tracking-wide ${light ? 'text-[#82939a]' : 'text-[#6b7d86]'}`}>
      Feito por <span className="font-bold">ARXUM</span>
    </p>
  )
}

export function PublicHeader({
  slug,
  cor = '#0d9488',
  logoUrl,
  escolaNome,
}: {
  slug?: string
  cor?: string
  logoUrl?: string | null
  escolaNome?: string
}) {
  const base = slug ? '/escola' : ''

  const links = slug
    ? [
        { label: 'A Escola', href: `${base}/a-escola` },
        { label: 'Segmentos', href: `${base}#segmentos` },
        { label: 'Estrutura', href: `${base}/estrutura` },
        { label: 'Notícias', href: `${base}/noticias` },
        { label: 'Contato', href: `${base}/contato` },
      ]
    : [
        { label: 'Produto', href: '#funcionalidades' },
        { label: 'Planos', href: '#planos' },
        { label: 'Casos', href: '#funcionalidades' },
        { label: 'Contato', href: '#contato' },
      ]

  const marca = slug ? (
    <Link href={base} className="flex items-center gap-2.5">
      {logoUrl ? (
        <img src={logoUrl} alt={escolaNome || 'Logo da escola'} className="h-8 w-auto object-contain" />
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="font-syne text-lg font-black tracking-[-.03em]" style={{ color: cor }}>
            {escolaNome?.split(' ')[0] || 'ARXUM'}
          </span>
          {escolaNome && escolaNome.split(' ').length > 1 && (
            <span className="font-syne text-lg font-black tracking-[-.03em] text-white">
              {escolaNome.split(' ').slice(1).join(' ')}
            </span>
          )}
        </div>
      )}
    </Link>
  ) : (
    <ArxumBrand />
  )

  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
      {marca}
      <nav className="hidden items-center gap-6 md:flex">
        {links.map((link) => (
          <Link key={link.label} href={link.href} className="text-sm font-medium text-[#8aa0ad] transition hover:text-white">
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-sm font-medium text-[#8aa0ad] transition hover:text-white">
          Entrar
        </Link>
        <Link
          href="/matricula"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90"
          style={{ backgroundColor: cor }}
        >
          Matrícula
        </Link>
      </div>
    </header>
  )
}

export function PublicFooter({
  slug,
  cor = '#0d9488',
  escolaNome,
}: {
  slug?: string
  cor?: string
  escolaNome?: string
}) {
  const base = slug ? '/escola' : ''

  const colunas = slug
    ? [
        { titulo: 'Institucional', links: [
          { label: 'A Escola', href: `${base}/a-escola` },
          { label: 'Estrutura', href: `${base}/estrutura` },
          { label: 'Notícias', href: `${base}/noticias` },
        ]},
        { titulo: 'Segmentos', links: [
          { label: 'Educação Infantil', href: `${base}#segmentos` },
          { label: 'Fundamental I', href: `${base}#segmentos` },
          { label: 'Ensino Médio', href: `${base}#segmentos` },
        ]},
        { titulo: 'Contato', links: [
          { label: 'Fale conosco', href: `${base}/contato` },
          { label: 'Área Restrita', href: '/login' },
          { label: 'Matrícula Online', href: '/matricula' },
        ]},
      ]
    : [
        { titulo: 'Produto', links: [
          { label: 'Funcionalidades', href: '#funcionalidades' },
          { label: 'Planos', href: '#planos' },
          { label: 'Casos', href: '#funcionalidades' },
        ]},
        { titulo: 'Empresa', links: [
          { label: 'Sobre', href: '#' },
          { label: 'Blog', href: '#' },
          { label: 'Contato', href: '#contato' },
        ]},
        { titulo: 'Conta', links: [
          { label: 'Entrar', href: '/login' },
          { label: 'Começar agora', href: '/cadastro' },
          { label: 'Suporte', href: '#' },
        ]},
      ]

  return (
    <footer className="border-t border-white/[.08] px-6 py-12 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          {slug ? (
            <div className="flex flex-col gap-4">
              <span className="font-syne text-2xl font-black tracking-[-.03em]" style={{ color: cor }}>
                {escolaNome}
              </span>
              <p className="text-xs leading-5 text-[#8aa0ad]">
                Educação que prepara para o futuro.<br />
                Um espaço para crescer, descobrir e transformar.
              </p>
            </div>
          ) : (
            <ArxumBrand />
          )}
          <p className="mt-6 text-[10px] text-[#5e7a94]">
            © {new Date().getFullYear()} {escolaNome || 'ARXUM Edu'}. Todos os direitos reservados.
          </p>
        </div>

        {colunas.map((col) => (
          <div key={col.titulo}>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">{col.titulo}</h4>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-[#8aa0ad] transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  )
}