'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import './outfit-rack.css'

export type LookbookOutfit = {
  id: string
  name: string
  subtitle?: string | null
  style_tags?: string[] | null
  occasion_tags?: string[] | null
  period?: string | null
  occasion?: string | null
  why?: string | null
  pieces: string[]
  created_at: string
}

export type LookbookPiece = {
  id: string
  name: string
  category: string
  season?: string | null
  photo_url?: string | null
  color?: string | null
  brand?: string | null
}

interface OutfitRackProps {
  outfits: LookbookOutfit[]
  pieces: Record<string, LookbookPiece>
  onDelete?: (id: string) => void
  onNavigate?: (id: string) => void
}

function formatPeriod(period?: string | null): string {
  return period === 'noite' ? 'Noite' : 'Dia'
}

// Mapeamento de cores para hex editorial
function getColorHex(colorName?: string | null): string {
  if (!colorName) return '#C4A882'
  const c = colorName.toLowerCase()
  if (c.includes('preto') || c.includes('black')) return '#1A1A1A'
  if (c.includes('branco') || c.includes('white') || c.includes('off-white') || c.includes('cru')) return '#FAF8F5'
  if (c.includes('bege') || c.includes('areia') || c.includes('nude') || c.includes('cáqui') || c.includes('caqui')) return '#E8DFD3'
  if (c.includes('terracota') || c.includes('marrom') || c.includes('caramelo') || c.includes('pinhão')) return '#C17F5A'
  if (c.includes('azul') || c.includes('navy') || c.includes('jeans')) return '#4A6984'
  if (c.includes('verde') || c.includes('oliva') || c.includes('militar')) return '#5C6B57'
  if (c.includes('cinza') || c.includes('grafite')) return '#7A7A7A'
  if (c.includes('rosa') || c.includes('rose') || c.includes('pink')) return '#DDA7A5'
  if (c.includes('vermelho') || c.includes('vinho') || c.includes('bordô')) return '#8B263E'
  if (c.includes('amarelo') || c.includes('mostarda') || c.includes('dourado')) return '#D4AF37'
  return '#C4A882'
}

// Determina o tipo SVG vetorial
function getPieceSvgType(piece: LookbookPiece): string {
  const cat = (piece.category || '').toLowerCase()
  const name = (piece.name || '').toLowerCase()
  const text = `${cat} ${name}`

  if (text.includes('bolsa') || text.includes('mochila') || text.includes('tote')) return 'bag'
  if (text.includes('óculos') || text.includes('oculos') || text.includes('relógio') || text.includes('chapéu') || text.includes('boné')) return 'sunglasses'
  if (text.includes('tênis') || text.includes('tenis') || text.includes('sneaker')) return 'sneaker'
  if (text.includes('sandália') || text.includes('sandalia') || text.includes('salto') || text.includes('slingback')) return 'slingback'
  if (text.includes('bota') || text.includes('sapato') || text.includes('oxford') || text.includes('mocassim') || text.includes('loafer')) return 'loafer'
  if (text.includes('saia')) return 'skirt'
  if (text.includes('calça') || text.includes('calca') || text.includes('short') || text.includes('bermuda') || text.includes('jeans')) return 'pants'
  if (text.includes('trench') || text.includes('sobretudo')) return 'trench'
  if (text.includes('blazer') || text.includes('terno')) return 'blazer'
  if (text.includes('jaqueta') || text.includes('couro') || text.includes('biker')) return 'leather_jacket'
  if (text.includes('suéter') || text.includes('sueter') || text.includes('moletom') || text.includes('tricô')) return 'sweater'
  if (text.includes('regata') || text.includes('top') || text.includes('colete')) return 'tank'
  if (text.includes('camisa') || text.includes('camiseta') || text.includes('blusa')) return 'shirt'

  return 'default'
}

