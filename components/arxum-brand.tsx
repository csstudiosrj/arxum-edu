'use client'

import Link from 'next/link'

export function ArxumBrand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-1.5" aria-label="ARXUM Edu, início">
      <span className="font-syne text-lg font-black tracking-[-.03em] text-[#0d9488]">
        ARXUM
      </span>
      <span
        className={`font-syne text-lg font-black tracking-[-.03em] ${
          light ? 'text-[#07090c]' : 'text-white'
        }`}
      >
        Edu
      </span>
    </Link>
  )
}

export function PublicHeader({ slug }: { slug?: string }) {
  const base = slug ? `/edu/${slug}` : ''

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

  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
      <Link href={base || '/'} className="flex items-center gap-1.5" aria-label="Início">
        <span className="font-syne text-lg font-black tracking-[-.03em] text-[#0d9488]">
          ARXUM
        </span>
        <span className="font-syne text-lg font-black tracking-[-.03em] text-white">
          Edu
        </span>
      </Link>
      <nav className="hidden items-center gap-7 text-sm text-[#8aa0ad] lg:flex">
        {links.map((item) => (
          <Link key={item.label} href={item.href} className="transition hover:text-white">
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <Link
          href={`${base}/login`}
          className="hidden rounded-lg px-4 py-2 text-sm font-medium text-[#b9cbd4] transition hover:bg-white/5 hover:text-white sm:block"
        >
          Área Restrita
        </Link>
        <Link
          href={`${base}/matricula`}
          className="rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f766e]"
        >
          Matrícula Online
        </Link>
      </div>
    </header>
  )
}

export function PublicFooter({ slug }: { slug?: string }) {
  const base = slug ? `/edu/${slug}` : ''

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
          { label: 'Área Restrita', href: `${base}/login` },
          { label: 'Matrícula Online', href: `${base}/matricula` },
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
          <ArxumBrand />
          <p className="mt-4 max-w-xs text-sm leading-6 text-[#8aa0ad]">
            Educação que prepara para o futuro, com propósito, tecnologia e cuidado.
          </p>
        </div>
        {colunas.map((col) => (
          <div key={col.titulo}>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[.16em] text-[#c7d5db]">
              {col.titulo}
            </h3>
            <div className="flex flex-col gap-3 text-sm text-[#718895]">
              {col.links.map((link) => (
                <Link key={link.label} href={link.href} className="hover:text-[#0d9488]">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/[.08] pt-6 text-xs text-[#617783]">
        © 2026 ARXUM Edu. Todos os direitos reservados.
      </div>
    </footer>
  )
}