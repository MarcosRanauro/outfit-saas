'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import '../../lookbook.css'

const DAY_OCCASIONS = ['Todos', 'Dia a Dia', 'Shopping', 'Amigos', 'Viagem', 'Faculdade', 'Trabalho', 'Academia', 'Café', 'Lazer', 'Praia']
const NIGHT_OCCASIONS = ['Todos', 'Aniversário', 'Balada', 'Jantar', 'Show', 'Festa', 'Cinema', 'Jogos', 'Bar', 'Encontro', 'Karaokê']

type Outfit = {
  id: string
  name: string
  subtitle: string | null
  style_tags: string[]
  period: string
  occasion: string | null
  why: string | null
  pieces: string[]
  created_at: string
}

type Piece = {
  id: string
  name: string
  category: string
  photo_url: string | null
}

export default function LookbookPage() {
  const supabase = createClient()

  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [pieces, setPieces] = useState<Record<string, Piece>>({})
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('dia')
  const [occasion, setOccasion] = useState('Todos')
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setOccasion('Todos')
  }, [period])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: outfitsData } = await supabase
      .from('outfits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: piecesData } = await supabase
      .from('pieces')
      .select('*')
      .eq('user_id', user.id)

    if (outfitsData) setOutfits(outfitsData)
    if (piecesData) {
      const map: Record<string, Piece> = {}
      piecesData.forEach(p => { map[p.id] = p })
      setPieces(map)
    }

    setLoading(false)
  }

  async function handleDelete() {
    if (!selectedOutfit) return
    setDeleting(true)

    await supabase
      .from('outfits')
      .delete()
      .eq('id', selectedOutfit.id)

    setOutfits(prev => prev.filter(o => o.id !== selectedOutfit.id))
    setDeleting(false)
    setModalOpen(false)
    setSelectedOutfit(null)
  }

  const tagClass = (tag: string) => {
    const map: Record<string, string> = {
      'Neutro': 'tag-neutro',
      'Statement': 'tag-statement',
      'Retrô': 'tag-retro',
      'Cor Forte': 'tag-cor',
      'Casual': 'tag-casual',
      'Conjunto': 'tag-conjunto',
    }
    return map[tag] || 'tag-neutro'
  }

  const filtered = outfits.filter(o => {
    const matchPeriod = o.period === period
    const matchOccasion = occasion === 'Todos' || o.occasion === occasion
    return matchPeriod && matchOccasion
  })

  const occasions = period === 'dia' ? DAY_OCCASIONS : NIGHT_OCCASIONS

  return (
    <>
      <div className="lookbook-header">
        <h1 className="lookbook-title">
          Look<span>book</span>
        </h1>
        <span className="lookbook-count">{outfits.length} outfits</span>
      </div>

      <div className="lookbook-period-row">
        <button
          className={`lookbook-period-btn ${period === 'dia' ? 'active' : ''}`}
          onClick={() => setPeriod('dia')}
        >
          ☀️ Dia
        </button>
        <button
          className={`lookbook-period-btn ${period === 'noite' ? 'active' : ''}`}
          onClick={() => setPeriod('noite')}
        >
          🌙 Noite
        </button>
      </div>

      <div className="lookbook-occ-row">
        {occasions.map(occ => (
          <button
            key={occ}
            className={`lookbook-occ-chip ${occasion === occ ? 'active' : ''}`}
            onClick={() => setOccasion(occ)}
          >
            {occ}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="lookbook-empty">
          <div className="lookbook-empty-text">Carregando...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="lookbook-empty">
          <div className="lookbook-empty-icon">✦</div>
          <div className="lookbook-empty-text">
            Nenhum outfit salvo aqui ainda.{'\n'}
            Gere outfits na aba IA e salve os que gostar.
          </div>
          <Link href="/outfit-ia" className="lookbook-empty-link">
            Ir para Outfit IA
          </Link>
        </div>
      ) : (
        <div className="lookbook-list">
          {filtered.map(outfit => {
            const outfitPieces = outfit.pieces
              .map(id => pieces[id])
              .filter(Boolean)

            return (
              <div
                key={outfit.id}
                className="lookbook-card"
                onClick={() => {
                  setSelectedOutfit(outfit)
                  setModalOpen(true)
                }}
              >
                <div className="lookbook-card-photos">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="lookbook-card-photo">
                      {outfitPieces[i]?.photo_url ? (
                        <img src={outfitPieces[i].photo_url!} alt={outfitPieces[i].name} />
                      ) : (
                        <div className="lookbook-photo-empty" />
                      )}
                      {i === 2 && outfitPieces.length > 3 && (
                        <span className="pieces-badge-more">+{outfitPieces.length - 3}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="lookbook-card-body">
                  <div className="lookbook-card-info">
                    <div className="lookbook-card-name">{outfit.name}</div>
                    <div className="lookbook-card-sub">{outfit.subtitle}</div>
                    <div className="lookbook-card-bottom">
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {outfit.style_tags?.slice(0, 2).map(tag => (
                          <span key={tag} className={`tag ${tagClass(tag)}`}>{tag}</span>
                        ))}
                      </div>
                      {outfit.occasion && (
                        <span className="lookbook-card-occ">{outfit.occasion}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal detalhe */}
      <div className={`lookbook-modal ${modalOpen ? 'open' : ''}`}>
        <button
          className="lookbook-modal-close"
          onClick={() => {
            setModalOpen(false)
            setSelectedOutfit(null)
          }}
        >
          ✕
        </button>

        <div className="lookbook-modal-inner">
          {selectedOutfit && (() => {
            const outfitPieces = selectedOutfit.pieces
              .map(id => pieces[id])
              .filter(Boolean)

            return (
              <>
                <div className="lookbook-detail-photos" style={{
                  gridTemplateColumns: outfitPieces.length === 4 ? '1fr 1fr' : '1fr 1fr 1fr'
                }}>
                  {outfitPieces.map((piece, i) => (
                    <div
                      key={i}
                      className="lookbook-detail-photo"
                      style={outfitPieces.length === 5 && i === 4 ? { gridColumnStart: '3' } : undefined}
                    >
                      {piece.photo_url ? (
                        <img src={piece.photo_url!} alt={piece.name} />
                      ) : (
                        <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(180,140,60,0.08)', border: '1px dashed rgba(180,140,60,0.2)' }} />
                      )}
                    </div>
                  ))}
                </div>

                <div className="lookbook-detail-title">{selectedOutfit.name}</div>
                <div className="lookbook-detail-sub">{selectedOutfit.subtitle}</div>

                <div className="lookbook-detail-tags">
                  {selectedOutfit.style_tags?.map(tag => (
                    <span key={tag} className={`tag ${tagClass(tag)}`}>{tag}</span>
                  ))}
                </div>

                <div className="lookbook-detail-section">Peças do Outfit</div>

                {outfitPieces.map((piece, i) => (
                  <div key={i} className="lookbook-detail-piece">
                    <div className="lookbook-detail-piece-photo">
                      {piece.photo_url ? (
                        <img src={piece.photo_url} alt={piece.name} />
                      ) : (
                        <div style={{ width: '16px', height: '16px', borderRadius: '3px', background: 'rgba(180,140,60,0.08)', border: '1px dashed rgba(180,140,60,0.2)' }} />
                      )}
                    </div>
                    <div>
                      <div className="lookbook-detail-piece-name">{piece.name}</div>
                      <div className="lookbook-detail-piece-cat">{piece.category}</div>
                    </div>
                  </div>
                ))}

                {selectedOutfit.why && (
                  <div className="lookbook-why">
                    <div className="lookbook-why-label">Por que funciona</div>
                    <div className="lookbook-why-text">{selectedOutfit.why}</div>
                  </div>
                )}

                <button
                  className="delete-outfit-btn"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Removendo...' : 'Remover do Lookbook'}
                </button>
              </>
            )
          })()}
        </div>
      </div>
    </>
  )
}