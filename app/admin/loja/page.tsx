'use client'

import { useState } from 'react'
import { Search, Plus, Package, ShoppingCart, TrendingUp, DollarSign, Edit, Trash2 } from 'lucide-react'
import { AdminShell, SectionHeading, Panel, ActionButton } from '@/components/admin-shell'

const produtos = [
  { nome: 'Uniforme completo — Infantil', categoria: 'Uniformes', preco: 'R$ 189,00', estoque: 42, vendidos: 128, status: 'Ativo' },
  { nome: 'Uniforme completo — Fundamental', categoria: 'Uniformes', preco: 'R$ 219,00', estoque: 28, vendidos: 96, status: 'Ativo' },
  { nome: 'Camiseta extra — Educação Física', categoria: 'Uniformes', preco: 'R$ 79,00', estoque: 85, vendidos: 214, status: 'Ativo' },
  { nome: 'Kit material escolar — 1º ano', categoria: 'Materiais', preco: 'R$ 340,00', estoque: 12, vendidos: 47, status: 'Ativo' },
  { nome: 'Kit material escolar — 6º ano', categoria: 'Materiais', preco: 'R$ 420,00', estoque: 8, vendidos: 38, status: 'Ativo' },
  { nome: 'Ingresso — Festa Junina', categoria: 'Eventos', preco: 'R$ 45,00', estoque: 250, vendidos: 187, status: 'Ativo' },
  { nome: 'Ingresso — Semana da Comunidade', categoria: 'Eventos', preco: 'R$ 30,00', estoque: 180, vendidos: 92, status: 'Ativo' },
  { nome: 'Agenda escolar 2026', categoria: 'Papelaria', preco: 'R$ 65,00', estoque: 0, vendidos: 156, status: 'Esgotado' },
]

const categorias = ['Todas', 'Uniformes', 'Materiais', 'Eventos', 'Papelaria']

export default function LojaAdminPage() {
  const [categoria, setCategoria] = useState('Todas')
  const [busca, setBusca] = useState('')

  const filtrados = produtos.filter((p) => {
    const matchCat = categoria === 'Todas' || p.categoria === categoria
    const matchBusca = busca === '' || p.nome.toLowerCase().includes(busca.toLowerCase())
    return matchCat && matchBusca
  })

  return (
    <AdminShell mode="school" active="Loja">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Loja virtual"
            title="Loja"
            description="Gerencie produtos, estoque e pedidos da loja virtual da escola."
          />
          <ActionButton variant="primary">
            <Plus className="mr-1.5 inline size-4" />
            Novo produto
          </ActionButton>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Vendas este mês', value: 'R$ 18.240', icon: DollarSign, color: '#0d9488' },
            { label: 'Pedidos', value: '94', icon: ShoppingCart, color: '#3b82f6' },
            { label: 'Produtos ativos', value: '18', icon: Package, color: '#065f46' },
            { label: 'Ticket médio', value: 'R$ 194', icon: TrendingUp, color: '#d97706' },
          ].map((m) => (
            <Panel key={m.label} className="p-5">
              <div className="grid size-10 place-items-center rounded-lg" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                <m.icon className="size-5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">{m.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-[-.03em]" style={{ color: m.color }}>{m.value}</p>
            </Panel>
          ))}
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {categorias.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategoria(c)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      categoria === c ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
                <Search className="size-4 text-[#9aaab0]" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar produto"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Produto</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Categoria</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Preço</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Estoque</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Vendidos</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Status</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.nome} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{p.nome}</td>
                    <td className="px-5 py-3.5 text-sm text-[#4d626c]">{p.categoria}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{p.preco}</td>
                    <td className="px-5 py-3.5 text-sm text-[#4d626c]">
                      <span className={p.estoque === 0 ? 'font-semibold text-[#dc2626]' : p.estoque < 15 ? 'font-semibold text-[#d97706]' : ''}>
                        {p.estoque} un.
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#4d626c]">{p.vendidos}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        p.status === 'Ativo' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#991b1b]'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Editar">
                          <Edit className="size-4" />
                        </button>
                        <button className="rounded-lg p-1.5 text-[#dc2626] hover:bg-[#fee2e2]" title="Excluir">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </main>
    </AdminShell>
  )
}