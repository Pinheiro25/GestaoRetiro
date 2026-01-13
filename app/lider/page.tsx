'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardLider() {
  const router = useRouter()
  const [dados, setDados] = useState<any>({
    retiro: null,
    usuarios: [],
    cardapio: [],
    compras: [],
    despesas: [],
    totalArrecadado: 0,
    totalAcordado: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarDashboard() {
      const { data: retiro } = await supabase.from('retiros').select('*').eq('status', 'ABERTO').limit(1).single()
      
      if (retiro) {
        const [users, card, comp, payments, expenses] = await Promise.all([
          supabase.from('usuarios').select('*').eq('retiro_id', retiro.id),
          supabase.from('cardapio').select('*').eq('retiro_id', retiro.id),
          supabase.from('lista_compras').select('*').eq('retiro_id', retiro.id),
          supabase.from('pagamentos').select('valor_pago, usuarios!inner(retiro_id)').eq('usuarios.retiro_id', retiro.id),
          supabase.from('despesas_retiro').select('*').eq('retiro_id', retiro.id)
        ])

        const somaAcordado = (users.data || []).reduce((acc, cur) => acc + (Number(cur.valor_acordado) || 0), 0)
        const somaPago = (payments.data || []).reduce((acc, cur) => acc + (Number(cur.valor_pago) || 0), 0)

        setDados({
          retiro,
          usuarios: users.data || [],
          cardapio: card.data || [],
          compras: comp.data || [],
          despesas: expenses.data || [],
          totalArrecadado: somaPago,
          totalAcordado: somaAcordado
        })
      }
      setLoading(false)
    }
    carregarDashboard()
  }, [])

  if (loading) return <div className="p-20 text-center font-serif italic text-stone-400 animate-pulse">Sincronizando guardiões...</div>
  if (!dados.retiro) return <div className="p-20 text-center font-serif">Nenhum retiro aberto encontrado.</div>

  // --- LÓGICA DE IDENTIFICAÇÃO DE GUARDIÕES ---
  const buscarGuardião = (papel: string) => {
    const responsaveis = dados.usuarios.filter((u: any) => u.nivel_acesso === papel)
    if (responsaveis.length > 0) return responsaveis.map((r: any) => r.nome.split(' ')[0]).join(', ')
    
    // Fallback para Admins se não houver guardião específico
    const admins = dados.usuarios.filter((u: any) => u.nivel_acesso === 'ADMIN')
    return admins.length > 0 ? admins.map((a: any) => a.nome.split(' ')[0]).join(', ') : 'Coordenação'
  }

  const buscarAdmins = () => {
    const admins = dados.usuarios.filter((u: any) => u.nivel_acesso === 'ADMIN')
    return admins.length > 0 ? admins.map((a: any) => a.nome.split(' ')[0]).join(', ') : 'Admin'
  }

  // --- SEGMENTAÇÃO ---
  const pagantes = dados.usuarios.filter((u: any) => u.role === 'INSCRITO' && Number(u.valor_acordado) > 0)
  const preInscritosNoSitio = dados.usuarios.filter((u: any) => u.role === 'PRÉ-INSCRITO' && u.ocupa_vaga === true)
  const totalConfirmadoNoSitio = dados.usuarios.filter((u: any) => u.ocupa_vaga === true && u.role === 'INSCRITO')
  
  const totalDespesasPrevisto = dados.despesas.reduce((acc: number, cur: any) => acc + Number(cur.valor_previsto), 0)
  const totalDespesasRealizado = dados.despesas.reduce((acc: number, cur: any) => acc + Number(cur.valor_realizado), 0)

  const vagasTotais = dados.retiro.vagas_totais || 0
  const porcentagemOcupacao = Math.min((totalConfirmadoNoSitio.length / (vagasTotais || 1)) * 100, 100)

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-4 md:p-12 font-serif text-stone-800">
      <div className="max-w-6xl mx-auto space-y-10">
        
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="flex-1 w-full">
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-600 font-bold mb-2 font-sans">Dashboard do Líder</p>
            <h1 className="text-4xl font-light italic tracking-tight">{dados.retiro.titulo}</h1>
            
            <div className="mt-6 max-w-md space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-bold text-stone-400 font-sans tracking-widest">
                <span>Ocupação Total</span>
                <span>{totalConfirmadoNoSitio.length} / {vagasTotais}</span>
              </div>
              <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400" style={{ width: `${porcentagemOcupacao}%` }}></div>
              </div>
            </div>
          </div>

          {/* BOTÕES DE NAVEGAÇÃO COM NOMES DOS GUARDIÕES */}
          <div className="grid grid-cols-2 md:flex gap-3 no-print font-sans">
            <button onClick={() => router.push('/alojamento')} className="flex flex-col items-center bg-white border border-stone-200 px-4 py-2 rounded-2xl shadow-sm hover:bg-stone-50 transition-all min-w-[120px]">
              <span className="text-[9px] font-bold uppercase tracking-widest">🏠 Alojamento</span>
              <span className="text-[8px] text-amber-600 font-medium mt-1 uppercase tracking-tighter">G: {buscarAdmins()}</span>
            </button>
            <button onClick={() => router.push('/cozinha')} className="flex flex-col items-center bg-white border border-stone-200 px-4 py-2 rounded-2xl shadow-sm hover:bg-stone-50 transition-all min-w-[120px]">
              <span className="text-[9px] font-bold uppercase tracking-widest">🍲 Cozinha</span>
              <span className="text-[8px] text-amber-600 font-medium mt-1 uppercase tracking-tighter">G: {buscarGuardião('COZINHA')}</span>
            </button>
            <button onClick={() => router.push('/financeiro')} className="flex flex-col items-center bg-white border border-stone-200 px-4 py-2 rounded-2xl shadow-sm hover:bg-stone-50 transition-all min-w-[120px]">
              <span className="text-[9px] font-bold uppercase tracking-widest">💰 Financeiro</span>
              <span className="text-[8px] text-amber-600 font-medium mt-1 uppercase tracking-tighter">G: {buscarGuardião('FINANCEIRO')}</span>
            </button>
            <button onClick={() => router.push('/logistica')} className="flex flex-col items-center bg-white border border-stone-200 px-4 py-2 rounded-2xl shadow-sm hover:bg-stone-50 transition-all min-w-[120px]">
              <span className="text-[9px] font-bold uppercase tracking-widest">🚐 Transporte</span>
              <span className="text-[8px] text-amber-600 font-medium mt-1 uppercase tracking-tighter">G: {buscarGuardião('LOGISTICA')}</span>
            </button>
          </div>
        </header>

        {/* INDICADORES PRINCIPAIS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Pagantes" value={pagantes.length} sub="Confirmados" icon="💳" color="bg-white" />
          <StatCard title="Pré-Inscritos" value={preInscritosNoSitio.length} sub="Pendente" icon="⏳" color="bg-white" />
          <StatCard title="Leitos" value={totalConfirmadoNoSitio.length} sub={`de ${vagasTotais}`} icon="🏠" color="bg-amber-50 border-amber-100" />
          <StatCard title="Guardião Geral" value={buscarGuardião('LIDER')} sub="Responsável" icon="🙏" color="bg-stone-100" />
        </div>

        {/* FINANCEIRO INTEGRADO */}
        <div className="bg-stone-800 text-white p-8 md:p-12 rounded-[3rem] shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <div>
                <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-stone-400 font-sans">Fluxo Financeiro</h3>
                <p className="text-[10px] text-amber-200 uppercase font-sans mt-1">Guardiã: {buscarGuardião('FINANCEIRO')}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] opacity-60 uppercase font-sans">Lucro Realizado</p>
                <p className="text-4xl font-light text-emerald-400">R$ {(dados.totalArrecadado - totalDespesasRealizado).toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 font-sans">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <p className="text-[10px] opacity-50 uppercase mb-2">Receita (Entrada)</p>
                <p className="text-xl">R$ {dados.totalArrecadado.toLocaleString('pt-BR')}</p>
                <p className="text-[9px] text-stone-400 mt-1 uppercase tracking-tighter">Esperado: R$ {dados.totalAcordado.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <p className="text-[10px] opacity-50 uppercase mb-2">Despesas (Saída)</p>
                <p className="text-xl text-red-400">R$ {totalDespesasRealizado.toLocaleString('pt-BR')}</p>
                <p className="text-[9px] text-stone-400 mt-1 uppercase tracking-tighter">Previsto: R$ {totalDespesasPrevisto.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <p className="text-[10px] opacity-50 uppercase mb-2">Saldo à Receber</p>
                <p className="text-xl text-amber-400">R$ {Math.max(0, dados.totalAcordado - dados.totalArrecadado).toLocaleString('pt-BR')}</p>
                <p className="text-[9px] text-stone-400 mt-1 uppercase tracking-tighter font-medium">Pendente de inscritos</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 text-9xl opacity-5 select-none italic">💰</div>
        </div>

        {/* SEÇÕES OPERACIONAIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 font-sans">
          <section className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
            <div className="flex justify-between items-start mb-6 border-b border-stone-50 pb-2">
              <h3 className="text-xs uppercase font-bold tracking-widest text-stone-400">Cozinha</h3>
              <p className="text-[9px] font-bold text-amber-600 uppercase">G: {buscarGuardião('COZINHA')}</p>
            </div>
            <div className="flex justify-around items-center">
              <div className="text-center">
                <p className="text-[10px] text-stone-400 uppercase mb-1">Veganos</p>
                <p className="text-3xl font-light">{totalConfirmadoNoSitio.filter((i:any) => i.dieta_tipo === 'VEGANO').length}</p>
              </div>
              <div className="w-px h-10 bg-stone-100"></div>
              <div className="text-center">
                <p className="text-[10px] text-stone-400 uppercase mb-1">Restrições</p>
                <p className="text-3xl font-light">{totalConfirmadoNoSitio.filter((i:any) => i.alergias_restricoes && i.alergias_restricoes.length > 2).length}</p>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
            <div className="flex justify-between items-start mb-6 border-b border-stone-50 pb-2">
              <h3 className="text-xs uppercase font-bold tracking-widest text-stone-400">Transporte</h3>
              <p className="text-[9px] font-bold text-amber-600 uppercase">G: {buscarGuardião('LOGISTICA')}</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-stone-50 rounded-2xl">
                <span className="text-sm text-stone-600">Precisam de Carona / Van</span>
                <span className="text-xl font-light text-amber-600">{totalConfirmadoNoSitio.filter((i: any) => i.transporte_tipo === 'PRECISA_CARONA').length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-stone-50 rounded-2xl">
                <span className="text-sm text-stone-600">Vagas em Carros</span>
                <span className="text-xl font-light text-emerald-600">{totalConfirmadoNoSitio.reduce((acc: any, cur: any) => acc + (cur.vagas_carro || 0), 0)}</span>
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
    <div className={`${color} p-6 rounded-[2.2rem] border border-stone-100 shadow-sm transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-2xl">{icon}</span>
        <span className="text-[9px] font-bold uppercase text-stone-400 tracking-[0.2em] font-sans">{title}</span>
      </div>
      <p className="text-2xl font-light mb-1">{value}</p>
      <p className="text-[9px] text-stone-400 uppercase font-bold tracking-tighter font-sans">{sub}</p>
    </div>
  )
}