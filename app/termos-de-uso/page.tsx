import Link from 'next/link'
import { PublicHeader, PublicFooter } from '@/components/arxum-brand'
import { TERMOS_VERSAO } from '@/lib/consentimentos'

export const metadata = {
  title: 'Termos de Uso — ARXUM Edu',
  description: 'Termos de uso da plataforma ARXUM Edu.',
}

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
        <Link href="/" className="text-sm text-[#8aa0ad] hover:text-white">
          ← Voltar
        </Link>

        <p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-[#0d9488]">
          Documento legal · versão {TERMOS_VERSAO}
        </p>
        <h1 className="mt-3 font-syne text-4xl font-bold tracking-[-.04em] text-white">
          Termos de Uso
        </h1>

        <div className="mt-8 space-y-6 rounded-xl border border-[#fef3c7] bg-[#fef3c7]/10 p-6">
          <p className="text-sm leading-6 text-[#fef3c7]">
            <strong>Aviso:</strong> este documento está em revisão jurídica e será publicado em sua
            versão final antes do início da operação comercial.
          </p>
        </div>

        <div className="mt-10 space-y-8 text-sm leading-7 text-[#c7d5db]">
          <section>
            <h2 className="mb-3 font-syne text-xl font-bold text-white">1. Objeto</h2>
            <p>
              Estes Termos regem o uso da plataforma ARXUM Edu por escolas contratantes e seus
              usuários autorizados (administradores, equipe interna, responsáveis e alunos).
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-syne text-xl font-bold text-white">2. Conta e acesso</h2>
            <p>
              Cada usuário é responsável pela guarda de suas credenciais. O ARXUM Edu pode suspender
              contas em caso de uso indevido, fraude ou inadimplência.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-syne text-xl font-bold text-white">3. Responsabilidades da escola</h2>
            <p>
              A escola é responsável pela veracidade dos dados que insere, pelo cumprimento das
              políticas internas de consentimento e por manter equipe treinada no uso da plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-syne text-xl font-bold text-white">4. Propriedade intelectual</h2>
            <p>
              O código-fonte, layout, marca e demais elementos da plataforma pertencem ao ARXUM Edu.
              Os dados inseridos pela escola pertencem à escola.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-syne text-xl font-bold text-white">5. Contato</h2>
            <p>
              Dúvidas sobre estes termos:{' '}
              <a href="mailto:contato@arxum.com.br" className="font-semibold text-[#0d9488] hover:underline">
                contato@arxum.com.br
              </a>
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}