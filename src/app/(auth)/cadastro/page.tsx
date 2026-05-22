'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import '../../auth.css'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function CadastroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmEmail, setShowConfirmEmail] = useState(false)

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('mia_theme', newTheme)
    document.documentElement.setAttribute('data-auth-theme', newTheme)
  }

  useEffect(() => {
    const saved = localStorage.getItem('mia_theme') as 'light' | 'dark' | null
    if (saved) setTheme(saved)
    setMounted(true)
  }, [])

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) {
      setError('Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }
    if (!data.session) {
      setLoading(false)
      setShowConfirmEmail(true)
      return
    }
    router.push('/closet')
  }

  async function handleGoogle() {
    setLoadingGoogle(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError('Erro ao conectar com Google.')
      setLoadingGoogle(false)
    }
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

        <h1 className="auth-title">Criar sua conta</h1>
        <p className="auth-subtitle">Comece seu teste gratuito de 15 dias</p>

        {showConfirmEmail && (
          <div className="auth-confirm-email">
            ✓ Conta criada! Verifique seu e-mail para confirmar o cadastro.
          </div>
        )}

        <button className="btn-google" onClick={handleGoogle} disabled={loadingGoogle}>
          <GoogleIcon />
          {loadingGoogle ? 'Conectando...' : 'Continuar com Google'}
        </button>

        <div className="divider">
          <div className="divider-line" />
          <span>ou</span>
          <div className="divider-line" />
        </div>

        <form onSubmit={handleCadastro}>
          <div className="field">
            <label>Nome</label>
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
          <div className="field">
            <label>Senha</label>
            <input
              type="password"
              placeholder="mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading || showConfirmEmail}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className="footer-link auth-footer-link--top">
          Já tem conta?{' '}
          <a href="/login">Entrar</a>
        </div>

        <div className="auth-links">
          <a href="/termos">Termos de Uso</a>
          <span className="auth-links-sep">·</span>
          <a href="/privacidade">Privacidade</a>
        </div>

      </div>
    </div>
  )
}
