'use client'

import { useState } from 'react'
import { PRECO_PRO } from '@/lib/pricing'
import './PieceLimitModal.css'

interface PieceLimitModalProps {
  isOpen: boolean
  onClose: () => void
  currentCount?: number
}

export default function PieceLimitModal({
  isOpen,
  onClose,
  currentCount = 20,
}: PieceLimitModalProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  async function handleUpgrade() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
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
    <div className="limit-modal-overlay" role="dialog" aria-modal="true">
      <div className="limit-modal-card">
        <div className="limit-modal-badge">Limite do Trial • 20/20 Peças</div>

        <h2 className="limit-modal-title">Seu closet está cheio.</h2>
        <p className="limit-modal-sub">
          No período de teste gratuito, você pode cadastrar até 20 peças. Para adicionar a 21ª peça e ter espaço infinito no seu closet, faça upgrade para o plano Pro.
        </p>

        <div className="limit-modal-price">
          <span className="limit-price-value">{PRECO_PRO}</span>
          <span className="limit-price-period">/mês</span>
        </div>

        <ul className="limit-modal-features">
          <li>Peças ilimitadas no seu closet</li>
          <li>20 fotos de estúdio (Manequim Fantasma) por mês</li>
          <li>Chat ilimitado com a Mia AI</li>
          <li>Sugestões de outfits completas sem limite</li>
          <li>Cancele quando quiser</li>
        </ul>

        <button
          className="limit-modal-cta"
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading ? 'Abrindo checkout...' : 'Liberar Closet Ilimitado'}
        </button>

        <button className="limit-modal-close" onClick={onClose} disabled={loading}>
          Agora não
        </button>
      </div>
    </div>
  )
}
