'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import '../../auth.css'

export default function EsqueciSenhaPage() {
  const supabase = createClient()

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('mia_theme') as 'light' | 'dark') || 'light'
  })
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('mia_theme', newTheme)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) {
      setError('Erro ao enviar o e-mail. Verifique o endereço e tente novamente.')
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="auth-page" data-theme={theme}>

      {/* Fundo geométrico */}
      <div className="auth-bg">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-bg-orb auth-bg-orb-3" />
        <svg className="auth-bg-lines" viewBox="0 0 800 800">
          <defs>
            <linearGradient id="gold-grad-esqueci" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(180,140,60,0.3)" />
              <stop offset="100%" stopColor="rgba(180,140,60,0.05)" />
            </linearGradient>
          </defs>
          <line x1="0" y1="200" x2="800" y2="600" stroke="url(#gold-grad-esqueci)" strokeWidth="0.5" />
          <line x1="0" y1="400" x2="800" y2="800" stroke="url(#gold-grad-esqueci)" strokeWidth="0.5" />
          <line x1="200" y1="0" x2="600" y2="800" stroke="url(#gold-grad-esqueci)" strokeWidth="0.5" />
          <line x1="400" y1="0" x2="800" y2="400" stroke="url(#gold-grad-esqueci)" strokeWidth="0.5" />
          <circle cx="400" cy="400" r="200" fill="none" stroke="url(#gold-grad-esqueci)" strokeWidth="0.5" />
          <circle cx="400" cy="400" r="300" fill="none" stroke="url(#gold-grad-esqueci)" strokeWidth="0.3" />
          <circle cx="400" cy="400" r="380" fill="none" stroke="url(#gold-grad-esqueci)" strokeWidth="0.2" />
          <polygon points="400,100 700,400 400,700 100,400" fill="none" stroke="url(#gold-grad-esqueci)" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Card */}
      <div className="auth-card">

        <button className="auth-theme-toggle" onClick={toggleTheme} title="Alternar tema">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <div className="auth-logo">
          <div className="auth-logo-diamond">✦</div>
          <span className="auth-logo-text">Mia <span>Outfit AI</span></span>
        </div>

        {sent ? (
          <>
            <div className="auth-sent">
              <div className="auth-sent-icon">✉️</div>
              <div className="auth-sent-title">E-mail enviado!</div>
              <div className="auth-sent-text">
                Enviamos um link de redefinição para{' '}
                <span className="auth-sent-email">{email}</span>
                <br /><br />
                Verifique sua caixa de entrada e a pasta de spam.
              </div>
            </div>
            <a href="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Voltar para o login
            </a>
          </>
        ) : (
          <>
            <h1 className="auth-title">Recuperar senha</h1>
            <p className="auth-subtitle">Enviaremos um link para seu e-mail</p>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>

            <div className="footer-link" style={{ marginTop: '16px' }}>
              Lembrou a senha?{' '}
              <a href="/login">Entrar</a>
            </div>
          </>
        )}

        <div className="auth-links">
          <a href="/termos">Termos de Uso</a>
          <span className="auth-links-sep">·</span>
          <a href="/privacidade">Privacidade</a>
        </div>

      </div>
    </div>
  )
}
