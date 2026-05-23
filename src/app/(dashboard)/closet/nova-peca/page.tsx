'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import './nova-peca.css'

const PIECE_CATEGORIES = [
  'Camiseta / Blusa', 'Camisa', 'Moletom', 'Calça', 'Short / Bermuda',
  'Saia', 'Vestido', 'Macacão', 'Tênis', 'Sapato / Oxford', 'Bota',
  'Sandália / Chinelo', 'Casaco / Jaqueta', 'Acessório', 'Relógio', 'Bolsa', 'Chapéu / Boné',
]

const FIT_OPTIONS = ['Oversized', 'Regular', 'Slim', 'Cropped', 'A-line']
const SEASON_OPTIONS = ['Todas', 'Verão', 'Inverno', 'Meia estação']
const STYLE_OPTIONS = ['Casual', 'Elegante', 'Esportivo', 'Streetwear', 'Boho', 'Clássico']

async function compressForUpload(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1200
      let { width, height } = img
      if (width > height && width > MAX) { height = Math.round((height * MAX) / width); width = MAX }
      else if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX }
      canvas.width = width; canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85)
    }
    img.src = url
  })
}

async function compressForAnalysis(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      const MAX = 800
      let { width, height } = img
      if (width > height && width > MAX) { height = Math.round((height * MAX) / width); width = MAX }
      else if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX }
      canvas.width = width; canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
      resolve({ base64, mimeType: 'image/jpeg' })
    }
    img.src = URL.createObjectURL(file)
  })
}

