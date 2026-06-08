'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
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

function formatPeriod(period: string): string {
  return period === 'noite' ? 'Noite' : 'Dia'
}

export default function OutfitDetailPage() {
  const router = useRouter()
  const params = useParams()
  const outfitId = params.id as string
  const supabase = createClient()

  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [outfitPieces, setOutfitPieces] = useState<Piece[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [activePieceIndex, setActivePieceIndex] = useState(0)

  useEffect(() => {
    async function loadOutfit() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: outfitData, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('id', outfitId)
        .eq('user_id', user.id)
        .single()

      if (error || !outfitData) {
        router.push('/lookbook')
        return
      }

      setOutfit(outfitData)
      setActivePieceIndex(0)

      if (outfitData.pieces.length > 0) {
        const { data: piecesData } = await supabase
          .from('pieces')
          .select('id, name, category, photo_url')
          .in('id', outfitData.pieces)
          .eq('user_id', user.id)

        if (piecesData) {
          const ordered = outfitData.pieces
            .map((id: string) => piecesData.find(p => p.id === id))
            .filter(Boolean) as Piece[]
          setOutfitPieces(ordered)
        }
      }

      setLoading(false)
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOutfit()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfitId])

  async function handleDelete() {
    if (!outfit || !window.confirm('Excluir este outfit do lookbook?')) return
    setDeleting(true)

    try {
      const { error } = await supabase
        .from('outfits')
        .delete()
        .eq('id', outfit.id)

      if (error) throw error
      router.push('/lookbook')
    } catch (err) {
      console.error('Erro ao deletar outfit:', err)
      alert('Erro ao excluir outfit. Tente novamente.')
      setDeleting(false)
    }
  }

  function handleThumbClick(index: number) {
    setActivePieceIndex(index)
  }

  function handleGenerateSimilar() {
    if (!outfit) return
    const occasionPart = outfit.occasion ? ` para ${outfit.occasion}` : ''
    const periodPart = outfit.period ? ` (${formatPeriod(outfit.period)})` : ''
    const msg = `Me gera outfits com vibe similar a "${outfit.name}"${occasionPart}${periodPart}`
    sessionStorage.setItem('mia_auto_message', msg)
    router.push('/mia')
  }

  if (loading) {
    return <div className="outfit-detail-loading">Carregando...</div>
  }

  if (!outfit) return null

  const mainPhotoUrl =
    outfitPieces[activePieceIndex]?.photo_url ?? outfitPieces[0]?.photo_url ?? null

  return (
    <div className="outfit-detail">
      <div className="outfit-detail-photo">
        <div className="outfit-detail-photo-main">
          {mainPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mainPhotoUrl} alt={outfit.name} />
          ) : null}
        </div>

        {outfitPieces.length > 0 && (
          <div className="outfit-detail-thumbs">
            {outfitPieces.map((piece, i) => (
              <div
                key={piece.id}
                className={`outfit-detail-thumb ${i === activePieceIndex ? 'active' : ''}`}
                onClick={() => handleThumbClick(i)}
              >
                {piece.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={piece.photo_url} alt={piece.name} />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="outfit-detail-info">
        <div className="outfit-detail-nav">
          <Link href="/lookbook" className="outfit-detail-back">
            ← Voltar
          </Link>
        </div>

        <p className="outfit-detail-meta">
          {outfit.occasion || 'Sem ocasião'} · {formatPeriod(outfit.period)}
        </p>
        <h1 className="outfit-detail-name">{outfit.name}</h1>

        {outfit.subtitle && (
          <p className="outfit-detail-why">{outfit.subtitle}</p>
        )}

        {outfit.why && (
          <>
            <hr className="outfit-detail-divider" />
            <span className="outfit-detail-why-label">Por que funciona</span>
            <p className="outfit-detail-why">{outfit.why}</p>
          </>
        )}

        {outfit.style_tags?.length > 0 && (
          <div className="outfit-detail-tags">
            {outfit.style_tags.map(tag => (
              <span key={tag} className="outfit-detail-tag">{tag}</span>
            ))}
          </div>
        )}

        {outfitPieces.length > 0 && (
          <>
            <span className="outfit-pieces-label">Peças do outfit</span>
            <div className="outfit-pieces-list">
              {outfitPieces.map(piece => (
                <Link
                  key={piece.id}
                  href={`/closet/${piece.id}`}
                  className="outfit-piece-item"
                >
                  <div className="outfit-piece-thumb">
                    {piece.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={piece.photo_url} alt={piece.name} />
                    ) : null}
                  </div>
                  <div>
                    <div className="outfit-piece-name">{piece.name}</div>
                    <div className="outfit-piece-category">{piece.category}</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="outfit-detail-actions">
          <button
            className="outfit-detail-delete"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </button>
          <button
            className="outfit-detail-similar"
            onClick={handleGenerateSimilar}
          >
            Gerar outfit similar
          </button>
        </div>
      </div>
    </div>
  )
}
