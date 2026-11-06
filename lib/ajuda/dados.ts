export type Artigo = {
    id: string
    titulo: string
    resumo: string
    conteudo: string // HTML
  }
  
  export type Categoria = {
    id: string
    titulo: string
    icone: string
    artigos: Artigo[]
  }
  
  export const BASE_CONHECIMENTO: Categoria[] = [
    {
      id: 'primeiros-passos',
      titulo: 'Primeiros Passos',
      icone: 'Rocket',
      artigos: [
        {
          id: 'configurar-escola',
          titulo: 'Como configurar os dados da sua escola',
          resumo: 'Aprenda a preencher CNPJ, endereço e logo que aparecerão nos documentos.',
          conteudo: `
            <p>Para que os boletos, contratos e o site da escola saiam com a sua identidade, siga estes passos:</p>
            <ol>
              <li>Acesse o menu lateral <strong>Configurações</strong>.</li>
              <li>Na aba <strong>Dados da escola</strong>, preencha o nome fantasia, CNPJ, endereço completo e telefone.</li>
              <li>Faça o upload da sua logo (de preferência em PNG com fundo transparente) e defina a cor primária da sua marca.</li>
              <li>Clique em <strong>Salvar alterações</strong> no topo da página.</li>
            </ol>
            <p><em>Dica: essas informações serão puxadas automaticamente em todos os relatórios em PDF emitidos pela Secretaria.</em></p>
          `
        },
        {
          id: 'importar-alunos',
          titulo: 'Como importar alunos do meu sistema antigo',
          resumo: 'Poupe dias de digitação trazendo sua base de alunos via planilha.',
          conteudo: `
            <p>Migrar de sistema pode parecer assustador, mas nós facilitamos:</p>
            <ol>
              <li>Acesse <strong>Importação</strong> no menu lateral.</li>
              <li>Baixe o nosso modelo de planilha padrão (CSV).</li>
              <li>Copie os dados do seu sistema antigo (ou da sua planilha) e cole nas colunas correspondentes do nosso modelo.</li>
              <li>Faça o upload do arquivo preenchido.</li>
              <li>O sistema vai ler as colunas e pedir para você confirmar quem é o quê (ex: "A coluna B é a série do aluno?").</li>
              <li>Clique em <strong>Iniciar Importação</strong>.</li>
            </ol>
            <p>Pronto! Todos os alunos, responsáveis e turnos estarão no ARXUM.</p>
          `
        }
      ]
    },
    {
      id: 'matriculas',
      titulo: 'Matrículas e Formulários',
      icone: 'FileText',
      artigos: [
        {
          id: 'criar-formulario',
          titulo: 'Como criar um formulário de matrícula',
          resumo: 'Crie formulários personalizados com lógica condicional.',
          conteudo: `
            <p>Você não está preso aos formulários padrão. Crie o seu:</p>
            <ol>
              <li>Vá em <strong>Formulários</strong> > <strong>Novo Formulário</strong>.</li>
              <li>Dê um título (ex: "Matrícula 2026").</li>
              <li>Clique em <strong>Adicionar Campo</strong> e escolha os tipos (Texto, Múltipla Escolha, Upload de Documento).</li>
              <li>Use a aba de <strong>Lógica Condicional</strong> no campo para fazer perguntas inteligentes. Ex: Se o pai responder "Sim" para "Alergias?", o campo "Quais alergias?" aparece.</li>
              <li>Na aba <strong>Configurações</strong>, defina a mensagem de sucesso e publique o formulário.</li>
            </ol>
            <p>Você receberá as respostas na sua tela de formulários e poderá transformar uma resposta em matrícula real com 1 clique.</p>
          `
        },
        {
          id: 'aprovar-matricula',
          titulo: 'Como aprovar uma inscrição',
          resumo: 'Entenda o fluxo de triagem da secretaria.',
          conteudo: `
            <p>O ARXUM Edu não matricula ninguém automaticamente. A palavra final é sempre da escola:</p>
            <ol>
              <li>Acesse <strong>Matrículas</strong>.</li>
              <li>Clique sobre o aluno que enviou a inscrição.</li>
              <li>Analise os documentos e a ficha de anamnese enviados.</li>
              <li>Se precisar, agende uma entrevista alterando o status para "Entrevista".</li>
              <li>Após aprovado, mude o status para <strong>Matriculado</strong>. Isso vai gerar o cadastro do aluno definitivo no sistema e liberar o acesso para os pais.</li>
            </ol>
          `
        }
      ]
    },
    {
      id: 'financeiro',
      titulo: 'Gestão Financeira',
      icone: 'WalletCards',
      artigos: [
        {
          id: 'gerar-pix',
          titulo: 'Como gerar um PIX ou Boleto',
          resumo: 'Configure as cobranças automáticas.',
          conteudo: `
            <p>Ao aprovar uma matrícula ou gerar uma fatura, o sistema pode emitir a cobrança:</p>
            <ol>
              <li>Vá em <strong>Financeiro</strong> > <strong>Nova Fatura</strong>.</li>
              <li>Selecione o aluno e o valor.</li>
              <li>O sistema se integra com o Mercado Pago (se você ativou em Configurações) para gerar o link de pagamento via PIX ou Boleto.</li>
              <li>O responsável receberá notificação no app do ARXUM e no e-mail para pagar.</li>
            </ol>
          `
        },
        {
          id: 'inadimplencia',
          titulo: 'Como ver e exportar a inadimplência',
          resumo: 'Saiba quem está devendo e baixe em formato Excel.',
          conteudo: `
            <p>Não perca tempo caçando boletos vencidos:</p>
            <ol>
              <li>Acesse <strong>Relatórios</strong>.</li>
              <li>No card de "Financeiro", veja o percentual de inadimplência atualizado em tempo real.</li>
              <li>Clique no botão <strong>Exportar CSV</strong> abaixo do card.</li>
              <li>Abra o arquivo no Excel. Ele terá a lista com o nome do aluno, descrição da fatura e valor vencido.</li>
            </ol>
          `
        }
      ]
    },
    {
      id: 'comunicacao',
      titulo: 'Comunicação e Chat',
      icone: 'MessageSquare',
      artigos: [
        {
          id: 'chat-pais',
          titulo: 'Como responder os pais no Chat',
          resumo: 'Use o chat interno para centralizar as conversas.',
          conteudo: `
            <p>Chega de mensagens perdidas no WhatsApp:</p>
            <ol>
              <li>Acesse <strong>Mensagens</strong>.</li>
              <li>Você verá uma fila com as escolas e os pais que iniciaram contato.</li>
              <li>Clique sobre o nome e o histórico de conversa abrirá à direita.</li>
              <li>Ao digitar, você pode selecionar de qual departamento é a resposta (Secretaria, Financeiro, etc) para o pai saber com quem está falando.</li>
            </ol>
          `
        },
        {
          id: 'enviar-comunicado',
          titulo: 'Como enviar um comunicado segmentado',
          resumo: 'Envie mensagens apenas para o Fundamental I, por exemplo.',
          conteudo: `
            <p>O comunicado vai direto para o mural do responsável e pode disparar e-mail:</p>
            <ol>
              <li>Vá em <strong>Comunicação</strong> e crie um novo.</li>
              <li>Escreva o título e o texto.</li>
              <li>Ao invés de enviar para "Toda a escola", selecione as turmas/séries que devem receber (ex: "1º Ano" e "2º Ano").</li>
              <li>Publique. O pai só verá o comunicado se o filho dele estiver naquela turma.</li>
            </ol>
          `
        }
      ]
    },
    {
      id: 'sala-de-aula',
      titulo: 'Sala de Aula e EduFlix',
      icone: 'PlayCircle',
      artigos: [
        {
          id: 'lancar-notas',
          titulo: 'Como lançar notas e faltas',
          resumo: 'O guia para o professor e coordenador.',
          conteudo: `
            <p>O lançamento gera o boletim automático para o pai:</p>
            <ol>
              <li>Vá em <strong>Notas</strong>.</li>
              <li>Selecione o aluno, a disciplina e o bimestre.</li>
              <li>Digite a nota (de 0 a 10) e as faltas.</li>
              <li>Salve. O responsável receberá notificação instantânea se estiver configurado.</li>
            </ol>
          `
        },
        {
          id: 'postar-videoaula',
          titulo: 'Como postar videoaulas no EduFlix',
          resumo: 'Adicione vídeos do YouTube, Vimeo ou upload direto.',
          conteudo: `
            <p>Transforme sua escola em uma plataforma de streaming:</p>
            <ol>
              <li>Acesse <strong>EduFlix</strong> > <strong>Nova Videoaula</strong>.</li>
              <li>Cole o link do vídeo (YouTube, Vimeo) ou faça o upload do arquivo direto.</li>
              <li>Adicione uma capa atraente e associe o vídeo à disciplina (ex: Matemática).</li>
              <li>Marque a videoaula como publicada.</li>
              <li>O aluno verá o vídeo no menu EduFlix com aquela interface estilo Netflix que criamos.</li>
            </ol>
          `
        }
      ]
    },
    {
      id: 'site',
      titulo: 'Site Público (CMS)',
      icone: 'Globe',
      artigos: [
        {
          id: 'editar-site',
          titulo: 'Como editar as páginas do seu site',
          resumo: 'Mude a foto do banner, textos e notícias sem programador.',
          conteudo: `
            <p>O site da sua escola está sob seu total controle:</p>
            <ol>
              <li>Acesse <strong>Site</strong> no menu.</li>
              <li>Na aba <strong>Home</strong>, você pode alterar o texto do banner principal (Hero), trocar as imagens do carrossel e os botões.</li>
              <li>Na aba <strong>Páginas Extras</strong>, você pode criar páginas ilimitadas como "Trabalhe Conosco" ou "Calendário Escolar". Use o editor de texto rico para formatar negrito e links.</li>
              <li>Clique em <strong>Salvar alterações</strong> e depois no botão <strong>Ver site</strong> para ver o resultado no ar.</li>
            </ol>
          `
        }
      ]
    }
  ]