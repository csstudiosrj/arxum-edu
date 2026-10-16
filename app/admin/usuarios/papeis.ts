export const PAPEIS_INTERNOS = [
    { key: 'admin_escola', label: 'Administrador', descricao: 'Acesso total ao sistema' },
    { key: 'direcao', label: 'Direção', descricao: 'Acesso geral menos configurações técnicas' },
    { key: 'coordenacao', label: 'Coordenação', descricao: 'Pedagógico, alunos, professores e comunicados' },
    { key: 'secretaria', label: 'Secretaria', descricao: 'Matrículas, documentos e alunos' },
    { key: 'financeiro', label: 'Financeiro', descricao: 'Faturas, pagamentos e relatórios financeiros' },
    { key: 'professor', label: 'Professor', descricao: 'Notas, ocorrências e portal do professor' },
  ] as const
  
  export const PAPEL_CORES: Record<string, string> = {
    admin_escola: '#dc2626',
    direcao: '#7c3aed',
    coordenacao: '#3b82f6',
    secretaria: '#0d9488',
    financeiro: '#d97706',
    professor: '#0891b2',
  }
  
  export const PAPEL_LABELS: Record<string, string> = {
    super_admin: 'Super Admin',
    admin_escola: 'Administrador',
    direcao: 'Direção',
    coordenacao: 'Coordenação',
    secretaria: 'Secretaria',
    financeiro: 'Financeiro',
    professor: 'Professor',
    responsavel: 'Responsável',
    aluno: 'Aluno',
  }
  
  export function papelLabel(key: string): string {
    return PAPEL_LABELS[key] || key
  }
  
  export function papelCor(key: string): string {
    return PAPEL_CORES[key] || '#6b7d86'
  }