// Vetores SVG idênticos ao prototipo.html
function renderGarmentSvg(type: string, colorHex: string, accentHex: string) {
  switch (type) {
    case 'trench':
      return (
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M28 20L50 14L72 20L84 40L74 44L68 30V95H32V30L26 44L16 40L28 20Z" fill={colorHex} stroke={accentHex} strokeWidth="1.8" />
          <path d="M42 20L50 34L58 20" stroke={accentHex} strokeWidth="1.5" />
          <path d="M32 55H68" stroke={accentHex} strokeWidth="2" />
          <circle cx="50" cy="55" r="3" fill={accentHex} />
          <path d="M50 34V95" stroke={accentHex} strokeWidth="1.2" strokeDasharray="3 2" />
        </svg>
      )
    case 'blazer':
      return (
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M30 18L50 24L70 18L84 38L75 42L68 30V90H32V30L25 42L16 38L30 18Z" fill={colorHex} stroke={accentHex} strokeWidth="1.8" />
          <path d="M38 18L50 44L62 18" fill="none" stroke={accentHex} strokeWidth="1.6" />
          <path d="M36 68H44M56 68H64" stroke={accentHex} strokeWidth="1.5" />
          <circle cx="50" cy="52" r="2" fill={accentHex} />
        </svg>
      )
    case 'shirt':
      return (
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 20L50 25L68 20L80 34L72 38L66 28V86H34V28L28 38L20 34L32 20Z" fill={colorHex} stroke={accentHex} strokeWidth="1.8" />
          <path d="M42 20L50 28L58 20" stroke={accentHex} strokeWidth="1.5" />
          <path d="M50 28V86" stroke={accentHex} strokeWidth="1.2" />
          <circle cx="50" cy="38" r="1.5" fill={accentHex} />
          <circle cx="50" cy="50" r="1.5" fill={accentHex} />
          <circle cx="50" cy="62" r="1.5" fill={accentHex} />
        </svg>
      )
    case 'leather_jacket':
      return (
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M28 20L50 26L72 20L85 36L77 40L70 30V82H30V30L23 40L15 36L28 20Z" fill={colorHex} stroke={accentHex} strokeWidth="2" />
          <path d="M40 22L56 52" stroke={accentHex} strokeWidth="2.2" />
          <path d="M34 56L42 62" stroke={accentHex} strokeWidth="1.5" />
          <path d="M60 62L66 56" stroke={accentHex} strokeWidth="1.5" />
        </svg>
      )
    case 'sweater':
      return (
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M34 22C34 16 66 16 66 22L82 36L74 42L68 32V85H32V32L26 42L18 36L34 22Z" fill={colorHex} stroke={accentHex} strokeWidth="1.8" />
          <path d="M40 18H60V24H40V18Z" fill={colorHex} stroke={accentHex} strokeWidth="1.2" />
          <path d="M32 82H68" stroke={accentHex} strokeWidth="1.5" />
        </svg>
      )
    case 'tank':
      return (
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M36 20C42 28 58 28 64 20L72 32C66 40 66 46 66 84H34C34 46 34 40 28 32L36 20Z" fill={colorHex} stroke={accentHex} strokeWidth="1.8" />
          <path d="M40 80H60" stroke={accentHex} strokeWidth="1.2" />
        </svg>
      )
    case 'pants':
      return (
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 20H68L72 95H53L50 50L47 95H28L32 20Z" fill={colorHex} stroke={accentHex} strokeWidth="1.8" />
          <path d="M50 20V32" stroke={accentHex} strokeWidth="1.5" />
          <path d="M40 28H60" stroke={accentHex} strokeWidth="1.2" />
        </svg>
      )
    case 'skirt':
      return (
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M38 20H62L78 88H22L38 20Z" fill={colorHex} stroke={accentHex} strokeWidth="1.8" />
          <path d="M30 40L35 88M44 32L46 88M56 32L54 88M70 40L65 88" stroke={accentHex} strokeWidth="1.2" strokeOpacity="0.6" />
        </svg>
      )
    case 'loafer':
      return (
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 65C16 52 45 45 70 50C85 54 90 62 88 74H16V65Z" fill={colorHex} stroke={accentHex} strokeWidth="1.8" />
          <rect x="14" y="74" width="76" height="8" rx="2" fill={accentHex} />
          <path d="M50 50V58H65V50" stroke={accentHex} strokeWidth="1.5" />
        </svg>
      )
    case 'slingback':
      return (
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 62C30 52 55 52 75 62L88 72H40L22 62Z" fill={colorHex} stroke={accentHex} strokeWidth="1.8" />
          <path d="M75 62C85 54 88 56 90 65" stroke={accentHex} strokeWidth="1.5" />
          <path d="M34 72V84H28V72" fill={accentHex} stroke={accentHex} strokeWidth="1.2" />
        </svg>
      )
    case 'sneaker':
      return (
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 64C20 48 42 42 66 48L88 62V76H16V64Z" fill={colorHex} stroke={accentHex} strokeWidth="1.8" />
          <rect x="14" y="74" width="76" height="8" rx="3" fill="#FAF8F5" stroke={accentHex} strokeWidth="1.4" />
          <path d="M48 52L54 58M58 54L64 60" stroke={accentHex} strokeWidth="1.5" />
        </svg>
      )
    case 'bag':
      return (
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 34C40 22 60 22 60 34" stroke={accentHex} strokeWidth="2" />
          <rect x="25" y="34" width="50" height="52" rx="4" fill={colorHex} stroke={accentHex} strokeWidth="1.8" />
          <path d="M25 46H75" stroke={accentHex} strokeWidth="1.5" />
          <circle cx="50" cy="46" r="3" fill={accentHex} />
        </svg>
      )
    case 'sunglasses':
      return (
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="18" y="44" width="28" height="20" rx="6" fill={colorHex} stroke={accentHex} strokeWidth="1.8" />
          <rect x="54" y="44" width="28" height="20" rx="6" fill={colorHex} stroke={accentHex} strokeWidth="1.8" />
          <path d="M46 50H54" stroke={accentHex} strokeWidth="2" />
          <path d="M18 48L10 44M82 48L90 44" stroke={accentHex} strokeWidth="1.8" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="55" r="30" fill={colorHex} stroke={accentHex} strokeWidth="2" />
        </svg>
      )
  }
}

