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

export function PublicHeader() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
      <ArxumBrand />
      <nav className="hidden items-center gap-7 text-sm text-[#8aa0ad] lg:flex">
        {['A Escola', 'Segmentos', 'Estrutura', 'Notícias', 'Contato'].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase().replace('í', 'i').replace(' ', '-')}`}
            className="transition hover:text-white"
          >
            {item}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="hidden rounded-lg px-4 py-2 text-sm font-medium text-[#b9cbd4] transition hover:bg-white/5 hover:text-white sm:block"
        >
          Área Restrita
        </Link>
        <Link
          href="/matricula"
          className="rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f766e]"
        >
          Matrícula Online
        </Link>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="border-t border-white/[.08] px-6 py-12 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <ArxumBrand />
          <p className="mt-4 max-w-xs text-sm leading-6 text-[#8aa0ad]">
            Educação que prepara para o futuro, com propósito, tecnologia e cuidado.
          </p>
        </div>
        {[
          ['Institucional', 'A Escola', 'Estrutura', 'Notícias'],
          ['Segmentos', 'Educação Infantil', 'Fundamental I', 'Ensino Médio'],
          ['Contato', 'Fale conosco', 'Área Restrita', 'Instagram'],
        ].map(([title, ...links]) => (
          <div key={title}>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[.16em] text-[#c7d5db]">
              {title}
            </h3>
            <div className="flex flex-col gap-3 text-sm text-[#718895]">
              {links.map((link) => (
                <a href="#" key={link} className="hover:text-[#0d9488]">
                  {link}
                </a>
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