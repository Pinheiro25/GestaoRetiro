'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'

function AlojamentoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [inscritos, setInscritos] = useState<any[]>([])
  const [alocacoes, setAlocacoes] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarDados() {
      setLoading(true)
      const { data: retiro } = await supabase
        .from('retiros')
        .select('id')
        .eq('status', 'ABERTO')
        .limit(1)
        .single()

      if (retiro) {
        const { data: users } = await supabase
          .from('usuarios')
          .select('id, nome, role, alojamento_id')
          .eq('retiro_id', retiro.id)
          .in('role', ['INSCRITO', 'PRÉ-INSCRITO'])
          .eq('ocupa_vaga', true)

        if (users) {
          setInscritos(users)
          const map: any = {}
          users.forEach(u => { 
            if (u.alojamento_id) map[u.id] = u.alojamento_id 
          })
          setAlocacoes(map)
        }
      }
      setLoading(false)
    }
    carregarDados()
  }, [])

  // LÓGICA DE AUTO-IMPRESSÃO E VOLTAR
  useEffect(() => {
    if (searchParams.get('print') === 'true' && !loading && inscritos.length > 0) {
      const timer = setTimeout(() => {
        window.print()
        
        // Após a impressão, volta para a página anterior (Dashboard ou Cadastro)
        const returnTo = searchParams.get('from') || '/lider'
        router.push(returnTo)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [loading, searchParams, inscritos, router])

  const alocarPessoa = async (userId: string, quartoId: string) => {
    const { error } = await supabase
      .from('usuarios')
      .update({ alojamento_id: quartoId === 'limpar' ? null : quartoId })
      .eq('id', userId)

    if (!error) {
      setAlocacoes((prev: any) => ({ 
        ...prev, 
        [userId]: quartoId === 'limpar' ? null : quartoId 
      }))
    }
  }

  if (loading) return <div className="p-20 text-center font-serif italic text-stone-400">Sincronizando quartos...</div>

  const ESTRUTURA_PIRAQUARA = [
    {
      ambiente: "Superior",
      quartos: [
        { id: 'sup_suite', nome: 'Suíte Principal', camas: 1 },
        { id: 'sup_escada', nome: 'Frente Escada', camas: 1 },
        { id: 'sup_cozinha', nome: 'Frente Cozinha', camas: 2 },
      ]
    },
    {
      ambiente: "Inferior",
      quartos: [
        { id: 'inf_escada', nome: 'Perto da Escada', camas: 3 },
        { id: 'inf_saida', nome: 'Perto da Saída', camas: 3 },
        { id: 'inf_piscina', nome: 'Quarto Piscina', camas: 3 },
      ]
    },
    {
      ambiente: "Casinha",
      quartos: [
        { id: 'cas_1', nome: 'Quarto 1', camas: 2 },
        { id: 'cas_2', nome: 'Quarto 2', camas: 3 },
        { id: 'cas_sala', nome: 'Sala da Casinha', camas: 1 },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-4 md:p-12 font-serif text-stone-800">
      
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { background: white !important; }
          .print-container { padding: 0 !important; margin: 0 !important; width: 100% !important; }
          .print-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .print-card { padding: 8px !important; border-radius: 8px !important; border: 1px solid #e5e7eb !important; page-break-inside: avoid; }
          header, .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-8 print-container">
        <header className="flex justify-between items-end border-b border-stone-200 pb-6 no-print">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold mb-2">Sítio Piraquara</p>
            <h1 className="text-4xl font-light italic">Alojamento</h1>
          </div>
          <button onClick={() => window.print()} className="bg-stone-800 text-white px-6 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-stone-700 shadow-lg">
            🖨️ Imprimir Mapa
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6 no-print">
            <h3 className="text-xs uppercase font-bold text-stone-400 tracking-widest">Aguardando Vaga</h3>
            <div className="bg-white border border-stone-100 rounded-3xl p-4 shadow-sm max-h-[500px] overflow-y-auto space-y-2 font-sans">
              {inscritos
                .filter(i => !alocacoes[i.id])
                .sort((a, b) => a.nome.localeCompare(b.nome))
                .map(i => (
                <div key={i.id} className="p-3 bg-stone-50 rounded-xl flex justify-between items-center text-sm border border-stone-100">
                  <span className="truncate mr-2 font-medium">{i.nome}</span>
                  <select 
                    className="bg-white border rounded px-1 text-[9px] font-bold text-amber-700 outline-none h-6 w-20"
                    onChange={(e) => alocarPessoa(i.id, e.target.value)}
                    value=""
                  >
                    <option value="">Alocar...</option>
                    {ESTRUTURA_PIRAQUARA.flatMap(a => a.quartos).map(q => (
                      <option key={q.id} value={q.id}>{q.nome}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm space-y-3 font-sans no-print">
              <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest border-b pb-2">Legenda de Status</p>
              <div className="flex items-center gap-3 text-xs"><div className="w-3 h-3 rounded-full bg-white border border-stone-200"></div><span>Vazio</span></div>
              <div className="flex items-center gap-3 text-xs"><div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300"></div><span>Ocupado (tem vagas)</span></div>
              <div className="flex items-center gap-3 text-xs"><div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300"></div><span>Quarto Cheio</span></div>
              <div className="flex items-center gap-3 text-xs"><div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div><span>Excedido</span></div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6 print:space-y-2">
            {ESTRUTURA_PIRAQUARA.map((setor) => (
              <section key={setor.ambiente} className="space-y-3">
                <h2 className="text-[10px] uppercase font-bold text-stone-400 tracking-widest border-l-2 border-amber-200 pl-4">{setor.ambiente}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-grid">
                  {setor.quartos.map((quarto) => {
                    const ocupantes = inscritos.filter(i => alocacoes[i.id] === quarto.id)
                    const total = ocupantes.length
                    const camas = quarto.camas

                    let bgColor = "bg-white", borderColor = "border-stone-200", textColor = "text-stone-800"
                    if (total > camas) { bgColor = "bg-red-50"; borderColor = "border-red-200"; textColor = "text-red-700" }
                    else if (total === camas) { bgColor = "bg-amber-50"; borderColor = "border-amber-200"; textColor = "text-amber-700" }
                    else if (total > 0) { bgColor = "bg-emerald-50"; borderColor = "border-emerald-200"; textColor = "text-emerald-700" }

                    return (
                      <div key={quarto.id} className={`${bgColor} ${borderColor} border rounded-2xl p-4 shadow-sm print-card`}>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className={`font-bold text-sm ${textColor}`}>{quarto.nome}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${total > camas ? 'bg-red-200' : total === camas ? 'bg-amber-200' : total > 0 ? 'bg-emerald-200' : 'bg-stone-100'} ${textColor}`}>
                            {total}/{camas}
                          </span>
                        </div>
                        <div className="space-y-1 font-sans">
                          {ocupantes.map(o => (
                            <div key={o.id} className="flex justify-between items-center bg-white/60 px-3 py-1.5 rounded-lg text-sm border border-stone-100/50">
                              <span className="truncate font-medium">{o.nome}</span>
                              <button onClick={() => alocarPessoa(o.id, 'limpar')} className="text-stone-300 hover:text-red-500 no-print ml-2">✕</button>
                            </div>
                          ))}
                          {Array.from({ length: Math.max(0, camas - total) }).map((_, idx) => (
                            <div key={idx} className="border border-dashed border-stone-200/40 py-1.5 rounded-lg text-[8px] text-stone-300 uppercase tracking-widest text-center">Vago</div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrapper para Suspense (obrigatório para usar useSearchParams no Next.js)
export default function GestaoAlojamento() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-serif italic">Carregando mapa...</div>}>
      <AlojamentoContent />
    </Suspense>
  )
}