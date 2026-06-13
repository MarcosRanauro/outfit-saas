'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toBase64, moderateImage, MODERATION_CONTENT_MESSAGE } from '@/lib/image'
import TrialExpiredModal from '@/components/ui/TrialExpiredModal'
import StudioScannerOverlay from '@/components/studio/StudioScannerOverlay'
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
  const [photo, setPhoto] = useState<File | null>(null)
  const [aiSuggestion, setAiSuggestion] = useState<Record<string, string> | null>(null)

  const [studioImages, setStudioImages] = useState<string[]>([])
  const [studioLoading, setStudioLoading] = useState(false)
  const [ghostLoading, setGhostLoading] = useState(false)
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
  const [showTrialExpired, setShowTrialExpired] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('mia_theme') as 'light' | 'dark' | null
    document.documentElement.setAttribute('data-theme', saved || 'light')
  }, [])

  function handleApiError(response: Response, data: Record<string, unknown>): boolean {
    if (response.ok) return false

    if (data.code === 'TRIAL_EXPIRED') {
      setShowTrialExpired(true)
      return true
    }

    if (data.code === 'RATE_LIMITED') {
      alert('Limite do plano atingido. Faça upgrade para continuar.')
      return true
    }

    return false
  }

  async function analyzeFile(file: File) {
    setAnalyzing(true)
    try {
      const { base64, mimeType } = await compressForAnalysis(file)
      const res = await fetch('/api/pieces/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })
      const data = await res.json().catch(() => ({}))
      if (handleApiError(res, data)) return

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
      const base64 = await toBase64(file)
      const moderation = await moderateImage(base64)
      if (!moderation.approved) {
        blocked = true
        setModerationError(moderation.message ?? MODERATION_CONTENT_MESSAGE)
      }
    } finally {
      setModerating(false)
      setPendingPreview(null)
      URL.revokeObjectURL(tempUrl)
    }

    if (blocked) return

    setPhoto(file)
    setAiSuggestion(null)
    analyzeFile(file)
  }

  async function handleGenerateStudio() {
    setStudioModalOpen(false)
    setStudioLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !photo) return

      const filename = `studio-input/${user.id}/${Date.now()}.jpg`
      await supabase.storage.from('pieces').upload(filename, photo, { upsert: true })
      const { data: urlData } = supabase.storage.from('pieces').getPublicUrl(filename)
      const photo_urls = [urlData.publicUrl]

      const res = await fetch('/api/pieces/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, color, color_secondary: colorSecondary || null, brand: brand || null, description: description || null, photo_urls }),
      })
      const data = await res.json().catch(() => ({}))
      if (handleApiError(res, data)) return

      if (res.ok && data.images?.length) {
        setStudioImages(data.images)
      }
    } catch (error) {
      console.error('Erro ao gerar foto de estúdio:', error)
      alert('Erro ao gerar foto de estúdio. Tente novamente.')
    } finally {
      setStudioLoading(false)
    }
  }

  async function handleGenerateGhostMannequin() {
    if (!photo) return

    setGhostLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const compressed = await compressForUpload(photo)
      const tempPath = `studio-input/${user.id}/temp_${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('pieces')
        .upload(tempPath, compressed, { contentType: 'image/jpeg', upsert: true })
      if (uploadError) return

      const { data: urlData } = supabase.storage.from('pieces').getPublicUrl(tempPath)

      const res = await fetch('/api/pieces/ghost-mannequin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: urlData.publicUrl }),
      })
      const data = await res.json().catch(() => ({}))
      if (handleApiError(res, data)) return

      if (res.ok && data.studio_urls?.length > 0) {
        setStudioImages(prev => {
          setSelectedStudioIndex(prev.length)
          return [...prev, ...data.studio_urls]
        })
      }
    } catch (error) {
      console.error('Ghost mannequin error:', error)
      alert('Erro ao gerar manequim fantasma. Tente novamente.')
    } finally {
      setGhostLoading(false)
    }
  }

  async function handleSave() {
    if (!name || !category) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const uploadedUrls: { url: string; isStudio: boolean; isCover: boolean }[] = []
      const ts = Date.now()

      if (photo) {
        const compressed = await compressForUpload(photo)
        const path = `${user.id}/${ts}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('pieces')
          .upload(path, compressed, { contentType: 'image/jpeg' })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('pieces').getPublicUrl(path)
          uploadedUrls.push({
            url: urlData.publicUrl,
            isStudio: false,
            isCover: selectedStudioIndex === null,
          })
        }
      }

      for (let i = 0; i < studioImages.length; i++) {
        uploadedUrls.push({
          url: studioImages[i],
          isStudio: true,
          isCover: selectedStudioIndex === i,
        })
      }

      if (uploadedUrls.length > 0 && !uploadedUrls.some(p => p.isCover)) {
        uploadedUrls[0].isCover = true
      }

      const coverPhoto = uploadedUrls.find(p => p.isCover) ?? uploadedUrls[0]

      const { data: piece, error: pieceError } = await supabase
        .from('pieces')
        .insert({
          user_id: user.id,
          code: `P${Date.now()}`,
          name,
          category,
          color: color || null,
          color_secondary: colorSecondary || null,
          brand: brand || null,
          photo_url: coverPhoto?.url ?? null,
          fit: fit || null,
          style_type: styleType || null,
          season: season || null,
          description: description || null,
          notes: notes || null,
        })
        .select()
        .single()

      if (pieceError || !piece) throw pieceError

      if (uploadedUrls.length > 0) {
        const photoRows = uploadedUrls.map((p, i) => ({
          piece_id: piece.id,
          user_id: user.id,
          url: p.url,
          is_cover: p.isCover,
          is_studio: p.isStudio,
          sort_order: i,
        }))

        const { error: photosError } = await supabase.from('piece_photos').insert(photoRows)
        if (photosError) throw photosError
      }

      router.push('/closet')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar a peça. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const canSave = !!name && !!category && !saving && !analyzing && !moderating && !studioLoading && !ghostLoading
  const mainPreview = selectedStudioIndex !== null
    ? studioImages[selectedStudioIndex]
    : photo
      ? URL.createObjectURL(photo)
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
          </>
        )}

        {/* ─── FOTO DE ESTÚDIO ─── */}
        {!analyzing && photo && (
          <>
            {aiSuggestion && (
              <button
                className="np-studio-btn"
                onClick={() => setStudioModalOpen(true)}
                disabled={studioLoading || ghostLoading}
              >
                <span>✦</span>
                {studioLoading ? 'Processando…' : 'Foto com modelo (IA)'}
              </button>
            )}

            <button
              className="np-studio-btn np-studio-btn--ghost"
              onClick={handleGenerateGhostMannequin}
              disabled={ghostLoading || studioLoading}
            >
              {ghostLoading ? 'Processando…' : '👻 Manequim fantasma'}
            </button>
            <p className="np-studio-hint">
              💡 Use uma foto nítida da frente da peça para melhores resultados.
            </p>

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

      <StudioScannerOverlay
        open={studioLoading || ghostLoading}
        photoSrc={photo ? URL.createObjectURL(photo) : null}
        title={ghostLoading ? 'Criando manequim fantasma...' : 'Criando foto de estúdio...'}
        subtitle={
          ghostLoading
            ? 'A Mia está processando sua peça. Isso pode levar alguns segundos.'
            : 'A Mia está analisando sua peça. Isso pode levar alguns segundos.'
        }
      />

      <TrialExpiredModal
        isOpen={showTrialExpired}
        onClose={() => setShowTrialExpired(false)}
      />
    </div>
  )
}