export default function NovaPecaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [moderating, setModerating] = useState(false)
  const [moderationError, setModerationError] = useState<string | null>(null)
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [aiSuggestion, setAiSuggestion] = useState<Record<string, string> | null>(null)

  const [studioImages, setStudioImages] = useState<string[]>([])
  const [studioLoading, setStudioLoading] = useState(false)
  const [studioModalOpen, setStudioModalOpen] = useState(false)
  const [selectedStudioIndex, setSelectedStudioIndex] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('Camiseta / Blusa')
  const [color, setColor] = useState('')
  const [colorSecondary, setColorSecondary] = useState('')
  const [brand, setBrand] = useState('')
  const [fit, setFit] = useState('')
  const [season, setSeason] = useState('')
  const [styleType, setStyleType] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('mia_theme') as 'light' | 'dark' | null
    document.documentElement.setAttribute('data-theme', saved || 'light')
  }, [])

  async function analyzeFile(file: File) {
    setAnalyzing(true)
    try {
      const { base64, mimeType } = await compressForAnalysis(file)
      const res = await fetch('/api/pieces/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })
      const data = await res.json()
      if (res.ok && data.suggestion) {
        const s = data.suggestion
        if (s.name) setName(s.name)
        if (s.category) setCategory(s.category)
        if (s.color) setColor(s.color)
        if (s.color_secondary) setColorSecondary(s.color_secondary)
        if (s.brand) setBrand(s.brand)
        if (s.fit) setFit(s.fit)
        if (s.season) setSeason(s.season)
        if (s.style_type) setStyleType(s.style_type)
        if (s.description) setDescription(s.description)
        setAiSuggestion(s)
      }
    } catch {
      // análise é opcional — usuário pode preencher manualmente
    } finally {
      setAnalyzing(false)
    }
  }

  async function handlePhotoFile(file: File) {
    setModerationError(null)
    const tempUrl = URL.createObjectURL(file)
    setPendingPreview(tempUrl)
    setModerating(true)

    let blocked = false
    try {
      const { base64 } = await compressForAnalysis(file)
      const res = await fetch('/api/pieces/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_base64: base64 }),
      })
      const data = await res.json()
      if (data.flagged) {
        blocked = true
        setModerationError('Esta imagem não é permitida. Por favor, envie uma foto de roupa ou acessório.')
      }
    } catch {
      // se moderação falhar, permite continuar
    } finally {
      setModerating(false)
      setPendingPreview(null)
      URL.revokeObjectURL(tempUrl)
    }

    if (blocked) return

    setPhotos([file])
    setSelectedPhotoIndex(0)
    setAiSuggestion(null)
    analyzeFile(file)
  }

  function handleAddPhoto(file: File) {
    setPhotos(prev => {
      if (prev.length >= 6) return prev
      return [...prev, file]
    })
  }

  async function handleGenerateStudio() {
    setStudioModalOpen(false)
    setStudioLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !photos[0]) return

      const ts = Date.now()
      const photo_urls: string[] = []
      for (let i = 0; i < photos.length; i++) {
        const filename = `studio-input/${user.id}/${ts}_${i}.jpg`
        await supabase.storage.from('pieces').upload(filename, photos[i], { upsert: true })
        const { data: urlData } = supabase.storage.from('pieces').getPublicUrl(filename)
        photo_urls.push(urlData.publicUrl)
      }

      const res = await fetch('/api/pieces/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, color, color_secondary: colorSecondary || null, brand: brand || null, description: description || null, photo_urls }),
      })
      const data = await res.json()
      if (res.ok && data.images?.length) {
        setStudioImages(data.images)
      }
    } catch {
      // geração é opcional
    } finally {
      setStudioLoading(false)
    }
  }

  async function handleSave() {
    if (!name || !category) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let photo_url = null

      if (selectedStudioIndex !== null && studioImages[selectedStudioIndex]) {
        // Studio image selected as cover — download and re-upload to Supabase Storage
        const studioUrl = studioImages[selectedStudioIndex]
        const blob = await fetch(studioUrl).then(r => r.blob())
        const path = `${user.id}/${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('pieces')
          .upload(path, blob, { contentType: 'image/jpeg' })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('pieces').getPublicUrl(path)
          photo_url = urlData.publicUrl
        }
      } else if (photos.length > 0) {
        const primaryFile = photos[selectedPhotoIndex] ?? photos[0]
        const primaryPath = `${user.id}/${Date.now()}.jpg`
        const primaryCompressed = await compressForUpload(primaryFile)
        const { error: uploadError } = await supabase.storage
          .from('pieces')
          .upload(primaryPath, primaryCompressed, { contentType: 'image/jpeg' })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('pieces').getPublicUrl(primaryPath)
          photo_url = urlData.publicUrl
        }
        for (let i = 0; i < photos.length; i++) {
          if (i === selectedPhotoIndex) continue
          const extraPath = `${user.id}/${Date.now()}-${i}.jpg`
          const extraCompressed = await compressForUpload(photos[i])
          await supabase.storage.from('pieces').upload(extraPath, extraCompressed, { contentType: 'image/jpeg' })
        }
      }

      const { error } = await supabase.from('pieces').insert({
        user_id: user.id,
        code: `P${Date.now()}`,
        name,
        category,
        color: color || null,
        color_secondary: colorSecondary || null,
        brand: brand || null,
        photo_url,
        fit: fit || null,
        style_type: styleType || null,
        season: season || null,
        description: description || null,
        notes: notes || null,
      })

      if (error) throw error
      router.push('/closet')
    } catch {
      alert('Erro ao salvar a peça. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const canSave = !!name && !!category && !saving && !analyzing && !moderating
  const mainPreview = selectedStudioIndex !== null
    ? studioImages[selectedStudioIndex]
    : photos.length > 0
      ? URL.createObjectURL(photos[selectedPhotoIndex] ?? photos[0])
      : pendingPreview

  return (
    <div className="np-page">

      {/* ─── HEADER ─── */}
      <div className="np-header">
        <button className="np-back" onClick={() => router.back()}>← Voltar</button>
        <span className="np-title">Nova Peça</span>
        <button className="np-save-header" onClick={handleSave} disabled={!canSave}>
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>

      <div className="np-container">

        {/* ─── FOTO ─── */}
        {!mainPreview ? (
          <div className="np-photo-empty">
            <span className="np-photo-empty-icon">🖼️</span>
            <p className="np-photo-empty-text">Toque para adicionar foto</p>
            {moderationError && (
              <p className="np-moderation-error">{moderationError}</p>
            )}
            <div className="np-photo-empty-btns">
              <label className="np-photo-btn">
                📷 Câmera
                <input
                  type="file" accept="image/*" capture="environment"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoFile(f) }}
                />
              </label>
              <label className="np-photo-btn">
                🖼️ Galeria
                <input
                  type="file" accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoFile(f) }}
                />
              </label>
            </div>
          </div>
        ) : (
          <>
            <div className="np-photo-preview">
              <img src={mainPreview} alt="Preview" />
              {(moderating || analyzing) && (
                <div className="np-analyzing-overlay">
                  <span className="np-spinner" />
                  {moderating ? 'Verificando imagem...' : 'Mia está analisando...'}
                </div>
              )}
              <label className="np-change-photo" style={{ cursor: 'pointer' }}>
                Trocar foto
                <input
                  type="file" accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoFile(f) }}
                />
              </label>
            </div>

            {!analyzing && (photos.length > 0 || studioImages.length > 0) && (
              <div className="np-gallery">
                {photos.map((photo, i) => (
                  <button
                    key={`photo-${i}`}
                    type="button"
                    className={`np-gallery-thumb ${selectedStudioIndex === null && selectedPhotoIndex === i ? 'active' : ''}`}
                    onClick={() => { setSelectedPhotoIndex(i); setSelectedStudioIndex(null) }}
                  >
                    <img src={URL.createObjectURL(photo)} alt={`Foto ${i + 1}`} />
                  </button>
                ))}
                {studioImages.map((url, i) => (
                  <button
                    key={`studio-${i}`}
                    type="button"
                    className={`np-gallery-thumb ${selectedStudioIndex === i ? 'active' : ''}`}
                    onClick={() => setSelectedStudioIndex(prev => prev === i ? null : i)}
                  >
                    <img src={url} alt={`Estúdio ${i + 1}`} />
                  </button>
                ))}
                {photos.length < 6 && (
                  <label className="np-gallery-add">
                    +
                    <input
                      type="file" accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleAddPhoto(f) }}
                    />
                  </label>
                )}
              </div>
            )}
          </>
        )}

        {/* ─── FOTO DE ESTÚDIO ─── */}
        {!analyzing && aiSuggestion && (
          <>
            <button
              className="np-studio-btn"
              onClick={() => setStudioModalOpen(true)}
              disabled={studioLoading}
            >
              <span>✦</span>
              {studioLoading ? 'Gerando fotos…' : 'Criar foto de estúdio'}
            </button>

            {studioImages.length > 0 && (
              <div className="np-studio-area">
                <p className="np-studio-label">Toque em uma foto para usar como capa</p>
                <div className="np-studio-grid">
                  {studioImages.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`np-studio-thumb ${selectedStudioIndex === i ? 'active' : ''}`}
                      onClick={() => setSelectedStudioIndex(prev => prev === i ? null : i)}
                    >
                      <img src={url} alt={`Estúdio ${i + 1}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── FORMULÁRIO ─── */}
        <div className="np-form">

          {aiSuggestion && (
            <div className="np-mia-badge">
              <span>✦</span>
              <span>Mia preencheu os campos automaticamente com base na foto.</span>
            </div>
          )}

          {/* Nome */}
          <div className="np-field">
            <label className="np-label">
              Nome {aiSuggestion?.name && <span className="np-mia-tag">MIA</span>}
            </label>
            <input
              className="np-input" type="text" placeholder="Ex: Camiseta branca básica"
              value={name} onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Categoria */}
          <div className="np-field">
            <label className="np-label">
              Categoria {aiSuggestion?.category && <span className="np-mia-tag">MIA</span>}
            </label>
            <select className="np-input" value={category} onChange={e => setCategory(e.target.value)}>
              {PIECE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Cor + Cor Secundária */}
          <div className="np-row">
            <div className="np-field">
              <label className="np-label">
                Cor {aiSuggestion?.color && <span className="np-mia-tag">MIA</span>}
              </label>
              <input
                className="np-input" type="text" placeholder="Ex: Branco"
                value={color} onChange={e => setColor(e.target.value)}
              />
            </div>
            <div className="np-field">
              <label className="np-label">
                Cor Secundária {aiSuggestion?.color_secondary && <span className="np-mia-tag">MIA</span>}
              </label>
              <input
                className="np-input" type="text" placeholder="Ex: Azul"
                value={colorSecondary} onChange={e => setColorSecondary(e.target.value)}
              />
            </div>
          </div>

          {/* Marca */}
          <div className="np-field">
            <label className="np-label">
              Marca {aiSuggestion?.brand && <span className="np-mia-tag">MIA</span>}
            </label>
            <input
              className="np-input" type="text" placeholder="Ex: Zara"
              value={brand} onChange={e => setBrand(e.target.value)}
            />
          </div>

          {/* Fit */}
          <div className="np-field">
            <label className="np-label">
              Fit {aiSuggestion?.fit && <span className="np-mia-tag">MIA</span>}
            </label>
            <div className="np-chips">
              {FIT_OPTIONS.map(opt => (
                <button
                  key={opt} type="button"
                  className={`np-chip ${fit === opt ? 'active' : ''}`}
                  onClick={() => setFit(prev => prev === opt ? '' : opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Estação */}
          <div className="np-field">
            <label className="np-label">
              Estação {aiSuggestion?.season && <span className="np-mia-tag">MIA</span>}
            </label>
            <div className="np-chips">
              {SEASON_OPTIONS.map(opt => (
                <button
                  key={opt} type="button"
                  className={`np-chip ${season === opt ? 'active' : ''}`}
                  onClick={() => setSeason(prev => prev === opt ? '' : opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Estilo da Peça */}
          <div className="np-field">
            <label className="np-label">
              Estilo da Peça {aiSuggestion?.style_type && <span className="np-mia-tag">MIA</span>}
            </label>
            <div className="np-chips">
              {STYLE_OPTIONS.map(opt => (
                <button
                  key={opt} type="button"
                  className={`np-chip ${styleType === opt ? 'active' : ''}`}
                  onClick={() => setStyleType(prev => prev === opt ? '' : opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div className="np-field">
            <label className="np-label">
              Descrição {aiSuggestion?.description && <span className="np-mia-tag">MIA</span>}
            </label>
            <textarea
              className="np-textarea" rows={3}
              placeholder="Ex: Camiseta oversized branca com textura lisa e caimento relaxado."
              value={description} onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Notas */}
          <div className="np-field">
            <label className="np-label">Notas</label>
            <textarea
              className="np-textarea" rows={2}
              placeholder="Anotações pessoais sobre a peça..."
              value={notes} onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Salvar */}
          <button className="np-save-full" onClick={handleSave} disabled={!canSave}>
            {saving ? 'Salvando…' : 'Salvar Peça'}
          </button>

        </div>
      </div>

      {/* ─── MODAL DE CONFIRMAÇÃO ─── */}
      {studioModalOpen && (
        <div className="np-modal-backdrop" onClick={() => setStudioModalOpen(false)}>
          <div className="np-modal" onClick={e => e.stopPropagation()}>
            <p className="np-modal-title">Foto de estúdio com IA</p>
            <p className="np-modal-text">
              A Mia vai gerar fotos profissionais da sua peça com fundo branco.
            </p>
            <p className="np-modal-tip">
              💡 Dica: para melhores resultados, apoie a peça em uma superfície lisa e tire fotos de frente, lateral e costas.
            </p>
            <div className="np-modal-actions">
              <button className="np-modal-cancel" onClick={() => setStudioModalOpen(false)}>
                Cancelar
              </button>
              <button className="np-modal-confirm" onClick={handleGenerateStudio}>
                Gerar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DE LOADING ─── */}
      {studioLoading && (
        <div className="np-loading-backdrop">
          <div className="np-loading-modal">
            <span className="np-loading-spinner" />
            <p className="np-loading-title">Criando fotos de estúdio...</p>
            <p className="np-loading-sub">
              A Mia está processando suas fotos. Isso pode levar alguns segundos.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
