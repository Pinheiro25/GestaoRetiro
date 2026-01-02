'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PainelLogistica() {
  const [retiros, setRetiros] = useState<any[]>([])
  const [idRetiro, setIdRetiro] = useState('')
  const [participantes, setParticipantes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [temVan, setTemVan] = useState(false)
  const [custoTotalVan, setCustoTotalVan] = useState(0)

  useEffect(() => {
    async function init() {
      const { data } = await supabase.from('retiros').select('*').eq('status', 'ABERTO').order('data_inicio', { ascending: true })
      if (data && data.length > 0) {
        setRetiros(data)
        const primeiro = data[0]
        setIdRetiro(primeiro.id)
        setTemVan(primeiro.tem_van || false)
        setCustoTotalVan(primeiro.valor_total_van || 0)
      }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (idRetiro) {
      carregarParticipantes()
      const r = retiros.find(ret => ret.id === idRetiro)
      if (r) {
        setTemVan(r.tem_van || false)
        setCustoTotalVan(r.valor_total_van || 0)
      }
    }
  }, [idRetiro])

  async function carregarParticipantes() {
    const { data } = await supabase.from('usuarios').select('*').eq('retiro_id', idRetiro).eq('ocupa_vaga', true)
    if (data) setParticipantes(data)
  }

  async function atualizarInfoVan(campo: string, valor: any) {
    await supabase.from('retiros').update({ [campo]: valor }).eq('id', idRetiro)
    setRetiros(prev => prev.map(r => r.id === idRetiro ? { ...r, [campo]: valor } : r))
  }

  async function mudarStatus(id: string, novoStatus: string) {
    await supabase.from('usuarios').update({ transporte_tipo: novoStatus }).eq('id', id)
    carregarParticipantes()
  }

  // NOVA FUNÇÃO: Grava o valor no campo valor_van
  async function togglePagamentoVan(id: string, statusAtual: boolean, taxa: number) {
    const novoStatus = !statusAtual
    const valorParaGravar = novoStatus ? taxa : 0
    
    await supabase.from('usuarios')
      .update({ 
        pago_van: novoStatus,
        valor_van: valorParaGravar 
      })
      .eq('id', id)
    
    carregarParticipantes()
  }

  const motoristas = participantes.filter(p => p.transporte_tipo === 'OFERECE_CARONA')
  const passageiros = participantes.filter(p => p.transporte_tipo === 'PRECISA_CARONA')
  const vaoDireto = participantes.filter(p => !p.transporte_tipo || p.transporte_tipo === 'VAI_DIRETO')

  const totalPassageiros = passageiros.length
  const taxaIndividual = totalPassageiros > 0 ? custoTotalVan / totalPassageiros : 0
  
  // Cálculo baseado no que já está no banco
  const totalRecebido = passageiros.reduce((acc, p) => acc + Number(p.valor_van || 0), 0)
  const faltaReceber = custoTotalVan - totalRecebido

  if (loading) return <div className="p-20 text-center font-serif text-stone-400">Sincronizando logística...</div>

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-4 md:p-10 font-serif text-stone-800">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl font-light italic">Logística do Retiro</h1>
          <select value={idRetiro} onChange={(e) => setIdRetiro(e.target.value)} className="p-2 bg-white border border-stone-200 rounded-xl text-sm outline-none shadow-sm">
            {retiros.map(r => <option key={r.id} value={r.id}>{r.titulo}</option>)}
          </select>
        </header>

        {/* CONTROLE DA VAN */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <button 
            onClick={() => {
              const novo = !temVan
              setTemVan(novo)
              atualizarInfoVan('tem_van', novo)
            }}
            className={`px-6 py-2 rounded-full text-[10px] font-bold tracking-widest border transition-all ${temVan ? 'bg-stone-800 text-white' : 'bg-white text-stone-400 border-stone-200'}`}
          >
            {temVan ? '✓ VAN ATIVADA' : '+ ATIVAR LOGÍSTICA DE VAN'}
          </button>
          <p className="text-[9px] text-stone-400 uppercase tracking-widest">A ativação habilita a cobrança individual</p>
        </div>

        {temVan && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 animate-in fade-in duration-500">
            <div className="p-6 bg-white border border-stone-200 rounded-[2rem] shadow-sm">
              <h2 className="text-[10px] font-bold uppercase text-stone-400 mb-2">Custo Contratado (Van)</h2>
              <div className="flex items-center gap-2 border-b border-stone-100">
                <span className="text-stone-300">R$</span>
                <input 
                  type="number" 
                  value={custoTotalVan} 
                  onChange={(e) => setCustoTotalVan(Number(e.target.value))}
                  onBlur={(e) => atualizarInfoVan('valor_total_van', Number(e.target.value))}
                  className="text-2xl font-light outline-none bg-transparent w-full"
                />
              </div>
            </div>

            <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem]">
              <h2 className="text-[10px] font-bold uppercase text-amber-600 mb-2">Taxa por Passageiro</h2>
              <p className="text-3xl font-light text-stone-800">R$ {taxaIndividual.toFixed(2)}</p>
              <p className="text-[9px] text-amber-700 opacity-70 mt-1 italic">* Valor total / {totalPassageiros} pessoas</p>
            </div>

            <div className="p-6 bg-stone-800 text-white rounded-[2rem] shadow-lg">
              <h2 className="text-[10px] font-bold uppercase text-stone-400 mb-2">Status Financeiro</h2>
              <p className="text-xs opacity-70">Falta coletar:</p>
              <p className="text-2xl font-bold text-amber-200">R$ {faltaReceber.toFixed(2)}</p>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-4">🚗 Motoristas ({motoristas.length})</h3>
            {motoristas.map(u => (
              <CardParticipante key={u.id} u={u} mudarStatus={mudarStatus} />
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-4">🚐 Passageiros ({passageiros.length})</h3>
            {passageiros.map(u => (
              <CardParticipante 
                key={u.id} 
                u={u} 
                mudarStatus={mudarStatus} 
                border="border-l-4 border-l-amber-200"
                mostrarPagamento={temVan}
                taxa={taxaIndividual}
                togglePagamento={togglePagamentoVan}
              />
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-4">📍 Vão Direto / Outros ({vaoDireto.length})</h3>
            {vaoDireto.map(u => (
              <CardParticipante key={u.id} u={u} mudarStatus={mudarStatus} modoAcao />
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

function CardParticipante({ u, mudarStatus, border = "border-stone-100", modoAcao = false, mostrarPagamento = false, togglePagamento, taxa }: any) {
  return (
    <div className={`bg-white p-5 rounded-3xl border shadow-sm ${border}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium text-sm text-stone-700">{u.nome}</p>
          <p className="text-[10px] text-stone-400">{u.cidade || 'Cidade não informada'}</p>
        </div>
        {!modoAcao && (
          <button onClick={() => mudarStatus(u.id, 'VAI_DIRETO')} className="text-[9px] text-stone-300 font-bold hover:text-red-400 uppercase">Remover</button>
        )}
      </div>

      {u.observacao_viagem && (
        <div className="bg-amber-50/50 p-2 rounded-xl mb-3 border border-amber-100/50">
          <p className="text-[8px] text-amber-600 uppercase font-bold mb-1">Nota do Inscrito:</p>
          <p className="text-[10px] text-stone-600 leading-tight italic">"{u.observacao_viagem}"</p>
        </div>
      )}

      <div className="flex flex-col gap-2 mt-4">
        {u.transporte_tipo === 'OFERECE_CARONA' && (
          <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit">🚗 Disponível: {u.vagas_carro} vagas</p>
        )}

        {mostrarPagamento && (
          <button 
            onClick={() => togglePagamento(u.id, u.pago_van, taxa)}
            className={`w-full py-3 rounded-2xl text-[9px] font-bold border transition-all ${u.pago_van ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white border-stone-100 text-stone-300 hover:border-amber-200 hover:text-amber-600'}`}
          >
            {u.pago_van ? `PAGO (R$ ${Number(u.valor_van).toFixed(2)}) ✓` : `MARCAR PAGO (R$ ${taxa.toFixed(2)})`}
          </button>
        )}

        {modoAcao && (
          <div className="flex gap-2">
            <button onClick={() => mudarStatus(u.id, 'OFERECE_CARONA')} className="flex-1 bg-white border border-stone-100 py-2 rounded-xl text-[8px] font-bold hover:bg-stone-50 uppercase tracking-tighter">Vou Dirigindo</button>
            <button onClick={() => mudarStatus(u.id, 'PRECISA_CARONA')} className="flex-1 bg-white border border-stone-100 py-2 rounded-xl text-[8px] font-bold hover:bg-stone-50 uppercase tracking-tighter">Vou de Comboio</button>
          </div>
        )}
      </div>
    </div>
  )
}