'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function BottomNav() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (path: string) => {
    if (!mounted) return false
    return pathname === path || pathname.startsWith(path)
  }

  return (
    <nav className="bottom-nav">

      {/* Closet */}
      <Link href="/closet" className={`nav-item${isActive('/closet') ? ' active' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        <span className="nav-label">Closet</span>
      </Link>

      {/* Lookbook */}
      <Link href="/lookbook" className={`nav-item${isActive('/lookbook') ? ' active' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="11" width="11" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="19" width="7" height="2" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        <span className="nav-label">Lookbook</span>
      </Link>

      {/* Mia */}
      <Link href="/mia" className={`nav-item${isActive('/mia') ? ' active' : ''}`}>
        <div className="nav-mia-icon">✦</div>
        <span className="nav-label">Mia</span>
      </Link>

      {/* Perfil */}
      <Link href="/perfil" className={`nav-item${isActive('/perfil') ? ' active' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="nav-label">Perfil</span>
      </Link>

    </nav>
  )
}
