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
    data: '', tipo: 'ALMOÇO', descricao: '', horario: '13h00' 
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
      supabase.from('cardapio').select('*').eq('retiro_id', id).order('data_refeicao', { ascending: true }).order('horario', { ascending: true }),
      supabase.from('lista_compras').select('*').eq('retiro_id', id).order('created_at', { ascending: true })
    ])
    if (part.data) setParticipantes(part.data)
    if (card.data) setCardapio(card.data)
    if (comp.data) setListaCompras(comp.data)

    // Sugestão de data inteligente
    if (card.data && card.data.length > 0) {
      const ultima = card.data.reduce((a: any, b: any) => a.data_refeicao > b.data_refeicao ? a : b).data_refeicao
      setEditandoRefeicao(prev => ({ ...prev, data: ultima }))
    } else if (retiro) {
      setEditandoRefeicao(prev => ({ ...prev, data: retiro.data_inicio }))
    }
  }

  async function salvarRefeicao() {
    if (!editandoRefeicao.data || !editandoRefeicao.descricao) return alert("Preencha Data e Descrição")
    const { error } = await supabase.from('cardapio').upsert([{ 
      retiro_id: retiro.id, 
      data_refeicao: editandoRefeicao.data,
      tipo: editandoRefeicao.tipo,
      descricao: editandoRefeicao.descricao,
      horario: editandoRefeicao.horario
    }], { onConflict: 'retiro_id, data_refeicao, horario' })

    if (!error) {
      setEditandoRefeicao(prev => ({ ...prev, descricao: '' }))
      carregarTudo(retiro.id)
    } else { alert(error.message) }
  }

  async function apagarRefeicao(id: string) {
    if (!confirm("Apagar?")) return
    // Remove da tela na hora
    setCardapio(prev => prev.filter(i => i.id !== id))
    const { error } = await supabase.from('cardapio').delete().eq('id', id)
    if (error) carregarTudo(retiro.id)
  }

  async function adicionarCompra() {
    if (!novoItem.item) return
    await supabase.from('lista_compras').insert([{ ...novoItem, retiro_id: retiro.id }])
    setNovoItem({ item: '', quantidade: '' })
    carregarTudo(retiro.id)
  }

  const gerarPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default
    html2pdf().set({ margin: 10, filename: 'cardapio.pdf', html2canvas: { scale: 2 } })
      .from(document.getElementById('pdf-cardapio')).save()
  }

  if (loading) return <div className="p-20 text-center font-serif italic">Sincronizando...</div>

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-4 md:p-10 font-serif text-stone-800">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b pb-4">
          <h1 className="text-xl italic">{retiro?.titulo}</h1>
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
            <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="date" className="p-3 rounded-xl text-sm" value={editandoRefeicao.data} onChange={e => setEditandoRefeicao({...editandoRefeicao, data: e.target.value})} />
              <select className="p-3 rounded-xl text-sm" value={editandoRefeicao.horario} onChange={e => setEditandoRefeicao({...editandoRefeicao, horario: e.target.value})}>
                {['9h00', '11h45', '12h15', '13h00', '16h00', '18h00'].map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <select className="p-3 rounded-xl text-sm" value={editandoRefeicao.tipo} onChange={e => setEditandoRefeicao({...editandoRefeicao, tipo: e.target.value})}>
                {['CAFÉ DA MANHÃ', 'LANCHE', 'ALMOÇO', 'JANTAR'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea placeholder="Descrição..." className="md:col-span-3 p-4 rounded-xl text-sm h-24" value={editandoRefeicao.descricao} onChange={e => setEditandoRefeicao({...editandoRefeicao, descricao: e.target.value})} />
              <button onClick={salvarRefeicao} className="md:col-span-3 bg-stone-800 text-white p-3 rounded-xl font-bold uppercase text-xs">Salvar</button>
            </div>
            <button onClick={gerarPDF} className="text-[10px] font-bold uppercase border-b border-black">Gerar PDF para Impressão</button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cardapio.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-2xl border flex justify-between items-start group">
                  <div>
                    <span className="text-[9px] font-bold text-amber-600 uppercase">{new Date(item.data_refeicao + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <h4 className="font-bold text-sm">{item.horario} {item.tipo}</h4>
                    <p className="text-xs text-stone-500 italic whitespace-pre-line mt-1">{item.descricao}</p>
                  </div>
                  <button onClick={() => apagarRefeicao(item.id)} className="text-red-400 text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 p-2">Apagar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {abaAtiva === 'resumo' && (
          <div className="space-y-4">
            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
              <p className="text-[10px] font-bold uppercase">Veganos</p>
              <p className="text-2xl">{participantes.filter(p => p.dieta_tipo === 'VEGANO').length}</p>
            </div>
            {participantes.filter(p => p.alergias_restricoes?.length > 2).map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl border-l-4 border-l-red-200 shadow-sm flex justify-between">
                <span className="text-sm font-medium">{p.nome}</span>
                <span className="text-xs text-red-500 italic font-bold">{p.alergias_restricoes}</span>
              </div>
            ))}
          </div>
        )}

        {abaAtiva === 'compras' && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <input placeholder="Item..." className="flex-1 p-4 bg-white rounded-2xl shadow-sm text-sm" value={novoItem.item} onChange={e => setNovoItem({...novoItem, item: e.target.value})} />
              <input placeholder="Qtd" className="w-24 p-4 bg-white rounded-2xl shadow-sm text-sm" value={novoItem.quantidade} onChange={e => setNovoItem({...novoItem, quantidade: e.target.value})} />
              <button onClick={adicionarCompra} className="bg-emerald-600 text-white px-8 rounded-2xl font-bold">+</button>
            </div>
            <div className="bg-white rounded-[2rem] shadow-sm divide-y divide-stone-100 overflow-hidden border border-stone-100">
              {listaCompras.map(c => (
                <div key={c.id} className="p-4 flex justify-between items-center">
                  <span className="text-sm">{c.item} ({c.quantidade})</span>
                  <input type="checkbox" checked={c.comprado} onChange={async () => { await supabase.from('lista_compras').update({comprado: !c.comprado}).eq('id', c.id); carregarTudo(retiro.id); }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF HIDDEN */}
        <div style={{ display: 'none' }}>
          <div id="pdf-cardapio" style={{ padding: '40px', color: 'black', fontFamily: 'sans-serif' }}>
             <h1 style={{ textAlign: 'center', textTransform: 'uppercase' }}>CARDÁPIO {retiro?.titulo}</h1>
             {Array.from(new Set(cardapio.map(i => i.data_refeicao))).map(data => (
              <div key={data} style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                <h3 style={{ borderBottom: '1px solid black', textTransform: 'uppercase' }}>{new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'numeric' })}</h3>
                {cardapio.filter(i => i.data_refeicao === data).map(item => (
                  <div key={item.id} style={{ marginBottom: '10px' }}>
                    <p style={{ fontWeight: 'bold', margin: '0' }}>{item.horario} {item.tipo}:</p>
                    <p style={{ fontSize: '12px', margin: '0 0 0 10px' }}>{item.descricao}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}