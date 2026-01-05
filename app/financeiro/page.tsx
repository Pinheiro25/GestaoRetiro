'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function FinanceiroFiltro() {
  const [retiros, setRetiros] = useState<any[]>([])
  const [retiroSelecionado, setRetiroSelecionado] = useState('')
  const [dadosRetiro, setDadosRetiro] = useState<any>(null)
  const [inscritos, setInscritos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarIniciais() {
      const { data: listRetiros } = await supabase.from('retiros').select('*').order('data_inicio', { ascending: false })
      
      if (listRetiros) {
        setRetiros(listRetiros)
        const aberto = listRetiros.find(r => r.status === 'ABERTO')
        if (aberto) {
          setRetiroSelecionado(aberto.id)
          setDadosRetiro(aberto)
        } else if (listRetiros.length > 0) {
          setRetiroSelecionado(listRetiros[0].id)
          setDadosRetiro(listRetiros[0])
        }
      }
      setLoading(false)
    }
    carregarIniciais()
  }, [])

  useEffect(() => {
    async function filtrarInscritos() {
      if (!retiroSelecionado) return
      
      // Busca usuários e seus pagamentos em paralelo
      const { data: users } = await supabase
        .from('usuarios')
        .select(`
          *,
          pagamentos (valor_pago)
        `)
        .eq('retiro_id', retiroSelecionado)
        .order('nome', { ascending: true })
      
      if (users) {
        // Calcula o total pago para cada pessoa para facilitar a tabela
        const usersComSoma = users.map(u => ({
          ...u,
          totalPago: (u.pagamentos || []).reduce((acc: number, p: any) => acc + (Number(p.valor_pago) || 0), 0)
        }))
        setInscritos(usersComSoma)
      }

      // Atualiza dados do retiro atual (para o termômetro)
      const r = retiros.find(ret => ret.id === retiroSelecionado)
      if (r) setDadosRetiro(r)
    }
    filtrarInscritos()
  }, [retiroSelecionado, retiros])

  async function alterarStatus(id: string, novoStatus: string) {
    const { error } = await supabase
      .from('usuarios')
      .update({ role: novoStatus })
      .eq('id', id)

    if (!error) {
      setInscritos(prev => prev.map(p => p.id === id ? { ...p, role: novoStatus } : p))
    } else {
      alert("Erro ao atualizar: " + error.message)
    }
  }

  // Cálculos para o Cabeçalho
  const inscritosConfirmados = inscritos.filter(i => i.role === 'INSCRITO' && i.ocupa_vaga === true).length
  const emEspera = inscritos.filter(i => i.role === 'EM ESPERA').length
  const vagasTotais = dadosRetiro?.vagas_totais || 0
  const vagasRestantes = Math.max(0, vagasTotais - inscritosConfirmados)
  const porcentagemOcupacao = Math.min((inscritosConfirmados / (vagasTotais || 1)) * 100, 100)

  if (loading) return <div className="p-20 text-center font-serif text-stone-400 italic">Organizando as contas... ☸️</div>

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-4 md:p-12 font-serif text-stone-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-light text-stone-800 tracking-tight">Guardião Financeiro</h1>
            <p className="text-stone-400 text-sm italic">Gestão de fluxos e contribuições da Sangha</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            {/* TERMÔMETRO DE VAGAS */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm min-w-[250px]">
              <div className="flex justify-between text-[10px] uppercase font-bold text-stone-400 mb-2 font-sans tracking-widest">
                <span>Ocupação do Sítio</span>
                <span className={vagasRestantes === 0 ? 'text-red-500' : 'text-emerald-600'}>
                  {vagasRestantes} Vagas
                </span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${porcentagemOcupacao > 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${porcentagemOcupacao}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3 self-end md:self-auto">
              <label className="text-[10px] uppercase font-bold text-stone-400 ml-2 font-sans">Retiro:</label>
              <select 
                value={retiroSelecionado}
                onChange={(e) => setRetiroSelecionado(e.target.value)}
                className="bg-transparent outline-none text-sm text-stone-700 pr-4 font-bold font-sans cursor-pointer"
              >
                {retiros.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.status === 'ABERTO' ? `🟢 ${r.titulo}` : r.titulo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* INDICADORES RÁPIDOS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
            <p className="text-[9px] uppercase font-bold text-stone-400 font-sans">Inscritos</p>
            <p className="text-2xl font-light">{inscritos.filter(i => i.role === 'INSCRITO').length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
            <p className="text-[9px] uppercase font-bold text-stone-400 font-sans">Pré-Inscritos</p>
            <p className="text-2xl font-light">{inscritos.filter(i => i.role === 'PRÉ-INSCRITO').length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
            <p className="text-[9px] uppercase font-bold text-stone-400 font-sans">Em Espera</p>
            <p className={`text-2xl font-light ${emEspera > 0 ? 'text-amber-600 font-bold' : ''}`}>{emEspera}</p>
          </div>
          <div className="bg-stone-800 text-white p-4 rounded-2xl shadow-md">
            <p className="text-[9px] uppercase font-bold text-stone-400 font-sans">Total Ocupação</p>
            <p className="text-2xl font-light">{inscritosConfirmados} / {vagasTotais}</p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-[2.5rem] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse font-sans">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="p-6 text-[10px] uppercase tracking-widest text-stone-400 font-bold">Participante</th>
                <th className="p-6 text-[10px] uppercase tracking-widest text-stone-400 font-bold text-center">Acordado</th>
                <th className="p-6 text-[10px] uppercase tracking-widest text-stone-400 font-bold text-center">Status Pagto</th>
                <th className="p-6 text-[10px] uppercase tracking-widest text-stone-400 font-bold text-center">Role</th>
                <th className="p-6 text-[10px] uppercase tracking-widest text-stone-400 font-bold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {inscritos.map((pessoa) => {
                const quitado = pessoa.totalPago >= Number(pessoa.valor_acordado) && Number(pessoa.valor_acordado) > 0;
                const isIsento = Number(pessoa.valor_acordado) === 0 && pessoa.role === 'INSCRITO';

                return (
                  <tr key={pessoa.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-6">
                      <p className="font-semibold text-stone-800 text-sm">{pessoa.nome}</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-tighter">{pessoa.cidade || 'Sem Cidade'}</p>
                    </td>

                    <td className="p-6 text-center">
                      <p className="text-xs font-bold text-stone-700">R$ {Number(pessoa.valor_acordado).toLocaleString('pt-BR')}</p>
                      <p className="text-[9px] text-stone-400">Total Pago: R$ {pessoa.totalPago.toLocaleString('pt-BR')}</p>
                    </td>
                    
                    <td className="p-6 text-center">
                      {isIsento ? (
                        <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">ISENTO/STAFF</span>
                      ) : quitado ? (
                        <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">✨ QUITADO</span>
                      ) : (
                        <span className="text-[9px] font-bold bg-red-50 text-red-400 px-3 py-1 rounded-full border border-red-100">PENDENTE</span>
                      )}
                    </td>

                    <td className="p-6 text-center">
                      <select 
                        value={pessoa.role} 
                        onChange={(e) => alterarStatus(pessoa.id, e.target.value)}
                        className={`text-[9px] font-bold uppercase px-3 py-1 rounded-full border-none cursor-pointer outline-none transition-colors ${
                          pessoa.role === 'INSCRITO' ? 'bg-emerald-100 text-emerald-700' :
                          pessoa.role === 'PRÉ-INSCRITO' ? 'bg-amber-100 text-amber-700' :
                          pessoa.role === 'EM ESPERA' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}
                      >
                        <option value="PRÉ-INSCRITO">PRÉ-INSCRITO</option>
                        <option value="INSCRITO">INSCRITO</option>
                        <option value="EM ESPERA">EM ESPERA</option>
                        <option value="DESISTENTE">DESISTENTE</option>
                      </select>
                    </td>

                    <td className="p-6 text-right">
                      <Link 
                        href={`/financeiro/${pessoa.id}`}
                        className="text-[10px] uppercase font-bold bg-stone-100 text-stone-600 px-4 py-2 rounded-xl hover:bg-stone-800 hover:text-white transition-all shadow-sm"
                      >
                        Lançar Dana
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}