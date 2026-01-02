'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PainelCozinha() {
  const [abaAtiva, setAbaAtiva] = useState('cardapio')
  const [retiro, setRetiro] = useState<any>(null)
  const [participantes, setParticipantes] = useState<any[]>([])
  const [cardapio, setCardapio] = useState<any[]>([])
  const [listaCompras, setListaCompras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [novoItem, setNovoItem] = useState({ item: '', quantidade: '' })
  const [editandoRefeicao, setEditandoRefeicao] = useState({ 
    data: '', tipo: 'ALMOÇO', descricao: '', horario: '13:00' 
  })

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: retirosData } = await supabase.from('retiros').select('*').eq('status', 'ABERTO').limit(1).single()
    if (retirosData) {
      setRetiro(retirosData)
      await carregarTudo(retirosData.id)
    }
    setLoading(false)
  }

  async function carregarTudo(id: string) {
    const [part, card, comp] = await Promise.all([
      supabase.from('usuarios').select('*').eq('retiro_id', id).eq('ocupa_vaga', true),
      // Ordenação no banco por data e depois por horário
      supabase.from('cardapio').select('*').eq('retiro_id', id).order('data_refeicao', { ascending: true }).order('horario', { ascending: true }),
      supabase.from('lista_compras').select('*').eq('retiro_id', id).order('created_at', { ascending: true })
    ])
    if (part.data) setParticipantes(part.data)
    if (card.data) setCardapio(card.data)
    if (comp.data) setListaCompras(comp.data)

    if (card.data && card.data.length > 0) {
      const ultima = card.data.reduce((a: any, b: any) => a.data_refeicao > b.data_refeicao ? a : b).data_refeicao
      setEditandoRefeicao(prev => ({ ...prev, data: ultima }))
    } else if (retiro) {
      setEditandoRefeicao(prev => ({ ...prev, data: retiro.data_inicio }))
    }
  }

  async function salvarRefeicao() {
    if (!editandoRefeicao.data || !editandoRefeicao.descricao) return alert("Preencha Data e Descrição")
    
    // Normaliza o horário para garantir ordem (ex: 9:00 vira 09:00)
    let horaFormatada = editandoRefeicao.horario.padStart(5, '0');

    const { error } = await supabase.from('cardapio').upsert([{ 
      retiro_id: retiro.id, 
      data_refeicao: editandoRefeicao.data,
      tipo: editandoRefeicao.tipo,
      descricao: editandoRefeicao.descricao,
      horario: horaFormatada
    }], { onConflict: 'retiro_id, data_refeicao, horario' })

    if (!error) {
      setEditandoRefeicao(prev => ({ ...prev, descricao: '' }))
      carregarTudo(retiro.id)
    } else { alert(error.message) }
  }

  async function apagarRefeicao(id: string) {
    if (!confirm("Apagar?")) return
    const { error } = await supabase.from('cardapio').delete().eq('id', id)
    if (!error) carregarTudo(retiro.id)
  }

  if (loading) return <div className="p-20 text-center font-serif italic text-stone-400">Carregando painel...</div>

  // Agrupamento e ordenação para a impressão
  const datasUnicas = Array.from(new Set(cardapio.map(i => i.data_refeicao))).sort();

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-serif text-stone-800">
      
      {/* INTERFACE DO SISTEMA - ESCONDIDA NA IMPRESSÃO */}
      <div className="print:hidden p-4 md:p-10 max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b pb-4">
          <h1 className="text-xl italic">{retiro?.titulo || 'Cozinha'}</h1>
          <nav className="flex gap-2 bg-stone-100 p-1 rounded-xl">
            {['cardapio', 'resumo', 'compras'].map(aba => (
              <button key={aba} onClick={() => setAbaAtiva(aba)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase ${abaAtiva === aba ? 'bg-white shadow' : 'text-stone-400'}`}>
                {aba === 'resumo' ? 'Alergias' : aba}
              </button>
            ))}
          </nav>
        </header>

        {abaAtiva === 'cardapio' && (
          <div className="space-y-6">
            {/* Formulário de Cadastro */}
            <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-inner">
              <input type="date" className="p-3 rounded-xl text-sm border-none shadow-sm" value={editandoRefeicao.data} onChange={e => setEditandoRefeicao({...editandoRefeicao, data: e.target.value})} />
              <select className="p-3 rounded-xl text-sm border-none shadow-sm" value={editandoRefeicao.horario} onChange={e => setEditandoRefeicao({...editandoRefeicao, horario: e.target.value})}>
                {['08:00', '09:00', '10:00', '12:00', '13:00', '16:00', '18:00', '19:30', '20:00'].map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <select className="p-3 rounded-xl text-sm border-none shadow-sm" value={editandoRefeicao.tipo} onChange={e => setEditandoRefeicao({...editandoRefeicao, tipo: e.target.value})}>
                {['CAFÉ DA MANHÃ', 'LANCHE', 'ALMOÇO', 'JANTAR', 'CEIA'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea placeholder="O que teremos para comer? (Ex: Arroz, feijão, salada de rúcula...)" className="md:col-span-3 p-4 rounded-xl text-sm h-24 border-none shadow-sm" value={editandoRefeicao.descricao} onChange={e => setEditandoRefeicao({...editandoRefeicao, descricao: e.target.value})} />
              <button onClick={salvarRefeicao} className="md:col-span-3 bg-stone-800 text-white p-3 rounded-xl font-bold uppercase text-xs hover:bg-black transition-all">Atualizar Cardápio</button>
            </div>

            <div className="flex justify-between items-center pt-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Visualização do Cardápio</h3>
              <button onClick={() => window.print()} className="px-5 py-2 bg-emerald-700 text-white rounded-full text-[10px] font-bold uppercase shadow-lg hover:bg-emerald-800 transition-all flex items-center gap-2">
                <span>🖨️</span> Imprimir / Salvar PDF
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cardapio.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-2xl border flex justify-between items-start group hover:shadow-md transition-all">
                  <div>
                    <span className="text-[9px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded">
                      {new Date(item.data_refeicao + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <h4 className="font-bold text-sm mt-2">{item.horario} - {item.tipo}</h4>
                    <p className="text-xs text-stone-500 italic whitespace-pre-line mt-1">{item.descricao}</p>
                  </div>
                  <button onClick={() => apagarRefeicao(item.id)} className="text-red-300 hover:text-red-600 text-[10px] font-bold uppercase p-2">Excluir</button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Outras abas (Alergias/Compras) continuam aqui... */}
      </div>

      {/* --- ÁREA DE IMPRESSÃO (Otimizada e Ordenada) --- */}
      <div className="hidden print:block bg-white text-black p-0 m-0">
        {datasUnicas.map((data, index) => (
          <div key={data} className={`p-12 h-screen ${index !== datasUnicas.length - 1 ? 'break-after-page' : ''}`} style={{ pageBreakAfter: 'always' }}>
            <div className="border-4 border-black p-8 h-full flex flex-col">
              <header className="text-center border-b-2 border-black pb-6 mb-8">
                <p className="text-sm uppercase tracking-widest mb-2">Cardápio do Dia</p>
                <h1 className="text-4xl font-black uppercase">
                  {new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}
                </h1>
                <p className="text-xl">
                  {new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </header>

              <div className="flex-1 space-y-10">
                {cardapio
                  .filter(i => i.data_refeicao === data)
                  .sort((a, b) => a.horario.localeCompare(b.horario))
                  .map(item => (
                    <div key={item.id} className="relative pl-6 border-l-2 border-gray-300">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 bg-black rounded-full"></div>
                      <div className="flex items-baseline gap-4 mb-1">
                        <span className="text-2xl font-black">{item.horario}</span>
                        <span className="text-lg font-bold uppercase text-gray-600">{item.tipo}</span>
                      </div>
                      <p className="text-xl italic leading-relaxed text-gray-800 whitespace-pre-line">
                        {item.descricao}
                      </p>
                    </div>
                ))}
              </div>

              <footer className="mt-auto pt-8 border-t border-gray-200 flex justify-between text-[10px] uppercase text-gray-400 tracking-widest">
                <span>{retiro?.titulo}</span>
                <span>Organização de Cozinha</span>
              </footer>
            </div>
          </div>
        ))}
      </div>

      {/* CSS extra para garantir a quebra de página no navegador */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .break-after-page { page-break-after: always !important; break-after: page !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  )
}