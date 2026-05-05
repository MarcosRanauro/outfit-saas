'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

type NavItem = {
  href: string
  label: string
  icon: ((active: boolean) => React.ReactNode) | 'mia'
}

const navItems: NavItem[] = [
  {
    href: '/closet',
    label: 'Closet',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5"
          stroke={active ? 'rgba(180,140,60,0.9)' : 'rgba(255,255,255,0.25)'}
          strokeWidth="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"
          stroke={active ? 'rgba(180,140,60,0.9)' : 'rgba(255,255,255,0.25)'}
          strokeWidth="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"
          stroke={active ? 'rgba(180,140,60,0.9)' : 'rgba(255,255,255,0.25)'}
          strokeWidth="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"
          stroke={active ? 'rgba(180,140,60,0.9)' : 'rgba(255,255,255,0.25)'}
          strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: '/lookbook',
    label: 'Lookbook',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="5" rx="1.5"
          stroke={active ? 'rgba(180,140,60,0.9)' : 'rgba(255,255,255,0.25)'}
          strokeWidth="1.5"/>
        <rect x="3" y="11" width="11" height="5" rx="1.5"
          stroke={active ? 'rgba(180,140,60,0.9)' : 'rgba(255,255,255,0.25)'}
          strokeWidth="1.5"/>
        <rect x="3" y="19" width="7" height="2" rx="1"
          stroke={active ? 'rgba(180,140,60,0.9)' : 'rgba(255,255,255,0.25)'}
          strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: '/mia',
    label: 'Mia',
    icon: 'mia',
  },
  {
    href: '/perfil',
    label: 'Perfil',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4"
          stroke={active ? 'rgba(180,140,60,0.9)' : 'rgba(255,255,255,0.25)'}
          strokeWidth="1.5"/>
        <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"
          stroke={active ? 'rgba(180,140,60,0.9)' : 'rgba(255,255,255,0.25)'}
          strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href} className="nav-item">
            {item.icon === 'mia' ? (
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: active
                  ? 'linear-gradient(135deg, rgba(180,140,60,0.4), rgba(180,140,60,0.15))'
                  : 'linear-gradient(135deg, rgba(180,140,60,0.2), rgba(180,140,60,0.05))',
                border: `1.5px solid ${active ? 'rgba(180,140,60,0.7)' : 'rgba(180,140,60,0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
              }}>
                ✦
              </div>
            ) : (
              item.icon(active)
            )}
            <span className="nav-label" style={{
              color: active ? 'rgba(180,140,60,0.9)' : 'rgba(255,255,255,0.25)'
            }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}