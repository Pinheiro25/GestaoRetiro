'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function InscricaoDinamica() {
  const [retiro, setRetiro] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enviado, setEnviado] = useState(false)
  
  const [form, setForm] = useState({ 
    nome: '', 
    email: '', 
    whatsapp: '', 
    cidade: '', 
    dieta_tipo: 'PADRAO',
    transporte_tipo: 'VAI_DIRETO',
    observacao_viagem: ''
  })

  useEffect(() => {
    async function carregarRetiro() {
      const { data } = await supabase
        .from('retiros')
        .select('*')
        .eq('status', 'ABERTO')
        .limit(1)
        .single()
      
      if (data) setRetiro(data)
      setLoading(false)
    }
    carregarRetiro()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Garantimos que o nível de acesso padrão seja INSCRITO e que ocupe vaga
    const { error } = await supabase.from('usuarios').insert([{
      ...form,
      nivel_acesso: 'INSCRITO',
      retiro_id: retiro?.id,
      ocupa_vaga: true
    }])
    
    if (error) {
        console.error(error)
        alert("Erro ao enviar: " + error.message)
    } else {
        setEnviado(true)
    }
  }

  if (loading) return <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center font-serif italic text-stone-400">Preparando o ambiente...</div>

  if (!retiro) return <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center font-serif text-stone-500 p-10 text-center">No momento não há retiros com inscrições abertas. 🙏</div>

  if (enviado) return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center font-serif p-6 text-center">
      <span className="text-6xl mb-6">🪷</span>
      <h1 className="text-2xl text-stone-800 mb-4 italic">Interesse Registrado!</h1>
      <p className="text-stone-600 max-w-md leading-relaxed">
        Que alegria! Agora, por favor, envie o comprovante de sinal para a coordenação para confirmarmos sua vaga. 
        Aguardamos você para este mergulho de silêncio e presença.
      </p>
      <button onClick={() => window.location.href = '/'} className="mt-8 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-800 transition-colors">Voltar para o Login</button>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#FDFCF8] font-serif text-stone-800 p-4 md:p-12">
      <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-[3rem] shadow-sm overflow-hidden mb-10">
        
        {/* Banner Decorativo */}
        <div className="bg-[#E8DCC4] p-10 text-center relative border-b border-stone-200">
          <h1 className="text-3xl md:text-4xl font-light mb-2">{retiro.titulo}</h1>
          <p className="text-stone-600 italic">"{retiro.tema}"</p>
        </div>

        <div className="p-8 md:p-12 space-y-8">
          {/* Informações do Retiro */}
          <section className="text-stone-600 leading-relaxed space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50 p-6 rounded-3xl border border-stone-100 text-sm">
              <p><strong>📅 Início:</strong> {new Date(retiro.data_inicio).toLocaleDateString()}</p>
              <p><strong>📅 Término:</strong> {new Date(retiro.data_fim).toLocaleDateString()}</p>
              <p><strong>👤 Líder:</strong> {retiro.lider || 'Karen'}</p>
            </div>

            <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100">
              <p className="font-bold mb-3 text-amber-900 text-sm uppercase tracking-widest">Opções de Contribuição:</p>
              <ul className="space-y-3 text-sm text-amber-800">
                <li className="flex justify-between"><span>Abundância:</span> <strong>R$ {Number(retiro.valor_abundancia || 0).toLocaleString('pt-BR')}</strong></li>
                <li className="flex justify-between border-t border-amber-200/50 pt-2"><span>Padrão (Cobre custos):</span> <strong>R$ {Number(retiro.valor_padrao || 0).toLocaleString('pt-BR')}</strong></li>
                <li className="italic text-[10px] mt-2">* Valores para hospedagem e alimentação completa.</li>
              </ul>
            </div>
          </section>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-6 border-t border-stone-100">
            <h3 className="text-lg font-light text-center mb-6">Preencha sua ficha de inscrição</h3>
            
            <div className="space-y-4">
              <input type="text" placeholder="Seu Nome Completo" required className="w-full p-4 bg-stone-50 rounded-2xl outline-none focus:bg-white focus:border-stone-200 border border-transparent transition-all" 
                onChange={e => setForm({...form, nome: e.target.value})} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="email" placeholder="E-mail" required className="w-full p-4 bg-stone-50 rounded-2xl outline-none focus:bg-white focus:border-stone-200 border border-transparent transition-all" 
                  onChange={e => setForm({...form, email: e.target.value})} />
                <input type="text" placeholder="WhatsApp" required className="w-full p-4 bg-stone-50 rounded-2xl outline-none focus:bg-white focus:border-stone-200 border border-transparent transition-all" 
                  onChange={e => setForm({...form, whatsapp: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-bold uppercase ml-2 text-stone-400">Logística de Viagem</label>
                    <select className="w-full p-4 bg-stone-50 rounded-2xl outline-none mt-1 border border-transparent" 
                        onChange={e => setForm({...form, transporte_tipo: e.target.value})}>
                        <option value="VAI_DIRETO">Vou direto ao sítio</option>
                        <option value="PRECISA_CARONA">Preciso de Carona / Van</option>
                        <option value="OFERECE_CARONA">Vou dirigindo / Dou Carona</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase ml-2 text-stone-400">Alimentação</label>
                    <select className="w-full p-4 bg-stone-50 rounded-2xl outline-none mt-1 border border-transparent" 
                        onChange={e => setForm({...form, dieta_tipo: e.target.value})}>
                        <option value="PADRAO">Dieta Padrão</option>
                        <option value="VEGETARIANO">Vegetariano</option>
                        <option value="VEGANO">Vegano</option>
                        <option value="SEM_GLUTEN">Sem Glúten</option>
                    </select>
                </div>
              </div>

              <textarea 
                placeholder="Observações de viagem ou restrições alimentares específicas..." 
                className="w-full p-4 bg-stone-50 rounded-2xl outline-none h-24 border border-transparent"
                onChange={e => setForm({...form, observacao_viagem: e.target.value})}
              />

              <button type="submit" className="w-full bg-stone-800 text-white font-bold p-5 rounded-[2rem] hover:bg-black transition-all shadow-lg mt-4 text-[10px] uppercase tracking-[0.2em]">
                Confirmar Minha Inscrição
              </button>
            </div>
          </form>
          
          <div className="text-center">
            <button onClick={() => window.location.href = '/'} className="text-[10px] text-stone-400 hover:text-stone-800 uppercase font-bold tracking-widest">Já sou inscrito / Fazer Login</button>
          </div>
        </div>
      </div>
    </main>
  )
}