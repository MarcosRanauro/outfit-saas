'use client'

import { WishlistItem } from '@/types/database'

interface WishlistSavedModalProps {
  open: boolean
  items: WishlistItem[]
  loading: boolean
  onClose: () => void
  onPurchased: (item: WishlistItem) => void
  onRemove: (id: string) => void
}

export default function WishlistSavedModal({
  open, items, loading, onClose, onPurchased, onRemove,
}: WishlistSavedModalProps) {
  return (
    <div
      className={`wishlist-modal-overlay ${open ? 'open' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="wishlist-modal-sheet">
        <div className="wishlist-modal-handle" />
        <div className="wishlist-modal-header">
          <span className="wishlist-modal-title">Minha Wishlist</span>
          <button className="wishlist-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="wishlist-modal-scroll">
          {loading ? (
            <div className="wishlist-empty">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="wishlist-empty">
              <div className="wishlist-empty-icon">♡</div>
              Sua wishlist está vazia.{'\n'}Use o botão ✦ para gerar sugestões.
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="wishlist-item">
                <div className="wishlist-item-top">
                  <div className="wishlist-item-name">{item.name}</div>
                  <span className={`wishlist-badge wishlist-badge-${item.priority}`}>
                    {item.priority === 'high' ? 'Essencial' : item.priority === 'medium' ? 'Recomendado' : 'Opcional'}
                  </span>
                </div>
                <div className="wishlist-item-meta">{item.category}{item.color ? ` · ${item.color}` : ''}</div>
                {item.reason && <div className="wishlist-item-reason">{item.reason}</div>}
                <div className="wishlist-item-actions">
                  <button className="wishlist-action-buy" onClick={() => onPurchased(item)}>Já comprei</button>
                  <button className="wishlist-action-remove" onClick={() => onRemove(item.id)}>Remover</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
