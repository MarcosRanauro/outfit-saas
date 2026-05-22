'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import '../../../closet.css'

const PIECE_CATEGORIES = [
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
  'Relógio',
  'Bolsa',
  'Chapéu / Boné',
]

const FIT_OPTIONS = ['Oversized', 'Regular', 'Slim', 'Cropped', 'A-line']
const SEASON_OPTIONS = ['Todas', 'Verão', 'Inverno', 'Meia estação']

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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [aiSuggestion, setAiSuggestion] = useState<Record<string, string> | null>(null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('Camiseta / Blusa')
  const [color, setColor] = useState('')
  const [brand, setBrand] = useState('')
  const [fit, setFit] = useState('')
  const [season, setSeason] = useState('')

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('mia_theme') as 'light' | 'dark' | null
    const t = saved || 'light'
    document.documentElement.setAttribute('data-theme', t)
  }, [])

  async function handlePhoto(file: File) {
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setAiSuggestion(null)

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
        if (s.brand) setBrand(s.brand)
        if (s.fit) setFit(s.fit)
        if (s.season) setSeason(s.season)
        setAiSuggestion(s)
      }
    } catch {
      // analysis is optional — user can fill manually
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSave() {
    if (!name || !category) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let photo_url = null
      if (photoFile) {
        const path = `${user.id}/${Date.now()}.jpg`
        const compressed = await compressForUpload(photoFile)
        const { error: uploadError } = await supabase.storage
          .from('pieces')
          .upload(path, compressed, { contentType: 'image/jpeg' })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('pieces').getPublicUrl(path)
          photo_url = urlData.publicUrl
        }
      }

      const { error } = await supabase.from('pieces').insert({
        user_id: user.id,
        code: `P${Date.now()}`,
        name,
        category,
        color: color || null,
        brand: brand || null,
        photo_url,
        fit: fit || null,
        style_type: null,
        season: season || null,
      })

      if (error) throw error
      router.push('/closet')
    } catch {
      alert('Erro ao salvar a peça. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const canSave = !!name && !!category && !saving && !analyzing

  return (
    <div className="nova-peca-page">

      {/* ─── HEADER ─── */}
      <div className="nova-peca-header">
        <button className="nova-peca-back" onClick={() => router.back()}>
          ← Voltar
        </button>
        <span className="nova-peca-title">Nova Peça</span>
        <button
          className="nova-peca-save-btn"
          onClick={handleSave}
          disabled={!canSave}
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>

      {/* ─── FOTO ─── */}
      <div className="nova-peca-photo-area">
        {photoPreview ? (
          <div className="nova-peca-photo-preview">
            <img src={photoPreview} alt="Preview" />
            {analyzing && (
              <div className="nova-peca-analyzing">
                <span className="analyze-spinner" style={{ display: 'inline-block', marginRight: '8px' }} />
                Mia está analisando...
              </div>
            )}
            <label className="nova-peca-change-photo" style={{ cursor: 'pointer' }}>
              Trocar foto
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(f) }}
              />
            </label>
          </div>
        ) : (
          <div className="nova-peca-photo-options">
            <label className="nova-peca-photo-btn" style={{ cursor: 'pointer' }}>
              <span className="nova-peca-photo-icon">📷</span>
              <span>Câmera</span>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(f) }}
              />
            </label>
            <div className="nova-peca-photo-divider" />
            <label className="nova-peca-photo-btn" style={{ cursor: 'pointer' }}>
              <span className="nova-peca-photo-icon">🖼️</span>
              <span>Galeria</span>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(f) }}
              />
            </label>
          </div>
        )}
      </div>

      {/* ─── FORMULÁRIO ─── */}
      <div className="nova-peca-form">

        {aiSuggestion && (
          <div className="mia-badge">
            <span className="mia-badge-icon">✦</span>
            <span className="mia-badge-text">Mia preencheu os campos automaticamente com base na foto.</span>
          </div>
        )}

        {/* Nome */}
        <div className="nova-peca-field">
          <label className="nova-peca-label">
            Nome
            {aiSuggestion?.name && <span className="nova-peca-mia-badge">MIA</span>}
          </label>
          <input
            className="nova-peca-input"
            type="text"
            placeholder="Ex: Camiseta branca básica"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Categoria */}
        <div className="nova-peca-field">
          <label className="nova-peca-label">
            Categoria
            {aiSuggestion?.category && <span className="nova-peca-mia-badge">MIA</span>}
          </label>
          <select
            className="nova-peca-input"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {PIECE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Cor + Marca */}
        <div className="nova-peca-row">
          <div className="nova-peca-field">
            <label className="nova-peca-label">
              Cor
              {aiSuggestion?.color && <span className="nova-peca-mia-badge">MIA</span>}
            </label>
            <input
              className="nova-peca-input"
              type="text"
              placeholder="Ex: Branco"
              value={color}
              onChange={e => setColor(e.target.value)}
            />
          </div>
          <div className="nova-peca-field">
            <label className="nova-peca-label">
              Marca
              {aiSuggestion?.brand && <span className="nova-peca-mia-badge">MIA</span>}
            </label>
            <input
              className="nova-peca-input"
              type="text"
              placeholder="Ex: Zara"
              value={brand}
              onChange={e => setBrand(e.target.value)}
            />
          </div>
        </div>

        {/* Fit */}
        <div className="nova-peca-field">
          <label className="nova-peca-label">
            Fit
            {aiSuggestion?.fit && <span className="nova-peca-mia-badge">MIA</span>}
          </label>
          <div className="modal-chips-row">
            {FIT_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                className={`modal-chip ${fit === opt ? 'active' : ''}`}
                onClick={() => setFit(prev => prev === opt ? '' : opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Estação */}
        <div className="nova-peca-field">
          <label className="nova-peca-label">
            Estação
            {aiSuggestion?.season && <span className="nova-peca-mia-badge">MIA</span>}
          </label>
          <div className="modal-chips-row">
            {SEASON_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                className={`modal-chip ${season === opt ? 'active' : ''}`}
                onClick={() => setSeason(prev => prev === opt ? '' : opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
