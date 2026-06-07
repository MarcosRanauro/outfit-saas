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

  const [mode, setMode] = useState<'claire' | 'dark'>('claire')
  const [mounted, setMounted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmEmail, setShowConfirmEmail] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('mia-mode') as 'claire' | 'dark' | null
    const initialMode = saved ?? 'claire'
    setMode(initialMode)
    document.documentElement.classList.toggle('mode-dark', initialMode === 'dark')
  }, [])

  const handleModeChange = (newMode: 'claire' | 'dark') => {
    setMode(newMode)
    localStorage.setItem('mia-mode', newMode)
    document.documentElement.classList.toggle('mode-dark', newMode === 'dark')
  }

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
    <div className="auth-page">
      {/* Lado esquerdo — imagem */}
      <div className="auth-img-side">
        <img src="/illustrations/Hero-principal.png" alt="" aria-hidden="true" />
        <div className="overlay" />
        <span className="auth-img-tag">· Comece grátis hoje</span>
      </div>

      {/* Lado direito — formulário */}
      <div className="auth-form-side">
        {mounted && (
          <div className="auth-toggle">
            <div className="mode-toggle">
              <button
                className={`toggle-option${mode === 'claire' ? ' active' : ''}`}
                onClick={() => handleModeChange('claire')}
              >
                Édition Claire
              </button>
              <button
                className={`toggle-option${mode === 'dark' ? ' active' : ''}`}
                onClick={() => handleModeChange('dark')}
              >
                Dark Edition
              </button>
            </div>
          </div>
        )}

        <div className="auth-logo">
          {mode === 'dark'
            ? <><span style={{ color: 'inherit' }}>MIA </span><span>·</span><span style={{ color: 'inherit' }}> OUTFIT AI</span></>
            : <>Mia <span>Outfit AI</span></>
          }
        </div>

        <h1 className="auth-title">Crie sua conta.</h1>
        <p className="auth-subtitle">Comece grátis — sem cartão de crédito</p>

        {showConfirmEmail && (
          <div className="auth-confirm-email">
            ✓ Conta criada! Verifique seu e-mail para confirmar o cadastro.
          </div>
        )}

        <button className="google-btn" onClick={handleGoogle} disabled={loadingGoogle}>
          <GoogleIcon />
          {loadingGoogle ? 'Conectando...' : 'Continuar com Google'}
        </button>

        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">ou</span>
          <div className="auth-divider-line" />
        </div>

        <form onSubmit={handleCadastro}>
          <div className="auth-field">
            <label className="auth-label">Nome</label>
            <input
              className="auth-input"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">E-mail</label>
            <input
              className="auth-input"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Senha</label>
            <input
              className="auth-input"
              type="password"
              placeholder="mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="auth-cta" disabled={loading || showConfirmEmail}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className="auth-links">
          <p>Já tem conta? <a href="/login">Entrar</a></p>
        </div>

        <div className="auth-footer">
          <a href="/termos">Termos de Uso</a>
          <a href="/privacidade">Privacidade</a>
          <a href="/sobre">Sobre</a>
        </div>
      </div>
    </div>
  )
}
