'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function InscricaoDinamica() {
  const [retirosAbertos, setRetirosAbertos] = useState<any[]>([])
  const [retiroSelecionado, setRetiroSelecionado] = useState<any>(null)
  const [contatoFinanceiro, setContatoFinanceiro] = useState({ nome: 'Patrícia (Paty)', whats: '15 98129-9944' })
  const [loading, setLoading] = useState(true)
  const [enviado, setEnviado] = useState(false)
  
  const [form, setForm] = useState({ 
    nome: '', email: '', whatsapp: '', cidade: '',
    transporte_tipo: '', vagas_carro: 0, observacao_viagem: '',
    alergias_restricoes: '', dieta_tipo: 'OVOLACTO'
  })

  useEffect(() => {
    async function carregarRetiros() {
      const { data } = await supabase
        .from('retiros')
        .select('*')
        .eq('status', 'ABERTO')
        .order('data_inicio', { ascending: true })
      
      if (data && data.length > 0) {
        setRetirosAbertos(data)
        setRetiroSelecionado(data[0])
      }
      setLoading(false)
    }
    carregarRetiros()
  }, [])

  useEffect(() => {
    if (retiroSelecionado) buscarResponsavel(retiroSelecionado.id)
  }, [retiroSelecionado])

  async function buscarResponsavel(retiroId: string) {
    const { data } = await supabase
      .from('usuarios')
      .select('nome, whatsapp')
      .eq('retiro_id', retiroId)
      .eq('nivel_acesso', 'FINANCEIRO')
      .limit(1)
      .single()

    if (data) setContatoFinanceiro({ nome: data.nome, whats: data.whatsapp })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('usuarios').insert([{
      ...form,
      role: 'PRÉ-INSCRITO',
      nivel_acesso: 'PARTICIPANTE',
      codigo_acesso: 'sangha2026',
      ocupa_vaga: true,
      retiro_id: retiroSelecionado?.id
    }])

    if (!error) setEnviado(true)
    else alert("Erro ao enviar: " + error.message)
  }

  if (loading) return <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center font-serif italic text-stone-400">Preparando o ambiente...</div>

  if (enviado) return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center font-serif p-6 text-center">
      <span className="text-6xl mb-6">🪷</span>
      <h1 className="text-2xl text-stone-800 mb-4">Inscrição Enviada!</h1>
      <p className="text-stone-600 max-w-md">
        Que alegria ter você conosco! Agora, para garantir sua vaga, envie o comprovante para <strong>{contatoFinanceiro.nome}</strong>.
      </p>
      {contatoFinanceiro.whats && (
        <a href={`https://wa.me/${contatoFinanceiro.whats.replace(/\D/g, '')}`} target="_blank" className="mt-6 inline-block bg-[#25D366] text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg">
          Enviar Comprovante via WhatsApp
        </a>
      )}
    </div>
  )

  return (
    <main className="min-h-screen bg-[#FDFCF8] font-serif text-stone-800 p-4 md:p-12">
      <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-[3rem] shadow-sm overflow-hidden">
        
        <div className="bg-[#E8DCC4] p-10 text-center relative">
          <h1 className="text-3xl font-light mb-2">{retiroSelecionado?.titulo}</h1>
          <p className="text-stone-600 italic mb-4">"{retiroSelecionado?.tema}"</p>
          <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold space-y-1">
            {/* CORREÇÃO DE DATA: timeZone 'UTC' evita que o fuso local atrase o dia */}
            <p>📅 Chegada: {new Date(retiroSelecionado?.data_inicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} às {retiroSelecionado?.horario_chegada || '08:00'}</p>
            <p>📅 Fim: {new Date(retiroSelecionado?.data_fim).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} às {retiroSelecionado?.horario_saida || '12:30'}</p>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-8">
          <section className="text-sm text-stone-600 leading-relaxed space-y-4">
            <p><strong>Ministrado por:</strong> {retiroSelecionado?.ministrantes}</p>
            <p className="italic">Este é o formulário de Inscrição para o {retiroSelecionado?.titulo}. Em todos nossos cálculos já estão incluídos as refeições, ensinamentos e alojamento.</p>
            
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
              <h4 className="font-bold text-stone-800 mb-2 uppercase text-[10px] tracking-widest">Dados para Pagamento</h4>
              <p>Nubank 0260 | Ag: 0001 | Conta: 36362806-2 | Stephen Little</p>
              <p className="font-mono text-amber-700 font-bold mt-1">PIX: info@budismosaopaulo.com.br</p>
              <p className="text-[11px] mt-2 italic text-stone-500">* Favor incluir "{retiroSelecionado?.titulo?.toUpperCase()}" na descrição e enviar o comprovante para {contatoFinanceiro.nome}.</p>
            </div>

            <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 space-y-3">
              <h4 className="font-bold text-stone-800 mb-1 uppercase text-[10px] tracking-widest text-center">Contribuição Sugerida</h4>
              <p className="text-[13px] text-center italic mb-4">Para garantir sua vaga, o depósito pode ser à vista ou em até 3x (1ª no ato da inscrição).</p>
              
              <ul className="space-y-3 text-[13px]">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Para quem consegue pagar um pouco mais: <strong>R$ {Number(retiroSelecionado?.valor_abundancia).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Para quem tem um orçamento menor: <strong>R$ {Number(retiroSelecionado?.valor_padrao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                </li>
                <li className="flex gap-2 text-stone-500 italic">
                  <span>•</span>
                  <span>Se estiver passando por dificuldades financeiras, entre em contato com {contatoFinanceiro.nome}. Tentamos, o mais possível, achar uma solução para todos.</span>
                </li>
              </ul>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="space-y-6 pt-8 border-t border-stone-100">
            <h3 className="text-center text-lg italic text-stone-400">Preencha seus dados</h3>
            
            <div className="space-y-4">
              <input type="text" placeholder="Nome Completo" required className="w-full p-4 bg-stone-50 rounded-xl outline-none shadow-inner" onChange={e => setForm({...form, nome: e.target.value})} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="email" placeholder="E-mail" required className="w-full p-4 bg-stone-50 rounded-xl outline-none shadow-inner" onChange={e => setForm({...form, email: e.target.value})} />
                <input type="text" placeholder="WhatsApp (com DDD)" required className="w-full p-4 bg-stone-50 rounded-xl outline-none shadow-inner" onChange={e => setForm({...form, whatsapp: e.target.value})} />
              </div>
              <input type="text" placeholder="Cidade / UF" required className="w-full p-4 bg-stone-50 rounded-xl outline-none shadow-inner" onChange={e => setForm({...form, cidade: e.target.value})} />
            </div>

            <div className="space-y-4 pt-6 border-t border-stone-100">
              <div className="flex items-center gap-2 text-emerald-700">
                <span className="text-lg">🌿</span>
                <p className="text-[10px] uppercase font-bold tracking-widest">Alimentação Ovolactovegetariana</p>
              </div>
              <textarea 
                placeholder="Possui alguma alergia alimentar ou restrição severa? (Ex: Glúten, Lactose, Amendoim...)" 
                className="w-full p-4 bg-stone-50 rounded-xl outline-none h-24 text-sm shadow-inner"
                onChange={e => setForm({...form, alergias_restricoes: e.target.value})}
              />
            </div>

            <div className="space-y-4 pt-6 border-t border-stone-100">
              <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block ml-1">Logística de Transporte (Comboio Rebouças)</label>
              <select required className="w-full p-4 bg-stone-50 rounded-xl outline-none text-sm shadow-inner cursor-pointer" onChange={e => setForm({...form, transporte_tipo: e.target.value})}>
                <option value="">Como você planeja chegar?</option>
                <option value="PRECISA_CARONA">Preciso de Carona (Comboio Rebouças)</option>
                <option value="OFERECE_CARONA">Ofereço carona do Comboio</option>
                <option value="VAI_DIRETO">Vou direto (Carro próprio/Outros)</option>
              </select>

              {form.transporte_tipo === 'OFERECE_CARONA' && (
                <input type="number" placeholder="Quantas vagas você oferece?" required className="w-full p-4 bg-amber-50/30 border border-amber-100 rounded-xl outline-none text-sm animate-in fade-in" onChange={e => setForm({...form, vagas_carro: parseInt(e.target.value)})} />
              )}
              
              <textarea placeholder="Observações sobre sua viagem..." className="w-full p-4 bg-stone-50 rounded-xl h-24 text-sm shadow-inner outline-none" onChange={e => setForm({...form, observacao_viagem: e.target.value})} />
            </div>

            <button type="submit" className="w-full bg-[#9DB2A2] text-white font-bold p-5 rounded-2xl hover:bg-[#8A9E8F] transition-all uppercase tracking-widest text-sm shadow-md mt-6">
              Confirmar minha Inscrição
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}