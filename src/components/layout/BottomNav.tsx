'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function BottomNav() {
  const pathname = usePathname()
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const saved = localStorage.getItem('mia_theme') || 'light'
    setTheme(saved)

    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-theme') || 'light'
      setTheme(current)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  const iconColor = theme === 'light' ? 'rgba(26,26,46,0.45)' : 'rgba(255,255,255,0.25)'
  const iconColorActive = theme === 'light' ? '#B48C3C' : 'rgba(180,140,60,0.9)'
  const labelColor = theme === 'light' ? 'rgba(26,26,46,0.45)' : 'rgba(255,255,255,0.25)'
  const labelColorActive = theme === 'light' ? '#B48C3C' : 'rgba(180,140,60,0.9)'

  const isActive = (path: string) => pathname === path || pathname.startsWith(path)

  return (
    <nav className="bottom-nav">

      {/* Closet */}
      <Link href="/closet" className="nav-item">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1.5"
            stroke={isActive('/closet') ? iconColorActive : iconColor} strokeWidth="1.5"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5"
            stroke={isActive('/closet') ? iconColorActive : iconColor} strokeWidth="1.5"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5"
            stroke={isActive('/closet') ? iconColorActive : iconColor} strokeWidth="1.5"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5"
            stroke={isActive('/closet') ? iconColorActive : iconColor} strokeWidth="1.5"/>
        </svg>
        <span className="nav-label" style={{ color: isActive('/closet') ? labelColorActive : labelColor }}>
          Closet
        </span>
      </Link>

      {/* Lookbook */}
      <Link href="/lookbook" className="nav-item">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="5" rx="1.5"
            stroke={isActive('/lookbook') ? iconColorActive : iconColor} strokeWidth="1.5"/>
          <rect x="3" y="11" width="11" height="5" rx="1.5"
            stroke={isActive('/lookbook') ? iconColorActive : iconColor} strokeWidth="1.5"/>
          <rect x="3" y="19" width="7" height="2" rx="1"
            stroke={isActive('/lookbook') ? iconColorActive : iconColor} strokeWidth="1.5"/>
        </svg>
        <span className="nav-label" style={{ color: isActive('/lookbook') ? labelColorActive : labelColor }}>
          Lookbook
        </span>
      </Link>

      {/* Mia */}
      <Link href="/mia" className="nav-item">
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: isActive('/mia')
            ? 'linear-gradient(135deg, rgba(180,140,60,0.4), rgba(180,140,60,0.15))'
            : 'linear-gradient(135deg, rgba(180,140,60,0.2), rgba(180,140,60,0.05))',
          border: `1.5px solid ${isActive('/mia') ? 'rgba(180,140,60,0.7)' : 'rgba(180,140,60,0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          color: isActive('/mia') ? iconColorActive : iconColor,
        }}>
          ✦
        </div>
        <span className="nav-label" style={{ color: isActive('/mia') ? labelColorActive : labelColor }}>
          Mia
        </span>
      </Link>

      {/* Perfil */}
      <Link href="/perfil" className="nav-item">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4"
            stroke={isActive('/perfil') ? iconColorActive : iconColor} strokeWidth="1.5"/>
          <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"
            stroke={isActive('/perfil') ? iconColorActive : iconColor} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="nav-label" style={{ color: isActive('/perfil') ? labelColorActive : labelColor }}>
          Perfil
        </span>
      </Link>

    </nav>
  )
}
