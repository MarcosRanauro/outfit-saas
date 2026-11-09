'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Archive, Sparkles, Plus } from 'lucide-react'
import ModeToggle from '@/components/ui/ModeToggle'
import './app-navbar.css'

export default function AppNavbar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isCloset = !mounted || pathname.startsWith('/closet')
  const isLookbook = mounted && pathname.startsWith('/lookbook')

  return (
    <header className="app-navbar">
      <Link href="/closet" className="brand-logo" aria-label="Ir para o Closet">
        <div className="brand-title">
          Mia<span>Outfit AI</span>
        </div>
      </Link>

      {/* Center Desktop Tabs */}
      <nav className="navbar-tabs" aria-label="Navegação Principal">
        <Link
          href="/closet"
          className={`nav-tab-btn ${isCloset ? 'active' : ''}`}
          id="tab-btn-closet"
        >
          <Archive size={14} />
          <span>Meu Closet</span>
        </Link>
        <Link
          href="/lookbook"
          className={`nav-tab-btn ${isLookbook ? 'active' : ''}`}
          id="tab-btn-lookbook"
        >
          <Sparkles size={14} />
          <span>Lookbook Arara</span>
        </Link>
      </nav>

      {/* Right Actions: Theme Toggle & + Nova Peça */}
      <div className="navbar-actions">
        <ModeToggle />

        <Link
          href="/closet/nova-peca"
          className="btn-new-piece"
          aria-label="Cadastrar Nova Peça"
        >
          <Plus size={16} />
          <span>Nova Peça</span>
        </Link>
      </div>
    </header>
  )
}
