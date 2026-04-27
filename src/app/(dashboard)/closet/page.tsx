'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Piece } from '@/types/database'
import '../../closet.css'
import '../../perfil.css'

const CATEGORIES = ['Todos', 'Blusa', 'Calça', 'Short', 'Tênis', 'Acessório']
const STYLE_OPTIONS = ['Streetwear', 'Sportwear', 'Casual', 'Social', 'Minimalista']

export default function ClosetPage() {
  const supabase = createClient()

  const [pieces, setPieces] = useState<Piece[]>([])
  const [filtered, setFiltered] = useState<Piece[]>([])
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('Blusa')
  const [color, setColor] = useState('')
  const [brand, setBrand] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

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

  useEffect(() => {
    loadData()
  }, [])

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

    const [piecesResult, profileResult] = await Promise.all([
      supabase.from('pieces').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('name, height, weight, style').eq('id', user.id).single(),
    ])

    if (piecesResult.data) {
      setPieces(piecesResult.data)
      setFiltered(piecesResult.data)
    }

    if (profileResult.data) {
      const p = profileResult.data
      const incomplete = !p.height || !p.weight || !p.style
      if (incomplete) {
        setShowNameField(!p.name)
        setOnboardingOpen(true)
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

  function resetModal() {
    setName('')
    setCategory('Blusa')
    setColor('')
    setBrand('')
    setPhoto(null)
    setPhotoPreview(null)
    setModalOpen(false)
  }

  async function handleSave() {
    if (!name || !category) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let photo_url = null

    if (photo) {
      const ext = photo.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('pieces')
        .upload(path, photo)

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
      })
      .select()
      .single()

    if (data) {
      setPieces(prev => [data, ...prev])
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

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('pieces')
      .upload(path, file)

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

  const categories = [...new Set(pieces.map(p => p.category))]

  return (
    <>
      <div className="closet-header">
        <h1 className="closet-title">
          Meu <span>Closet</span>
        </h1>
        <button
          className="closet-add-btn"
          onClick={() => setModalOpen(true)}
        >
          +
        </button>
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
          <div className="stat-num">0</div>
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
