'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function FinanceiroFiltro() {
  const [retiros, setRetiros] = useState<any[]>([])
  const [retiroSelecionado, setRetiroSelecionado] = useState('')
  const [inscritos, setInscritos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarIniciais() {
      // Carrega retiros, mas prioriza o que está ABERTO
      const { data: listRetiros } = await supabase.from('retiros').select('*').order('data_inicio', { ascending: false })
      
      if (listRetiros) {
        setRetiros(listRetiros)
        // Busca o que está aberto para selecionar por padrão
        const aberto = listRetiros.find(r => r.status === 'ABERTO')
        if (aberto) {
          setRetiroSelecionado(aberto.id)
        } else if (listRetiros.length > 0) {
          setRetiroSelecionado(listRetiros[0].id)
        }
      }
      setLoading(false)
    }
    carregarIniciais()
  }, [])

  useEffect(() => {
    async function filtrarInscritos() {
      if (!retiroSelecionado) return
      
      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('retiro_id', retiroSelecionado)
        .order('nome', { ascending: true })
      
      if (data) setInscritos(data)
    }
    filtrarInscritos()
  }, [retiroSelecionado])

  // Função para a Patrícia alterar o status (Role) direto na tabela
  async function alterarStatus(id: string, novoStatus: string) {
    const { error } = await supabase
      .from('usuarios')
      .update({ role: novoStatus })
      .eq('id', id)

    if (!error) {
      setInscritos(prev => prev.map(p => p.id === id ? { ...p, role: novoStatus } : p))
    } else {
      alert("Erro ao atualizar: " + error.message)
    }
  }

  if (loading) return <div className="p-20 text-center font-serif text-stone-400 italic">Organizando as contas... ☸️</div>

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-4 md:p-8 font-serif text-stone-800">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-light text-stone-800">Guardião Financeiro</h1>
            <p className="text-stone-400 text-sm">Gestão de fluxos e contribuições</p>
          </div>

          <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
            <label className="text-[10px] uppercase font-bold text-stone-400 ml-2">Retiro Ativo:</label>
            <select 
              value={retiroSelecionado}
              onChange={(e) => setRetiroSelecionado(e.target.value)}
              className="bg-transparent outline-none text-sm text-stone-700 pr-4 font-bold"
            >
              {retiros.map(r => (
                <option key={r.id} value={r.id}>
                  {r.status === 'ABERTO' ? `🟢 ${r.titulo}` : r.titulo}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="bg-white border border-stone-200 rounded-[2.5rem] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="p-6 text-[10px] uppercase tracking-widest text-stone-400 font-bold">Participante</th>
                <th className="p-6 text-[10px] uppercase tracking-widest text-stone-400 font-bold">Cidade</th>
                <th className="p-6 text-[10px] uppercase tracking-widest text-stone-400 font-bold text-center">WhatsApp</th>
                <th className="p-6 text-[10px] uppercase tracking-widest text-stone-400 font-bold text-center">Status</th>
                <th className="p-6 text-[10px] uppercase tracking-widest text-stone-400 font-bold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {inscritos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-stone-400 italic">Nenhum inscrito encontrado.</td>
                </tr>
              ) : (
                inscritos.map((pessoa) => (
                  <tr key={pessoa.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-6">
                      <p className="font-medium text-stone-800">{pessoa.nome}</p>
                      <p className="text-[10px] text-stone-400">{pessoa.email}</p>
                    </td>
                    <td className="p-6 text-sm text-stone-500">{pessoa.cidade || '—'}</td>
                    
                    {/* COLUNA WHATSAPP */}
                    <td className="p-6 text-center">
                      {pessoa.whatsapp ? (
                        <a 
                          href={`https://wa.me/${pessoa.whatsapp.replace(/\D/g, '')}`} 
                          target="_blank" 
                          className="inline-block p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-600 hover:text-white transition-all"
                          title="Chamar no WhatsApp"
                        >
                          📱
                        </a>
                      ) : '—'}
                    </td>

                    {/* SELETOR DE STATUS (ROLE) */}
                    <td className="p-6 text-center">
                      <select 
                        value={pessoa.role} 
                        onChange={(e) => alterarStatus(pessoa.id, e.target.value)}
                        className={`text-[9px] font-bold uppercase px-3 py-1 rounded-full border-none cursor-pointer transition-colors ${
                          pessoa.role === 'INSCRITO' ? 'bg-emerald-100 text-emerald-700' :
                          pessoa.role === 'PRÉ-INSCRITO' ? 'bg-amber-100 text-amber-700' :
                          pessoa.role === 'DESISTENTE' ? 'bg-red-100 text-red-700' :
                          'bg-stone-100 text-stone-500'
                        }`}
                      >
                        <option value="PRÉ-INSCRITO">PRÉ-INSCRITO</option>
                        <option value="INSCRITO">INSCRITO</option>
                        <option value="EM ESPERA">EM ESPERA</option>
                        <option value="DESISTENTE">DESISTENTE</option>
                      </select>
                    </td>

                    <td className="p-6 text-right">
                      <Link 
                        href={`/financeiro/${pessoa.id}`}
                        className="text-[10px] uppercase font-bold bg-stone-100 text-stone-600 px-4 py-2 rounded-xl hover:bg-stone-800 hover:text-white transition-all"
                      >
                        Detalhes
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CONTADOR SIMPLES ABAIXO DA TABELA */}
        <div className="mt-6 flex gap-6 px-6">
          <p className="text-[10px] uppercase font-bold text-stone-400">
            Total Inscritos: <span className="text-stone-800">{inscritos.filter(i => i.role === 'INSCRITO').length}</span>
          </p>
          <p className="text-[10px] uppercase font-bold text-stone-400">
            Total Pré-Inscritos: <span className="text-stone-800">{inscritos.filter(i => i.role === 'PRÉ-INSCRITO').length}</span>
          </p>
        </div>
      </div>
    </div>
  )
}