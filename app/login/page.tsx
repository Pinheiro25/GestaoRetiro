'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPortal() {
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' })
  const router = useRouter()

  const realizarLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensagem({ texto: 'Iniciando sintonização...', tipo: 'info' })

    const { data, error } = await supabase
      .from('usuarios')
      .select('*, retiros!retiro_id!inner(*)')
      .eq('email', email.toLowerCase().trim())
      .eq('codigo_acesso', codigo.trim())

    if (error) {
      setMensagem({ texto: 'Erro na conexão: ' + error.message, tipo: 'erro' })
      return
    }

    if (data && data.length > 0) {
      const sessao = data.find(i => i.retiros.status === 'ABERTO') || data[0]

      // --- NOVIDADE: SALVAR EM COOKIE PARA O MIDDLEWARE LER ---
      // Criamos um "token" simples. Em produção o ideal é JWT, 
      // mas para o retiro, o nível de acesso no cookie já resolve o bloqueio de URL.
      document.cookie = `sangha_session=${sessao.nivel_acesso}; path=/; max-age=86400; SameSite=Lax`
      
      // Mantemos o localStorage para uso dos componentes internos
      localStorage.setItem('user_role', sessao.nivel_acesso)
      localStorage.setItem('user_id', sessao.id)
      localStorage.setItem('user_name', sessao.nome)

      setMensagem({ texto: 'Bem-vindo(a), ' + sessao.nome, tipo: 'sucesso' })

      setTimeout(() => {
        // Redirecionamento unificado para a Home ou Dashboard
        if (['ADMIN', 'LIDER'].includes(sessao.nivel_acesso)) router.push('/lider')
        else if (sessao.nivel_acesso === 'FINANCEIRO') router.push('/financeiro')
        else router.push('/meu-retiro')
      }, 1000)
    } else {
      setMensagem({ texto: 'E-mail ou código não reconhecidos.', tipo: 'erro' })
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 font-serif">
      <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100">
        <div className="text-center mb-8">
          <span className="text-4xl">☸️</span>
          <h1 className="text-2xl font-light text-stone-800 mt-4">Portal da Sangha</h1>
          <p className="text-stone-400 text-sm italic">Identifique-se para entrar</p>
        </div>

        <form onSubmit={realizarLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Seu e-mail" 
            className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-transparent focus:border-amber-200"
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Código de acesso" 
            className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-transparent focus:border-amber-200"
            onChange={e => setCodigo(e.target.value)}
            required
          />
          {mensagem.texto && (
            <p className={`text-xs text-center italic ${mensagem.tipo === 'erro' ? 'text-red-400' : 'text-amber-600'}`}>
              {mensagem.texto}
            </p>
          )}
          <button type="submit" className="w-full bg-[#E8DCC4] text-stone-800 font-bold p-4 rounded-2xl hover:bg-[#DCCCAF] transition-all">
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}