'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { UploadCloud, FileSpreadsheet, Check, AlertCircle, ArrowRight, Loader2, Download, FileDown } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { importarAlunos, type LinhaImportacao } from './actions'

const CAMPOS_SISTEMA = [
  { key: 'nome', label: 'Nome do Aluno', obrigatorio: true },
  { key: 'data_nascimento', label: 'Data de Nascimento', obrigatorio: false },
  { key: 'serie', label: 'Série / Turma', obrigatorio: false },
  { key: 'turno', label: 'Turno', obrigatorio: false },
  { key: 'responsavel_nome', label: 'Nome do Responsável', obrigatorio: false },
  { key: 'responsavel_email', label: 'E-mail do Responsável', obrigatorio: true },
  { key: 'responsavel_telefone', label: 'Telefone do Responsável', obrigatorio: false },
  { key: 'responsavel_cpf', label: 'CPF do Responsável', obrigatorio: false },
] as const

type CampoKey = typeof CAMPOS_SISTEMA[number]['key']

export function ImportacaoClient() {
  const [passo, setPasso] = useState<1 | 2 | 3>(1)
  const [arquivoNome, setArquivoNome] = useState('')
  const [colunasArquivo, setColunasArquivo] = useState<string[]>([])
  const [dadosBrutos, setDadosBrutos] = useState<any[]>([])
  const [mapeamento, setMapeamento] = useState<Record<CampoKey, string>>({} as any)
  
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [erro, setErro] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  function baixarModelo() {
    const cabecalhos = ['Nome do Aluno', 'Data Nascimento', 'Série', 'Turno', 'Nome Responsável', 'Email Responsável', 'Telefone Responsável', 'CPF Responsável']
    const exemplo = ['João da Silva', '2015-05-20', '3º Ano Fundamental', 'Manhã', 'Maria da Silva', 'maria@email.com', '21999998888', '12345678900']
    
    const csv = `${cabecalhos.join(',')}\n${exemplo.join(',')}`
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modelo_importacao_alunos.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setArquivoNome(file.name)
    setErro('')

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]

        if (data.length < 2) {
          setErro('A planilha está vazia ou não tem dados suficientes.')
          return
        }

        const cabecalhos = data[0].map(h => String(h).trim())
        const linhas = data.slice(1).filter(row => row.length > 0)

        setColunasArquivo(cabecalhos)
        
        const objetos = linhas.map(linha => {
          const obj: any = {}
          cabecalhos.forEach((col, index) => {
            obj[col] = linha[index] !== undefined ? String(linha[index]) : ''
          })
          return obj
        })
        
        setDadosBrutos(objetos)
        
        // Auto-mapeamento básico (tenta adivinhar pelos nomes parecidos)
        const autoMap: any = {}
        CAMPOS_SISTEMA.forEach(campo => {
          const colunaEncontrada = cabecalhos.find(c => 
            c.toLowerCase().includes(campo.label.toLowerCase()) || 
            campo.label.toLowerCase().includes(c.toLowerCase())
          )
          if (colunaEncontrada) autoMap[campo.key] = colunaEncontrada
        })
        setMapeamento(autoMap)
        setPasso(2)
        
      } catch (err) {
        setErro('Erro ao ler o arquivo. Verifique se é um arquivo Excel ou CSV válido.')
      }
    }
    reader.readAsBinaryString(file)
  }

  async function handleImportar() {
    // Validação do mapeamento
    const faltando = CAMPOS_SISTEMA.filter(c => c.obrigatorio && !mapeamento[c.key])
    if (faltando.length > 0) {
      setErro(`Mapeie os campos obrigatórios: ${faltando.map(f => f.label).join(', ')}`)
      return
    }

    setImportando(true)
    setErro('')

    // Converte os dados brutos para o formato do sistema
    const dadosMapeados: LinhaImportacao[] = dadosBrutos.map(linha => {
      const aluno: any = {}
      CAMPOS_SISTEMA.forEach(campo => {
        const coluna = mapeamento[campo.key]
        aluno[campo.key] = coluna ? linha[coluna] : null
      })
      
      // Limpa formatações básicas de data
      if (aluno.data_nascimento) {
        // Tenta converter padrão brasileiro DD/MM/YYYY para YYYY-MM-DD
        const partes = String(aluno.data_nascimento).split('/')
        if (partes.length === 3) {
          aluno.data_nascimento = `${partes[2]}-${partes[1]}-${partes[0]}`
        } else {
          // Se for um número do Excel, converte
          const num = Number(aluno.data_nascimento)
          if (!isNaN(num) && num > 20000) {
            const data = XLSX.SSF.parse_date_code(num)
            aluno.data_nascimento = `${data.y}-${String(data.m).padStart(2, '0')}-${String(data.d).padStart(2, '0')}`
          }
        }
      }
      
      return aluno as LinhaImportacao
    })

    const r = await importarAlunos(dadosMapeados)
    setImportando(false)

    if (r.success) {
      setResultado(r.resumo)
      setPasso(3)
    } else {
      setErro(r.error || 'Erro na importação.')
    }
  }

  return (
    <AdminShell mode="school" active="Importação">
      <main className="px-5 py-8 lg:px-8 max-w-5xl">
        <SectionHeading
          eyebrow="Configurações"
          title="Importar dados"
          description="Traga os alunos da sua escola de outro sistema ou de uma planilha."
        />

        {/* Barra de progresso */}
        <div className="mt-8 flex items-center justify-between border-b border-[#e5ecee] pb-4">
          {[
            { num: 1, label: 'Upload do arquivo' },
            { num: 2, label: 'Mapear colunas' },
            { num: 3, label: 'Concluído' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`grid size-7 place-items-center rounded-full text-xs font-bold ${passo >= s.num ? 'bg-[#0d9488] text-white' : 'bg-[#e5ecee] text-[#82939a]'}`}>
                {passo > s.num ? <Check size={14} /> : s.num}
              </div>
              <span className={`text-sm font-semibold ${passo >= s.num ? 'text-[#12232b]' : 'text-[#82939a]'}`}>{s.label}</span>
              {i < 2 && <div className="mx-4 h-px w-12 bg-[#e5ecee] sm:w-24" />}
            </div>
          ))}
        </div>

        {erro && (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="size-5 shrink-0" /> {erro}
          </div>
        )}

        {passo === 1 && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Panel className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="grid size-10 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]"><Download size={20} /></div>
                <div>
                  <h2 className="text-base font-bold text-[#12232b]">1. Baixe o modelo</h2>
                  <p className="text-xs text-[#82939a]">Use nossa planilha padrão para garantir que os dados entrem corretamente.</p>
                </div>
              </div>
              <button onClick={baixarModelo} className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#b8c9ce] bg-white px-4 py-3 text-sm font-semibold text-[#30454e] hover:border-[var(--cor-primaria,#0d9488)] transition">
                <FileDown size={18} /> Baixar modelo em CSV
              </button>
            </Panel>

            <Panel className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#1e40af]"><UploadCloud size={20} /></div>
                <div>
                  <h2 className="text-base font-bold text-[#12232b]">2. Envie sua planilha</h2>
                  <p className="text-xs text-[#82939a]">Aceita arquivos .xlsx, .xls ou .csv.</p>
                </div>
              </div>
              
              <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              
              <button onClick={() => fileInputRef.current?.click()} className="w-full h-32 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#d5e0e3] bg-[#fafcfc] text-[#82939a] hover:border-[var(--cor-primaria,#0d9488)] hover:text-[var(--cor-primaria,#0d9488)] transition">
                <FileSpreadsheet size={32} />
                <span className="text-sm font-semibold">Clique para selecionar o arquivo</span>
              </button>
            </Panel>
          </div>
        )}

        {passo === 2 && (
          <div className="mt-8">
            <Panel>
              <div className="border-b border-[#e5ecee] px-5 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#12232b]">Mapeamento de colunas</h2>
                  <p className="text-xs text-[#82939a]">Arquivo: {arquivoNome} · {dadosBrutos.length} linhas encontradas</p>
                </div>
                <button onClick={() => setPasso(1)} className="text-xs text-[#82939a] hover:text-[#dc2626] font-semibold">Cancelar</button>
              </div>
              
              <div className="p-5 grid gap-4 sm:grid-cols-2">
                {CAMPOS_SISTEMA.map(campo => (
                  <div key={campo.key} className="rounded-lg border border-[#e5ecee] bg-white p-4">
                    <label className="mb-2 block text-xs font-bold text-[#243942]">
                      {campo.label} {campo.obrigatorio && <span className="text-[#dc2626]">*</span>}
                    </label>
                    <select
                      value={mapeamento[campo.key] || ''}
                      onChange={(e) => setMapeamento({ ...mapeamento, [campo.key]: e.target.value })}
                      className="w-full rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]"
                    >
                      <option value="">Não importar / Deixar em branco</option>
                      {colunasArquivo.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    {mapeamento[campo.key] && dadosBrutos[0] && (
                      <p className="mt-2 text-[10px] text-[#82939a] truncate">Ex: {dadosBrutos[0][mapeamento[campo.key]] || '(vazio)'}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-[#e5ecee] bg-[#fafcfc] p-5 flex justify-end">
                <button onClick={handleImportar} disabled={importando} className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50" style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}>
                  {importando ? <><Loader2 className="size-4 animate-spin" /> Importando {dadosBrutos.length} alunos...</> : <><ArrowRight size={16} /> Iniciar Importação</>}
                </button>
              </div>
            </Panel>
          </div>
        )}

        {passo === 3 && resultado && (
          <div className="mt-8 flex flex-col items-center justify-center py-12">
            <div className="grid size-20 place-items-center rounded-full bg-[#d1fae5] text-[#065f46] mb-6">
              <Check size={40} />
            </div>
            <h2 className="text-2xl font-bold text-[#12232b]">Importação concluída!</h2>
            <p className="mt-2 text-sm text-[#82939a] text-center max-w-md">
              Os dados da sua planilha foram processados com sucesso e já estão disponíveis no sistema.
            </p>
            
            <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
              <div className="rounded-xl border border-[#e5ecee] bg-white p-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Importados</p>
                <p className="mt-1 text-3xl font-bold text-[#0d9488]">{resultado.importados}</p>
              </div>
              <div className="rounded-xl border border-[#e5ecee] bg-white p-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Erros / Ignorados</p>
                <p className="mt-1 text-3xl font-bold text-[#dc2626]">{resultado.erros}</p>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => { setPasso(1); setArquivoNome(''); }} className="rounded-lg border border-[#b8c9ce] bg-white px-5 py-2 text-sm font-semibold text-[#30454e]">Importar outra planilha</button>
              <button onClick={() => window.location.href = '/admin/alunos'} className="rounded-lg px-5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}>Ver lista de alunos</button>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  )
}