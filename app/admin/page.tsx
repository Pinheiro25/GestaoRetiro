'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function AdminHub() {
  const [nome, setNome] = useState('')

  useEffect(() => {
    setNome(localStorage.getItem('user_name') || 'Administrador')
  }, [])

  const modulos = [
    { 
      titulo: 'Dashboard do Líder', 
      desc: 'Métricas, ocupação e financeiro geral.', 
      link: '/lider', 
      icone: '📈',
      cor: 'bg-amber-50' 
    },
    { 
      titulo: 'Gestão de Retiros', 
      desc: 'Criar novos eventos e alterar status.', 
      link: '/admin/retiros', 
      icone: '🏔️',
      cor: 'bg-stone-50'
    },
    { 
      titulo: 'Equipe de Guardiões', 
      desc: 'Definir Financeiro e Logística por retiro.', 
      link: '/admin/guardioes', 
      icone: '🛡️',
      cor: 'bg-blue-50/30'
    },
    { 
      titulo: 'Painel Financeiro', 
      desc: 'Lista de inscritos, acordos e parcelas.', 
      link: '/financeiro', 
      icone: '💰',
      cor: 'bg-green-50/30'
    }
  ]

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-6 md:p-12 font-serif">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-light text-stone-800">Salve, {nome.split(' ')[0]}</h1>
          <p className="text-stone-500 italic mt-2">Central de orquestração da Sangha</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modulos.map((m) => (
            <Link 
              key={m.link} 
              href={m.link}
              className={`${m.cor} p-8 rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-md transition-all group`}
            >
              <span className="text-4xl block mb-4 group-hover:scale-110 transition-transform">{m.icone}</span>
              <h2 className="text-xl font-medium text-stone-800 mb-2">{m.titulo}</h2>
              <p className="text-sm text-stone-500 leading-relaxed">{m.desc}</p>
            </Link>
          ))}
        </div>

        <footer className="mt-16 text-center">
          <Link href="/" className="text-xs text-stone-400 hover:text-amber-700 transition-colors uppercase tracking-widest">
            Ir para página pública de inscrição
          </Link>
        </footer>
      </div>
    </div>
  )
}