'use client'

import { useState } from 'react'
import { ADDON_PACKAGES } from '@/config/plan-limits'
import { PRECO_PRO } from '@/lib/pricing'
import './StudioCreditsModal.css'

interface StudioCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  isPro?: boolean
}

export default function StudioCreditsModal({
  isOpen,
  onClose,
  isPro = false,
}: StudioCreditsModalProps) {
  const [selectedId, setSelectedId] = useState<string>('addon_25')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const selectedPackage = ADDON_PACKAGES.find(p => p.id === selectedId) || ADDON_PACKAGES[0]

  async function handleBuyPackage() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: selectedPackage.id }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.assign(data.url)
        return
      }
      alert(data.error || 'Erro ao iniciar checkout do pacote.')
    } catch (err) {
      console.error('Erro no checkout de créditos:', err)
      alert('Erro ao conectar com o checkout. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubscribePro() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.url) {
        window.location.assign(data.url)
        return
      }
      window.location.assign('/perfil')
    } catch {
      window.location.assign('/perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="studio-credits-overlay" role="dialog" aria-modal="true">
      <div className="studio-credits-card">
        <div className="studio-credits-badge">
          ✦ Fotos de Estúdio (Manequim Fantasma)
        </div>

        <h2 className="studio-credits-title">Créditos de Estúdio Esgotados</h2>
        <p className="studio-credits-sub">
          {isPro
            ? 'Você utilizou as 20 fotos da sua cota mensal. Escolha um pacote de créditos avulsos para continuar gerando fotos de estúdio (eles nunca expiram):'
            : 'Seus créditos de teste do Manequim Fantasma acabaram. Escolha um pacote avulso ou assine o Pro para continuar:'}
        </p>

        {/* Grade com os 4 pacotes */}
        <div className="studio-packages-grid">
          {ADDON_PACKAGES.map((pkg) => {
            const isSelected = pkg.id === selectedId
            const isPopular = pkg.id === 'addon_25'
            const formattedPrice = pkg.price.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })

            return (
              <button
                key={pkg.id}
                type="button"
                className={`studio-pkg-item ${isSelected ? 'selected' : ''} ${isPopular ? 'popular' : ''}`}
                onClick={() => setSelectedId(pkg.id)}
              >
                {isPopular && <span className="studio-pkg-tag">Mais Escolhido</span>}
                <div className="studio-pkg-count">+{pkg.photos}</div>
                <div className="studio-pkg-label">fotos</div>
                <div className="studio-pkg-price">{formattedPrice}</div>
              </button>
            )
          })}
        </div>

        {/* CTA Principal de compra do pacote */}
        <button
          className="studio-credits-cta"
          onClick={handleBuyPackage}
          disabled={loading}
        >
          {loading
            ? 'Iniciando checkout...'
            : `Comprar +${selectedPackage.photos} fotos por R$ ${selectedPackage.price.toFixed(2).replace('.', ',')}`}
        </button>

        {/* Alternativa para quem não é Pro */}
        {!isPro && (
          <div className="studio-pro-alternative">
            <span className="studio-pro-text">Prefere assinar o Pro?</span>
            <button
              type="button"
              className="studio-pro-link"
              onClick={handleSubscribePro}
              disabled={loading}
            >
              Assinar Pro ({PRECO_PRO}/mês com 20 fotos/mês + closet ilimitado)
            </button>
          </div>
        )}

        <button className="studio-credits-close" onClick={onClose} disabled={loading}>
          Agora não
        </button>
      </div>
    </div>
  )
}
