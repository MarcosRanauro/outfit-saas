'use client'

import { useEffect, useRef, useState } from 'react'
import NextImage from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Piece, WishlistItem } from '@/types/database'
import { toBase64, moderateImage } from '@/lib/image'
import ClosetOnboarding from '@/components/closet/ClosetOnboarding'
import ClosetTour from '@/components/closet/ClosetTour'
import WishlistSuggestionsModal, { WishlistSuggestion } from '@/components/closet/WishlistSuggestionsModal'
import WishlistSavedModal from '@/components/closet/WishlistSavedModal'
import ClosetFiltersDrawer from '@/components/closet/ClosetFiltersDrawer'
import PieceDetailModal from '@/components/closet/PieceDetailModal'
import ModeToggle from '@/components/ui/ModeToggle'
import TrialExpiredModal from '@/components/ui/TrialExpiredModal'
import '../../closet.css'
import '../../perfil.css'
import '../../wishlist.css'

interface AiSuggestion {
  name?: string
  category?: string
  color?: string
  color_secondary?: string
  brand?: string
  fit?: string
  style_type?: string
  season?: string
  description?: string
}

const CATEGORY_GROUPS = {
  'Todos': [] as string[],
  'Roupas': [
    'Camiseta / Blusa', 'Camisa', 'Moletom',
    'Calça', 'Short / Bermuda', 'Saia', 'Vestido',
    'Macacão', 'Casaco / Jaqueta',
  ],
  'Calçados': [
    'Tênis', 'Sapato / Oxford', 'Bota', 'Sandália / Chinelo',
  ],
  'Acessórios': [
    'Acessório', 'Relógio', 'Bolsa', 'Chapéu / Boné',
  ],
}

type GroupKey = keyof typeof CATEGORY_GROUPS

const ALL_CATEGORIES = Object.values(CATEGORY_GROUPS).flat()

const FIT_OPTIONS = ['Oversized', 'Regular', 'Slim', 'Cropped', 'A-line']
const STYLE_TYPE_OPTIONS = ['Casual', 'Social', 'Esportivo', 'Streetwear', 'Minimalista']
const SEASON_OPTIONS = ['Todas', 'Verão', 'Inverno', 'Meia estação']

async function compressImageForUpload(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const MAX_SIZE = 1200
      let { width, height } = img
      if (width > height && width > MAX_SIZE) {
        height = Math.round((height * MAX_SIZE) / width)
        width = MAX_SIZE
      } else if (height > MAX_SIZE) {
        width = Math.round((width * MAX_SIZE) / height)
        height = MAX_SIZE
      }
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85)
    }

    img.src = url
  })
}

