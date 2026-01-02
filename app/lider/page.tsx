'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardLider() {
  const [dados, setDados] = useState<any>({
    retiro: null,
    inscritos: [],
    cardapio: [],
    compras: [],
    totalArrecadado: 0,
    totalAcordado: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarDashboard() {
      // 1. Busca Retiro Aberto
      const { data: retiro } = await supabase.from('retiros').select('*').eq('status', 'ABERTO').limit(1).single()
      
      if (retiro) {
        // 2. Busca tudo relacionado ao retiro em paralelo
        // Buscamos pagamentos vinculados a usuários deste retiro
        const [users, card, comp, payments] = await Promise.all([
          supabase.from('usuarios').select('*').eq('retiro_id', retiro.id),
          supabase.from('cardapio').select('*').eq('retiro_id', retiro.id),
          supabase.from('lista_compras').select('*').eq('retiro_id', retiro.id),
          supabase.from('pagamentos').select('valor_pago, usuarios!inner(retiro_id)').eq('usuarios.retiro_id', retiro.id)
        ])

        // CÁLCULO FINANCEIRO REAL
        const somaAcordado = (users.data || []).reduce((acc, cur) => acc + (Number(cur.valor_acordado) || 0), 0)
        const somaPago = (payments.data || []).reduce((acc, cur) => acc + (Number(cur.valor_pago) || 0), 0)

        setDados({
          retiro,
          inscritos: users.data || [],
          cardapio: card.data || [],
          compras: comp.data || [],
          totalArrecadado: somaPago,
          totalAcordado: somaAcordado
        })
      }
      setLoading(false)
    }
    carregarDashboard()
  }, [])

  if (loading) return <div className="p-20 text-center font-serif italic text-stone-400 animate-pulse">Lendo os ventos do retiro...</div>
  if (!dados.retiro) return <div className="p-20 text-center font-serif">Nenhum retiro aberto encontrado.</div>

  // Resumo de Status (Roles)
  const countRole = (r: string) => dados.inscritos.filter((i: any) => i.role === r).length
  
  // Saldo a Receber
  const saldoAReceber = dados.totalAcordado - dados.totalArrecadado

  // Logística (Apenas quem ocupa vaga e não desistiu)
  const quemOcupaVaga = dados.inscritos.filter((i: any) => i.ocupa_vaga === true && i.role !== 'DESISTENTE')
  const precisaCarona = quemOcupaVaga.filter((i: any) => i.transporte_tipo === 'PRECISA_CARONA').length
  const ofereceCarona = quemOcupaVaga.reduce((acc: any, cur: any) => acc + (cur.vagas_carro || 0), 0)

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-4 md:p-12 font-serif text-stone-800">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* CABEÇALHO */}
        <header>
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-600 font-bold mb-2">Visão do Líder</p>
          <h1 className="text-4xl font-light italic">{dados.retiro.titulo}</h1>
          <div className="flex gap-4 mt-4 text-[10px] uppercase font-bold text-stone-400">
            <span>📅 {new Date(dados.retiro.data_inicio).toLocaleDateString()}</span>
            <span>👥 {quemOcupaVaga.length} Guardiões e Praticantes</span>
          </div>
        </header>

        {/* CARDS DE STATUS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Inscritos" value={countRole('INSCRITO')} sub="Confirmados" icon="🟢" color="bg-white" />
          <StatCard title="Pré-Inscritos" value={countRole('PRÉ-INSCRITO')} sub="Interessados" icon="🟡" color="bg-white" />
          <StatCard title="Espera" value={countRole('ESPERA')} sub="Lista reserva" icon="🔵" color="bg-white" />
          <StatCard title="Desistentes" value={countRole('DESISTENTE')} sub="Cancelados" icon="⚪" color="bg-stone-50" />
        </div>

        {/* FINANCEIRO REAL - CORRIGIDO */}
        <div className="bg-stone-800 text-white p-8 md:p-12 rounded-[3rem] shadow-xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-stone-400 mb-6">Saúde Financeira (Real)</h3>
              <div className="space-y-1">
                <p className="text-[10px] opacity-60 uppercase">Total Arrecadado (Pagamentos Confirmados)</p>
                <p className="text-5xl font-light text-emerald-400">
                  R$ {dados.totalArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 p-6 bg-white/5 rounded-3xl border border-white/10">
              <div>
                <p className="text-[10px] opacity-50 uppercase mb-1">Total Acordado</p>
                <p className="text-xl font-sans">R$ {dados.totalAcordado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[9px] text-stone-500 mt-1 italic">Soma das promessas</p>
              </div>
              <div>
                <p className="text-[10px] opacity-50 uppercase mb-1">Saldo a Receber</p>
                <p className="text-xl font-sans text-amber-400">
                  R$ {Math.max(0, saldoAReceber).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[9px] text-stone-500 mt-1 italic">Pendências totais</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 text-9xl opacity-5 select-none font-serif italic">💰</div>
        </div>

        {/* SEÇÕES OPERACIONAIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* COZINHA */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
            <h3 className="text-xs uppercase font-bold tracking-widest mb-6 border-b pb-2">Status da Cozinha</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span>Cardápio Lançado</span>
                <span className="font-bold">{dados.cardapio.length} refeições</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Itens Comprados</span>
                <span className="font-bold text-emerald-600">
                  {dados.compras.filter((c:any) => c.comprado).length} / {dados.compras.length} OK
                </span>
              </div>
              <div className="mt-4 p-4 bg-stone-50 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase">Dieta Vegana</p>
                  <p className="text-xl">{quemOcupaVaga.filter((i:any) => i.dieta_tipo === 'VEGANO').length}</p>
                </div>
                <div className="h-8 w-px bg-stone-200"></div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-stone-400 uppercase">Alergias</p>
                  <p className="text-xl">{quemOcupaVaga.filter((i:any) => i.alergias_restricoes && i.alergias_restricoes.length > 2).length}</p>
                </div>
              </div>
            </div>
          </section>

          {/* LOGÍSTICA */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
            <h3 className="text-xs uppercase font-bold tracking-widest mb-6 border-b pb-2">Resumo de Logística</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tighter">Precisa Carona</p>
                  <p className="text-2xl">{precisaCarona}</p>
                </div>
                <div className="bg-stone-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-tighter">Vagas em Carros</p>
                  <p className="text-2xl">{ofereceCarona}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${ofereceCarona >= precisaCarona ? 'bg-emerald-400' : 'bg-amber-400'}`} 
                    style={{ width: `${Math.min((ofereceCarona / (precisaCarona || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-[9px] text-stone-400 font-bold uppercase">
                  {ofereceCarona >= precisaCarona 
                    ? "✅ Vagas suficientes nos carros" 
                    : `⚠️ Atenção: faltam ${precisaCarona - ofereceCarona} vagas`}
                </p>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  )
}

function StatCard({ title, value, sub, icon, color }: any) {
  return (
    <div className={`${color} p-5 rounded-[2rem] border border-stone-100 shadow-sm`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-[9px] font-bold uppercase text-stone-300 tracking-widest">{title}</span>
      </div>
      <p className="text-2xl font-light">{value}</p>
      <p className="text-[9px] text-stone-400 uppercase font-bold mt-1 tracking-tighter">{sub}</p>
    </div>
  )
}