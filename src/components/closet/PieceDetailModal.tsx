'use client'

import Image from 'next/image'
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
      <div className="piece-detail-sheet">
        <div className="modal-handle" />
        {piece && (
          <div className="piece-detail-split">

            {/* Lado esquerdo/topo — foto */}
            <div className="piece-detail-img-side">
              {piece.photo_url ? (
                <Image src={piece.photo_url} alt={piece.name} fill sizes="(max-width: 640px) 100vw, 400px" />
              ) : (
                <label className="piece-detail-no-photo">
                  <div className="piece-detail-upload-area">
                    {uploadingPhoto ? 'Enviando...' : '+ Adicionar foto'}
                  </div>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onAddPhoto} />
                </label>
              )}
              <div className="piece-detail-name-overlay">{piece.name}</div>
            </div>

            {/* Lado direito/baixo — info + ações */}
            <div className="piece-detail-content">
              <h1 className="piece-detail-name">{piece.name}</h1>
              <p className="piece-detail-category">{piece.category}</p>

              <div className="piece-detail-divider" />

              {piece.color && (
                <div className="piece-detail-field">
                  <span className="piece-detail-field-label">Cor</span>
                  <span className="piece-detail-field-value">{piece.color}</span>
                </div>
              )}
              {piece.brand && (
                <div className="piece-detail-field">
                  <span className="piece-detail-field-label">Marca</span>
                  <span className="piece-detail-field-value">{piece.brand}</span>
                </div>
              )}
              {piece.fit && (
                <div className="piece-detail-field">
                  <span className="piece-detail-field-label">Fit</span>
                  <span className="piece-detail-field-value">{piece.fit}</span>
                </div>
              )}
              {piece.style_type && (
                <div className="piece-detail-field">
                  <span className="piece-detail-field-label">Estilo</span>
                  <span className="piece-detail-field-value">{piece.style_type}</span>
                </div>
              )}
              {piece.season && (
                <div className="piece-detail-field">
                  <span className="piece-detail-field-label">Estação</span>
                  <span className="piece-detail-field-value">{piece.season}</span>
                </div>
              )}
              {piece.description && (
                <div className="piece-detail-field">
                  <span className="piece-detail-field-label">Descrição</span>
                  <span className="piece-detail-field-value">{piece.description}</span>
                </div>
              )}
              {piece.notes && (
                <div className="piece-detail-field">
                  <span className="piece-detail-field-label">Notas</span>
                  <span className="piece-detail-field-value">{piece.notes}</span>
                </div>
              )}

              <div className="piece-detail-cta-group">
                <button
                  className="piece-detail-cta piece-detail-cta-primary"
                  onClick={() => onSetAnchor(piece)}
                >
                  📌 {anchorPieceId === piece.id ? 'Âncora ativa' : 'Usar como âncora'}
                </button>
                {piece.photo_url && (
                  <label className="piece-detail-cta piece-detail-cta-secondary" style={{ cursor: 'pointer' }}>
                    {uploadingPhoto ? 'Enviando...' : 'Trocar foto'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onAddPhoto} />
                  </label>
                )}
                <button className="piece-detail-cta piece-detail-cta-delete" onClick={onDelete}>
                  Excluir peça
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
