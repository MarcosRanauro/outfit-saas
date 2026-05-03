'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Piece, WishlistItem } from '@/types/database'
import '../../closet.css'
import '../../perfil.css'
import '../../wishlist.css'

const CATEGORIES = [
  'Todos',
  'Camiseta / Blusa',
  'Camisa',
  'Moletom',
  'Calça',
  'Short / Bermuda',
  'Saia',
  'Vestido',
  'Macacão',
  'Tênis',
  'Sapato / Oxford',
  'Bota',
  'Sandália / Chinelo',
  'Casaco / Jaqueta',
  'Acessório',
  'Bolsa',
  'Chapéu / Boné',
]
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

      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/jpeg',
        0.85
      )
    }

    img.src = url
  })
}

export default function ClosetPage() {
  const supabase = createClient()

  const [pieces, setPieces] = useState<Piece[]>([])
  const [filtered, setFiltered] = useState<Piece[]>([])
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [outfitsCount, setOutfitsCount] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('Camiseta / Blusa')
  const [color, setColor] = useState('')
  const [brand, setBrand] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<any>(null)
  const [fit, setFit] = useState('')
  const [styleType, setStyleType] = useState('')
  const [season, setSeason] = useState('')

  // onboarding
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [obStep, setObStep] = useState(1)
  const [obName, setObName] = useState('')
  const [obHeight, setObHeight] = useState('')
  const [obWeight, setObWeight] = useState('')
  const [obSelectedStyles, setObSelectedStyles] = useState<string[]>([])
  const [obCustomStyle, setObCustomStyle] = useState('')
  const [obSaving, setObSaving] = useState(false)
  const [showNameField, setShowNameField] = useState(false)

  const [wishlistGenerating, setWishlistGenerating] = useState(false)
  const [wishlistSuggestions, setWishlistSuggestions] = useState<WishlistSuggestion[]>([])
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false)
  const [savedSuggestionIds, setSavedSuggestionIds] = useState<number[]>([])
  const [wishlistSavedOpen, setWishlistSavedOpen] = useState(false)
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [purchasingWishlistId, setPurchasingWishlistId] = useState<string | null>(null)

  const [tourOpen, setTourOpen] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({})
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})

  const suggestBtnRef = useRef<HTMLButtonElement>(null)
  const wishlistBtnRef = useRef<HTMLButtonElement>(null)
  const addBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!tourOpen) return
    const refs = [suggestBtnRef, wishlistBtnRef, addBtnRef]
    const el = refs[tourStep]?.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setSpotlightStyle({ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 })
    const tooltipLeft = Math.max(10, Math.min(rect.left + rect.width / 2 - 110, window.innerWidth - 230))
    setTooltipStyle({ top: rect.bottom + 14, left: tooltipLeft })
  }, [tourStep, tourOpen])

  useEffect(() => {
    if (activeFilter === 'Todos') {
      setFiltered(pieces)
    } else {
      setFiltered(pieces.filter(p => p.category === activeFilter))
    }
  }, [activeFilter, pieces])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [piecesResult, profileResult, outfitsResult] = await Promise.all([
      supabase.from('pieces').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('name, height, weight, style, closet_tour_completed').eq('id', user.id).single(),
      supabase.from('outfits').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    if (piecesResult.data) {
      setPieces(piecesResult.data)
      setFiltered(piecesResult.data)
    }

    setOutfitsCount(outfitsResult.count || 0)

    if (profileResult.data) {
      const p = profileResult.data
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

    if (showNameField && obName.trim()) {
      updates.name = obName.trim()
    }

    await supabase.from('profiles').update(updates).eq('id', user.id)
    setObSaving(false)
    setObStep(3)
  }

  const step1Valid =
    !!obHeight &&
    !!obWeight &&
    (!showNameField || !!obName.trim())

  const step2Valid = obSelectedStyles.length > 0 || !!obCustomStyle.trim()

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function compressImage(file: File): Promise<{ base64: string, mimeType: string }> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        const MAX_SIZE = 800
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
    } catch (err) {
      console.error('Erro ao analisar:', err)
    }

    setAnalyzing(false)
  }

  function resetModal() {
    setName('')
    setCategory('Camiseta / Blusa')
    setColor('')
    setBrand('')
    setPhoto(null)
    setPhotoPreview(null)
    setFit('')
    setStyleType('')
    setSeason('')
    setAiSuggestion(null)
    setPurchasingWishlistId(null)
    setModalOpen(false)
  }

  async function handleSave() {
    if (!name || !category) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let photo_url = null

    if (photo) {
      const path = `${user.id}/${Date.now()}.jpg`

      const compressedPhoto = await compressImageForUpload(photo)
      const { error: uploadError } = await supabase.storage
        .from('pieces')
        .upload(path, compressedPhoto, { contentType: 'image/jpeg' })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('pieces')
          .getPublicUrl(path)
        photo_url = urlData.publicUrl
      }
    }

    const code = `P${Date.now()}`

    const { data } = await supabase
      .from('pieces')
      .insert({
        user_id: user.id,
        code,
        name,
        category,
        color: color || null,
        brand: brand || null,
        photo_url,
        fit: fit || null,
        style_type: styleType || null,
        season: season || null,
      })
      .select()
      .single()

    if (data) {
      setPieces(prev => [data, ...prev])
    }

    if (purchasingWishlistId) {
      await supabase.from('wishlist_items').delete().eq('id', purchasingWishlistId)
      setWishlistItems(prev => prev.filter(i => i.id !== purchasingWishlistId))
    }

    setSaving(false)
    resetModal()
  }

  async function handleDelete() {
    if (!selectedPiece) return

    await supabase
      .from('pieces')
      .delete()
      .eq('id', selectedPiece.id)

    setPieces(prev => prev.filter(p => p.id !== selectedPiece.id))
    setDetailOpen(false)
    setSelectedPiece(null)
  }

  async function handleAddPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedPiece) return
    setUploadingPhoto(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const path = `${user.id}/${Date.now()}.jpg`

    const compressedFile = await compressImageForUpload(file)
    const { error: uploadError } = await supabase.storage
      .from('pieces')
      .upload(path, compressedFile, { contentType: 'image/jpeg' })

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('pieces')
        .getPublicUrl(path)

      const { data } = await supabase
        .from('pieces')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', selectedPiece.id)
        .select()
        .single()

      if (data) {
        setPieces(prev => prev.map(p => p.id === data.id ? data : p))
        setSelectedPiece(data)
      }
    }

    setUploadingPhoto(false)
  }

  async function handleTourFinish() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ closet_tour_completed: true }).eq('id', user.id)
    }
    setTourOpen(false)
  }

  function handleTourNext() {
    if (tourStep < 2) {
      setTourStep(prev => prev + 1)
    } else {
      handleTourFinish()
    }
  }

  async function handleGenerateWishlist() {
    setWishlistGenerating(true)
    try {
      const res = await fetch('/api/wishlist/generate', { method: 'POST' })
      const data = await res.json()
      if (data.suggestions) {
        setWishlistSuggestions(data.suggestions)
        setSavedSuggestionIds([])
        setWishlistModalOpen(true)
      }
    } catch {
      // silent
    }
    setWishlistGenerating(false)
  }

  async function loadWishlistItems() {
    setWishlistLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setWishlistLoading(false); return }

    const { data } = await supabase
      .from('wishlist_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('purchased', false)
      .order('created_at', { ascending: false })

    setWishlistItems(data || [])
    setWishlistLoading(false)
  }

  async function handleSaveToWishlist(suggestion: WishlistSuggestion, index: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('wishlist_items').insert({
      user_id: user.id,
      category: suggestion.category,
      name: suggestion.name,
      color: suggestion.color || null,
      reason: suggestion.reason,
      priority: suggestion.priority,
    })

    setSavedSuggestionIds(prev => [...prev, index])
  }

  async function handleRemoveWishlistItem(id: string) {
    await supabase.from('wishlist_items').delete().eq('id', id)
    setWishlistItems(prev => prev.filter(i => i.id !== id))
  }

  function handleWishlistPurchased(item: WishlistItem) {
    setName(item.name)
    setCategory(item.category)
    setColor(item.color || '')
    setBrand('')
    setPhoto(null)
    setPhotoPreview(null)
    setPurchasingWishlistId(item.id)
    setWishlistSavedOpen(false)
    setModalOpen(true)
  }

  const categories = [...new Set(pieces.map(p => p.category))]

  return (
    <>
      <div className="closet-header">
        <h1 className="closet-title">
          Meu <span>Closet</span>
        </h1>
        <div className="closet-actions">
          <button
            ref={suggestBtnRef}
            className="action-btn"
            onClick={handleGenerateWishlist}
            disabled={wishlistGenerating || pieces.length < 3}
            title={pieces.length < 3 ? 'Adicione pelo menos 3 peças' : ''}
          >
            <span className="action-btn-icon gold">
              {wishlistGenerating ? <span className="wishlist-spinner" /> : '✦'}
            </span>
            <span className="action-btn-label">Sugerir</span>
          </button>
          <button
            ref={wishlistBtnRef}
            className="action-btn"
            onClick={() => { loadWishlistItems(); setWishlistSavedOpen(true) }}
          >
            <span className="action-btn-icon ghost">♡</span>
            <span className="action-btn-label">Wishlist</span>
          </button>
          <button
            ref={addBtnRef}
            className="action-btn"
            onClick={() => setModalOpen(true)}
          >
            <span className="action-btn-icon gold">+</span>
            <span className="action-btn-label">Nova</span>
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-num">{pieces.length}</div>
          <div className="stat-label">Peças</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{categories.length}</div>
          <div className="stat-label">Categorias</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{outfitsCount}</div>
          <div className="stat-label">Outfits</div>
        </div>
      </div>

      <div className="filter-row">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-chip ${activeFilter === cat ? 'active' : ''}`}
            onClick={() => setActiveFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="pieces-grid">
        {loading ? (
          <div className="empty-state">
            <div className="empty-state-text">Carregando...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="piece-photo-icon" />
            <div className="empty-state-text">
              Nenhuma peça ainda.{'\n'}Toque em + para adicionar.
            </div>
          </div>
        ) : (
          filtered.map(piece => (
            <div
              key={piece.id}
              className="piece-card"
              onClick={() => {
                setSelectedPiece(piece)
                setDetailOpen(true)
              }}
            >
              <div className="piece-photo">
                {piece.photo_url ? (
                  <img src={piece.photo_url} alt={piece.name} />
                ) : (
                  <div className="piece-photo-empty">
                    <div className="piece-photo-icon" />
                    <span className="piece-photo-text">Sem foto</span>
                  </div>
                )}
              </div>
              <div className="piece-info">
                <div className="piece-name">{piece.name}</div>
                <div className="piece-cat">{piece.category}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal adicionar peça */}
      <div
        className={`modal-overlay ${modalOpen ? 'open' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) resetModal()
        }}
      >
        <div className="modal-sheet">
          <div className="modal-handle" />
          <div className="modal-title">Nova Peça</div>

          <div className="modal-field">
            <span className="modal-label">Foto</span>
            <label style={{ display: 'block', cursor: 'pointer' }}>
              {photoPreview ? (
                <img src={photoPreview} className="upload-preview" alt="preview" />
              ) : (
                <div className="upload-area">Toque para adicionar foto</div>
              )}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
            </label>
          </div>

          {photoPreview && (
            <button
              className="analyze-btn"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <span className="analyze-spinner" />
                  Analisando...
                </>
              ) : '✦ Analisar com Mia'}
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
            <input
              className="modal-input"
              placeholder="Ex: Campus Cinza"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <span className="modal-label">Categoria</span>
            <select
              className="modal-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.filter(c => c !== 'Todos').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="modal-field">
            <span className="modal-label">Cor</span>
            <input
              className="modal-input"
              placeholder="Ex: Cinza mescla"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <span className="modal-label">Marca</span>
            <input
              className="modal-input"
              placeholder="Ex: Adidas"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <span className="modal-label">
              Fit
              {aiSuggestion?.fit && <span className="modal-label-badge">MIA</span>}
            </span>
            <div className="modal-chips-row">
              {FIT_OPTIONS.map(f => (
                <button
                  key={f}
                  className={`modal-chip ${fit === f ? 'active' : ''} ${aiSuggestion?.fit === f && fit === f ? 'ai-filled' : ''}`}
                  onClick={() => setFit(fit === f ? '' : f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-field">
            <span className="modal-label">
              Estilo da Peça
              {aiSuggestion?.style_type && <span className="modal-label-badge">MIA</span>}
            </span>
            <div className="modal-chips-row">
              {STYLE_TYPE_OPTIONS.map(option => (
                <button
                  key={option}
                  className={`modal-chip ${styleType === option ? 'active' : ''} ${aiSuggestion?.style_type === option && styleType === option ? 'ai-filled' : ''}`}
                  onClick={() => setStyleType(prev => prev === option ? '' : option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-field">
            <span className="modal-label">
              Estação
              {aiSuggestion?.season && <span className="modal-label-badge">MIA</span>}
            </span>
            <div className="modal-chips-row">
              {SEASON_OPTIONS.map(s => (
                <button
                  key={s}
                  className={`modal-chip ${season === s ? 'active' : ''} ${aiSuggestion?.season === s && season === s ? 'ai-filled' : ''}`}
                  onClick={() => setSeason(season === s ? '' : s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            className="modal-btn"
            onClick={handleSave}
            disabled={saving || !name}
          >
            {saving ? 'Salvando...' : 'Salvar Peça'}
          </button>
        </div>
      </div>

      {/* Modal detalhe da peça */}
      <div
        className={`modal-overlay ${detailOpen ? 'open' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setDetailOpen(false)
            setSelectedPiece(null)
          }
        }}
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
                  <label style={{ cursor: 'pointer', display: 'block' }}>
                    <div className="upload-area" style={{ height: '120px' }}>
                      {uploadingPhoto ? 'Enviando...' : '+ Adicionar foto'}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAddPhoto}
                    />
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
                <label style={{ display: 'block', cursor: 'pointer', marginBottom: '10px' }}>
                  <div className="modal-btn" style={{
                    textAlign: 'center',
                    background: 'transparent',
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.5)'
                  }}>
                    {uploadingPhoto ? 'Enviando...' : 'Trocar foto'}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAddPhoto}
                  />
                </label>
              )}

              <button
                className="modal-btn"
                onClick={handleDelete}
                style={{
                  background: 'rgba(224,92,92,0.08)',
                  borderColor: 'rgba(224,92,92,0.3)',
                  color: 'rgba(224,92,92,0.8)'
                }}
              >
                Excluir Peça
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tour explicativo */}
      {tourOpen && (
        <div className="tour-overlay">
          <button className="tour-skip" onClick={handleTourFinish}>Pular</button>
          <div className="tour-spotlight" style={spotlightStyle} />
          <div className="tour-tooltip" style={tooltipStyle}>
            <div className="tour-tooltip-title">{TOUR_STEPS[tourStep].title}</div>
            <div className="tour-tooltip-text">{TOUR_STEPS[tourStep].text}</div>
            <div className="tour-tooltip-footer">
              <div className="tour-dots">
                {TOUR_STEPS.map((_, i) => (
                  <div key={i} className={`tour-dot ${i === tourStep ? 'active' : ''}`} />
                ))}
              </div>
              <button className="tour-next" onClick={handleTourNext}>
                {tourStep === 2 ? 'Concluir' : 'Próximo →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sugestões da wishlist */}
      <div
        className={`wishlist-modal-overlay ${wishlistModalOpen ? 'open' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setWishlistModalOpen(false)
            setSavedSuggestionIds([])
          }
        }}
      >
        <div className="wishlist-modal-sheet">
          <div className="wishlist-modal-handle" />
          <div className="wishlist-modal-header">
            <span className="wishlist-modal-title">Sugestões para o Closet</span>
            <button
              className="wishlist-modal-close"
              onClick={() => {
                setWishlistModalOpen(false)
                setSavedSuggestionIds([])
              }}
            >
              ✕
            </button>
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

      {/* Modal da wishlist salva */}
      <div
        className={`wishlist-modal-overlay ${wishlistSavedOpen ? 'open' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setWishlistSavedOpen(false)
        }}
      >
        <div className="wishlist-modal-sheet">
          <div className="wishlist-modal-handle" />
          <div className="wishlist-modal-header">
            <span className="wishlist-modal-title">Minha Wishlist</span>
            <button
              className="wishlist-modal-close"
              onClick={() => setWishlistSavedOpen(false)}
            >
              ✕
            </button>
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
                    <button
                      className="wishlist-action-buy"
                      onClick={() => handleWishlistPurchased(item)}
                    >
                      Já comprei
                    </button>
                    <button
                      className="wishlist-action-remove"
                      onClick={() => handleRemoveWishlistItem(item.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de onboarding */}
      <div className={`onboarding-overlay ${onboardingOpen ? 'open' : ''}`}>
        <div className="onboarding-sheet">
          <div className="onboarding-handle" />

          <div className="onboarding-dots">
            {[1, 2, 3].map(s => (
              <div key={s} className={`onboarding-dot ${obStep === s ? 'active' : ''}`} />
            ))}
          </div>

          {/* Step 1 — Dados pessoais */}
          {obStep === 1 && (
            <>
              <div className="onboarding-logo">
                <div className="onboarding-diamond" />
                <div className="onboarding-title">Bem-vindo</div>
                <div className="onboarding-sub">
                  Alguns dados para personalizar suas sugestões de outfit.
                </div>
              </div>

              {showNameField && (
                <div className="onboarding-field">
                  <span className="onboarding-label">Como quer ser chamado?</span>
                  <input
                    className="onboarding-input"
                    placeholder="Seu nome"
                    value={obName}
                    onChange={e => setObName(e.target.value)}
                  />
                </div>
              )}

              <div className="onboarding-row">
                <div className="onboarding-field">
                  <span className="onboarding-label">Altura (cm)</span>
                  <input
                    className="onboarding-input"
                    type="number"
                    inputMode="numeric"
                    placeholder="Ex: 178"
                    value={obHeight}
                    onChange={e => setObHeight(e.target.value)}
                  />
                </div>
                <div className="onboarding-field">
                  <span className="onboarding-label">Peso (kg)</span>
                  <input
                    className="onboarding-input"
                    type="number"
                    inputMode="decimal"
                    placeholder="Ex: 75"
                    value={obWeight}
                    onChange={e => setObWeight(e.target.value)}
                  />
                </div>
              </div>

              <button
                className="onboarding-btn"
                onClick={() => setObStep(2)}
                disabled={!step1Valid}
              >
                Próximo
              </button>
            </>
          )}

          {/* Step 2 — Estilos */}
          {obStep === 2 && (
            <>
              <div className="onboarding-logo">
                <div className="onboarding-diamond" />
                <div className="onboarding-title">Seu Estilo</div>
                <div className="onboarding-sub">
                  Escolha um ou mais estilos que descrevem você.
                </div>
              </div>

              <div className="style-chips">
                {STYLE_OPTIONS.map(style => (
                  <button
                    key={style}
                    className={`style-chip ${obSelectedStyles.includes(style) ? 'active' : ''}`}
                    onClick={() => toggleStyle(style)}
                  >
                    {style}
                  </button>
                ))}
              </div>

              <div className="onboarding-field">
                <span className="onboarding-label">Outro estilo (opcional)</span>
                <input
                  className="onboarding-input"
                  placeholder="Ex: Vintage, Gótico..."
                  value={obCustomStyle}
                  onChange={e => setObCustomStyle(e.target.value)}
                />
              </div>

              <button
                className="onboarding-btn"
                onClick={handleOnboardingSave}
                disabled={obSaving || !step2Valid}
              >
                {obSaving ? 'Salvando...' : 'Concluir'}
              </button>

              <button
                className="onboarding-btn"
                onClick={() => setObStep(1)}
                style={{
                  background: 'transparent',
                  borderColor: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.3)',
                  marginTop: '6px',
                }}
              >
                Voltar
              </button>
            </>
          )}

          {/* Step 3 — Confirmação */}
          {obStep === 3 && (
            <div className="onboarding-success">
              <div className="onboarding-success-icon">✦</div>
              <div className="onboarding-success-title">Tudo Certo!</div>
              <div className="onboarding-success-text">
                Seu perfil está configurado. Agora a IA pode sugerir outfits perfeitos para você.
              </div>
              <button
                className="onboarding-btn"
                onClick={() => setOnboardingOpen(false)}
              >
                Explorar Closet
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
