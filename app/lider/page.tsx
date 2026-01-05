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
    totalArrecadado: 0,
    totalAcordado: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarDashboard() {
      const { data: retiro } = await supabase.from('retiros').select('*').eq('status', 'ABERTO').limit(1).single()
      
      if (retiro) {
        const [users, card, comp, payments] = await Promise.all([
          supabase.from('usuarios').select('*').eq('retiro_id', retiro.id),
          supabase.from('cardapio').select('*').eq('retiro_id', retiro.id),
          supabase.from('lista_compras').select('*').eq('retiro_id', retiro.id),
          supabase.from('pagamentos').select('valor_pago, usuarios!inner(retiro_id)').eq('usuarios.retiro_id', retiro.id)
        ])

        const somaAcordado = (users.data || []).reduce((acc, cur) => acc + (Number(cur.valor_acordado) || 0), 0)
        const somaPago = (payments.data || []).reduce((acc, cur) => acc + (Number(cur.valor_pago) || 0), 0)

        setDados({
          retiro,
          usuarios: users.data || [],
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

  // --- LÓGICA DE SEGMENTAÇÃO PRECISA ---
  const pagantes = dados.usuarios.filter((u: any) => u.role === 'INSCRITO' && Number(u.valor_acordado) > 0)
  const preInscritosNoSitio = dados.usuarios.filter((u: any) => u.role === 'PRÉ-INSCRITO' && u.ocupa_vaga === true)
  const listaEspera = dados.usuarios.filter((u: any) => u.role === 'ESPERA')
  const staffNoSitio = dados.usuarios.filter((u: any) => u.nivel_acesso !== 'PARTICIPANTE' && u.ocupa_vaga === true && u.role !== 'DESISTENTE')
  const staffRemoto = dados.usuarios.filter((u: any) => u.nivel_acesso !== 'PARTICIPANTE' && u.ocupa_vaga === false && u.role !== 'DESISTENTE')
  
  // Total que efetivamente ocupa leito (Confirmados)
  const totalConfirmadoNoSitio = dados.usuarios.filter((u: any) => u.ocupa_vaga === true && u.role === 'INSCRITO')
  const baseFisica = totalConfirmadoNoSitio

  // Lógica do Termômetro
  const vagasTotais = dados.retiro.vagas_totais || 0
  const ocupacaoConfirmada = totalConfirmadoNoSitio.length
  const vagasRestantes = Math.max(0, vagasTotais - ocupacaoConfirmada)
  const porcentagemOcupacao = Math.min((ocupacaoConfirmada / (vagasTotais || 1)) * 100, 100)

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-4 md:p-12 font-serif text-stone-800">
      <div className="max-w-6xl mx-auto space-y-10">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex-1 w-full">
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-600 font-bold mb-2 font-sans">Gestão Estratégica</p>
            <h1 className="text-4xl font-light italic">{dados.retiro.titulo}</h1>
            
            {/* TERMÔMETRO DE VAGAS */}
            <div className="mt-6 max-w-md space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-bold text-stone-400 font-sans tracking-widest">
                <span>Ocupação do Sítio</span>
                <span className={vagasRestantes <= 2 ? 'text-red-500' : 'text-stone-500'}>
                  {vagasRestantes} Vagas Restantes
                </span>
              </div>
              <div className="h-3 bg-stone-200 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 ${porcentagemOcupacao > 90 ? 'bg-red-400' : 'bg-emerald-400'}`}
                  style={{ width: `${porcentagemOcupacao}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 no-print font-sans">
            <button onClick={() => router.push('/alojamento')} className="bg-white border border-stone-200 px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50 transition-all shadow-sm">🏠 Alojamento</button>
            <button onClick={() => router.push('/cozinha')} className="bg-white border border-stone-200 px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50 transition-all shadow-sm">🍲 Cozinha</button>
          </div>
        </header>

        {/* INDICADORES PRINCIPAIS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Pagantes" value={pagantes.length} sub="Confirmados" icon="💰" color="bg-white" />
          <StatCard title="Pré-Inscritos" value={preInscritosNoSitio.length} sub="Definindo" icon="⏳" color="bg-white" />
          <StatCard title="Espera" value={listaEspera.length} sub="Lista Reserva" icon="🔵" color="bg-white" />
          <StatCard title="No Sítio" value={totalConfirmadoNoSitio.length} sub={`de ${vagasTotais} vagas`} icon="🏠" color="bg-amber-50 border-amber-100" />
          <StatCard title="Apoio" value={staffNoSitio.length} sub={`+ ${staffRemoto.length} Remoto`} icon="🙏" color="bg-stone-100" />
        </div>

        {/* DETALHAMENTO DO STAFF */}
        <div className="bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm">
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-6 border-b pb-2 font-sans">Equipe de Serviço & Coordenação</h3>
          <div className="flex flex-wrap gap-3">
            {staffNoSitio.map((s:any) => (
              <div key={s.id} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full">
                <span className="text-xs font-bold text-emerald-700 font-sans">{s.nome}</span>
                <span className="text-[8px] bg-emerald-700 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">{s.nivel_acesso === 'PARTICIPANTE' ? 'No Sítio' : s.nivel_acesso}</span>
              </div>
            ))}
            {staffRemoto.map((s:any) => (
              <div key={s.id} className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full">
                <span className="text-xs font-bold text-blue-700 font-sans">{s.nome}</span>
                <span className="text-[8px] bg-blue-700 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Remoto</span>
              </div>
            ))}
          </div>
        </div>

        {/* FINANCEIRO */}
        <div className="bg-stone-800 text-white p-8 md:p-12 rounded-[3rem] shadow-xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-stone-400 mb-6 font-sans">Saúde Financeira</h3>
              <div className="space-y-1">
                <p className="text-[10px] opacity-60 uppercase font-sans tracking-widest">Total Arrecadado</p>
                <p className="text-5xl font-light text-emerald-400">R$ {dados.totalArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 p-6 bg-white/5 rounded-3xl border border-white/10 font-sans text-center">
              <div>
                <p className="text-[10px] opacity-50 uppercase mb-1">Total Esperado</p>
                <p className="text-xl">R$ {dados.totalAcordado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-[10px] opacity-50 uppercase mb-1">Pendente</p>
                <p className="text-xl text-amber-400">R$ {Math.max(0, dados.totalAcordado - dados.totalArrecadado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 text-9xl opacity-5 select-none font-serif italic">🕉️</div>
        </div>

        {/* LOGÍSTICA & COZINHA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 font-sans">
          <section className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
            <h3 className="text-xs uppercase font-bold tracking-widest mb-6 border-b pb-2 text-stone-400">Cozinha (Confirmados)</h3>
            <div className="flex justify-around items-center">
              <div className="text-center">
                <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Veganos</p>
                <p className="text-3xl font-light">{baseFisica.filter((i:any) => i.dieta_tipo === 'VEGANO').length}</p>
              </div>
              <div className="w-px h-10 bg-stone-100"></div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Restrições</p>
                <p className="text-3xl font-light">{baseFisica.filter((i:any) => i.alergias_restricoes && i.alergias_restricoes.length > 2).length}</p>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
            <h3 className="text-xs uppercase font-bold tracking-widest mb-6 border-b pb-2 text-stone-400">Transporte (Confirmados)</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-stone-50 rounded-2xl">
                <span className="text-sm text-stone-600">Precisam de Carona</span>
                <span className="text-xl font-light text-amber-600">{baseFisica.filter((i: any) => i.transporte_tipo === 'PRECISA_CARONA').length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-stone-50 rounded-2xl">
                <span className="text-sm text-stone-600">Vagas Disponíveis</span>
                <span className="text-xl font-light text-emerald-600">{baseFisica.reduce((acc: any, cur: any) => acc + (cur.vagas_carro || 0), 0)}</span>
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
    <div className={`${color} p-6 rounded-[2.2rem] border border-stone-100 shadow-sm`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-2xl">{icon}</span>
        <span className="text-[9px] font-bold uppercase text-stone-400 tracking-[0.2em] font-sans">{title}</span>
      </div>
      <p className="text-2xl font-light mb-1">{value}</p>
      <p className="text-[9px] text-stone-400 uppercase font-bold tracking-tighter font-sans">{sub}</p>
    </div>
  )
}