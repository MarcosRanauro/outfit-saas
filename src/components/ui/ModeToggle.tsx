'use client'

import { useEffect, useState } from 'react'

export default function ModeToggle() {
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
    <div className="mode-toggle">
      <button
        className={`toggle-option${mode === 'claire' ? ' active' : ''}`}
        onClick={() => handleChange('claire')}
      >
        Édition Claire
      </button>
      <button
        className={`toggle-option${mode === 'dark' ? ' active' : ''}`}
        onClick={() => handleChange('dark')}
      >
        Dark Edition
      </button>
    </div>
  )
}
