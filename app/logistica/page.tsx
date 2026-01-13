'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PainelLogistica() {
  const [retiros, setRetiros] = useState<any[]>([])
  const [idRetiro, setIdRetiro] = useState('')
  const [participantes, setParticipantes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [temVan, setTemVan] = useState(false)
  const [custoIdaVan, setCustoIdaVan] = useState(0)
  const [custoVoltaVan, setCustoVoltaVan] = useState(0)

  useEffect(() => {
    async function init() {
      const { data } = await supabase
        .from('retiros')
        .select('*')
        .eq('status', 'ABERTO')
        .order('data_inicio', { ascending: true })
      
      if (data && data.length > 0) {
        setRetiros(data)
        const primeiro = data[0]
        setIdRetiro(primeiro.id)
        setTemVan(primeiro.tem_van || false)
        setCustoIdaVan(primeiro.valor_ida_van || 840) 
        setCustoVoltaVan(primeiro.valor_volta_van || 840)
      }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (idRetiro) {
      carregarParticipantes()
      const r = retiros.find(ret => ret.id === idRetiro)
      if (r) setTemVan(r.tem_van || false)
    }
  }, [idRetiro])

  async function carregarParticipantes() {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('retiro_id', idRetiro)
      .eq('ocupa_vaga', true)
      .eq('role', 'INSCRITO')
      .order('nome', { ascending: true })
    if (data) setParticipantes(data)
  }

  async function atualizarConfigRetiro(campo: string, valor: any) {
    await supabase.from('retiros').update({ [campo]: valor }).eq('id', idRetiro)
    setRetiros(prev => prev.map(r => r.id === idRetiro ? { ...r, [campo]: valor } : r))
  }

  async function mudarVagasCarro(id: string, vagas: number) {
    await supabase.from('usuarios').update({ vagas_carro: vagas }).eq('id', id)
    carregarParticipantes()
  }

  async function toggleTrecho(id: string, campo: string, estadoAtual: boolean) {
    await supabase.from('usuarios').update({ [campo]: !estadoAtual }).eq('id', id)
    carregarParticipantes()
  }

  async function mudarStatus(id: string, novoStatus: string) {
    await supabase.from('usuarios').update({ transporte_tipo: novoStatus }).eq('id', id)
    carregarParticipantes()
  }

  async function togglePagamentoVan(id: string, statusAtual: boolean, valorCalculado: number) {
    const novoStatus = !statusAtual
    await supabase.from('usuarios')
      .update({ pago_van: novoStatus, valor_van: novoStatus ? valorCalculado : 0 })
      .eq('id', id)
    carregarParticipantes()
  }

  // CÁLCULOS
  const motoristas = participantes.filter(p => p.transporte_tipo === 'OFERECE_CARONA')
  const passageiros = participantes.filter(p => p.transporte_tipo === 'PRECISA_CARONA')
  const vaoDireto = participantes.filter(p => !p.transporte_tipo || p.transporte_tipo === 'VAI_DIRETO')

  const totalVagasOferecidas = motoristas.reduce((acc, m) => acc + (m.vagas_carro || 0), 0)
  const deficitVagas = passageiros.length - totalVagasOferecidas

  const totalIda = passageiros.filter(p => p.van_ida).length
  const totalVolta = passageiros.filter(p => p.van_volta).length

  const taxaIda = totalIda > 0 ? custoIdaVan / totalIda : 0
  const taxaVolta = totalVolta > 0 ? custoVoltaVan / totalVolta : 0

  const totalArrecadadoVan = passageiros.reduce((acc, p) => acc + Number(p.valor_van || 0), 0)
  const custoTotalVan = custoIdaVan + custoVoltaVan
  const saldoPendenteVan = custoTotalVan - totalArrecadadoVan

  if (loading) return <div className="p-20 text-center font-serif text-stone-400 italic">Sincronizando transporte... 🚐🚗</div>

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-4 md:p-10 font-serif text-stone-800">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-stone-100 pb-6">
          <div>
            <h1 className="text-2xl font-light italic">Logística de Viagem</h1>
            <div className="flex gap-4 mt-2 font-sans">
               <span className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">🏠 {totalVagasOferecidas} Vagas em Carros</span>
               <span className={`text-[10px] uppercase font-bold tracking-widest ${deficitVagas > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                 {deficitVagas > 0 ? `⚠️ Faltam ${deficitVagas} lugares` : '✅ Lugares Suficientes'}
               </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const novo = !temVan
                setTemVan(novo)
                atualizarConfigRetiro('tem_van', novo)
              }}
              className={`px-6 py-2 rounded-full text-[9px] font-bold tracking-widest border transition-all font-sans ${temVan ? 'bg-stone-800 text-white border-stone-800 shadow-lg' : 'bg-white text-stone-400 border-stone-200'}`}
            >
              {temVan ? '✓ VAN HABILITADA' : '+ HABILITAR VAN'}
            </button>

            <select value={idRetiro} onChange={(e) => setIdRetiro(e.target.value)} className="p-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-600 outline-none font-sans">
              {retiros.map(r => <option key={r.id} value={r.id}>{r.titulo}</option>)}
            </select>
          </div>
        </header>

        {temVan && (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 animate-in fade-in duration-500 font-sans">
            <div className="p-6 bg-white border border-stone-200 rounded-3xl shadow-sm">
              <h2 className="text-[9px] font-bold uppercase text-stone-400 mb-2 tracking-widest">Custos Contratados</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-stone-400 uppercase tracking-tighter">Motorista Ida:</span>
                  <input 
                    type="number" 
                    value={custoIdaVan} 
                    onChange={(e) => setCustoIdaVan(Number(e.target.value))} 
                    onBlur={() => atualizarConfigRetiro('valor_ida_van', custoIdaVan)}
                    className="text-right font-bold outline-none w-20 bg-stone-50 rounded px-1" 
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-stone-400 uppercase tracking-tighter">Motorista Volta:</span>
                  <input 
                    type="number" 
                    value={custoVoltaVan} 
                    onChange={(e) => setCustoVoltaVan(Number(e.target.value))} 
                    onBlur={() => atualizarConfigRetiro('valor_volta_van', custoVoltaVan)}
                    className="text-right font-bold outline-none w-20 bg-stone-50 rounded px-1" 
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl shadow-sm">
              <h2 className="text-[9px] font-bold uppercase text-emerald-600 mb-2 tracking-widest">Total Arrecadado</h2>
              <p className="text-2xl font-bold text-emerald-700">R$ {totalArrecadadoVan.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-emerald-600/70 mt-1 uppercase font-bold tracking-tighter italic">Dinheiro em Caixa</p>
            </div>

            <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl shadow-sm">
              <h2 className="text-[9px] font-bold uppercase text-amber-600 mb-2 tracking-widest">Saldo à Receber</h2>
              <p className="text-2xl font-bold text-amber-700">R$ {Math.max(0, saldoPendenteVan).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-amber-600/70 mt-1 uppercase font-bold tracking-tighter italic">Pendências da Van</p>
            </div>

            {/* CARD DE RATEIO COM SOMA TOTAL */}
            <div className="p-6 bg-stone-800 text-white rounded-3xl shadow-xl flex flex-col justify-center">
              <h2 className="text-[9px] font-bold uppercase text-stone-400 mb-2 tracking-widest text-amber-200/50">Rateio Individual</h2>
              <div className="space-y-0.5 border-b border-white/10 pb-2 mb-2">
                <p className="text-xs text-stone-300 flex justify-between">Ida: <span className="text-white font-medium">R$ {taxaIda.toFixed(2)}</span></p>
                <p className="text-xs text-stone-300 flex justify-between">Volta: <span className="text-white font-medium">R$ {taxaVolta.toFixed(2)}</span></p>
              </div>
              <p className="text-sm font-bold text-amber-200 flex justify-between items-center">
                <span className="text-[9px] uppercase tracking-widest opacity-70">Total:</span> 
                R$ {(taxaIda + taxaVolta).toFixed(2)}
              </p>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* COLUNA MOTORISTAS */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-4 flex justify-between font-sans">
              <span>🚗 Motoristas Carona</span>
              <span className="bg-stone-200 text-stone-600 px-2 rounded-full">{motoristas.length}</span>
            </h3>
            {motoristas.map(u => (
              <CardParticipante 
                key={u.id} u={u} mudarStatus={mudarStatus} 
                tipo="MOTORISTA"
                mudarVagas={mudarVagasCarro}
              />
            ))}
          </div>

          {/* COLUNA PASSAGEIROS */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-4 flex justify-between font-sans">
              <span>{temVan ? '🚐 Passageiros Van' : '👣 Precisa de Vaga'}</span>
              <span className="bg-stone-200 text-stone-600 px-2 rounded-full">{passageiros.length}</span>
            </h3>
            {passageiros.map(u => {
              const valorIndividual = (u.van_ida ? taxaIda : 0) + (u.van_volta ? taxaVolta : 0);
              return (
                <CardParticipante 
                  key={u.id} u={u} 
                  mudarStatus={mudarStatus} 
                  mostrarPagamento={temVan}
                  taxa={valorIndividual}
                  togglePagamento={togglePagamentoVan}
                  toggleTrecho={toggleTrecho}
                  tipo="PASSAGEIRO"
                />
              )
            })}
          </div>

          {/* COLUNA VÃO DIRETO */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-4 flex justify-between italic font-sans">
              <span>📍 Vão Direto</span>
              <span className="bg-stone-100 text-stone-400 px-2 rounded-full">{vaoDireto.length}</span>
            </h3>
            {vaoDireto.map(u => (
              <CardParticipante key={u.id} u={u} mudarStatus={mudarStatus} modoAcao tipo="DIRETO" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CardParticipante({ u, mudarStatus, modoAcao, mostrarPagamento, togglePagamento, taxa, toggleTrecho, tipo, mudarVagas }: any) {
  return (
    <div className={`bg-white p-5 rounded-[2.2rem] border border-stone-100 shadow-sm group hover:border-amber-200 transition-all font-sans`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <p className="font-bold text-sm text-stone-800 leading-tight">{u.nome}</p>
          <p className="text-[9px] text-stone-400 uppercase font-bold tracking-tighter">{u.cidade || '—'}</p>
        </div>
        {!modoAcao && (
          <button onClick={() => mudarStatus(u.id, 'VAI_DIRETO')} className="text-[8px] text-stone-300 hover:text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">REMOVER</button>
        )}
      </div>

      {tipo === 'MOTORISTA' && (
        <div className="mt-2 mb-3 flex items-center justify-between bg-stone-50 p-3 rounded-2xl border border-stone-100">
           <span className="text-[10px] font-bold text-stone-500 uppercase">Vagas Livres:</span>
           <div className="flex items-center gap-2">
              <button onClick={() => mudarVagas(u.id, Math.max(0, (u.vagas_carro || 0) - 1))} className="w-6 h-6 rounded-full border border-stone-200 flex items-center justify-center text-xs hover:bg-stone-800 hover:text-white transition-all">-</button>
              <span className="text-sm font-bold w-4 text-center">{u.vagas_carro || 0}</span>
              <button onClick={() => mudarVagas(u.id, (u.vagas_carro || 0) + 1)} className="w-6 h-6 rounded-full border border-stone-200 flex items-center justify-center text-xs hover:bg-stone-800 hover:text-white transition-all">+</button>
           </div>
        </div>
      )}

      {tipo === 'PASSAGEIRO' && mostrarPagamento && (
        <>
          <div className="flex gap-2 mb-4 bg-stone-50 p-2 rounded-2xl border border-stone-100">
            <button 
              onClick={() => toggleTrecho(u.id, 'van_ida', u.van_ida)}
              className={`flex-1 py-1.5 rounded-xl text-[8px] font-bold transition-all ${u.van_ida ? 'bg-white shadow-sm text-stone-800' : 'text-stone-300'}`}
            >
              {u.van_ida ? '✓ IDA' : 'IDA'}
            </button>
            <button 
              onClick={() => toggleTrecho(u.id, 'van_volta', u.van_volta)}
              className={`flex-1 py-1.5 rounded-xl text-[8px] font-bold transition-all ${u.van_volta ? 'bg-white shadow-sm text-stone-800' : 'text-stone-300'}`}
            >
              {u.van_volta ? '✓ VOLTA' : 'VOLTA'}
            </button>
          </div>
          <button 
            onClick={() => togglePagamento(u.id, u.pago_van, taxa)}
            className={`w-full py-3.5 rounded-2xl text-[10px] font-bold border transition-all ${
              u.pago_van ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-stone-200 text-stone-400 hover:border-emerald-300'
            }`}
          >
            {u.pago_van ? `✓ PAGO R$ ${Number(u.valor_van).toFixed(2)}` : `MARCAR PAGO (R$ ${taxa.toFixed(2)})`}
          </button>
        </>
      )}

      {modoAcao && (
        <div className="flex gap-2 mt-2">
          <button onClick={() => mudarStatus(u.id, 'OFERECE_CARONA')} className="flex-1 border py-2.5 rounded-xl text-[8px] font-bold uppercase text-stone-400 hover:bg-stone-800 hover:text-white transition-all">Vou Dirigindo</button>
          <button onClick={() => mudarStatus(u.id, 'PRECISA_CARONA')} className="flex-1 border py-2.5 rounded-xl text-[8px] font-bold uppercase text-stone-400 hover:bg-stone-800 hover:text-white transition-all">Vou de Van</button>
        </div>
      )}
    </div>
  )
}