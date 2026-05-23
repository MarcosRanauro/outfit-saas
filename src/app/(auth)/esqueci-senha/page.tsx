'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import '../../auth.css'

export default function EsqueciSenhaPage() {
  const supabase = createClient()

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('mia_theme') as 'light' | 'dark') ?? 'light'
  })
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('mia_theme', newTheme)
    document.documentElement.setAttribute('data-auth-theme', newTheme)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

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
    <div className="auth-page" data-theme={mounted ? theme : 'light'}>

      <div className="auth-bg" />

      {/* Card */}
      <div className="auth-card">

        {mounted && (
          <button className="auth-theme-toggle" onClick={toggleTheme} title="Alternar tema">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        )}

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