export default function OutfitRack({
  outfits,
  pieces,
  onDelete,
  onNavigate,
}: OutfitRackProps) {
  const router = useRouter()
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(outfits[0]?.id ?? null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Sincroniza seleção inicial quando outfits mudam
  useEffect(() => {
    if (outfits.length > 0 && (!selectedOutfitId || !outfits.some(o => o.id === selectedOutfitId))) {
      setSelectedOutfitId(outfits[0].id)
    }
  }, [outfits, selectedOutfitId])

  // Detecta Dark Mode para traço dinâmico dos SVGs
  useEffect(() => {
    const checkDark = () => {
      setIsDarkMode(document.documentElement.classList.contains('mode-dark'))
    }
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const strokeColor = isDarkMode ? '#D4AF6A' : '#1A1A1A'

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const selectedOutfit = outfits.find(o => o.id === selectedOutfitId) || outfits[0] || null

  const handleUseLook = (outfit: LookbookOutfit) => {
    showToast(`Look "${outfit.name}" marcado como usado hoje! Registrado no histórico.`)
  }

  const handleGenerateVariation = (outfit: LookbookOutfit) => {
    const occasionPart = outfit.occasion ? ` para ${outfit.occasion}` : ''
    const msg = `Me gere variações de meia-estação com peças similares ao look "${outfit.name}"${occasionPart}.`
    sessionStorage.setItem('mia_auto_message', msg)
    router.push('/mia')
  }

  const selectedPieces: LookbookPiece[] = selectedOutfit
    ? selectedOutfit.pieces.map(id => pieces[id]).filter(Boolean)
    : []

  if (outfits.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ec-text-muted)' }}>
        <p style={{ fontSize: 15, fontFamily: 'var(--font-inter), sans-serif' }}>
          Nenhum look salvo encontrado para os filtros selecionados.
        </p>
      </div>
    )
  }

  return (
    <div className="lookbook-rack-container">
      {/* Toast flutuante */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--ec-text-primary)',
            color: 'var(--ec-bg-primary)',
            padding: '10px 20px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            fontFamily: 'var(--font-inter), sans-serif',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* ─── NARRATIVE HEADER ─── */}
      <div className="lookbook-narrative-header">
        <span className="lookbook-narrative-label">Curadoria Personalizada da Mia</span>
        <h2 className="lookbook-narrative-title">Arara de Looks do Dia</h2>
        <p className="lookbook-narrative-subtitle">
          Outfits criados pela IA considerando as roupas cadastradas, temperatura local e ocasião.
        </p>
      </div>

      {/* ─── FASHION RAIL STAGE (ARARA METÁLICA DE BOUTIQUE) ─── */}
      <div className="fashion-rail-stage">
        {/* Barra Metálica Superior */}
        <div className="rail-bar-top" />

        {/* Scroll Horizontal dos Cabides */}
        <div className="outfits-rack-scroll">
          {outfits.map(outfit => {
            const outfitPieces = outfit.pieces.map(id => pieces[id]).filter(Boolean)
            const isSelected = outfit.id === selectedOutfit?.id

            return (
              <motion.div
                key={outfit.id}
                className={`outfit-rack-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedOutfitId(outfit.id)}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              >
                {/* Gancho triangular metálico do cabide */}
                <div className="outfit-hanger-neck">
                  <div className="hanger-triangle" />
                </div>

                {/* Prévia do Conjunto (miniaturas com vetores e fotos reais) */}
                <div className="outfit-ensemble-preview">
                  {outfitPieces.slice(0, 4).map((p, idx) => {
                    const svgType = getPieceSvgType(p)
                    const colorHex = getColorHex(p.color)

                    return (
                      <div key={p.id || idx} className="ensemble-thumb" title={p.name}>
                        {p.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photo_url} alt={p.name} />
                        ) : (
                          renderGarmentSvg(svgType, colorHex, strokeColor)
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Corpo do Card */}
                <div className="outfit-card-body">
                  <div className="outfit-badge-row">
                    <span className="outfit-weather-tag">
                      {outfit.period === 'noite' ? '🌙 Noite' : '☀️ Dia'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--ec-accent)', fontWeight: 600 }}>
                      {outfit.occasion || outfit.occasion_tags?.[0] || 'Casual'}
                    </span>
                  </div>

                  <h3 className="outfit-card-title">{outfit.name}</h3>
                  <p className="outfit-card-sub">{outfit.subtitle || outfit.why}</p>

                  <div className="outfit-card-actions">
                    <button
                      type="button"
                      className="btn-use-look"
                      onClick={e => {
                        e.stopPropagation()
                        handleUseLook(outfit)
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Usar hoje</span>
                    </button>

                    <button
                      type="button"
                      className="btn-inspect-look"
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedOutfitId(outfit.id)
                        setModalOpen(true)
                      }}
                    >
                      <span>Ver Detalhes</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ─── DETAILED OUTFIT BREAKDOWN INSPECTOR (CARD INFERIOR) ─── */}
      {selectedOutfit && (
        <div className="lookbook-detail-card" id="lookbook-detail-card">
          <div className="ld-left-block">
            <span className="ld-occasion-badge">
              {selectedOutfit.occasion || 'Casual'} · {formatPeriod(selectedOutfit.period)}
            </span>
            <h3 className="ld-title">{selectedOutfit.name}</h3>
            {selectedOutfit.subtitle && (
              <p className="ld-subtitle">{selectedOutfit.subtitle}</p>
            )}

            {/* "Por que funciona" — Análise da Mia AI */}
            {selectedOutfit.why && (
              <div className="mia-reasoning-box">
                <div className="mrb-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ec-accent)" strokeWidth="2">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  </svg>
                  <span>Por que funciona — Análise da Mia AI</span>
                </div>
                <p className="mrb-text">{selectedOutfit.why}</p>
              </div>
            )}

            {/* Tags de ocasião e estilo */}
            {((selectedOutfit.occasion_tags && selectedOutfit.occasion_tags.length > 0) ||
              (selectedOutfit.style_tags && selectedOutfit.style_tags.length > 0)) && (
              <div className="ld-tags-wrap">
                {selectedOutfit.occasion_tags?.map(tag => (
                  <span key={`occ-${tag}`} className="ld-tag-pill" style={{ color: 'var(--ec-accent)' }}>
                    #{tag}
                  </span>
                ))}
                {selectedOutfit.style_tags?.map(tag => (
                  <span key={`stl-${tag}`} className="ld-tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-use-look"
                style={{ flex: 'none', padding: '10px 20px' }}
                onClick={() => handleUseLook(selectedOutfit)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Usar este look hoje</span>
              </button>

              <button
                type="button"
                className="btn-sub-action"
                style={{ flex: 'none', padding: '10px 18px' }}
                onClick={() => handleGenerateVariation(selectedOutfit)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
                  <path d="m18 2 4 4-4 4" />
                  <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
                  <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
                  <path d="m18 14 4 4-4 4" />
                </svg>
                <span>Gerar variação na Mia</span>
              </button>

              {onDelete && (
                <button
                  type="button"
                  style={{
                    background: 'transparent',
                    color: '#e55353',
                    border: '0.5px solid rgba(229, 83, 83, 0.4)',
                    borderRadius: 999,
                    padding: '8px 16px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-inter), sans-serif',
                  }}
                  onClick={() => onDelete(selectedOutfit.id)}
                >
                  Excluir look
                </button>
              )}
            </div>
          </div>

          {/* Peças que compõem este outfit */}
          <div className="ld-right-block">
            <div className="ld-section-title">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ec-accent)" strokeWidth="2">
                <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
                <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
                <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
              </svg>
              <span>Peças que compõem este outfit</span>
            </div>

            <div className="ld-pieces-list">
              {selectedPieces.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--ec-text-muted)' }}>
                  Nenhuma peça vinculada encontrada no seu closet.
                </p>
              ) : (
                selectedPieces.map(piece => {
                  const svgType = getPieceSvgType(piece)
                  const colorHex = getColorHex(piece.color)

                  return (
                    <Link
                      key={piece.id}
                      href={`/closet/${piece.id}`}
                      className="ld-piece-row"
                      title="Ver detalhes da peça"
                    >
                      <div className="ld-piece-thumb">
                        {piece.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={piece.photo_url} alt={piece.name} />
                        ) : (
                          renderGarmentSvg(svgType, colorHex, strokeColor)
                        )}
                      </div>
                      <div className="ld-piece-info">
                        <span className="ld-piece-cat">{piece.category}</span>
                        <div className="ld-piece-name">{piece.name}</div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ec-text-muted)" strokeWidth="2">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL COMPLEMENTAR DE DETALHES COM FRAMER MOTION ─── */}
      <AnimatePresence>
        {modalOpen && selectedOutfit && (
          <div
            className="lookbook-modal-backdrop"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              className="lookbook-modal-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                className="lookbook-modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar"
              >
                ✕
              </button>

              <span className="ld-occasion-badge">
                {selectedOutfit.occasion || 'Casual'} · {formatPeriod(selectedOutfit.period)}
              </span>
              <h2 className="ld-title" style={{ marginTop: 4 }}>{selectedOutfit.name}</h2>
              {selectedOutfit.subtitle && (
                <p className="ld-subtitle" style={{ marginTop: 4 }}>{selectedOutfit.subtitle}</p>
              )}

              {selectedOutfit.why && (
                <div className="mia-reasoning-box" style={{ marginTop: 16 }}>
                  <div className="mrb-label">
                    <span>✦ Por que funciona — Análise da Mia AI</span>
                  </div>
                  <p className="mrb-text">{selectedOutfit.why}</p>
                </div>
              )}

              <div style={{ marginTop: 24 }}>
                <div className="ld-section-title">
                  <span>Peças Selecionadas</span>
                </div>
                <div className="ld-pieces-list">
                  {selectedPieces.map(piece => (
                    <Link
                      key={piece.id}
                      href={`/closet/${piece.id}`}
                      className="ld-piece-row"
                    >
                      <div className="ld-piece-thumb">
                        {piece.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={piece.photo_url} alt={piece.name} />
                        ) : (
                          renderGarmentSvg(getPieceSvgType(piece), getColorHex(piece.color), strokeColor)
                        )}
                      </div>
                      <div className="ld-piece-info">
                        <span className="ld-piece-cat">{piece.category}</span>
                        <div className="ld-piece-name">{piece.name}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-use-look"
                  style={{ flex: 'none', padding: '10px 24px' }}
                  onClick={() => {
                    handleUseLook(selectedOutfit)
                    setModalOpen(false)
                  }}
                >
                  Usar este look hoje
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
