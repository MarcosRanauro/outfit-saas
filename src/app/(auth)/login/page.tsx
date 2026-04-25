'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import '../../auth.css'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/closet')
  }

  return (
    <main className="login-wrap">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <div className="card">
        <div className="card-top-line" />

        <div className="logo">
          <div className="logo-mark">
            <div className="logo-diamond" />
          </div>
          <span className="logo-title">Outfit</span>
          <span className="logo-sub">Style Intelligence</span>
        </div>

        <form onSubmit={handleLogin}>
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="error-msg">{error}</p>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="divider">
          <div className="divider-line" />
          <span>ou</span>
          <div className="divider-line" />
        </div>

        <div className="footer-link">
          Não tem conta?{' '}
          <a href="/cadastro">Criar conta</a>
        </div>
        <div className="footer-link" style={{ marginTop: '8px' }}>
          <a href="/esqueci-senha">Esqueci minha senha</a>
        </div>
      </div>
    </main>
  )
}