'use client'
import './globals.css'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // Busca o papel do usuário que salvamos no login
    setRole(localStorage.getItem('userRole'))
  }, [pathname])

  const isPublic = pathname === '/' || pathname === '/inscricao'
  if (isPublic) return <html lang="pt-br"><body>{children}</body></html>

  // Definição dos links baseada no Role para o Menu Mobile
  const getNavLinks = () => {
    const links = []
    if (role === 'ADMIN') {
      links.push({ href: '/lider', icon: '📊', label: 'Líder' })
      links.push({ href: '/financeiro', icon: '💳', label: 'Finanças' })
      links.push({ href: '/logistica', icon: '🚗', label: 'Logística' })
      links.push({ href: '/cozinha', icon: '🍳', label: 'Cozinha' })
    } else if (role === 'COZINHA') {
      links.push({ href: '/cozinha', icon: '🍳', label: 'Cozinha' })
    } else if (role === 'LOGISTICA') {
      links.push({ href: '/logistica', icon: '🚗', label: 'Logística' })
    } else if (role === 'FINANCEIRO') {
      links.push({ href: '/financeiro', icon: '💳', label: 'Financeiro' })
    }
    return links
  }

  return (
    <html lang="pt-br">
      <body className="bg-[#FDFCF8] flex min-h-screen">
        
        {/* ASIDE (Desktop): hidden no mobile, flex no desktop */}
        <aside className="hidden md:flex w-64 bg-white border-r border-stone-100 flex-col fixed h-full shadow-sm print:hidden">
          <div className="p-8 border-b border-stone-50 text-center">
            <h2 className="font-serif italic text-xl">Sangha</h2>
            <span className="text-[8px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase font-bold">{role}</span>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="text-[9px] uppercase font-bold text-stone-300 ml-3 mt-4 mb-2">Pessoal</p>
            <NavLink href="/meu-retiro" icon="🧘‍♂️" label="Minha Jornada" />
            
            <p className="text-[9px] uppercase font-bold text-stone-300 ml-3 mt-6 mb-2">Trabalho</p>
            
            {role === 'ADMIN' && (
              <>
                <NavLink href="/lider" icon="📊" label="Dashboard" />
                <NavLink href="/financeiro" icon="📝" label="Inscritos" />
                <NavLink href="/admin/guardioes" icon="🎭" label="Guardiões" />
                <NavLink href="/cozinha" icon="🍳" label="Cozinha" />
                <NavLink href="/logistica" icon="🚗" label="Logística" />
                <NavLink href="/alojamento" icon="🏠" label="Quartos" />
              </>
            )}

            {role === 'COZINHA' && <NavLink href="/cozinha" icon="🍳" label="Gestão Cozinha" />}
            {role === 'LOGISTICA' && <NavLink href="/logistica" icon="🚗" label="Gestão Logística" />}
            {role === 'FINANCEIRO' && <NavLink href="/financeiro" icon="💳" label="Financeiro" />}
          </nav>

          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/'; }}
            className="p-6 text-[10px] font-bold text-red-300 hover:text-red-500 uppercase text-center border-t border-stone-50"
          >
            Sair do Sistema
          </button>
        </aside>

        {/* MAIN: Sem margem no mobile, com margem no desktop */}
        <main className="flex-1 md:ml-64 p-4 pb-24 md:pb-4 print:ml-0 print:p-0">
          {children}
        </main>

        {/* MENU MOBILE (Tab Bar): Aparece apenas no mobile */}
        <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-white/90 backdrop-blur-md border border-stone-200 h-16 rounded-3xl flex items-center justify-around px-2 shadow-2xl z-50 print:hidden">
          <Link href="/meu-retiro" className="flex flex-col items-center gap-1">
            <span className="text-lg">🧘‍♂️</span>
            <span className="text-[8px] font-bold text-stone-400 uppercase">Início</span>
          </Link>
          
          {getNavLinks().map((link) => (
            <Link key={link.href} href={link.href} className="flex flex-col items-center gap-1">
              <span className="text-lg">{link.icon}</span>
              <span className={`text-[8px] font-bold uppercase ${pathname.startsWith(link.href) ? 'text-stone-900' : 'text-stone-400'}`}>
                {link.label}
              </span>
            </Link>
          ))}

          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="flex flex-col items-center gap-1">
            <span className="text-lg">🚪</span>
            <span className="text-[8px] font-bold text-red-300 uppercase">Sair</span>
          </button>
        </nav>

      </body>
    </html>
  )
}

function NavLink({ href, icon, label }: any) {
  const pathname = usePathname()
  const active = pathname === href
  return (
    <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900 text-sm'}`}>
      <span>{icon}</span><span className="font-medium">{label}</span>
    </Link>
  )
}