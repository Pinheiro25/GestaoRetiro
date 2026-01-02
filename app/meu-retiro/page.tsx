'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function MinhaJornada() {
  const [participante, setParticipante] = useState<any>(null)
  const [retiro, setRetiro] = useState<any>(null)
  const [totalPago, setTotalPago] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarDados() {
      const emailOriginal = localStorage.getItem('userEmail')
      if (!emailOriginal) return (window.location.href = '/')

      const emailLimpo = emailOriginal.trim().toLowerCase()

      // 1. Buscamos primeiro qual é o retiro que está ATIVO/ABERTO
      const { data: retiroAtivo } = await supabase
        .from('retiros')
        .select('id')
        .eq('status', 'ABERTO')
        .maybeSingle()

      if (!retiroAtivo) {
        setLoading(false)
        return
      }

      // 2. Busca o participante APENAS no retiro ativo
      const { data: user } = await supabase
        .from('usuarios')
        .select('*')
        .ilike('email', emailLimpo)
        .eq('retiro_id', retiroAtivo.id) // <-- Filtro essencial para casos como o da Ana
        .maybeSingle()

      if (user) {
        setParticipante(user)

        // 3. Soma pagamentos da tabela 'pagamentos'
        const { data: pags } = await supabase
          .from('pagamentos')
          .select('valor_pago')
          .eq('usuario_id', user.id)

        if (pags) {
          const soma = pags.reduce((acc, curr) => acc + Number(curr.valor_pago || 0), 0)
          setTotalPago(soma)
        }

        // 4. Busca dados do retiro (já temos o ID, mas buscamos o objeto completo para o cabeçalho)
        const { data: ret } = await supabase
          .from('retiros')
          .select('*')
          .eq('id', retiroAtivo.id)
          .single()
        
        setRetiro(ret)
      }
      setLoading(false)
    }
    carregarDados()
  }, [])

  if (loading) return <div className="p-20 text-center font-serif italic animate-pulse text-stone-400">Sincronizando sua jornada...</div>
  
  if (!participante) return (
    <div className="p-20 text-center font-serif">
      <p className="text-stone-500 italic">Inscrição não encontrada para o retiro ativo.</p>
      <button onClick={() => window.location.href = '/'} className="mt-4 text-xs underline uppercase">Voltar ao Início</button>
    </div>
  )

  const vAcordado = Number(participante.valor_acordado || 0)
  const saldoDevedor = vAcordado - totalPago
  const isStaff = participante.ocupa_vaga === false

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 font-serif text-stone-800 space-y-8 pb-20">
      
      {/* CABEÇALHO */}
      <header className={`text-center p-10 rounded-[3rem] border shadow-sm transition-all ${!isStaff ? 'bg-white border-stone-100' : 'bg-amber-50/30 border-amber-100'}`}>
        <div className="mb-4">
          {isStaff ? (
            <span className="text-[10px] bg-amber-200 px-3 py-1 rounded-full font-bold uppercase tracking-widest text-amber-800 animate-pulse">⭐ Equipe de Apoio / Staff</span>
          ) : (
            <span className="text-[10px] bg-stone-100 px-3 py-1 rounded-full font-bold uppercase tracking-widest text-stone-500">Inscrição Confirmada</span>
          )}
        </div>
        <h1 className="text-3xl italic">{retiro?.titulo || 'Seu Retiro'}</h1>
        <p className="text-stone-500 mt-2 text-sm italic">{participante.nome}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* FINANCEIRO */}
        <section className={`${!isStaff ? 'bg-stone-800 text-white shadow-xl' : 'bg-stone-100 text-stone-400'} p-8 rounded-[2.5rem]`}>
          <h3 className="text-[10px] uppercase font-bold opacity-50 mb-6 tracking-widest">Financeiro</h3>
          
          {isStaff ? (
            <div className="py-4 italic text-sm text-stone-600">
              Inscrição de Staff. Detalhes financeiros são tratados diretamente com a coordenação.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-xs opacity-70">Valor Acordado:</span>
                <span className="text-sm font-bold">R$ {vAcordado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2 text-emerald-400">
                <span className="text-xs opacity-70 text-white">Total Pago:</span>
                <span className="text-sm font-bold">R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-xs font-bold uppercase">Saldo em Aberto:</span>
                <span className={`text-lg font-bold ${saldoDevedor > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {saldoDevedor > 0 ? `R$ ${saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '✅ Quitado'}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* LOGÍSTICA (VAN E CARONA) */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
          <h3 className="text-[10px] uppercase font-bold text-stone-300 mb-6 tracking-widest">Transporte & Logística</h3>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <span className="text-2xl">
                {participante.transporte_tipo === 'OFERECE_CARONA' ? '🚗' : 
                 participante.transporte_tipo === 'PRECISA_CARONA' ? '🚐' : '📍'}
              </span>
              <div>
                <p className="text-sm font-bold text-stone-700">
                  {participante.transporte_tipo === 'PRECISA_CARONA' && "Confirmado no Comboio/Van"}
                  {participante.transporte_tipo === 'OFERECE_CARONA' && "Vou Dirigindo (Motorista)"}
                  {participante.transporte_tipo === 'VAI_DIRETO' && "Vou Direto / Por conta própria"}
                  {!participante.transporte_tipo && "A definir com a organização"}
                </p>
                <p className="text-[10px] text-stone-400 uppercase mt-1">Status da sua viagem</p>
              </div>
            </div>

            {/* SE FOR VAN/COMBOIO, MOSTRA O FINANCEIRO DA VAN */}
            {participante.transporte_tipo === 'PRECISA_CARONA' && (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">Taxa de Transporte</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${participante.pago_van ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {participante.pago_van ? 'PAGO' : 'PENDENTE'}
                  </span>
                </div>
                <p className="text-lg font-bold text-stone-700">
                  R$ {Number(participante.valor_van || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}

            {/* OBSERVAÇÃO DE VIAGEM */}
            {participante.observacao_viagem && (
              <div className="pt-4 border-t border-stone-50">
                <p className="text-[9px] font-bold text-stone-300 uppercase mb-1">Sua observação de viagem:</p>
                <p className="text-xs text-stone-500 italic leading-relaxed">"{participante.observacao_viagem}"</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ENDEREÇO E MAPA */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm text-center">
        <h3 className="text-[10px] uppercase font-bold text-stone-300 mb-2 tracking-widest">Local do Encontro</h3>
        <p className="text-sm font-bold text-stone-700 uppercase">SÍTIO PIRAQUARA</p>
        <p className="text-xs text-stone-500 italic mt-1 leading-relaxed">Estrada Maria Soares Pereira 2600<br/>São Lourenço da Serra - SP</p>
        
        <div className="mt-8 grid grid-cols-2 gap-3">
          <a href="https://maps.google.com/?q=Sítio+Piraquara+São+Lourenço+da+Serra" target="_blank" className="bg-stone-800 text-white py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-md">Google Maps</a>
          <a href="https://waze.com/ul?q=Sítio+Piraquara+São+Lourenço+da+Serra" target="_blank" className="bg-white text-stone-800 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-stone-200 shadow-sm">Abrir no Waze</a>
        </div>
      </section>

    </div>
  )
}