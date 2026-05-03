'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import '../../auth.css'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Erro ao redefinir a senha. O link pode ter expirado.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    setTimeout(() => {
      router.push('/closet')
    }, 2000)
  }

  return (
    <main className="login-wrap">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <div className="card">
        <div className="card-top-line" />

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: '18px',
              color: '#f0f0f0',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>
              Senha redefinida!
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.35)',
              lineHeight: '1.7'
            }}>
              Redirecionando para o closet...
            </div>
          </div>
        ) : (
          <>
            <div className="logo">
              <div className="logo-mark">
                <div className="logo-diamond" />
              </div>
              <span className="logo-title">Outfit</span>
              <span className="logo-sub" style={{ marginTop: '8px', display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.3)', lineHeight: '1.6' }}>
                Digite sua nova senha abaixo.
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Nova senha</label>
                <input
                  type="password"
                  placeholder="mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <div className="field">
                <label>Confirmar senha</label>
                <input
                  type="password"
                  placeholder="repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              {error && <p className="error-msg">{error}</p>}

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Redefinindo...' : 'Redefinir senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
