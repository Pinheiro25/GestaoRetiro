'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function GestaoRetiros() {
  const [retiros, setRetiros] = useState<any[]>([])
  const [editandoId, setEditandoId] = useState<string | null>(null)
  
  const estadoInicial = {
    titulo: '', 
    tema: '', 
    ministrantes: '', 
    lider_nome: '',
    vagas_totais: '15', 
    valor_padrao: '1540', 
    valor_abundancia: '2100',
    data_inicio: '', 
    data_fim: '', 
    status: 'CRIADO'
  }

  const [formData, setFormData] = useState(estadoInicial)

  useEffect(() => { carregarRetiros() }, [])

  // Função essencial para o calendário aceitar a data do banco
  const formatarDataParaInput = (dataIso: string) => {
    if (!dataIso) return ''
    return dataIso.split('T')[0]
  }

  async function carregarRetiros() {
    const { data, error } = await supabase
      .from('retiros')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error("Erro:", error.message);
    else setRetiros(data || []);
  }

  async function salvarRetiro(e: React.FormEvent) {
    e.preventDefault()
    
    const payload = { 
      titulo: formData.titulo,
      tema: formData.tema,
      ministrantes: formData.ministrantes,
      lider_nome: formData.lider_nome,
      vagas_totais: parseInt(formData.vagas_totais),
      valor_padrao: parseFloat(formData.valor_padrao),
      valor_abundancia: parseFloat(formData.valor_abundancia),
      data_inicio: formData.data_inicio || null,
      data_fim: formData.data_fim || null,
      status: formData.status
    }

    const { error } = editandoId 
      ? await supabase.from('retiros').update(payload).eq('id', editandoId)
      : await supabase.from('retiros').insert([payload])

    if (!error) {
      alert(editandoId ? 'Retiro atualizado com sucesso! ✨' : 'Novo retiro manifestado! 🪷')
      setEditandoId(null)
      setFormData(estadoInicial)
      carregarRetiros()
    } else {
      alert('Erro ao salvar: ' + error.message)
    }
  }

  const prepararEdicao = (r: any) => {
    setEditandoId(r.id)
    setFormData({
      titulo: r.titulo || '',
      tema: r.tema || '',
      ministrantes: r.ministrantes || '',
      lider_nome: r.lider_nome || '',
      vagas_totais: r.vagas_totais?.toString() || '15',
      valor_padrao: r.valor_padrao?.toString() || '1540',
      valor_abundancia: r.valor_abundancia?.toString() || '2100',
      // Aqui aplicamos a formatação para as datas aparecerem
      data_inicio: formatarDataParaInput(r.data_inicio),
      data_fim: formatarDataParaInput(r.data_fim),
      status: r.status || 'CRIADO'
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-4 md:p-8 font-serif text-stone-800">
      <div className="max-w-5xl mx-auto space-y-12">
        
        <section className="bg-white border border-stone-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
          <h1 className="text-3xl font-light mb-10 text-center text-stone-800">
            {editandoId ? 'Editar Detalhes do Retiro' : 'Configurar Novo Retiro'}
          </h1>
          
          <form onSubmit={salvarRetiro} className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <div className="md:col-span-2 border-b border-stone-100 pb-2">
              <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Título do Retiro</label>
              <input type="text" value={formData.titulo} className="w-full p-2 bg-transparent outline-none text-lg" 
                onChange={e => setFormData({...formData, titulo: e.target.value})} required placeholder="Ex: Retiro de Carnaval 2026" />
            </div>

            <div className="border-b border-stone-100 pb-2">
              <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Líder Responsável</label>
              <input type="text" value={formData.lider_nome} className="w-full p-2 bg-transparent outline-none" 
                onChange={e => setFormData({...formData, lider_nome: e.target.value})} placeholder="Quem orquestra?" />
            </div>

            <div className="border-b border-stone-100 pb-2">
              <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Tema</label>
              <input type="text" value={formData.tema} className="w-full p-2 bg-transparent outline-none" 
                onChange={e => setFormData({...formData, tema: e.target.value})} placeholder="A essência do ensinamento" />
            </div>

            <div className="md:col-span-2 border-b border-stone-100 pb-2">
              <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Ministrantes / Convidados</label>
              <input type="text" value={formData.ministrantes} className="w-full p-2 bg-transparent outline-none" 
                onChange={e => setFormData({...formData, ministrantes: e.target.value})} placeholder="Nomes dos mestres" />
            </div>

            <div className="border-b border-stone-100 pb-2">
              <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Data de Início</label>
              <input type="date" value={formData.data_inicio} className="w-full p-2 bg-transparent outline-none text-stone-600" 
                onChange={e => setFormData({...formData, data_inicio: e.target.value})} />
            </div>

            <div className="border-b border-stone-100 pb-2">
              <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Data de Término</label>
              <input type="date" value={formData.data_fim} className="w-full p-2 bg-transparent outline-none text-stone-600" 
                onChange={e => setFormData({...formData, data_fim: e.target.value})} />
            </div>

            <div className="border-b border-stone-100 pb-2">
              <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Sugestão Padrão (R$)</label>
              <input type="number" value={formData.valor_padrao} className="w-full p-2 bg-transparent outline-none" 
                onChange={e => setFormData({...formData, valor_padrao: e.target.value})} />
            </div>

            <div className="border-b border-stone-100 pb-2">
              <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Sugestão Abundância (R$)</label>
              <input type="number" value={formData.valor_abundancia} className="w-full p-2 bg-transparent outline-none" 
                onChange={e => setFormData({...formData, valor_abundancia: e.target.value})} />
            </div>

            <div className="border-b border-stone-100 pb-2">
              <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Vagas Totais</label>
              <input type="number" value={formData.vagas_totais} className="w-full p-2 bg-transparent outline-none" 
                onChange={e => setFormData({...formData, vagas_totais: e.target.value})} />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Status da Inscrição</label>
              <select value={formData.status} className="w-full p-2 bg-stone-50 rounded-xl outline-none mt-2 text-sm"
                onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="CRIADO">⚙️ Rascunho</option>
                <option value="ABERTO">🟢 Aberto</option>
                <option value="FECHADO">🔴 Fechado</option>
              </select>
            </div>

            <button type="submit" className="md:col-span-2 bg-[#E8DCC4] text-stone-800 p-5 rounded-2xl hover:bg-[#DCCCAF] transition-all font-bold shadow-sm text-lg">
              {editandoId ? 'Salvar Atualizações' : 'Publicar Retiro'}
            </button>
            
            {editandoId && (
              <button type="button" onClick={() => { setEditandoId(null); setFormData(estadoInicial); }} className="md:col-span-2 text-stone-400 hover:text-stone-600 text-sm italic">
                Cancelar edição e criar novo retiro
              </button>
            )}
          </form>
        </section>

        {/* HISTÓRICO */}
        <section>
          <h2 className="text-xl font-light mb-8 text-stone-500 italic flex items-center text-center">
             Histórico de Retiros Criados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {retiros.map(r => (
              <div key={r.id} className={`p-6 rounded-[2rem] border transition-all ${r.status === 'ABERTO' ? 'bg-white border-amber-100 shadow-md ring-1 ring-amber-50' : 'bg-stone-50/50 border-stone-100'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-bold ${r.status === 'ABERTO' ? 'bg-green-100 text-green-700' : 'bg-stone-200 text-stone-500'}`}>
                      {r.status}
                    </span>
                    <h3 className="text-lg font-medium text-stone-800 mt-2 leading-tight">{r.titulo}</h3>
                    <p className="text-xs text-stone-500 mt-1 italic">{r.tema}</p>
                  </div>
                  <button 
                    onClick={() => prepararEdicao(r)}
                    className="p-3 bg-white border border-stone-200 rounded-2xl hover:bg-stone-50 shadow-sm transition-all text-xs font-bold text-stone-600"
                  >
                    EDITAR
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 text-[11px] text-stone-400 border-t border-stone-100 pt-4">
                  <p>🗓️ {r.data_inicio ? new Date(r.data_inicio).toLocaleDateString() : '—'}</p>
                  <p>🧘 {r.vagas_totais} vagas</p>
                  <p>👤 Líder: {r.lider_nome || '—'}</p>
                  <p>💰 R$ {r.valor_padrao}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}