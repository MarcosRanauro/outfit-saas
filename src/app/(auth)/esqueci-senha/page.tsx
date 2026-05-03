'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import '../../auth.css'

export default function EsqueciSenhaPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

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
    <main className="login-wrap">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <div className="card">
        <div className="card-top-line" />

        {sent ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>✉️</div>
              <div style={{
                fontFamily: 'Georgia, serif',
                fontSize: '18px',
                color: '#f0f0f0',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}>
                E-mail enviado!
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.35)',
                lineHeight: '1.7'
              }}>
                Enviamos um link de redefinição para{' '}
                <span style={{ color: 'rgba(180,140,60,0.7)' }}>{email}</span>
                <br /><br />
                Verifique sua caixa de entrada e a pasta de spam.
              </div>
            </div>
            <a href="/login" className="btn-primary" style={{
              display: 'block',
              textAlign: 'center',
              textDecoration: 'none'
            }}>
              Voltar para o login
            </a>
          </>
        ) : (
          <>
            <div className="logo">
              <div className="logo-mark">
                <div className="logo-diamond" />
              </div>
              <span className="logo-title">Outfit</span>
              <span className="logo-sub" style={{ marginTop: '8px', display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.3)', lineHeight: '1.6' }}>
                Digite seu e-mail e enviaremos um link para redefinir sua senha.
              </span>
            </div>

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

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>

            <div className="footer-link" style={{ marginTop: '16px' }}>
              Lembrou a senha?{' '}
              <a href="/login">Entrar</a>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
