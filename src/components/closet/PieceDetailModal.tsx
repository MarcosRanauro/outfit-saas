'use client'

import { Piece } from '@/types/database'

interface PieceDetailModalProps {
  open: boolean
  piece: Piece | null
  uploadingPhoto: boolean
  anchorPieceId: string | null
  onClose: () => void
  onDelete: () => void
  onAddPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSetAnchor: (piece: Piece) => void
}

export default function PieceDetailModal({
  open, piece, uploadingPhoto, anchorPieceId,
  onClose, onDelete, onAddPhoto, onSetAnchor,
}: PieceDetailModalProps) {
  return (
    <div
      className={`modal-overlay ${open ? 'open' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-sheet">
        <div className="modal-handle" />
        {piece && (
          <>
            <div className="modal-title">{piece.name}</div>
            <div className="piece-detail-photo">
              {piece.photo_url ? (
                <img src={piece.photo_url} alt={piece.name} />
              ) : (
                <label className="upload-label">
                  <div className="upload-area upload-area--small">
                    {uploadingPhoto ? 'Enviando...' : '+ Adicionar foto'}
                  </div>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onAddPhoto} />
                </label>
              )}
            </div>
            <div className="piece-detail-info">
              <div className="piece-detail-row">
                <span className="piece-detail-label">Categoria</span>
                <span className="piece-detail-value">{piece.category}</span>
              </div>
              {piece.color && (
                <div className="piece-detail-row">
                  <span className="piece-detail-label">Cor</span>
                  <span className="piece-detail-value">{piece.color}</span>
                </div>
              )}
              {piece.brand && (
                <div className="piece-detail-row">
                  <span className="piece-detail-label">Marca</span>
                  <span className="piece-detail-value">{piece.brand}</span>
                </div>
              )}
            </div>
            {piece.photo_url && (
              <label className="modal-swap-photo">
                <div className="modal-btn">
                  {uploadingPhoto ? 'Enviando...' : 'Trocar foto'}
                </div>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onAddPhoto} />
              </label>
            )}
            <button
              className="anchor-piece-btn"
              onClick={() => onSetAnchor(piece)}
            >
              <span>📌</span>
              {anchorPieceId === piece.id ? 'Peça âncora ativa' : 'Usar como peça âncora'}
            </button>
            <button className="modal-btn modal-btn--danger" onClick={onDelete}>
              Excluir Peça
            </button>
          </>
        )}
      </div>
    </div>
  )
}
