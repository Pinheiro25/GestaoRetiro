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
      // 1. Carrega retiros para o filtro
      const { data: listRetiros } = await supabase.from('retiros').select('*').order('data_inicio', { ascending: false })
      if (listRetiros) {
        setRetiros(listRetiros)
        if (listRetiros.length > 0) setRetiroSelecionado(listRetiros[0].id)
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
            <label className="text-[10px] uppercase font-bold text-stone-400 ml-2">Filtrar Retiro:</label>
            <select 
              value={retiroSelecionado}
              onChange={(e) => setRetiroSelecionado(e.target.value)}
              className="bg-transparent outline-none text-sm text-stone-700 pr-4"
            >
              {retiros.map(r => (
                <option key={r.id} value={r.id}>{r.titulo}</option>
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
                <th className="p-6 text-[10px] uppercase tracking-widest text-stone-400 font-bold text-center">Status</th>
                <th className="p-6 text-[10px] uppercase tracking-widest text-stone-400 font-bold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {inscritos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-stone-400 italic">Nenhum inscrito encontrado para este retiro.</td>
                </tr>
              ) : (
                inscritos.map((pessoa) => (
                  <tr key={pessoa.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-6">
                      <p className="font-medium text-stone-800">{pessoa.nome}</p>
                      <p className="text-[10px] text-stone-400">{pessoa.email}</p>
                    </td>
                    <td className="p-6 text-sm text-stone-500">{pessoa.cidade || '—'}</td>
                    <td className="p-6 text-center">
                      <span className="text-[9px] bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold uppercase tracking-tighter">
                        {pessoa.role}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <Link 
                        href={`/financeiro/${pessoa.id}`}
                        className="text-xs bg-stone-800 text-white px-4 py-2 rounded-xl hover:bg-stone-700 transition-all"
                      >
                        Gerenciar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}