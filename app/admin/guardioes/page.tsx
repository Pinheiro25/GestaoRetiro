'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function GestaoGuardioes() {
  const [retiros, setRetiros] = useState<any[]>([])
  const [idRetiro, setIdRetiro] = useState('')
  const [equipe, setEquipe] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Lista expandida de papéis conforme sua necessidade
  const PAPEIS = [
    { id: 'PARTICIPANTE', label: 'Participante' },
    { id: 'PALESTRANTE', label: 'Palestrante' },
    { id: 'LIDER', label: 'Líder' },
    { id: 'COZINHA', label: 'Cozinha' },
    { id: 'LOGISTICA', label: 'Logística' },
    { id: 'FINANCEIRO', label: 'Financeiro' },
    { id: 'ADMIN', label: 'Admin' }
  ]

  useEffect(() => {
    async function carregarRetiros() {
      const { data } = await supabase
        .from('retiros')
        .select('*')
        .order('data_inicio', { ascending: false })
      
      if (data && data.length > 0) {
        setRetiros(data)
        setIdRetiro(data[0].id)
      }
      setLoading(false)
    }
    carregarRetiros()
  }, [])

  useEffect(() => {
    if (idRetiro) carregarEquipe()
  }, [idRetiro])

  async function carregarEquipe() {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('retiro_id', idRetiro)
      .order('nome')
    if (data) setEquipe(data)
  }

  async function mudarPapel(id: string, novoPapel: string) {
    const { error } = await supabase
      .from('usuarios')
      .update({ nivel_acesso: novoPapel })
      .eq('id', id)
    
    if (!error) carregarEquipe()
    else alert("Erro ao atualizar papel: " + error.message)
  }

  async function alternarOcupacaoVaga(id: string, estadoAtual: boolean) {
    const { error } = await supabase
      .from('usuarios')
      .update({ ocupa_vaga: !estadoAtual })
      .eq('id', id)
    
    if (!error) carregarEquipe()
  }

  if (loading) return <div className="p-20 text-center font-serif italic text-stone-400">Carregando guardiões...</div>

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-4 md:p-12 font-serif text-stone-800">
      <div className="max-w-6xl mx-auto bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-stone-100">
        
        <header className="text-center mb-10">
          <h1 className="text-3xl font-light text-stone-800">Designação de Papéis</h1>
          <p className="text-stone-400 italic mt-2 text-sm font-sans">Organizando quem serve, quem ensina e quem pratica</p>
          
          <div className="mt-8 inline-block bg-stone-50 p-2 rounded-2xl border border-stone-100">
            <select 
              value={idRetiro} 
              onChange={(e) => setIdRetiro(e.target.value)}
              className="bg-transparent outline-none text-sm font-medium text-stone-600 px-4 cursor-pointer font-sans"
            >
              {retiros.map(r => <option key={r.id} value={r.id}>{r.titulo}</option>)}
            </select>
          </div>
        </header>

        <div className="space-y-4">
          <div className="hidden md:grid grid-cols-12 px-6 py-2 text-[10px] uppercase tracking-widest text-stone-400 font-bold font-sans">
            <div className="col-span-4">Nome do Guardião / Praticante</div>
            <div className="col-span-3 text-center">Presença no Sítio</div>
            <div className="col-span-5 text-right">Função Designada</div>
          </div>

          {equipe.length === 0 ? (
            <p className="text-center py-20 text-stone-300 italic">Ninguém inscrito neste retiro ainda.</p>
          ) : (
            equipe.map(u => (
              <div key={u.id} className="grid grid-cols-1 md:grid-cols-12 items-center p-6 bg-stone-50/30 border border-stone-50 rounded-[2rem] hover:border-amber-100 transition-all gap-4">
                
                {/* Info Básica */}
                <div className="col-span-1 md:col-span-4">
                  <p className="font-medium text-stone-800 font-sans">{u.nome}</p>
                  <p className="text-[10px] text-stone-400 truncate font-sans uppercase tracking-tight">{u.email}</p>
                </div>

                {/* Switch Ocupa Vaga */}
                <div className="col-span-1 md:col-span-3 flex justify-center">
                  <button 
                    onClick={() => alternarOcupacaoVaga(u.id, u.ocupa_vaga)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold transition-all font-sans ${
                      u.ocupa_vaga 
                        ? 'bg-amber-50 text-amber-700 border border-amber-100 shadow-sm' 
                        : 'bg-stone-100 text-stone-400 border border-transparent opacity-60'
                    }`}
                  >
                    {u.ocupa_vaga ? '🏠 OCUPA LEITO' : '☁️ SUPORTE / REMOTO'}
                  </button>
                </div>

                {/* Seleção de Nível de Acesso Expandida */}
                <div className="col-span-1 md:col-span-5 flex flex-wrap justify-end gap-1.5">
                  {PAPEIS.map(papel => (
                    <button
                      key={papel.id}
                      onClick={() => mudarPapel(u.id, papel.id)}
                      className={`px-3 py-1.5 text-[9px] font-bold rounded-full border transition-all font-sans uppercase tracking-tighter ${
                        u.nivel_acesso === papel.id 
                          ? 'bg-stone-800 text-white border-stone-800 shadow-md scale-105' 
                          : 'bg-white text-stone-300 border-stone-100 hover:border-stone-200 hover:text-stone-600'
                      }`}
                    >
                      {papel.label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="mt-12 pt-8 border-t border-stone-50 text-center font-sans">
          <p className="text-[10px] text-stone-300 italic max-w-2xl mx-auto">
            Nota: Pessoas marcadas como "Suporte / Remoto" não reservam cama no Sítio Piraquara. 
            Papéis como Palestrante, Líder e Cozinha são automaticamente agrupados no "Corpo de Serviço" no Dashboard.
          </p>
        </footer>
      </div>
    </div>
  )
}