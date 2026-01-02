'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPortal() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function entrar() {
    if (!email) return alert("Por favor, digite seu e-mail.")
    setLoading(true)
    
    try {
      // 1. Buscamos qual é o retiro que está ABERTO agora
      const { data: retiroAtivo } = await supabase
        .from('retiros')
        .select('id')
        .eq('status', 'ABERTO')
        .maybeSingle()

      if (!retiroAtivo) {
        alert("Não há nenhum retiro aberto no momento.")
        setLoading(false)
        return
      }

      // 2. Buscamos o usuário pelo e-mail vinculado ao retiro ativo
      // Usamos .ilike e .trim() para evitar erros de digitação e espaços
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .ilike('email', email.trim())
        .eq('retiro_id', retiroAtivo.id)
        .maybeSingle()

      if (data) {
        localStorage.setItem('userEmail', data.email.toLowerCase())
        localStorage.setItem('userRole', data.nivel_acesso)
        
        // Redireciona baseado no papel (Roles)
        if (data.nivel_acesso === 'ADMIN') {
          window.location.href = '/lider'
        } else if (data.nivel_acesso === 'COZINHA') {
          window.location.href = '/cozinha'
        } else if (data.nivel_acesso === 'LOGISTICA') {
          window.location.href = '/logistica'
        } else if (data.nivel_acesso === 'FINANCEIRO') {
          window.location.href = '/financeiro'
        } else {
          window.location.href = '/meu-retiro'
        }
      } else {
        alert("E-mail não encontrado para este retiro. Verifique o endereço ou faça sua inscrição.")
      }
    } catch (err) {
      console.error(err)
      alert("Ocorreu um erro ao tentar entrar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 font-serif text-stone-800">
      <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 text-center">
        <h1 className="text-3xl italic mb-2">Portal Sangha</h1>
        <p className="text-stone-400 text-sm mb-8">Acesso ao Retiro</p>
        
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="Seu e-mail cadastrado" 
            className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-transparent focus:border-amber-200 transition-all text-center text-stone-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && entrar()}
          />
          <button 
            onClick={entrar}
            disabled={loading}
            className="w-full bg-stone-800 text-white p-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-black transition-all disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar no Sistema'}
          </button>
          
          <div className="pt-6 border-t border-stone-50">
            <p className="text-[10px] uppercase text-stone-300 font-bold mb-4">Ainda não tem conta?</p>
            <a href="/inscricao" className="text-amber-700 font-bold text-sm hover:underline italic">
              Quero me inscrever agora →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}