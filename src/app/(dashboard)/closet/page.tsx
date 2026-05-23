'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Piece, WishlistItem } from '@/types/database'

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
import { toBase64, moderateImage } from '@/lib/image'
import '../../closet.css'
import '../../perfil.css'
import '../../wishlist.css'

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

const STYLE_OPTIONS = ['Streetwear', 'Sportwear', 'Casual', 'Social', 'Minimalista']
const FIT_OPTIONS = ['Oversized', 'Regular', 'Slim', 'Cropped', 'A-line']
const STYLE_TYPE_OPTIONS = ['Casual', 'Social', 'Esportivo', 'Streetwear', 'Minimalista']
const SEASON_OPTIONS = ['Todas', 'Verão', 'Inverno', 'Meia estação']

const TOUR_STEPS = [
  {
    title: '✦ Sugerir Peças',
    text: 'A IA analisa seu closet e sugere peças que faltam para criar mais combinações.',
  },
  {
    title: '♡ Sua Wishlist',
    text: 'Aqui ficam as peças que você quer comprar. Quando comprar, adicione direto ao closet com um toque.',
  },
  {
    title: '+ Adicionar Peça',
    text: 'Cadastre as peças que você já tem para a IA conhecer seu guarda-roupa e gerar outfits perfeitos.',
  },
]

