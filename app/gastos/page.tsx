'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function GestaoGastos() {
  const [retiroAtivo, setRetiroAtivo] = useState<any>(null)
  const [despesas, setDespesas] = useState<any[]>([])
  const [receitaTotal, setReceitaTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Estado para o formulário de nova despesa
  const [novaDespesa, setNovaDespesa] = useState({
    descricao: '',
    categoria: 'ALIMENTAÇÃO',
    valor_previsto: 0,
    valor_realizado: 0,
    pago: false
  })

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)
    // 1. Busca Retiro Aberto
    const { data: retiro } = await supabase.from('retiros').select('*').eq('status', 'ABERTO').limit(1).single()
    
    if (retiro) {
      setRetiroAtivo(retiro)
      
      // 2. Busca Despesas e Receita (Pagamentos) em paralelo
      const [gastos, pagtos] = await Promise.all([
        supabase.from('despesas_retiro').select('*').eq('retiro_id', retiro.id).order('criado_em'),
        supabase.from('pagamentos').select('valor_pago, usuarios!inner(retiro_id)').eq('usuarios.retiro_id', retiro.id)
      ])

      setDespesas(gastos.data || [])
      const totalPagtos = (pagtos.data || []).reduce((acc, cur) => acc + Number(cur.valor_pago), 0)
      setReceitaTotal(totalPagtos)
    }
    setLoading(false)
  }

  async function salvarDespesa() {
    if (!novaDespesa.descricao) return alert("Dê uma descrição à despesa")
    
    const { error } = await supabase.from('despesas_retiro').insert([{
      ...novaDespesa,
      retiro_id: retiroAtivo.id
    }])

    if (!error) {
      setNovaDespesa({ descricao: '', categoria: 'ALIMENTAÇÃO', valor_previsto: 0, valor_realizado: 0, pago: false })
      carregarDados()
    }
  }

  async function atualizarValorReal(id: string, valor: string) {
    await supabase.from('despesas_retiro').update({ valor_realizado: Number(valor) }).eq('id', id)
    // Atualiza localmente para rapidez
    setDespesas(prev => prev.map(d => d.id === id ? { ...d, valor_realizado: Number(valor) } : d))
  }

  async function excluirDespesa(id: string) {
    if (confirm("Excluir esta despesa?")) {
      await supabase.from('despesas_retiro').delete().eq('id', id)
      carregarDados()
    }
  }

  if (loading) return <div className="p-20 text-center font-serif italic text-stone-400">Calculando balanço...</div>

  const totalPrevisto = despesas.reduce((acc, cur) => acc + Number(cur.valor_previsto), 0)
  const totalRealizado = despesas.reduce((acc, cur) => acc + Number(cur.valor_realizado), 0)
  const lucroPrevisto = receitaTotal - totalPrevisto
  const lucroReal = receitaTotal - totalRealizado

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-4 md:p-12 font-serif text-stone-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header>
          <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold mb-2">Financeiro Interno</p>
          <h1 className="text-4xl font-light italic">Fluxo de Despesas</h1>
          <p className="text-stone-400 text-sm mt-2">{retiroAtivo?.titulo}</p>
        </header>

        {/* DASHBOARD DE LUCRO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-stone-400 mb-2">Receita Atual (Inscrições)</p>
            <p className="text-3xl font-light text-emerald-600">R$ {receitaTotal.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm font-sans">
            <p className="text-[10px] uppercase font-bold text-stone-400 mb-2">Total de Gastos (Realizado)</p>
            <p className="text-3xl font-light text-red-500 font-serif">R$ {totalRealizado.toLocaleString('pt-BR')}</p>
            <p className="text-[9px] text-stone-400 mt-1 uppercase">Previsto: R$ {totalPrevisto.toLocaleString('pt-BR')}</p>
          </div>
          <div className={`p-6 rounded-[2rem] border shadow-md ${lucroReal >= 0 ? 'bg-stone-800 text-white' : 'bg-red-900 text-white'}`}>
            <p className="text-[10px] uppercase font-bold opacity-60 mb-2 tracking-widest">Lucratividade Real</p>
            <p className="text-4xl font-light italic">R$ {lucroReal.toLocaleString('pt-BR')}</p>
            <p className="text-[9px] mt-1 opacity-50 uppercase">Saldo final após despesas</p>
          </div>
        </div>

        {/* ADICIONAR DESPESA */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm font-sans">
          <h3 className="text-xs uppercase font-bold tracking-widest text-stone-400 mb-6">Cadastrar Despesa Prevista</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input 
              type="text" placeholder="Descrição (Ex: Compra Mercado)" 
              className="md:col-span-2 border-b border-stone-200 outline-none p-2 text-sm"
              value={novaDespesa.descricao}
              onChange={e => setNovaDespesa({...novaDespesa, descricao: e.target.value})}
            />
            <input 
              type="number" placeholder="Valor Previsto" 
              className="border-b border-stone-200 outline-none p-2 text-sm"
              value={novaDespesa.valor_previsto || ''}
              onChange={e => setNovaDespesa({...novaDespesa, valor_previsto: Number(e.target.value)})}
            />
            <button 
              onClick={salvarDespesa}
              className="bg-amber-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest py-3 hover:bg-amber-700 transition-all"
            >
              Adicionar
            </button>
          </div>
        </div>

        {/* LISTA DE DESPESAS */}
        <div className="bg-white border border-stone-100 rounded-[2.5rem] overflow-hidden shadow-sm font-sans">
          <table className="w-full text-left">
            <thead className="bg-stone-50 text-[10px] uppercase text-stone-400">
              <tr>
                <th className="p-6">Descrição</th>
                <th className="p-6 text-center">Previsto</th>
                <th className="p-6 text-center">Realizado (Ajustável)</th>
                <th className="p-6 text-center">Diferença</th>
                <th className="p-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {despesas.map((d) => (
                <tr key={d.id} className="text-sm">
                  <td className="p-6 font-medium text-stone-700">{d.descricao}</td>
                  <td className="p-6 text-center text-stone-500 font-mono">R$ {Number(d.valor_previsto).toFixed(2)}</td>
                  <td className="p-6 text-center">
                    <input 
                      type="number" 
                      className="w-24 border-b border-stone-200 text-center outline-none focus:border-amber-500 transition-colors"
                      defaultValue={d.valor_realizado}
                      onBlur={(e) => atualizarValorReal(d.id, e.target.value)}
                    />
                  </td>
                  <td className={`p-6 text-center font-bold ${d.valor_realizado > d.valor_previsto ? 'text-red-500' : 'text-emerald-600'}`}>
                    R$ {(d.valor_previsto - d.valor_realizado).toFixed(2)}
                  </td>
                  <td className="p-6 text-right">
                    <button onClick={() => excluirDespesa(d.id)} className="text-stone-300 hover:text-red-500">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}