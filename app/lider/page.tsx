'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardLider() {
  const [dados, setDados] = useState<any>({
    retiro: null,
    inscritos: [],
    cardapio: [],
    compras: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarDashboard() {
      // 1. Busca Retiro Aberto
      const { data: retiro } = await supabase.from('retiros').select('*').eq('status', 'ABERTO').limit(1).single()
      
      if (retiro) {
        // 2. Busca tudo relacionado ao retiro em paralelo
        const [ins, card, comp] = await Promise.all([
          supabase.from('usuarios').select('*').eq('retiro_id', retiro.id).eq('ocupa_vaga', true),
          supabase.from('cardapio').select('*').eq('retiro_id', retiro.id),
          supabase.from('lista_compras').select('*').eq('retiro_id', retiro.id)
        ])

        setDados({
          retiro,
          inscritos: ins.data || [],
          cardapio: card.data || [],
          compras: comp.data || []
        })
      }
      setLoading(false)
    }
    carregarDashboard()
  }, [])

  if (loading) return <div className="p-20 text-center font-serif italic text-stone-400 animate-pulse">Lendo os ventos do retiro...</div>
  if (!dados.retiro) return <div className="p-20 text-center font-serif">Nenhum retiro aberto encontrado.</div>

  // Cálculos de Logística
  const precisaCarona = dados.inscritos.filter((i:any) => i.transporte_tipo === 'PRECISA_CARONA').length
  const ofereceCarona = dados.inscritos.reduce((acc:any, cur:any) => acc + (cur.vagas_carro || 0), 0)
  
  // Cálculos de Cozinha
  const veganos = dados.inscritos.filter((i:any) => i.dieta_tipo === 'VEGANO').length
  const comAlergia = dados.inscritos.filter((i:any) => i.alergias_restricoes && i.alergias_restricoes.length > 3)

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-6 md:p-12 font-serif text-stone-800">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* CABEÇALHO */}
        <header>
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-600 font-bold mb-2">Visão do Líder</p>
          <h1 className="text-4xl font-light italic">{dados.retiro.titulo}</h1>
          <div className="flex gap-4 mt-4 text-[10px] uppercase font-bold text-stone-400">
            <span>📅 {new Date(dados.retiro.data_inicio).toLocaleDateString()}</span>
            <span>📍 {dados.inscritos.length} Inscritos Confirmados</span>
          </div>
        </header>

        {/* CARDS PRINCIPAIS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Inscritos" value={dados.inscritos.length} sub="Vagas ocupadas" icon="📝" color="bg-white" />
          <StatCard title="Veganos" value={veganos} sub="Refeições especiais" icon="🌿" color="bg-emerald-50" />
          <StatCard title="Caronas" value={ofereceCarona} sub={`Vagas para ${precisaCarona} pessoas`} icon="🚗" color="bg-amber-50" />
          <StatCard title="Alergias" value={comAlergia.length} sub="Casos críticos" icon="⚠️" color="bg-red-50" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* COLUNA: COZINHA & LOGÍSTICA */}
          <div className="space-y-8">
            <section className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
              <h3 className="text-xs uppercase font-bold tracking-widest mb-6 border-b pb-2">Status da Cozinha</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cardápio Lançado</span>
                  <span className="text-sm font-bold">{dados.cardapio.length} refeições</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Itens de Compra</span>
                  <span className="text-sm font-bold text-emerald-600">{dados.compras.filter((c:any) => c.comprado).length} / {dados.compras.length} OK</span>
                </div>
                {comAlergia.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-red-800 uppercase mb-2">Alergias Detectadas:</p>
                    <ul className="text-xs text-red-700 space-y-1">
                      {comAlergia.slice(0, 3).map((i:any) => (
                        <li key={i.id}>• {i.nome}: {i.alergias_restricoes}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
              <h3 className="text-xs uppercase font-bold tracking-widest mb-6 border-b pb-2">Resumo de Logística</h3>
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400" 
                      style={{ width: `${(ofereceCarona / precisaCarona) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] mt-2 text-stone-400 font-bold uppercase">Cobertura de Caronas: {ofereceCarona} vagas para {precisaCarona} pedidos</p>
                </div>
              </div>
            </section>
          </div>

          {/* COLUNA: FINANCEIRO ESTIMADO */}
          <div className="bg-stone-800 text-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-stone-400 mb-8">Saúde Financeira (Estimada)</h3>
                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] opacity-60 uppercase mb-1">Total Mínimo Estimado</p>
                        <p className="text-4xl font-light italic">R$ {(dados.inscritos.length * dados.retiro.valor_padrao).toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                        <div>
                            <p className="text-[10px] opacity-50 uppercase">Arrecadação Ideal</p>
                            <p className="text-lg">R$ {(dados.inscritos.length * dados.retiro.valor_abundancia).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] opacity-50 uppercase">Custo da Van</p>
                            <p className="text-lg">R$ {dados.retiro.valor_total_van || 0}</p>
                        </div>
                    </div>
                    <p className="text-[9px] text-stone-500 italic mt-8 leading-relaxed">
                        * Valores baseados no total de inscritos multiplicados pelas sugestões padrão e abundância. Verifique os comprovantes com o financeiro.
                    </p>
                </div>
            </div>
            {/* Elemento decorativo */}
            <div className="absolute -bottom-10 -right-10 text-9xl opacity-5 select-none font-serif italic">🪷</div>
          </div>

        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, sub, icon, color }: any) {
  return (
    <div className={`${color} p-6 rounded-[2rem] border border-stone-100 shadow-sm flex flex-col justify-between`}>
      <div className="flex justify-between items-start">
        <span className="text-2xl">{icon}</span>
        <span className="text-[10px] font-bold uppercase text-stone-300 tracking-widest">{title}</span>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-light">{value}</p>
        <p className="text-[10px] text-stone-400 uppercase font-bold tracking-tighter mt-1">{sub}</p>
      </div>
    </div>
  )
}