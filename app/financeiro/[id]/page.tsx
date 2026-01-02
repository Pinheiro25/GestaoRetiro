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
  const [novoPagamento, setNovoPagamento] = useState('')
  const [mensagem, setMensagem] = useState('')

  const carregarDados = async () => {
    if (!id) return
    
    // Busca dados do usuário
    const { data: user } = await supabase.from('usuarios').select('*').eq('id', id).single()
    if (user) {
      setPessoa(user)
      setValorAcordado(user.valor_acordado || '0')
      setObservacoes(user.observacoes || '')
    }

    // Busca histórico de pagamentos
    const { data: payments } = await supabase.from('pagamentos').select('*').eq('usuario_id', id).order('data_pagamento', { ascending: false })
    if (payments) setPagamentos(payments)
  }

  useEffect(() => { carregarDados() }, [id])

  const salvarAlteracoes = async () => {
  setMensagem('Iniciando salvamento...')

  // Garantimos que o valor é um número válido ou zero
  const valorParaSalvar = parseFloat(valorAcordado) || 0

  const { error } = await supabase
    .from('usuarios')
    .update({ 
      valor_acordado: valorParaSalvar, 
      observacoes: observacoes 
    })
    .eq('id', id)

  if (error) {
    console.error("Erro ao salvar dados financeiros:", error.message)
    alert("Erro ao salvar: " + error.message)
    setMensagem('Erro ao guardar as informações.')
  } else {
    setMensagem('Registros atualizados com paz! 🙏')
    // Recarrega os dados para garantir que a tela reflete o banco
    carregarDados() 
    
    // Limpa a mensagem após 3 segundos
    setTimeout(() => setMensagem(''), 3000)
  }
}

  const registrarPagamento = async () => {
    if (!novoPagamento || parseFloat(novoPagamento) <= 0) {
        alert("Por favor, insira um valor válido.");
        return;
    }

    const { error } = await supabase.from('pagamentos').insert([
        { 
          usuario_id: id, 
          valor_pago: parseFloat(novoPagamento), 
        metodo: 'Pix' 
        }
    ]);

  if (error) {
    console.error("Erro ao lançar:", error.message);
    alert("Erro ao salvar pagamento: " + error.message);
  } else {
    setNovoPagamento('');
    setMensagem('Pagamento recebido com gratidão! ✨');
    carregarDados(); // Recarrega a lista e o saldo na tela
  }
};

  const totalPago = pagamentos.reduce((acc, curr) => acc + Number(curr.valor_pago), 0)
  const saldoDevedor = Number(valorAcordado) - totalPago

  if (!pessoa) return <div className="p-10 text-stone-500 font-serif">Aguardando...</div>

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-4 md:p-8 font-serif text-black">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* CABEÇALHO E INFO BÁSICA */}
        <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
          <div className="absolute -top-4 -right-4 text-6xl opacity-5 text-amber-600">🪷</div>
          <button onClick={() => router.push('/financeiro')} className="text-stone-400 hover:text-stone-600 mb-6 text-sm">← Voltar</button>
          <h1 className="text-3xl font-light text-stone-800">{pessoa.nome}</h1>
          <p className="text-stone-500">{pessoa.cidade} • {pessoa.whatsapp}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* COLUNA ESQUERDA: FINANCEIRO E OBS */}
          <div className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
              <h2 className="text-stone-500 font-semibold mb-6 flex items-center">☸️ Acordo e Notas</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase text-stone-400 mb-1">Valor Total Acordado</label>
                  <input type="number" value={valorAcordado} onChange={(e) => setValorAcordado(e.target.value)} className="w-full p-3 bg-stone-50 border border-stone-100 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-xs uppercase text-stone-400 mb-1">Observações Internas</label>
                  <textarea rows={4} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="w-full p-3 bg-stone-50 border border-stone-100 rounded-xl outline-none text-sm" placeholder="Ex: Parcelou em 4x, pediu quarto individual..." />
                </div>
                <button onClick={salvarAlteracoes} className="w-full bg-[#E8DCC4] text-stone-800 p-3 rounded-xl hover:bg-[#DCCCAF] font-medium transition-all">Salvar Notas</button>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: PAGAMENTOS */}
          <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm space-y-6">
            <h2 className="text-stone-500 font-semibold flex items-center">💰 Gestão de Parcelas</h2>
            
            <div className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl border border-stone-100">
              <div className="text-center">
                <p className="text-[10px] uppercase text-stone-400">Total Pago</p>
                <p className="text-xl font-light text-green-600">R$ {totalPago.toFixed(2)}</p>
              </div>
              <div className="h-8 w-px bg-stone-200"></div>
              <div className="text-center">
                <p className="text-[10px] uppercase text-stone-400">Saldo Restante</p>
                <p className="text-xl font-light text-amber-700">R$ {saldoDevedor.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input type="number" placeholder="Valor da Parcela" value={novoPagamento} onChange={(e) => setNovoPagamento(e.target.value)} className="flex-1 p-3 bg-stone-50 border border-stone-100 rounded-xl outline-none" />
              <button onClick={registrarPagamento} className="bg-stone-800 text-white px-6 rounded-xl hover:bg-stone-700 transition-all">Lançar</button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              <p className="text-[10px] uppercase text-stone-400 mb-2 font-bold">Histórico</p>
              {pagamentos.map((pag) => (
                <div key={pag.id} className="flex justify-between text-sm p-2 border-b border-stone-50">
                  <span className="text-stone-500">{new Date(pag.data_pagamento).toLocaleDateString()}</span>
                  <span className="font-medium text-stone-700">R$ {Number(pag.valor_pago).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {mensagem && <div className="text-center text-stone-600 bg-amber-50 p-3 rounded-2xl italic">{mensagem}</div>}
      </div>
    </div>
  )
}