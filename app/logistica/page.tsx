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
      // Busca retiros abertos para inicializar o painel
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
    // FILTRO: Apenas quem ocupa vaga e está com role 'INSCRITO'
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('retiro_id', idRetiro)
      .eq('ocupa_vaga', true)
      .eq('role', 'INSCRITO')
      .order('nome', { ascending: true })

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
  
  const totalRecebido = passageiros.reduce((acc, p) => acc + Number(p.valor_van || 0), 0)
  const faltaReceber = custoTotalVan - totalRecebido

  if (loading) return <div className="p-20 text-center font-serif text-stone-400 italic font-light">Sincronizando logística de viagem... ☸️</div>

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-4 md:p-10 font-serif text-stone-800">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-stone-100 pb-6">
          <div>
            <h1 className="text-2xl font-light italic">Logística do Retiro</h1>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Apenas participantes confirmados (Inscritos)</p>
          </div>
          <select 
            value={idRetiro} 
            onChange={(e) => setIdRetiro(e.target.value)} 
            className="p-3 bg-white border border-stone-200 rounded-2xl text-sm outline-none shadow-sm font-bold text-stone-600"
          >
            {retiros.map(r => <option key={r.id} value={r.id}>{r.titulo}</option>)}
          </select>
        </header>

        {/* CONTROLE DA VAN */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <button 
            onClick={() => {
              const novo = !temVan
              setTemVan(novo)
              atualizarInfoVan('tem_van', novo)
            }}
            className={`px-8 py-3 rounded-full text-[10px] font-bold tracking-[0.2em] border transition-all ${temVan ? 'bg-stone-800 text-white shadow-xl border-stone-800' : 'bg-white text-stone-400 border-stone-200'}`}
          >
            {temVan ? '✓ LOGÍSTICA DE VAN ATIVA' : '+ ATIVAR CONTRATAÇÃO DE VAN'}
          </button>
        </div>

        {temVan && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="p-8 bg-white border border-stone-200 rounded-[2.5rem] shadow-sm">
              <h2 className="text-[10px] font-bold uppercase text-stone-400 mb-3 tracking-widest">Custo da Van</h2>
              <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                <span className="text-stone-300 font-sans">R$</span>
                <input 
                  type="number" 
                  value={custoTotalVan} 
                  onChange={(e) => setCustoTotalVan(Number(e.target.value))}
                  onBlur={(e) => atualizarInfoVan('valor_total_van', Number(e.target.value))}
                  className="text-3xl font-light outline-none bg-transparent w-full font-sans"
                />
              </div>
            </div>

            <div className="p-8 bg-amber-50/50 border border-amber-100 rounded-[2.5rem]">
              <h2 className="text-[10px] font-bold uppercase text-amber-600 mb-3 tracking-widest">Custo por Pessoa</h2>
              <p className="text-4xl font-light text-stone-800 font-sans">R$ {taxaIndividual.toFixed(2)}</p>
              <p className="text-[9px] text-amber-700/60 mt-2 italic">* Rateio entre {totalPassageiros} passageiros</p>
            </div>

            <div className="p-8 bg-stone-800 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-[10px] font-bold uppercase text-stone-400 mb-3 tracking-widest text-amber-200/50">Saldo Pendente</h2>
                <p className="text-xs opacity-60 mb-1 italic font-light font-sans">A arrecadar:</p>
                <p className="text-3xl font-bold text-amber-200 font-sans tracking-tight">R$ {faltaReceber.toFixed(2)}</p>
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] text-7xl opacity-10 grayscale">🚐</div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-6 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Motoristas ({motoristas.length})
            </h3>
            {motoristas.map(u => (
              <CardParticipante key={u.id} u={u} mudarStatus={mudarStatus} />
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-6 mb-4">🚐 Passageiros ({passageiros.length})</h3>
            {passageiros.map(u => (
              <CardParticipante 
                key={u.id} 
                u={u} 
                mudarStatus={mudarStatus} 
                border="border-l-4 border-l-amber-300"
                mostrarPagamento={temVan}
                taxa={taxaIndividual}
                togglePagamento={togglePagamentoVan}
              />
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-6 mb-4 italic">📍 Vão Direto ({vaoDireto.length})</h3>
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
    <div className={`bg-white p-6 rounded-[2rem] border shadow-sm transition-all hover:shadow-md group ${border}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <p className="font-bold text-[15px] text-stone-800 leading-tight">{u.nome}</p>
          
          {/* CONTATOS: WHATSAPP E TELEFONE */}
          <div className="flex items-center gap-3 mt-2">
            <a 
              href={`https://wa.me/${u.whatsapp?.replace(/\D/g, '')}`} 
              target="_blank" 
              className="text-[11px] text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-1 transition-colors"
            >
              <span className="text-sm">📱</span> {u.whatsapp || '—'}
            </a>
            {u.whatsapp && (
              <a 
                href={`tel:${u.whatsapp.replace(/\D/g, '')}`} 
                className="w-6 h-6 flex items-center justify-center bg-stone-50 rounded-full text-xs text-stone-400 hover:bg-stone-800 hover:text-white transition-all"
                title="Ligar para participante"
              >
                📞
              </a>
            )}
          </div>
          <p className="text-[9px] text-stone-400 uppercase font-bold mt-1 tracking-wider italic">{u.cidade || 'Cidade não informada'}</p>
        </div>
        
        {!modoAcao && (
          <button 
            onClick={() => mudarStatus(u.id, 'VAI_DIRETO')} 
            className="text-[9px] text-stone-300 font-bold hover:text-red-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Remover
          </button>
        )}
      </div>

      {u.observacao_viagem && (
        <div className="bg-amber-50/40 p-3 rounded-2xl mb-4 border border-amber-100/50">
          <p className="text-[10px] text-stone-600 leading-relaxed italic">
            <span className="text-amber-600 not-italic font-bold mr-1">“</span>
            {u.observacao_viagem}
            <span className="text-amber-600 not-italic font-bold ml-1">”</span>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 mt-2">
        {u.transporte_tipo === 'OFERECE_CARONA' && (
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
            <span className="text-sm">🚗</span>
            <p className="text-[10px] font-black text-emerald-700 uppercase">Dispõe de {u.vagas_carro} vagas</p>
          </div>
        )}

        {mostrarPagamento && (
          <button 
            onClick={() => togglePagamento(u.id, u.pago_van, taxa)}
            className={`w-full py-3.5 rounded-2xl text-[10px] font-bold border transition-all flex items-center justify-center gap-2 ${
              u.pago_van 
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' 
                : 'bg-white border-stone-200 text-stone-400 hover:border-amber-300 hover:text-amber-700'
            }`}
          >
            {u.pago_van ? (
              <><span>✓</span> PAGO R$ {Number(u.valor_van).toFixed(2)}</>
            ) : (
              <>MARCAR PAGO (R$ {taxa.toFixed(2)})</>
            )}
          </button>
        )}

        {modoAcao && (
          <div className="flex gap-2">
            <button 
              onClick={() => mudarStatus(u.id, 'OFERECE_CARONA')} 
              className="flex-1 bg-white border border-stone-200 py-2.5 rounded-2xl text-[8px] font-bold text-stone-500 hover:bg-stone-800 hover:text-white hover:border-stone-800 uppercase transition-all"
            >
              Vou Dirigindo
            </button>
            <button 
              onClick={() => mudarStatus(u.id, 'PRECISA_CARONA')} 
              className="flex-1 bg-white border border-stone-200 py-2.5 rounded-2xl text-[8px] font-bold text-stone-500 hover:bg-stone-800 hover:text-white hover:border-stone-800 uppercase transition-all"
            >
              Vou de Comboio
            </button>
          </div>
        )}
      </div>
    </div>
  )
}