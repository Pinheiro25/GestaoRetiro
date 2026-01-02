'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function DetalhesParticipante() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  
  const [pessoa, setPessoa] = useState<any>(null)
  const [pagamentos, setPagamentos] = useState<any[]>([])
  const [valorAcordado, setValorAcordado] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [role, setRole] = useState('') // Estado para o Status/Role
  const [novoPagamento, setNovoPagamento] = useState('')
  const [mensagem, setMensagem] = useState('')

  const carregarDados = async () => {
    if (!id) return
    
    const { data: user } = await supabase.from('usuarios').select('*').eq('id', id).single()
    if (user) {
      setPessoa(user)
      setValorAcordado(user.valor_acordado || '0')
      setObservacoes(user.observacoes || '')
      setRole(user.role || 'PRÉ-INSCRITO')
    }

    const { data: payments } = await supabase.from('pagamentos').select('*').eq('usuario_id', id).order('data_pagamento', { ascending: false })
    if (payments) setPagamentos(payments)
  }

  useEffect(() => { carregarDados() }, [id])

  const salvarAlteracoes = async (novoRole?: string) => {
    setMensagem('Sincronizando...')
    const valorParaSalvar = parseFloat(valorAcordado) || 0
    const roleParaSalvar = novoRole || role

    const { error } = await supabase
      .from('usuarios')
      .update({ 
        valor_acordado: valorParaSalvar, 
        observacoes: observacoes,
        role: roleParaSalvar
      })
      .eq('id', id)

    if (error) {
      alert("Erro ao salvar: " + error.message)
    } else {
      setMensagem('Registros atualizados com paz! 🙏')
      carregarDados() 
      setTimeout(() => setMensagem(''), 3000)
    }
  }

  const registrarPagamento = async () => {
    if (!novoPagamento || parseFloat(novoPagamento) <= 0) {
        alert("Insira um valor válido.");
        return;
    }

    // 1. Lança o pagamento
    const { error: payError } = await supabase.from('pagamentos').insert([
        { usuario_id: id, valor_pago: parseFloat(novoPagamento), metodo: 'Pix' }
    ]);

    if (payError) {
      alert("Erro ao salvar pagamento");
      return;
    }

    // 2. Se for pré-inscrito, vira INSCRITO automaticamente
    if (role === 'PRÉ-INSCRITO') {
      await supabase.from('usuarios').update({ role: 'INSCRITO' }).eq('id', id);
      setRole('INSCRITO');
    }

    setNovoPagamento('');
    setMensagem('Pagamento e inscrição confirmados! ✨');
    carregarDados();
  };

  const totalPago = pagamentos.reduce((acc, curr) => acc + Number(curr.valor_pago), 0)
  const saldoDevedor = Number(valorAcordado) - totalPago

  if (!pessoa) return <div className="p-10 text-stone-500 font-serif italic text-center">Buscando guardião...</div>

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-4 md:p-8 font-serif text-black">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
          <button onClick={() => router.push('/financeiro')} className="text-stone-400 hover:text-stone-600 mb-6 text-sm flex items-center gap-2">← Painel Financeiro</button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-light text-stone-800">{pessoa.nome}</h1>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-stone-500">{pessoa.cidade}</p>
                <span className="text-stone-300">|</span>
                <a 
                  href={`https://wa.me/55${pessoa.whatsapp?.replace(/\D/g,'')}`} 
                  target="_blank" 
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 font-sans font-medium text-sm transition-all"
                >
                  <span>{pessoa.whatsapp}</span>
                  <span className="bg-green-100 p-1.5 rounded-full">💬</span>
                </a>
              </div>
            </div>

            {/* SELETOR DE STATUS (ROLE) */}
            <div className="bg-stone-50 p-2 rounded-2xl border border-stone-100">
              <label className="block text-[9px] uppercase font-bold text-stone-400 ml-2 mb-1">Status do Inscrito</label>
              <select 
                value={role} 
                onChange={(e) => { setRole(e.target.value); salvarAlteracoes(e.target.value); }}
                className={`text-xs font-bold px-4 py-2 rounded-xl outline-none border-none appearance-none cursor-pointer ${
                  role === 'INSCRITO' ? 'bg-green-100 text-green-700' : 
                  role === 'DESISTENTE' ? 'bg-red-100 text-red-700' : 
                  'bg-amber-100 text-amber-700'
                }`}
              >
                <option value="PRÉ-INSCRITO">🟡 PRÉ-INSCRITO</option>
                <option value="INSCRITO">🟢 INSCRITO</option>
                <option value="ESPERA">🔵 LISTA DE ESPERA</option>
                <option value="DESISTENTE">🔴 DESISTENTE</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* COLUNA ESQUERDA: ACORDO */}
          <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-stone-500 font-semibold mb-6 flex items-center gap-2">☸️ Acordo e Notas</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-stone-400 mb-1">Valor Total Acordado</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-stone-400 text-sm">R$</span>
                  <input type="number" value={valorAcordado} onChange={(e) => setValorAcordado(e.target.value)} className="w-full p-3 pl-10 bg-stone-50 border border-stone-100 rounded-xl outline-none font-sans" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase text-stone-400 mb-1">Observações Internas</label>
                <textarea rows={4} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="w-full p-3 bg-stone-50 border border-stone-100 rounded-xl outline-none text-sm font-sans" placeholder="Detalhes do parcelamento ou pedidos especiais..." />
              </div>
              <button onClick={() => salvarAlteracoes()} className="w-full bg-[#E8DCC4] text-stone-800 p-3 rounded-xl hover:bg-[#DCCCAF] font-bold text-xs uppercase tracking-widest transition-all">Atualizar Cadastro</button>
            </div>
          </div>

          {/* COLUNA DIREITA: FINANCEIRO */}
          <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm space-y-6">
            <h2 className="text-stone-500 font-semibold flex items-center gap-2">💰 Pagamentos</h2>
            
            <div className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl border border-stone-100 font-sans">
              <div className="text-center">
                <p className="text-[10px] uppercase text-stone-400 font-bold">Total Pago</p>
                <p className="text-xl font-light text-green-600">R$ {totalPago.toFixed(2)}</p>
              </div>
              <div className="h-8 w-px bg-stone-200"></div>
              <div className="text-center">
                <p className="text-[10px] uppercase text-stone-400 font-bold">A Pagar</p>
                <p className={`text-xl font-light ${saldoDevedor > 0 ? 'text-amber-700' : 'text-stone-400'}`}>
                  R$ {saldoDevedor.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <input type="number" placeholder="Novo valor" value={novoPagamento} onChange={(e) => setNovoPagamento(e.target.value)} className="flex-1 p-3 bg-stone-50 border border-stone-100 rounded-xl outline-none font-sans" />
              <button onClick={registrarPagamento} className="bg-stone-800 text-white px-6 rounded-xl hover:bg-stone-700 transition-all font-bold text-xs uppercase tracking-widest">Lançar</button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-[10px] uppercase text-stone-400 mb-2 font-bold tracking-widest">Histórico</p>
              {pagamentos.length === 0 ? (
                <p className="text-xs text-stone-300 italic">Nenhum pagamento registrado.</p>
              ) : (
                pagamentos.map((pag) => (
                  <div key={pag.id} className="flex justify-between text-sm py-2 border-b border-stone-50 font-sans">
                    <span className="text-stone-500">{new Date(pag.data_pagamento).toLocaleDateString('pt-BR')}</span>
                    <span className="font-bold text-stone-700">R$ {Number(pag.valor_pago).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {mensagem && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-8 py-3 rounded-full text-sm shadow-2xl animate-bounce">
            {mensagem}
          </div>
        )}
      </div>
    </div>
  )
}