import Link from 'next/link'
import { PublicHeader, PublicFooter } from '@/components/arxum-brand'
import { POLITICA_VERSAO } from '@/lib/consentimentos'

export const metadata = {
  title: 'Política de Privacidade — ARXUM Edu',
  description: 'Política de Privacidade e tratamento de dados pessoais do ARXUM Edu.',
}

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
        <Link href="/" className="text-sm text-[#8aa0ad] hover:text-white">
          ← Voltar
        </Link>

        <p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-[#0d9488]">
          Documento legal · versão {POLITICA_VERSAO}
        </p>
        <h1 className="mt-3 font-syne text-4xl font-bold tracking-[-.04em] text-white">
          Política de Privacidade
        </h1>

        <div className="mt-8 space-y-6 rounded-xl border border-[#fef3c7] bg-[#fef3c7]/10 p-6">
          <p className="text-sm leading-6 text-[#fef3c7]">
            <strong>Aviso:</strong> este documento está em revisão jurídica e será publicado em sua
            versão final antes do início da operação comercial. Enquanto isso, o ARXUM Edu trata
            dados pessoais em conformidade com a Lei 13.709/2018 (LGPD), adotando medidas técnicas e
            administrativas de segurança da informação.
          </p>
        </div>

        <div className="mt-10 space-y-8 text-sm leading-7 text-[#c7d5db]">
          <section>
            <h2 className="mb-3 font-syne text-xl font-bold text-white">1. Quem somos</h2>
            <p>
              O ARXUM Edu é uma plataforma SaaS de gestão escolar. Cada escola cliente é a
              controladora dos dados pessoais de seus alunos, responsáveis e equipe. O ARXUM Edu atua
              como operador, tratando dados exclusivamente conforme as instruções da escola.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-syne text-xl font-bold text-white">2. Quais dados tratamos</h2>
            <p>
              Tratamos dados cadastrais (nome, e-mail, telefone, CPF), dados de identificação do
              aluno, dados acadêmicos (notas, frequência, ocorrências), dados financeiros
              (faturas, pagamentos) e dados sensíveis de saúde (anamnese), sempre que aplicável e
              com base legal adequada.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-syne text-xl font-bold text-white">3. Bases legais</h2>
            <p>
              Tratamos dados com base em: execução de contrato (matrícula), cumprimento de obrigação
              legal (registros acadêmicos), consentimento (uso de imagem) e legítimo interesse
              (segurança, prevenção de fraude e melhoria do serviço).
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-syne text-xl font-bold text-white">4. Seus direitos</h2>
            <p>
              Você pode solicitar acesso, correção, portabilidade, anonimização, bloqueio ou
              eliminação dos seus dados a qualquer momento pelo portal do responsável ou pelo e-mail
              abaixo. Responderemos em até 15 dias.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-syne text-xl font-bold text-white">5. Contato</h2>
            <p>
              Encarregado de Dados (DPO):{' '}
              <a href="mailto:privacidade@arxum.com.br" className="font-semibold text-[#0d9488] hover:underline">
                privacidade@arxum.com.br
              </a>
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}