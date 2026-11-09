'use client'

import { useEffect, useState } from 'react'

interface ModeToggleProps {
  compact?: boolean
}

export default function ModeToggle({ compact = false }: ModeToggleProps) {
  const [mode, setMode] = useState<'claire' | 'dark'>('claire')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('mia-mode') as 'claire' | 'dark' | null
    setMode(saved ?? 'claire')
  }, [])

  const handleChange = (newMode: 'claire' | 'dark') => {
    setMode(newMode)
    localStorage.setItem('mia-mode', newMode)
    localStorage.setItem('mia_theme', newMode === 'dark' ? 'dark' : 'light')
    document.documentElement.classList.toggle('mode-dark', newMode === 'dark')
    document.documentElement.setAttribute('data-theme', newMode === 'dark' ? 'dark' : 'light')
  }

  if (!mounted) return null

  return (
    <div className="mode-toggle" role="group" aria-label="Alternar Tema Visual">
      <button
        type="button"
        id="opt-claire"
        className={`toggle-opt toggle-option${mode === 'claire' ? ' active' : ''}`}
        onClick={() => handleChange('claire')}
      >
        <span>{compact ? 'Claire' : 'Édition Claire'}</span>
      </button>
      <button
        type="button"
        id="opt-dark"
        className={`toggle-opt toggle-option${mode === 'dark' ? ' active' : ''}`}
        onClick={() => handleChange('dark')}
      >
        <span>{compact ? 'Dark' : 'Dark Edition'}</span>
      </button>
    </div>
  )
}
