'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import LookbookFiltersDrawer, { LookbookFilters } from '@/components/lookbook/LookbookFiltersDrawer'

const QUICK_OCCASION_CHIPS = [
  'Dia a Dia', 'Shopping', 'Amigos', 'Viagem', 'Faculdade', 'Trabalho', 'Reunião',
  'Academia', 'Café', 'Praia', 'Lazer', 'Ensaio', 'Evento Cultural', 'Ao Ar Livre',
]

const EMPTY_FILTERS: LookbookFilters = {
  periodo: [],
  ocasiao: [],
  estilo: [],
  estacao: [],
}

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
  season: string | null
  photo_url: string | null
}

function formatPeriod(period: string): string {
  return period === 'noite' ? 'Noite' : 'Dia'
}

interface OutfitCardProps {
  outfit: Outfit
  outfitPieces: Piece[]
  activePiece: number
  onActivePieceChange: (index: number) => void
  onDelete: (id: string) => void
  onNavigate: (id: string) => void
}

function OutfitCard({
  outfit,
  outfitPieces,
  activePiece,
  onActivePieceChange,
  onDelete,
  onNavigate,
}: OutfitCardProps) {
  const mainPhotoUrl = outfitPieces[activePiece]?.photo_url ?? outfitPieces[0]?.photo_url ?? null
  const description = outfit.subtitle || outfit.why || ''

  return (
    <div className="outfit-card" onClick={() => onNavigate(outfit.id)}>
      <div className="outfit-card-body">
        <div className="outfit-card-photo">
          {mainPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mainPhotoUrl} alt={outfit.name} />
          ) : (
            <div style={{ width: '100%', height: '100%' }} />
          )}
        </div>

        <div className="outfit-card-info">
          <span className="outfit-occasion">
            {outfit.occasion || 'Sem ocasião'} · {formatPeriod(outfit.period)}
          </span>
          <h3 className="outfit-name">{outfit.name}</h3>
          {description && <p className="outfit-desc">{description}</p>}
          {outfit.style_tags?.length > 0 && (
            <div className="outfit-tags">
              {outfit.style_tags.map(tag => (
                <span key={tag} className="outfit-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="outfit-card-footer">
        <div className="outfit-thumbs">
          {outfitPieces.map((piece, i) => (
            <div
              key={piece.id}
              className={`outfit-thumb ${i === activePiece ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onActivePieceChange(i)
              }}
            >
              {piece.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={piece.photo_url} alt={piece.name} />
              ) : null}
            </div>
          ))}
        </div>
        <button
          className="outfit-delete"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(outfit.id)
          }}
        >
          Excluir
        </button>
      </div>
    </div>
  )
}

export default function LookbookPage() {
  const router = useRouter()
  const supabase = createClient()

  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [pieces, setPieces] = useState<Record<string, Piece>>({})
  const [loading, setLoading] = useState(true)
  const [activePieces, setActivePieces] = useState<Record<string, number>>({})

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<LookbookFilters>(EMPTY_FILTERS)
  const [activeChips, setActiveChips] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)

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
      .select('id, name, category, season, photo_url')
      .eq('user_id', user.id)

    if (outfitsData) setOutfits(outfitsData)
    if (piecesData) {
      const map: Record<string, Piece> = {}
      piecesData.forEach(p => { map[p.id] = p })
      setPieces(map)
    }

    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function confirmDelete(outfitId: string) {
    if (!window.confirm('Excluir este outfit do lookbook?')) return

    try {
      const { error } = await supabase
        .from('outfits')
        .delete()
        .eq('id', outfitId)

      if (error) throw error
      setOutfits(prev => prev.filter(o => o.id !== outfitId))
    } catch (err) {
      console.error('Erro ao deletar outfit:', err)
      alert('Erro ao excluir outfit. Tente novamente.')
    }
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS)
    setActiveChips([])
  }

  function toggleChip(occ: string) {
    setActiveChips(prev =>
      prev.includes(occ) ? prev.filter(x => x !== occ) : [...prev, occ]
    )
  }

  const activeFilterCount =
    filters.periodo.length +
    filters.ocasiao.length +
    filters.estilo.length +
    filters.estacao.length

  const hasActiveFilters = activeFilterCount > 0 || activeChips.length > 0

  const filtered = outfits.filter(outfit => {
    if (search && !outfit.name.toLowerCase().includes(search.toLowerCase())) {
      return false
    }

    if (filters.periodo.length > 0 && !filters.periodo.includes(outfit.period)) {
      return false
    }

    const activeOcasiao = [...filters.ocasiao, ...activeChips]
    if (activeOcasiao.length > 0) {
      if (!outfit.occasion || !activeOcasiao.some(o => outfit.occasion === o)) {
        return false
      }
    }

    if (filters.estilo.length > 0) {
      const tags = outfit.style_tags ?? []
      const match = filters.estilo.some(e =>
        tags.some(tag => tag.toLowerCase() === e.toLowerCase())
      )
      if (!match) return false
    }

    if (filters.estacao.length > 0) {
      const outfitSeasons = outfit.pieces
        .map(id => pieces[id]?.season)
        .filter((s): s is string => Boolean(s))
      const match = filters.estacao.some(s => outfitSeasons.includes(s))
      if (!match) return false
    }

    return true
  })

  const hasOutfits = outfits.length > 0
  const hasResults = filtered.length > 0

  return (
    <>
      <div className="lookbook-header">
        <h1 className="lookbook-title">
          Look<span>book</span>
        </h1>
        <span className="lookbook-count">{outfits.length} outfits</span>
      </div>

      <div className="lookbook-search-row">
        <div className="lookbook-search">
          <span className="lookbook-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar outfits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="lookbook-search-input"
          />
        </div>
        <button
          className={`lookbook-filter-btn ${hasActiveFilters ? 'has-filters' : ''}`}
          onClick={() => setFilterOpen(true)}
          aria-label="Abrir filtros"
        >
          ⊟
        </button>
      </div>

      <div className="lookbook-chips">
        {QUICK_OCCASION_CHIPS.map(occ => (
          <button
            key={occ}
            className={`lookbook-chip ${activeChips.includes(occ) ? 'active' : ''}`}
            onClick={() => toggleChip(occ)}
          >
            {occ}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="lookbook-empty">
          <p className="lookbook-loading">Carregando...</p>
        </div>
      ) : !hasOutfits ? (
        <div className="lookbook-empty">
          <h2 className="lookbook-empty-title">Nenhum outfit aqui ainda.</h2>
          <p className="lookbook-empty-sub">
            Gere outfits com a Mia e salve os que gostar.
          </p>
          <Link href="/mia" className="lookbook-empty-cta">
            Gerar outfits
          </Link>
        </div>
      ) : !hasResults ? (
        <div className="lookbook-empty">
          <h2 className="lookbook-empty-title">Nenhum outfit encontrado.</h2>
          <p className="lookbook-empty-sub">
            Tente outro termo de busca ou ajuste os filtros.
          </p>
        </div>
      ) : (
        <div className="lookbook-list">
          {filtered.map(outfit => {
            const outfitPieces = outfit.pieces
              .map(id => pieces[id])
              .filter(Boolean)

            return (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                outfitPieces={outfitPieces}
                activePiece={activePieces[outfit.id] ?? 0}
                onActivePieceChange={(index) => {
                  setActivePieces(prev => ({ ...prev, [outfit.id]: index }))
                }}
                onDelete={confirmDelete}
                onNavigate={(id) => router.push(`/lookbook/${id}`)}
              />
            )
          })}
        </div>
      )}

      <LookbookFiltersDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onReset={resetFilters}
        filters={filters}
        setFilters={setFilters}
        filteredCount={filtered.length}
      />
    </>
  )
}
