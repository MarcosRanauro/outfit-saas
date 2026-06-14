'use client'

import { useState } from 'react'
import './TrialExpiredModal.css'

interface TrialExpiredModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TrialExpiredModal({ isOpen, onClose }: TrialExpiredModalProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  async function handleSubscribe() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      window.location.href = '/perfil'
    } catch {
      window.location.href = '/perfil'
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="trial-expired-overlay" role="dialog" aria-modal="true">
      <div className="trial-expired-card">
        <h2 className="trial-expired-title">Seu trial encerrou.</h2>
        <p className="trial-expired-sub">
          Assine o plano Pro para continuar usando a Mia sem limites.
        </p>

        <div className="trial-expired-price">
          <span className="price-value">R$ 19,00</span>
          <span className="price-period">/mês</span>
        </div>

        <ul className="trial-expired-features">
          <li>Outfits ilimitados</li>
          <li>Chat ilimitado com a Mia</li>
          <li>Foto de estúdio</li>
          <li>Virtual Try-On</li>
          <li>Cancele quando quiser</li>
        </ul>

        <button
          className="trial-expired-cta"
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? 'Abrindo...' : 'Assinar agora'}
        </button>

        <button className="trial-expired-close" onClick={onClose}>
          Agora não
        </button>
      </div>
    </div>
  )
}
