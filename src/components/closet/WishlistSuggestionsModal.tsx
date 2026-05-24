'use client'

export type WishlistSuggestion = {
  category: string
  name: string
  color: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

interface WishlistSuggestionsModalProps {
  open: boolean
  suggestions: WishlistSuggestion[]
  savedIds: number[]
  onSave: (suggestion: WishlistSuggestion, index: number) => void
  onClose: () => void
}

export default function WishlistSuggestionsModal({
  open, suggestions, savedIds, onSave, onClose,
}: WishlistSuggestionsModalProps) {
  return (
    <div
      className={`wishlist-modal-overlay ${open ? 'open' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="wishlist-modal-sheet">
        <div className="wishlist-modal-handle" />
        <div className="wishlist-modal-header">
          <span className="wishlist-modal-title">Sugestões para o Closet</span>
          <button className="wishlist-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="wishlist-modal-scroll">
          {suggestions.map((s, index) => (
            <div key={index} className="wishlist-card">
              <div className="wishlist-card-top">
                <div className="wishlist-card-name">{s.name}</div>
                <span className={`wishlist-badge wishlist-badge-${s.priority}`}>
                  {s.priority === 'high' ? 'Essencial' : s.priority === 'medium' ? 'Recomendado' : 'Opcional'}
                </span>
              </div>
              <div className="wishlist-card-meta">{s.category}{s.color ? ` · ${s.color}` : ''}</div>
              <div className="wishlist-card-reason">{s.reason}</div>
              <button
                className={`wishlist-save-btn ${savedIds.includes(index) ? 'saved' : ''}`}
                disabled={savedIds.includes(index)}
                onClick={() => onSave(s, index)}
              >
                {savedIds.includes(index) ? '✓ Salvo' : 'Salvar na Wishlist'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
