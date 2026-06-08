'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toBase64, moderateImage } from '@/lib/image'
import { sortPiecePhotos, type DisplayPhoto } from '@/lib/piece-photos'
import type { Piece } from '@/types/app'
import StudioScannerOverlay from '@/components/studio/StudioScannerOverlay'
import TrialExpiredModal from '@/components/ui/TrialExpiredModal'
import '../nova-peca/nova-peca.css'
import './piece-detail.css'

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

function applyPieceToForm(piece: Piece) {
  return {
    name: piece.name,
    category: piece.category,
    color: piece.color ?? '',
    colorSecondary: piece.color_secondary ?? '',
    brand: piece.brand ?? '',
    fit: piece.fit ?? '',
    season: piece.season ?? '',
    styleType: piece.style_type ?? '',
    description: piece.description ?? '',
    notes: piece.notes ?? '',
  }
}

export default function PieceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const pieceId = params.id as string
  const supabase = createClient()

  const [piece, setPiece] = useState<Piece | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  const [studioLoading, setStudioLoading] = useState(false)
  const [ghostLoading, setGhostLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showTrialExpired, setShowTrialExpired] = useState(false)

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

  const photos = useMemo(() => (piece ? sortPiecePhotos(piece) : []), [piece])
  const mainPhoto = photos[activePhotoIndex]
  const mainPhotoUrl = mainPhoto?.url ?? piece?.photo_url ?? null

  const loadPiece = useCallback(async () => {
    const { data, error } = await supabase
      .from('pieces')
      .select(`
        *,
        piece_photos (
          id,
          url,
          is_cover,
          is_studio,
          sort_order
        )
      `)
      .eq('id', pieceId)
      .single()

    if (error || !data) {
      router.push('/closet')
      return
    }

    setPiece(data)
    const form = applyPieceToForm(data)
    setName(form.name)
    setCategory(form.category)
    setColor(form.color)
    setColorSecondary(form.colorSecondary)
    setBrand(form.brand)
    setFit(form.fit)
    setSeason(form.season)
    setStyleType(form.styleType)
    setDescription(form.description)
    setNotes(form.notes)
    setLoading(false)
  }, [pieceId, router, supabase])

  useEffect(() => {
    loadPiece()
  }, [loadPiece])

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

  async function insertStudioPhotos(urls: string[]) {
    if (!piece || urls.length === 0) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let baseCount = piece.piece_photos?.length ?? 0

    // Peça legada: só photo_url, sem linhas em piece_photos — preservar original antes de inserir estúdio
    if (baseCount === 0 && piece.photo_url) {
      const { error: migrateError } = await supabase.from('piece_photos').insert({
        piece_id: piece.id,
        user_id: user.id,
        url: piece.photo_url,
        is_cover: true,
        is_studio: false,
        sort_order: 0,
      })
      if (migrateError) throw migrateError
      baseCount = 1
    }

    const rows = urls.map((url, i) => ({
      piece_id: piece.id,
      user_id: user.id,
      url,
      is_cover: false,
      is_studio: true,
      sort_order: baseCount + i,
    }))

    const { error: insertError } = await supabase.from('piece_photos').insert(rows)
    if (insertError) throw insertError

    await loadPiece()
    setActivePhotoIndex(baseCount)
  }

  async function handleGenerateStudio() {
    if (!piece || !mainPhotoUrl) return

    setStudioLoading(true)
    try {
      const res = await fetch('/api/pieces/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          color,
          color_secondary: colorSecondary || null,
          brand: brand || null,
          description: description || null,
          photo_urls: [mainPhotoUrl],
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (handleApiError(res, data)) return

      if (res.ok && data.images?.length) {
        await insertStudioPhotos(data.images)
      }
    } catch (error) {
      console.error('Erro ao gerar foto de estúdio:', error)
      alert('Erro ao gerar foto de estúdio. Tente novamente.')
    } finally {
      setStudioLoading(false)
    }
  }

  async function handleGenerateGhostMannequin() {
    if (!piece || !mainPhotoUrl) return

    setGhostLoading(true)
    try {
      const res = await fetch('/api/pieces/ghost-mannequin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: mainPhotoUrl }),
      })
      const data = await res.json().catch(() => ({}))
      if (handleApiError(res, data)) return

      if (res.ok && data.studio_urls?.length) {
        await insertStudioPhotos(data.studio_urls)
      }
    } catch (error) {
      console.error('Ghost mannequin error:', error)
      alert('Erro ao gerar manequim fantasma. Tente novamente.')
    } finally {
      setGhostLoading(false)
    }
  }

  async function handleSetCover(photo: DisplayPhoto, index: number) {
    if (!piece) return

    setActivePhotoIndex(index)

    if (photo.id === 'cover') return

    try {
      await supabase.from('piece_photos').update({ is_cover: false }).eq('piece_id', piece.id)
      await supabase.from('piece_photos').update({ is_cover: true }).eq('id', photo.id)
      await supabase.from('pieces').update({ photo_url: photo.url }).eq('id', piece.id)
      await loadPiece()
      setActivePhotoIndex(0)
    } catch (error) {
      console.error('Erro ao definir capa:', error)
      alert('Erro ao definir foto de capa. Tente novamente.')
    }
  }

  async function handleAddPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !piece) return

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

      const compressed = await compressForUpload(file)
      const path = `${user.id}/${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('pieces')
        .upload(path, compressed, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('pieces').getPublicUrl(path)
      let baseCount = piece.piece_photos?.length ?? 0
      if (baseCount === 0 && piece.photo_url) {
        const { error: migrateError } = await supabase.from('piece_photos').insert({
          piece_id: piece.id,
          user_id: user.id,
          url: piece.photo_url,
          is_cover: true,
          is_studio: false,
          sort_order: 0,
        })
        if (migrateError) throw migrateError
        baseCount = 1
      }

      const { error: insertError } = await supabase.from('piece_photos').insert({
        piece_id: piece.id,
        user_id: user.id,
        url: urlData.publicUrl,
        is_cover: false,
        is_studio: false,
        sort_order: baseCount,
      })
      if (insertError) throw insertError

      await loadPiece()
      setActivePhotoIndex(baseCount)
    } catch (error) {
      console.error('Erro ao adicionar foto:', error)
      alert('Erro ao adicionar foto. Tente novamente.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSave() {
    if (!piece || !name || !category) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('pieces')
        .update({
          name,
          category,
          color: color || null,
          color_secondary: colorSecondary || null,
          brand: brand || null,
          fit: fit || null,
          season: season || null,
          style_type: styleType || null,
          description: description || null,
          notes: notes || null,
        })
        .eq('id', piece.id)

      if (error) throw error
      await loadPiece()
      setEditing(false)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar a peça. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (!piece) return
    const form = applyPieceToForm(piece)
    setName(form.name)
    setCategory(form.category)
    setColor(form.color)
    setColorSecondary(form.colorSecondary)
    setBrand(form.brand)
    setFit(form.fit)
    setSeason(form.season)
    setStyleType(form.styleType)
    setDescription(form.description)
    setNotes(form.notes)
    setEditing(false)
  }

  async function handleDelete() {
    if (!piece) return
    if (!confirm('Excluir esta peça? Esta ação não pode ser desfeita.')) return

    try {
      const { error } = await supabase.from('pieces').delete().eq('id', piece.id)
      if (error) throw error

      try {
        const savedAnchor = sessionStorage.getItem('anchor_piece')
        if (savedAnchor) {
          const anchor = JSON.parse(savedAnchor)
          if (anchor.id === piece.id) sessionStorage.removeItem('anchor_piece')
        }
      } catch {}

      router.push('/closet')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir a peça. Tente novamente.')
    }
  }

  if (loading || !piece) {
    return (
      <div className="pd-page">
        <p className="pd-loading">Carregando peça...</p>
      </div>
    )
  }

  return (
    <div className="pd-page">
      <div className="pd-header">
        <button className="pd-back" onClick={() => router.back()}>← Voltar</button>
        <span className="pd-header-title">Detalhe da Peça</span>
        <div className="pd-header-actions">
          {editing ? (
            <>
              <button className="pd-btn-cancel" onClick={handleCancel} disabled={saving}>Cancelar</button>
              <button className="pd-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          ) : (
            <button className="pd-btn-edit" onClick={() => setEditing(true)}>Editar</button>
          )}
        </div>
      </div>

      <div className="pd-container">
        {mainPhotoUrl && (
          <div className="pd-photo-main">
            <img src={mainPhoto?.url ?? mainPhotoUrl} alt={piece.name} />
          </div>
        )}

        <div className="pd-thumbs">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              className={`pd-thumb ${i === activePhotoIndex ? 'active' : ''} ${photo.is_studio ? 'is-studio' : ''}`}
              onClick={() => handleSetCover(photo, i)}
            >
              <img src={photo.url} alt="" />
              {photo.is_cover && (
                <span className="pd-thumb-cover-badge">Capa</span>
              )}
            </button>
          ))}
          <label className={`pd-thumb-add ${uploadingPhoto ? 'is-loading' : ''}`}>
            {uploadingPhoto ? '…' : '+'}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              disabled={uploadingPhoto}
              onChange={handleAddPhoto}
            />
          </label>
        </div>

        <button
          className="np-studio-btn"
          onClick={handleGenerateStudio}
          disabled={studioLoading || ghostLoading || !mainPhotoUrl}
        >
          <span>✦</span>
          {studioLoading ? 'Processando…' : 'Foto com modelo (IA)'}
        </button>

        <button
          className="np-studio-btn np-studio-btn--ghost"
          onClick={handleGenerateGhostMannequin}
          disabled={ghostLoading || studioLoading || !mainPhotoUrl}
        >
          {ghostLoading ? 'Processando…' : '👻 Manequim fantasma'}
        </button>
        <p className="np-studio-hint">
          💡 Use uma foto nítida da frente da peça para melhores resultados.
        </p>

        <div className="pd-form">
          <div className="pd-field">
            <span className="pd-field-label">Nome</span>
            {editing
              ? <input className="pd-input" value={name} onChange={e => setName(e.target.value)} />
              : <span className="pd-field-value">{piece.name}</span>
            }
          </div>

          <div className="pd-field">
            <span className="pd-field-label">Categoria</span>
            {editing
              ? (
                <select className="pd-select" value={category} onChange={e => setCategory(e.target.value)}>
                  {PIECE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )
              : <span className="pd-field-value">{piece.category}</span>
            }
          </div>

          <div className="pd-row">
            <div className="pd-field">
              <span className="pd-field-label">Cor</span>
              {editing
                ? <input className="pd-input" value={color} onChange={e => setColor(e.target.value)} />
                : <span className="pd-field-value">{piece.color || '—'}</span>
              }
            </div>
            <div className="pd-field">
              <span className="pd-field-label">Cor Secundária</span>
              {editing
                ? <input className="pd-input" value={colorSecondary} onChange={e => setColorSecondary(e.target.value)} />
                : <span className="pd-field-value">{piece.color_secondary || '—'}</span>
              }
            </div>
          </div>

          <div className="pd-field">
            <span className="pd-field-label">Marca</span>
            {editing
              ? <input className="pd-input" value={brand} onChange={e => setBrand(e.target.value)} />
              : <span className="pd-field-value">{piece.brand || '—'}</span>
            }
          </div>

          <div className="pd-field">
            <span className="pd-field-label">Fit</span>
            {editing ? (
              <div className="pd-chips-edit">
                {FIT_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`pd-chip ${fit === opt ? 'active' : ''}`}
                    onClick={() => setFit(prev => prev === opt ? '' : opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="pd-chips-view">
                {fit ? <span className="pd-chip-static">{fit}</span> : <span className="pd-field-value">—</span>}
              </div>
            )}
          </div>

          <div className="pd-field">
            <span className="pd-field-label">Estação</span>
            {editing ? (
              <div className="pd-chips-edit">
                {SEASON_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`pd-chip ${season === opt ? 'active' : ''}`}
                    onClick={() => setSeason(prev => prev === opt ? '' : opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="pd-chips-view">
                {season ? <span className="pd-chip-static">{season}</span> : <span className="pd-field-value">—</span>}
              </div>
            )}
          </div>

          <div className="pd-field">
            <span className="pd-field-label">Estilo da Peça</span>
            {editing ? (
              <div className="pd-chips-edit">
                {STYLE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`pd-chip ${styleType === opt ? 'active' : ''}`}
                    onClick={() => setStyleType(prev => prev === opt ? '' : opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="pd-chips-view">
                {styleType ? <span className="pd-chip-static">{styleType}</span> : <span className="pd-field-value">—</span>}
              </div>
            )}
          </div>

          <div className="pd-field">
            <span className="pd-field-label">Descrição</span>
            {editing
              ? <textarea className="pd-textarea" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
              : <span className="pd-field-value">{piece.description || '—'}</span>
            }
          </div>

          <div className="pd-field">
            <span className="pd-field-label">Notas</span>
            {editing
              ? <textarea className="pd-textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
              : <span className="pd-field-value">{piece.notes || '—'}</span>
            }
          </div>
        </div>

        <button className="pd-delete" onClick={handleDelete}>
          Excluir peça
        </button>
      </div>

      <StudioScannerOverlay
        open={studioLoading || ghostLoading}
        photoSrc={mainPhotoUrl}
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