type WishlistSuggestion = {
  category: string
  name: string
  color: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

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
  const [cols, setCols] = useState(() => {
    if (typeof window === 'undefined') return 2
    const saved = localStorage.getItem('closet_cols')
    const parsed = parseInt(saved || '2', 10)
    return [1, 2, 3, 4, 5].includes(parsed) ? parsed : 2
  })
  const [showColsMenu, setShowColsMenu] = useState(false)
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState<GroupKey>('Todos')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('mia_theme') as 'light' | 'dark') ?? 'light'
  })
  const [mounted, setMounted] = useState(false)

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
  const [wishlistSuggestions, setWishlistSuggestions] = useState<WishlistSuggestion[]>([])
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false)
  const [savedSuggestionIds, setSavedSuggestionIds] = useState<number[]>([])
  const [wishlistSavedOpen, setWishlistSavedOpen] = useState(false)
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [purchasingWishlistId, setPurchasingWishlistId] = useState<string | null>(null)

  // Add modal (for wishlist "Já comprei" flow)
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
  const [obStep, setObStep] = useState(1)
  const [obName, setObName] = useState('')
  const [obHeight, setObHeight] = useState('')
  const [obWeight, setObWeight] = useState('')
  const [obSelectedStyles, setObSelectedStyles] = useState<string[]>([])
  const [obCustomStyle, setObCustomStyle] = useState('')
  const [obSaving, setObSaving] = useState(false)
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

  // Apply theme to document root on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  function uniqueValues(key: keyof Piece): string[] {
    return [...new Set(
      pieces.map(p => p[key] as string).filter(Boolean)
    )].sort()
  }

  function toggleFilter(arr: string[], val: string, setter: (v: string[]) => void) {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

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
    filterCategory,
    ...filterSeason,
    ...filterStyle,
    ...filterColor,
    ...filterBrand,
    ...filterFit,
  ].filter(Boolean).length

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('mia_theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    document.documentElement.setAttribute('data-auth-theme', newTheme)
  }

  function openPieceDetail(piece: Piece) {
    setSelectedPiece(piece)
    setDetailOpen(true)
  }

  function toggleStyle(style: string) {
    setObSelectedStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    )
  }

  async function handleOnboardingSave() {
    setObSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setObSaving(false); return }

    const allStyles = [
      ...obSelectedStyles,
      ...(obCustomStyle.trim() ? [obCustomStyle.trim()] : []),
    ].join(' / ')

    const updates: Record<string, unknown> = {
      height: obHeight ? parseInt(obHeight) : null,
      weight: obWeight ? parseFloat(obWeight) : null,
      style: allStyles || null,
    }
    if (showNameField && obName.trim()) updates.name = obName.trim()

    await supabase.from('profiles').update(updates).eq('id', user.id)
    setObSaving(false)
    setObStep(3)
  }

  const step1Valid = !!obHeight && !!obWeight && (!showNameField || !!obName.trim())
  const step2Valid = obSelectedStyles.length > 0 || !!obCustomStyle.trim()

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
      if (data.suggestions) { setWishlistSuggestions(data.suggestions); setSavedSuggestionIds([]); setWishlistModalOpen(true) }
    } catch {}
    setWishlistGenerating(false)
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
          {mounted && (
            <button className="dash-theme-toggle" onClick={toggleTheme}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          )}
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
          <button
            className="closet-cols-btn"
            onClick={() => setShowColsMenu(p => !p)}
          >
            ⊞ ▾
          </button>
          {showColsMenu && (
            <>
              <div
                className="closet-cols-backdrop"
                onClick={() => setShowColsMenu(false)}
              />
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
                    onClick={() => { setCols(opt.value); localStorage.setItem('closet_cols', String(opt.value)); setShowColsMenu(false) }}
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
          <div className="closet-grid-placeholder">
            Carregando...
          </div>
        ) : filteredPieces.length === 0 ? (
          <div className="closet-grid-placeholder">
            {search || activeGroup !== 'Todos' || activeFilterCount > 0
              ? 'Nenhuma peça encontrada.'
              : 'Seu closet está vazio.\nToque em + para adicionar.'}
          </div>
        ) : (
          filteredPieces.map(piece => (
            <div
              key={piece.id}
              className="closet-piece-card"
              onClick={() => openPieceDetail(piece)}
            >
              <div className="closet-piece-photo">
                {piece.photo_url ? (
                  <img src={piece.photo_url} alt={piece.name} />
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

      {/* ─── MODAL DETALHE ─── */}
      <div
        className={`modal-overlay ${detailOpen ? 'open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) { setDetailOpen(false); setSelectedPiece(null) } }}
      >
        <div className="modal-sheet">
          <div className="modal-handle" />
          {selectedPiece && (
            <>
              <div className="modal-title">{selectedPiece.name}</div>
              <div className="piece-detail-photo">
                {selectedPiece.photo_url ? (
                  <img src={selectedPiece.photo_url} alt={selectedPiece.name} />
                ) : (
                  <label className="upload-label">
                    <div className="upload-area upload-area--small">{uploadingPhoto ? 'Enviando...' : '+ Adicionar foto'}</div>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAddPhoto} />
                  </label>
                )}
              </div>
              <div className="piece-detail-info">
                <div className="piece-detail-row">
                  <span className="piece-detail-label">Categoria</span>
                  <span className="piece-detail-value">{selectedPiece.category}</span>
                </div>
                {selectedPiece.color && (
                  <div className="piece-detail-row">
                    <span className="piece-detail-label">Cor</span>
                    <span className="piece-detail-value">{selectedPiece.color}</span>
                  </div>
                )}
                {selectedPiece.brand && (
                  <div className="piece-detail-row">
                    <span className="piece-detail-label">Marca</span>
                    <span className="piece-detail-value">{selectedPiece.brand}</span>
                  </div>
                )}
              </div>
              {selectedPiece.photo_url && (
                <label className="modal-swap-photo">
                  <div className="modal-btn">
                    {uploadingPhoto ? 'Enviando...' : 'Trocar foto'}
                  </div>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAddPhoto} />
                </label>
              )}
              <button
                className="anchor-piece-btn"
                onClick={() => {
                  if (selectedPiece) {
                    sessionStorage.setItem('anchor_piece', JSON.stringify(selectedPiece))
                    setAnchorPieceId(selectedPiece.id)
                    setDetailOpen(false)
                    setSelectedPiece(null)
                  }
                }}
              >
                <span>📌</span>
                Usar como peça âncora
              </button>
              <button
                className="modal-btn modal-btn--danger"
                onClick={handleDelete}
              >
                Excluir Peça
              </button>
            </>
          )}
        </div>
      </div>

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
            <span className="modal-label">Fit{aiSuggestion?.fit && <span className="modal-label-badge">MIA</span>}</span>
            <div className="modal-chips-row">
              {FIT_OPTIONS.map(f => (
                <button key={f} className={`modal-chip ${fit === f ? 'active' : ''}`} onClick={() => setFit(fit === f ? '' : f)}>{f}</button>
              ))}
            </div>
          </div>
          <div className="modal-field">
            <span className="modal-label">Estilo{aiSuggestion?.style_type && <span className="modal-label-badge">MIA</span>}</span>
            <div className="modal-chips-row">
              {STYLE_TYPE_OPTIONS.map(o => (
                <button key={o} className={`modal-chip ${styleType === o ? 'active' : ''}`} onClick={() => setStyleType(styleType === o ? '' : o)}>{o}</button>
              ))}
            </div>
          </div>
          <div className="modal-field">
            <span className="modal-label">Estação{aiSuggestion?.season && <span className="modal-label-badge">MIA</span>}</span>
            <div className="modal-chips-row">
              {SEASON_OPTIONS.map(s => (
                <button key={s} className={`modal-chip ${season === s ? 'active' : ''}`} onClick={() => setSeason(season === s ? '' : s)}>{s}</button>
              ))}
            </div>
          </div>
          <button className="modal-btn" onClick={handleSave} disabled={saving || !name}>{saving ? 'Salvando...' : 'Salvar Peça'}</button>
        </div>
      </div>

      {/* ─── TOUR ─── */}
      {tourOpen && (
        <div className="tour-overlay">
          <button className="tour-skip" onClick={handleTourFinish}>Pular</button>
          <div className="tour-spotlight" style={spotlightStyle} />
          <div className="tour-tooltip" style={tooltipStyle}>
            <div className="tour-tooltip-title">{TOUR_STEPS[tourStep].title}</div>
            <div className="tour-tooltip-text">{TOUR_STEPS[tourStep].text}</div>
            <div className="tour-tooltip-footer">
              <div className="tour-dots">
                {TOUR_STEPS.map((_, i) => <div key={i} className={`tour-dot ${i === tourStep ? 'active' : ''}`} />)}
              </div>
              <button className="tour-next" onClick={handleTourNext}>{tourStep === 2 ? 'Concluir' : 'Próximo →'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL SUGESTÕES WISHLIST ─── */}
      <div
        className={`wishlist-modal-overlay ${wishlistModalOpen ? 'open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) { setWishlistModalOpen(false); setSavedSuggestionIds([]) } }}
      >
        <div className="wishlist-modal-sheet">
          <div className="wishlist-modal-handle" />
          <div className="wishlist-modal-header">
            <span className="wishlist-modal-title">Sugestões para o Closet</span>
            <button className="wishlist-modal-close" onClick={() => { setWishlistModalOpen(false); setSavedSuggestionIds([]) }}>✕</button>
          </div>
          <div className="wishlist-modal-scroll">
            {wishlistSuggestions.map((s, index) => (
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
                  className={`wishlist-save-btn ${savedSuggestionIds.includes(index) ? 'saved' : ''}`}
                  disabled={savedSuggestionIds.includes(index)}
                  onClick={() => handleSaveToWishlist(s, index)}
                >
                  {savedSuggestionIds.includes(index) ? '✓ Salvo' : 'Salvar na Wishlist'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MODAL WISHLIST SALVA ─── */}
      <div
        className={`wishlist-modal-overlay ${wishlistSavedOpen ? 'open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) setWishlistSavedOpen(false) }}
      >
        <div className="wishlist-modal-sheet">
          <div className="wishlist-modal-handle" />
          <div className="wishlist-modal-header">
            <span className="wishlist-modal-title">Minha Wishlist</span>
            <button className="wishlist-modal-close" onClick={() => setWishlistSavedOpen(false)}>✕</button>
          </div>
          <div className="wishlist-modal-scroll">
            {wishlistLoading ? (
              <div className="wishlist-empty">Carregando...</div>
            ) : wishlistItems.length === 0 ? (
              <div className="wishlist-empty">
                <div className="wishlist-empty-icon">♡</div>
                Sua wishlist está vazia.{'\n'}Use o botão ✦ para gerar sugestões.
              </div>
            ) : (
              wishlistItems.map(item => (
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
                    <button className="wishlist-action-buy" onClick={() => handleWishlistPurchased(item)}>Já comprei</button>
                    <button className="wishlist-action-remove" onClick={() => handleRemoveWishlistItem(item.id)}>Remover</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── ONBOARDING ─── */}
      <div className={`onboarding-overlay ${onboardingOpen ? 'open' : ''}`}>
        <div className="onboarding-sheet">
          <div className="onboarding-handle" />
          <div className="onboarding-dots">
            {[1, 2, 3].map(s => <div key={s} className={`onboarding-dot ${obStep === s ? 'active' : ''}`} />)}
          </div>

          {obStep === 1 && (
            <>
              <div className="onboarding-logo">
                <div className="onboarding-diamond" />
                <div className="onboarding-title">Bem-vindo</div>
                <div className="onboarding-sub">Alguns dados para personalizar suas sugestões de outfit.</div>
              </div>
              {showNameField && (
                <div className="onboarding-field">
                  <span className="onboarding-label">Como quer ser chamado?</span>
                  <input className="onboarding-input" placeholder="Seu nome" value={obName} onChange={e => setObName(e.target.value)} />
                </div>
              )}
              <div className="onboarding-row">
                <div className="onboarding-field">
                  <span className="onboarding-label">Altura (cm)</span>
                  <input className="onboarding-input" type="number" inputMode="numeric" placeholder="Ex: 178" value={obHeight} onChange={e => setObHeight(e.target.value)} />
                </div>
                <div className="onboarding-field">
                  <span className="onboarding-label">Peso (kg)</span>
                  <input className="onboarding-input" type="number" inputMode="decimal" placeholder="Ex: 75" value={obWeight} onChange={e => setObWeight(e.target.value)} />
                </div>
              </div>
              <button className="onboarding-btn" onClick={() => setObStep(2)} disabled={!step1Valid}>Próximo</button>
            </>
          )}

          {obStep === 2 && (
            <>
              <div className="onboarding-logo">
                <div className="onboarding-diamond" />
                <div className="onboarding-title">Seu Estilo</div>
                <div className="onboarding-sub">Escolha um ou mais estilos que descrevem você.</div>
              </div>
              <div className="style-chips">
                {STYLE_OPTIONS.map(style => (
                  <button key={style} className={`style-chip ${obSelectedStyles.includes(style) ? 'active' : ''}`} onClick={() => toggleStyle(style)}>{style}</button>
                ))}
              </div>
              <div className="onboarding-field">
                <span className="onboarding-label">Outro estilo (opcional)</span>
                <input className="onboarding-input" placeholder="Ex: Vintage, Gótico..." value={obCustomStyle} onChange={e => setObCustomStyle(e.target.value)} />
              </div>
              <button className="onboarding-btn" onClick={handleOnboardingSave} disabled={obSaving || !step2Valid}>{obSaving ? 'Salvando...' : 'Concluir'}</button>
              <button className="onboarding-btn onboarding-btn--ghost" onClick={() => setObStep(1)}>Voltar</button>
            </>
          )}

          {obStep === 3 && (
            <div className="onboarding-success">
              <div className="onboarding-success-icon">✦</div>
              <div className="onboarding-success-title">Tudo Certo!</div>
              <div className="onboarding-success-text">Seu perfil está configurado. Agora a IA pode sugerir outfits perfeitos para você.</div>
              <button className="onboarding-btn" onClick={() => setOnboardingOpen(false)}>Explorar Closet</button>
            </div>
          )}
        </div>
      </div>

      {/* ─── DRAWER DE FILTROS ─── */}
      {filterOpen && (
        <>
          <div
            className="closet-filter-backdrop"
            onClick={() => setFilterOpen(false)}
          />
          <div className="closet-filter-drawer">
            <div className="closet-filter-drawer-header">
              <span className="closet-filter-drawer-title">Filtros</span>
              <button className="closet-filter-drawer-close" onClick={() => setFilterOpen(false)}>✕</button>
            </div>

            {/* Categoria */}
            <div className="closet-filter-section">
              <div className="closet-filter-section-title">Categoria</div>
              <select
                className="closet-filter-select"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="">Todas</option>
                {ALL_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Estação — dinâmico */}
            {uniqueValues('season').length > 0 && (
              <div className="closet-filter-section">
                <div className="closet-filter-section-title">Estação</div>
                <div className="closet-filter-checks">
                  {uniqueValues('season').map(s => (
                    <label key={s} className="closet-filter-check">
                      <input
                        type="checkbox"
                        checked={filterSeason.includes(s)}
                        onChange={() => toggleFilter(filterSeason, s, setFilterSeason)}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Estilo — dinâmico */}
            {uniqueValues('style_type').length > 0 && (
              <div className="closet-filter-section">
                <div className="closet-filter-section-title">Estilo</div>
                <div className="closet-filter-checks">
                  {uniqueValues('style_type').map(s => (
                    <label key={s} className="closet-filter-check">
                      <input
                        type="checkbox"
                        checked={filterStyle.includes(s)}
                        onChange={() => toggleFilter(filterStyle, s, setFilterStyle)}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Cor — chips coloridos */}
            {uniqueValues('color').length > 0 && (
              <div className="closet-filter-section">
                <div className="closet-filter-section-title">Cor</div>
                <div className="closet-filter-colors">
                  {uniqueValues('color').map(c => (
                    <button
                      key={c}
                      className={`closet-filter-color-chip ${filterColor.includes(c) ? 'active' : ''}`}
                      onClick={() => toggleFilter(filterColor, c, setFilterColor)}
                      title={c}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fit — dinâmico */}
            {uniqueValues('fit').length > 0 && (
              <div className="closet-filter-section">
                <div className="closet-filter-section-title">Fit</div>
                <div className="closet-filter-checks">
                  {uniqueValues('fit').map(f => (
                    <label key={f} className="closet-filter-check">
                      <input
                        type="checkbox"
                        checked={filterFit.includes(f)}
                        onChange={() => toggleFilter(filterFit, f, setFilterFit)}
                      />
                      {f}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Marca — dinâmica */}
            {uniqueValues('brand').length > 0 && (
              <div className="closet-filter-section">
                <div className="closet-filter-section-title">Marca</div>
                <div className="closet-filter-checks">
                  {uniqueValues('brand').map(b => (
                    <label key={b} className="closet-filter-check">
                      <input
                        type="checkbox"
                        checked={filterBrand.includes(b)}
                        onChange={() => toggleFilter(filterBrand, b, setFilterBrand)}
                      />
                      {b}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="closet-filter-actions">
              <button
                className="closet-filter-reset"
                onClick={() => {
                  setFilterCategory('')
                  setFilterSeason([])
                  setFilterStyle([])
                  setFilterColor([])
                  setFilterBrand([])
                  setFilterFit([])
                  setActiveGroup('Todos')
                }}
              >
                Limpar
              </button>
              <button
                className="closet-filter-apply"
                onClick={() => setFilterOpen(false)}
              >
                Aplicar ({filteredPieces.length})
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
