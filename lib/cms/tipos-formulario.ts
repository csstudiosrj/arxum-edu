export type TipoCampo =
  | 'texto_curto'
  | 'texto_longo'
  | 'multipla_escolha'
  | 'checkbox'
  | 'sim_nao'
  | 'numero'
  | 'data'
  | 'cpf'
  | 'telefone'
  | 'email'
  | 'upload'

export type CampoFormulario = {
  id: string
  formulario_id: string
  tipo: TipoCampo
  label: string
  placeholder: string | null
  texto_ajuda: string | null
  obrigatorio: boolean
  unico: boolean
  opcoes: string[]
  validacao_min: number | null
  validacao_max: number | null
  ordem: number
  secao: string | null
}

export type Formulario = {
  id: string
  escola_id: string
  titulo: string
  slug: string
  descricao: string | null
  tipo: string
  status: string
  cor_primaria: string | null
  mensagem_sucesso: string | null
  redirecionar_url: string | null
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export type RespostaFormulario = {
  id: string
  formulario_id: string
  escola_id: string
  responsavel_email: string | null
  aluno_nome: string | null
  dados: Record<string, string | string[] | number | null>
  ip: string | null
  criado_em: string
}

export type TipoInfo = {
  key: TipoCampo
  label: string
  icone: string
  descricao: string
  tem_opcoes: boolean
}

export const TIPOS_CAMPO: TipoInfo[] = [
  { key: 'texto_curto', label: 'Texto curto', icone: 'Type', descricao: 'Uma linha de texto', tem_opcoes: false },
  { key: 'texto_longo', label: 'Texto longo', icone: 'AlignLeft', descricao: 'Área de várias linhas', tem_opcoes: false },
  { key: 'multipla_escolha', label: 'Múltipla escolha', icone: 'CircleDot', descricao: 'Escolher uma entre várias', tem_opcoes: true },
  { key: 'checkbox', label: 'Caixas de seleção', icone: 'CheckSquare', descricao: 'Marcar várias opções', tem_opcoes: true },
  { key: 'sim_nao', label: 'Sim / Não', icone: 'ToggleLeft', descricao: 'Resposta binária', tem_opcoes: false },
  { key: 'numero', label: 'Número', icone: 'Hash', descricao: 'Valor numérico', tem_opcoes: false },
  { key: 'data', label: 'Data', icone: 'Calendar', descricao: 'Seletor de data', tem_opcoes: false },
  { key: 'cpf', label: 'CPF', icone: 'IdCard', descricao: 'CPF com validação', tem_opcoes: false },
  { key: 'telefone', label: 'Telefone', icone: 'Phone', descricao: 'Telefone formatado', tem_opcoes: false },
  { key: 'email', label: 'E-mail', icone: 'Mail', descricao: 'E-mail com validação', tem_opcoes: false },
  { key: 'upload', label: 'Upload', icone: 'Upload', descricao: 'Enviar arquivo', tem_opcoes: false },
]

export const TIPOS_FORMULARIO = [
  { key: 'matricula', label: 'Matrícula' },
  { key: 'anamnese', label: 'Anamnese' },
  { key: 'autorizacao', label: 'Autorização' },
  { key: 'pesquisa', label: 'Pesquisa' },
  { key: 'inscricao', label: 'Inscrição' },
  { key: 'outro', label: 'Outro' },
]

export function tipoInfo(key: string): TipoInfo {
  return TIPOS_CAMPO.find((t) => t.key === key) || TIPOS_CAMPO[0]
}

export function gerarSlugFormulario(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}