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

  return (
    <html lang="pt-br">
      <body className="bg-[#FDFCF8] flex min-h-screen">
        {/* ADICIONADO: print:hidden para o menu sumir no papel */}
        <aside className="w-64 bg-white border-r border-stone-100 flex flex-col fixed h-full shadow-sm print:hidden">
          <div className="p-8 border-b border-stone-50 text-center">
            <h2 className="font-serif italic text-xl">Sangha</h2>
            <span className="text-[8px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase font-bold">{role}</span>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <p className="text-[9px] uppercase font-bold text-stone-300 ml-3 mt-4 mb-2">Pessoal</p>
            <NavLink href="/meu-retiro" icon="🧘‍♂️" label="Minha Jornada" />
            
            <p className="text-[9px] uppercase font-bold text-stone-300 ml-3 mt-6 mb-2">Trabalho</p>
            
            {/* LOGICA DE ACESSO */}
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

        {/* ALTERADO: print:ml-0 para o conteúdo ocupar a tela toda na impressão */}
        <main className="flex-1 ml-64 p-4 print:ml-0 print:p-0">{children}</main>
      </body>
    </html>
  )
}

function NavLink({ href, icon, label }: any) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-500 hover:bg-stone-50 hover:text-stone-900 text-sm transition-all">
      <span>{icon}</span><span className="font-medium">{label}</span>
    </Link>
  )
}