export default function ClosetPage() {
  const router = useRouter()
  const supabase = createClient()

  // Data
  const [pieces, setPieces] = useState<Piece[]>([])
  const [loading, setLoading] = useState(true)
  const [userPlan, setUserPlan] = useState<string>('free')
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [anchorPieceId, setAnchorPieceId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const saved = sessionStorage.getItem('anchor_piece')
      return saved ? (JSON.parse(saved) as { id: string }).id : null
    } catch {
      return null
    }
  })
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false)

  // Layout
  const [cols, setCols] = useState(4)
  const [showColsMenu, setShowColsMenu] = useState(false)
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState<GroupKey>('Todos')

  // Filtros drawer
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSeason, setFilterSeason] = useState<string[]>([])
  const [filterStyle, setFilterStyle] = useState<string[]>([])
  const [filterColor, setFilterColor] = useState<string[]>([])
  const [filterBrand, setFilterBrand] = useState<string[]>([])
  const [filterFit, setFilterFit] = useState<string[]>([])

  // Wishlist
  const [wishlistGenerating, setWishlistGenerating] = useState(false)
  const [showTrialExpired, setShowTrialExpired] = useState(false)
  const [wishlistSuggestions, setWishlistSuggestions] = useState<WishlistSuggestion[]>([])
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false)
  const [savedSuggestionIds, setSavedSuggestionIds] = useState<number[]>([])
  const [wishlistSavedOpen, setWishlistSavedOpen] = useState(false)
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [purchasingWishlistId, setPurchasingWishlistId] = useState<string | null>(null)

  // Add modal (fluxo wishlist "Já comprei")
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Camiseta / Blusa')
  const [color, setColor] = useState('')
  const [brand, setBrand] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null)
  const [fit, setFit] = useState('')
  const [styleType, setStyleType] = useState('')
  const [season, setSeason] = useState('')

  // Onboarding
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [showNameField, setShowNameField] = useState(false)

  // Tour
  const [tourOpen, setTourOpen] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({})
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})

  const suggestBtnRef = useRef<HTMLButtonElement>(null)
  const wishlistBtnRef = useRef<HTMLButtonElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [piecesResult, profileResult] = await Promise.all([
      supabase.from('pieces').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('plan, name, height, weight, style, closet_tour_completed, trial_ends_at').eq('id', user.id).single(),
    ])

    if (piecesResult.data) setPieces(piecesResult.data)

    if (profileResult.data) {
      const p = profileResult.data
      const dbPlan = p.plan || 'free'
      const trialEndsAt = p.trial_ends_at ? new Date(p.trial_ends_at) : null
      const isTrialActive = trialEndsAt !== null && trialEndsAt > new Date()
      const effectivePlan = dbPlan === 'pro' ? 'pro' : (isTrialActive ? 'trial' : 'expired')
      setUserPlan(effectivePlan)
      const incomplete = !p.height || !p.weight || !p.style
      if (incomplete) {
        setShowNameField(!p.name)
        setOnboardingOpen(true)
      } else if (!p.closet_tour_completed) {
        setTourOpen(true)
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    const saved = localStorage.getItem('mia-closet-cols')
    if (saved) {
      const parsed = parseInt(saved, 10)
      if ([1, 2, 3, 4, 5].includes(parsed)) setCols(parsed)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (loading || pieces.length === 0) return
    const params = new URLSearchParams(window.location.search)
    const pieceId = params.get('piece')
    if (!pieceId) return
    const piece = pieces.find(p => p.id === pieceId)
    if (piece) {
      setSelectedPiece(piece)
      setDetailOpen(true)
      window.history.replaceState({}, '', '/closet')
    }
  }, [loading, pieces])

  useEffect(() => {
    if (!tourOpen) return
    const refs = [suggestBtnRef, wishlistBtnRef, fabRef]
    const el = refs[tourStep]?.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setSpotlightStyle({ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 })
    const tooltipLeft = Math.max(10, Math.min(rect.left + rect.width / 2 - 110, window.innerWidth - 230))
    setTooltipStyle({ top: rect.bottom + 14, left: tooltipLeft })
  }, [tourStep, tourOpen])

  const filteredPieces = pieces.filter(piece => {
    const groupCats = CATEGORY_GROUPS[activeGroup]
    const matchGroup = activeGroup === 'Todos' || groupCats.includes(piece.category)
    const matchSearch = !search ||
      piece.name.toLowerCase().includes(search.toLowerCase()) ||
      piece.category.toLowerCase().includes(search.toLowerCase()) ||
      (piece.color || '').toLowerCase().includes(search.toLowerCase())
    const matchCategory = !filterCategory || piece.category === filterCategory
    const matchSeason = filterSeason.length === 0 ||
      filterSeason.some(s => (piece.season || '').toLowerCase().includes(s.toLowerCase()))
    const matchStyle = filterStyle.length === 0 ||
      filterStyle.some(s => (piece.style_type || '').toLowerCase().includes(s.toLowerCase()))
    const matchColor = filterColor.length === 0 ||
      filterColor.some(c => (piece.color || '').toLowerCase().includes(c.toLowerCase()))
    const matchBrand = filterBrand.length === 0 ||
      filterBrand.some(b => (piece.brand || '').toLowerCase().includes(b.toLowerCase()))
    const matchFit = filterFit.length === 0 ||
      filterFit.some(f => (piece.fit || '').toLowerCase().includes(f.toLowerCase()))
    return matchGroup && matchSearch && matchCategory &&
      matchSeason && matchStyle && matchColor && matchBrand && matchFit
  })

  const activeFilterCount = [
    filterCategory, ...filterSeason, ...filterStyle, ...filterColor, ...filterBrand, ...filterFit,
  ].filter(Boolean).length


  function openPieceDetail(piece: Piece) {
    setSelectedPiece(piece)
    setDetailOpen(true)
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await toBase64(file)
    const approved = await moderateImage(base64)
    if (!approved) {
      alert('Esta imagem não é permitida. Por favor, envie uma foto de roupa ou acessório.')
      return
    }
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      img.onload = () => {
        const MAX_SIZE = 800
        let { width, height } = img
        if (width > height && width > MAX_SIZE) { height = Math.round((height * MAX_SIZE) / width); width = MAX_SIZE }
        else if (height > MAX_SIZE) { width = Math.round((width * MAX_SIZE) / height); height = MAX_SIZE }
        canvas.width = width; canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
        resolve({ base64, mimeType: 'image/jpeg' })
      }
      img.src = URL.createObjectURL(file)
    })
  }

  async function handleAnalyze() {
    if (!photo) return
    setAnalyzing(true)
    try {
      const { base64, mimeType } = await compressImage(photo)
      const res = await fetch('/api/pieces/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Erro ao analisar a foto. Tente novamente.'); return }
      if (data.suggestion) {
        const s = data.suggestion
        if (s.name) setName(s.name)
        if (s.category) setCategory(s.category)
        if (s.color) setColor(s.color)
        if (s.brand) setBrand(s.brand)
        if (s.fit) setFit(s.fit)
        if (s.style_type) setStyleType(s.style_type)
        if (s.season) setSeason(s.season)
        setAiSuggestion(s)
      }
    } catch {
      alert('Erro ao analisar a foto. Tente novamente.')
    } finally {
      setAnalyzing(false)
    }
  }

  function resetModal() {
    setName(''); setCategory('Camiseta / Blusa'); setColor(''); setBrand('')
    setPhoto(null); setPhotoPreview(null); setFit(''); setStyleType(''); setSeason('')
    setAiSuggestion(null); setPurchasingWishlistId(null); setModalOpen(false)
  }

  async function handleSave() {
    if (!name || !category) return
    setSaving(true)
    if (userPlan === 'expired') { setShowUpgradeBanner(true); setSaving(false); resetModal(); return }
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      let photo_url = null
      if (photo) {
        const path = `${user.id}/${Date.now()}.jpg`
        const compressedPhoto = await compressImageForUpload(photo)
        const { error: uploadError } = await supabase.storage.from('pieces').upload(path, compressedPhoto, { contentType: 'image/jpeg' })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('pieces').getPublicUrl(path)
          photo_url = urlData.publicUrl
        }
      }
      const { data, error } = await supabase.from('pieces').insert({
        user_id: user.id, code: `P${Date.now()}`, name, category,
        color: color || null, brand: brand || null, photo_url,
        fit: fit || null, style_type: styleType || null, season: season || null,
      }).select().single()
      if (error) throw error
      if (data) setPieces(prev => [data, ...prev])
      if (purchasingWishlistId) {
        await supabase.from('wishlist_items').delete().eq('id', purchasingWishlistId)
        setWishlistItems(prev => prev.filter(i => i.id !== purchasingWishlistId))
      }
      resetModal()
    } catch {
      alert('Erro ao salvar a peça. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedPiece) return
    try {
      const { error } = await supabase.from('pieces').delete().eq('id', selectedPiece.id)
      if (error) throw error
      setPieces(prev => prev.filter(p => p.id !== selectedPiece.id))
      try {
        const savedAnchor = sessionStorage.getItem('anchor_piece')
        if (savedAnchor) {
          const anchor = JSON.parse(savedAnchor)
          if (anchor.id === selectedPiece.id) { sessionStorage.removeItem('anchor_piece'); setAnchorPieceId(null) }
        }
      } catch {}
      setDetailOpen(false); setSelectedPiece(null)
    } catch {
      alert('Erro ao excluir a peça. Tente novamente.')
    }
  }

  async function handleAddPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedPiece) return
    const base64 = await toBase64(file)
    const approved = await moderateImage(base64)
    if (!approved) {
      alert('Esta imagem não é permitida. Por favor, envie uma foto de roupa ou acessório.')
      return
    }
    setUploadingPhoto(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const path = `${user.id}/${Date.now()}.jpg`
      const compressedFile = await compressImageForUpload(file)
      const { error: uploadError } = await supabase.storage.from('pieces').upload(path, compressedFile, { contentType: 'image/jpeg' })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('pieces').getPublicUrl(path)
        const { data } = await supabase.from('pieces').update({ photo_url: urlData.publicUrl }).eq('id', selectedPiece.id).select().single()
        if (data) {
          setPieces(prev => prev.map(p => p.id === data.id ? data : p))
          setSelectedPiece(data)
          if (data.id === anchorPieceId) sessionStorage.setItem('anchor_piece', JSON.stringify(data))
        }
      }
    } catch (err) {
      console.error('Erro ao adicionar foto:', err)
      alert('Erro ao adicionar foto. Tente novamente.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleTourFinish() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ closet_tour_completed: true }).eq('id', user.id)
    setTourOpen(false)
  }

  function handleTourNext() {
    if (tourStep < 2) setTourStep(prev => prev + 1)
    else handleTourFinish()
  }

  async function handleGenerateWishlist() {
    setWishlistGenerating(true)
    try {
      const res = await fetch('/api/wishlist/generate', { method: 'POST' })
      const data = await res.json()
      if (data.code === 'TRIAL_EXPIRED') {
        setShowTrialExpired(true)
        return
      }
      if (data.suggestions) { setWishlistSuggestions(data.suggestions); setSavedSuggestionIds([]); setWishlistModalOpen(true) }
    } catch {}
    finally { setWishlistGenerating(false) }
  }

  async function loadWishlistItems() {
    setWishlistLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setWishlistLoading(false); return }
    const { data } = await supabase.from('wishlist_items').select('*').eq('user_id', user.id).eq('purchased', false).order('created_at', { ascending: false })
    setWishlistItems(data || [])
    setWishlistLoading(false)
  }

  async function handleSaveToWishlist(suggestion: WishlistSuggestion, index: number) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('wishlist_items').insert({
        user_id: user.id, category: suggestion.category, name: suggestion.name,
        color: suggestion.color || null, reason: suggestion.reason, priority: suggestion.priority,
      })
      setSavedSuggestionIds(prev => [...prev, index])
    } catch (err) {
      console.error('Erro ao salvar na wishlist:', err)
      alert('Erro ao salvar. Tente novamente.')
    }
  }

  async function handleRemoveWishlistItem(id: string) {
    try {
      await supabase.from('wishlist_items').delete().eq('id', id)
      setWishlistItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      console.error('Erro ao remover da wishlist:', err)
    }
  }

  function handleWishlistPurchased(item: WishlistItem) {
    setName(item.name); setCategory(item.category); setColor(item.color || '')
    setBrand(''); setPhoto(null); setPhotoPreview(null)
    setPurchasingWishlistId(item.id); setWishlistSavedOpen(false); setModalOpen(true)
  }

  function handleSetAnchor(piece: Piece) {
    sessionStorage.setItem('anchor_piece', JSON.stringify(piece))
    setAnchorPieceId(piece.id)
    setDetailOpen(false)
    setSelectedPiece(null)
  }

  function handleFiltersReset() {
    setFilterCategory('')
    setFilterSeason([])
    setFilterStyle([])
    setFilterColor([])
    setFilterBrand([])
    setFilterFit([])
    setActiveGroup('Todos')
  }

  return (
    <>
      {/* ─── HEADER ─── */}
      <div className="closet-header">
        <div className="closet-header-left">
          <h1 className="closet-title">MEU <span>CLOSET</span></h1>
          <span className="closet-count">{pieces.length}</span>
        </div>
        <div className="closet-header-right">
          <button
            ref={suggestBtnRef}
            className="closet-col-btn"
            onClick={handleGenerateWishlist}
            disabled={wishlistGenerating || pieces.length < 3}
            title={pieces.length < 3 ? 'Adicione pelo menos 3 peças' : 'Sugerir peças'}
          >
            {wishlistGenerating ? '…' : '✦'}
          </button>
          <button
            ref={wishlistBtnRef}
            className="closet-col-btn"
            onClick={() => { loadWishlistItems(); setWishlistSavedOpen(true) }}
            title="Minha wishlist"
          >
            ♡
          </button>
          <ModeToggle />
        </div>
      </div>

      {/* ─── SEARCH + FILTROS + COLUNAS ─── */}
      <div className="closet-search-row">
        <div className="closet-search-bar">
          <span className="closet-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar peças..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="closet-search-input"
          />
          {search && (
            <button onClick={() => setSearch('')} className="closet-search-clear">✕</button>
          )}
        </div>
        <button
          className={`closet-filter-btn ${filterOpen || activeFilterCount > 0 ? 'active' : ''}`}
          onClick={() => setFilterOpen(true)}
        >
          ⊟{activeFilterCount > 0 && (
            <span className="closet-filter-badge">{activeFilterCount}</span>
          )}
        </button>
        <div className="closet-cols-wrap">
          <button className="closet-cols-btn" onClick={() => setShowColsMenu(p => !p)}>
            ⊞ ▾
          </button>
          {showColsMenu && (
            <>
              <div className="closet-cols-backdrop" onClick={() => setShowColsMenu(false)} />
              <div className="closet-cols-menu">
                {[
                  { label: '2 colunas', value: 2 },
                  { label: '3 colunas', value: 3 },
                  { label: '4 colunas', value: 4 },
                  { label: '5 colunas', value: 5 },
                  { label: 'Lista', value: 1 },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`closet-cols-option ${cols === opt.value ? 'active' : ''}`}
                    onClick={() => { setCols(opt.value); localStorage.setItem('mia-closet-cols', String(opt.value)); setShowColsMenu(false) }}
                  >
                    <span>{opt.label}</span>
                    {cols === opt.value && <span>✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── CHIPS DE GRUPO ─── */}
      <div className="closet-filter-chips">
        {(Object.keys(CATEGORY_GROUPS) as GroupKey[]).map(group => (
          <button
            key={group}
            className={`closet-chip ${activeGroup === group ? 'active' : ''}`}
            onClick={() => setActiveGroup(group)}
          >
            {group}
          </button>
        ))}
      </div>

      {/* ─── BANNER UPGRADE ─── */}
      {showUpgradeBanner && (
        <div className="closet-upgrade-banner">
          <div className="closet-upgrade-banner-info">
            <div className="closet-upgrade-banner-title">🔒 Teste expirado</div>
            <div className="closet-upgrade-banner-sub">Seu período de teste encerrou. Faça upgrade para continuar.</div>
          </div>
          <div className="closet-upgrade-banner-actions">
            <button onClick={() => setShowUpgradeBanner(false)} className="closet-upgrade-banner-close">Fechar</button>
            <a href="/perfil" className="closet-upgrade-btn">⚡ Upgrade Pro</a>
          </div>
        </div>
      )}

      {/* ─── GRID ─── */}
      <div
        className={cols === 1 ? 'closet-list' : 'closet-grid'}
        style={cols > 1 ? { gridTemplateColumns: `repeat(${cols}, 1fr)` } : undefined}
      >
        {loading ? (
          <div className="closet-grid-placeholder">Carregando...</div>
        ) : filteredPieces.length === 0 ? (
          <div className="closet-grid-placeholder">
            {search || activeGroup !== 'Todos' || activeFilterCount > 0
              ? 'Nenhuma peça encontrada.'
              : 'Seu closet está vazio.\nToque em + para adicionar.'}
          </div>
        ) : (
          filteredPieces.map(piece => (
            <div key={piece.id} className="closet-piece-card" onClick={() => openPieceDetail(piece)}>
              <div className="closet-piece-photo">
                {piece.photo_url ? (
                  <NextImage src={piece.photo_url} alt={piece.name} fill sizes="(max-width: 768px) 25vw, 20vw" />
                ) : (
                  <div className="closet-piece-no-photo"><span>👗</span></div>
                )}
                {anchorPieceId === piece.id && (
                  <div className="closet-anchor-badge">✦</div>
                )}
              </div>
              <div className="closet-piece-overlay">
                <span className="closet-piece-cat">{piece.category}</span>
                <span className="closet-piece-name">{piece.name}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── FAB ─── */}
      <button
        ref={fabRef}
        className="closet-fab"
        onClick={() => {
          if (userPlan === 'expired') { setShowUpgradeBanner(true); return }
          router.push('/closet/nova-peca')
        }}
      >
        +
      </button>

      {/* ─── MODAL ADICIONAR (fluxo wishlist "Já comprei") ─── */}
      <div
        className={`modal-overlay ${modalOpen ? 'open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) resetModal() }}
      >
        <div className="modal-sheet">
          <div className="modal-handle" />
          <div className="modal-title">Nova Peça</div>
          <div className="modal-field">
            <span className="modal-label">Foto</span>
            <label className="upload-label">
              {photoPreview
                ? <img src={photoPreview} className="upload-preview" alt="preview" />
                : <div className="upload-area">Toque para adicionar foto</div>}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
            </label>
          </div>
          {photoPreview && (
            <button className="analyze-btn" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? <><span className="analyze-spinner" />Analisando...</> : '✦ Analisar com Mia'}
            </button>
          )}
          {aiSuggestion && (
            <div className="mia-badge">
              <span className="mia-badge-icon">✦</span>
              <span className="mia-badge-text">Mia analisou sua peça. Revise e ajuste se quiser.</span>
            </div>
          )}
          <div className="modal-field">
            <span className="modal-label">Nome</span>
            <input className="modal-input" placeholder="Ex: Campus Cinza" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="modal-field">
            <span className="modal-label">Categoria</span>
            <select className="modal-select" value={category} onChange={e => setCategory(e.target.value)}>
              {ALL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="modal-field">
            <span className="modal-label">Cor</span>
            <input className="modal-input" placeholder="Ex: Cinza mescla" value={color} onChange={e => setColor(e.target.value)} />
          </div>
          <div className="modal-field">
            <span className="modal-label">Marca</span>
            <input className="modal-input" placeholder="Ex: Adidas" value={brand} onChange={e => setBrand(e.target.value)} />
          </div>
          <div className="modal-field">
            <span className="modal-label">
              Fit{aiSuggestion?.fit && <span className="modal-label-badge">MIA</span>}
            </span>
            <div className="modal-chips-row">
              {FIT_OPTIONS.map(f => (
                <button key={f} className={`modal-chip ${fit === f ? 'active' : ''}`} onClick={() => setFit(fit === f ? '' : f)}>{f}</button>
              ))}
            </div>
          </div>
          <div className="modal-field">
            <span className="modal-label">
              Estilo{aiSuggestion?.style_type && <span className="modal-label-badge">MIA</span>}
            </span>
            <div className="modal-chips-row">
              {STYLE_TYPE_OPTIONS.map(o => (
                <button key={o} className={`modal-chip ${styleType === o ? 'active' : ''}`} onClick={() => setStyleType(styleType === o ? '' : o)}>{o}</button>
              ))}
            </div>
          </div>
          <div className="modal-field">
            <span className="modal-label">
              Estação{aiSuggestion?.season && <span className="modal-label-badge">MIA</span>}
            </span>
            <div className="modal-chips-row">
              {SEASON_OPTIONS.map(s => (
                <button key={s} className={`modal-chip ${season === s ? 'active' : ''}`} onClick={() => setSeason(season === s ? '' : s)}>{s}</button>
              ))}
            </div>
          </div>
          <button className="modal-btn" onClick={handleSave} disabled={saving || !name}>
            {saving ? 'Salvando...' : 'Salvar Peça'}
          </button>
        </div>
      </div>

      {/* ─── COMPONENTES EXTRAÍDOS ─── */}
      <PieceDetailModal
        open={detailOpen}
        piece={selectedPiece}
        uploadingPhoto={uploadingPhoto}
        anchorPieceId={anchorPieceId}
        onClose={() => { setDetailOpen(false); setSelectedPiece(null) }}
        onDelete={handleDelete}
        onAddPhoto={handleAddPhoto}
        onSetAnchor={handleSetAnchor}
      />

      <TrialExpiredModal
        isOpen={showTrialExpired}
        onClose={() => setShowTrialExpired(false)}
      />

      <WishlistSuggestionsModal
        open={wishlistModalOpen}
        suggestions={wishlistSuggestions}
        savedIds={savedSuggestionIds}
        onSave={handleSaveToWishlist}
        onClose={() => { setWishlistModalOpen(false); setSavedSuggestionIds([]) }}
      />

      <WishlistSavedModal
        open={wishlistSavedOpen}
        items={wishlistItems}
        loading={wishlistLoading}
        onClose={() => setWishlistSavedOpen(false)}
        onPurchased={handleWishlistPurchased}
        onRemove={handleRemoveWishlistItem}
      />

      <ClosetOnboarding
        open={onboardingOpen}
        showNameField={showNameField}
        onComplete={() => setOnboardingOpen(false)}
      />

      <ClosetTour
        open={tourOpen}
        step={tourStep}
        spotlightStyle={spotlightStyle}
        tooltipStyle={tooltipStyle}
        onNext={handleTourNext}
        onFinish={handleTourFinish}
      />

      <ClosetFiltersDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onReset={handleFiltersReset}
        pieces={pieces}
        filteredCount={filteredPieces.length}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterSeason={filterSeason}
        setFilterSeason={setFilterSeason}
        filterStyle={filterStyle}
        setFilterStyle={setFilterStyle}
        filterColor={filterColor}
        setFilterColor={setFilterColor}
        filterBrand={filterBrand}
        setFilterBrand={setFilterBrand}
        filterFit={filterFit}
        setFilterFit={setFilterFit}
      />
    </>
  )
}
