'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Piece } from '@/types/app'
import { sortPiecePhotos } from '@/lib/piece-photos'
import './interactive-wardrobe.css'

interface InteractiveWardrobeProps {
  pieces: Piece[]
  anchorPieceId?: string | null
  onSelectPiece?: (piece: Piece) => void
}

type CompartmentKey = 'acessorios' | 'cabideiro' | 'gaveteiro' | 'sapateira'

// Mapeamento de cores comuns para hex editorial
function getColorHex(colorName?: string | null): string {
  if (!colorName) return '#C4A882'
  const c = colorName.toLowerCase()
  if (c.includes('preto') || c.includes('black')) return '#1A1A1A'
  if (c.includes('branco') || c.includes('white') || c.includes('off-white') || c.includes('cru') || c.includes('perolado')) return '#FAF8F5'
  if (c.includes('bege') || c.includes('areia') || c.includes('nude') || c.includes('cáqui') || c.includes('caqui')) return '#E8DFD3'
  if (c.includes('terracota') || c.includes('marrom') || c.includes('caramelo') || c.includes('pinhão')) return '#C17F5A'
  if (c.includes('azul') || c.includes('navy') || c.includes('jeans') || c.includes('oxford')) return '#4A6984'
  if (c.includes('verde') || c.includes('oliva') || c.includes('militar')) return '#5C6B57'
  if (c.includes('cinza') || c.includes('grafite')) return '#7A7A7A'
  if (c.includes('rosa') || c.includes('rose') || c.includes('pink')) return '#DDA7A5'
  if (c.includes('vermelho') || c.includes('vinho') || c.includes('bordô')) return '#8B263E'
  if (c.includes('amarelo') || c.includes('mostarda') || c.includes('dourado')) return '#D4AF37'
  return '#C4A882'
}

// Determina o tipo SVG vetorial a partir da categoria e nome da peça
function getPieceSvgType(piece: Piece): string {
  const cat = (piece.category || '').toLowerCase()
  const name = (piece.name || '').toLowerCase()
  const text = `${cat} ${name}`

  // Acessórios
  if (text.includes('bolsa') || text.includes('mochila') || text.includes('tote') || text.includes('clutch')) return 'bag'
  if (text.includes('óculos') || text.includes('oculos') || text.includes('relógio') || text.includes('relogio') || text.includes('chapéu') || text.includes('boné')) return 'sunglasses'

  // Calçados
  if (text.includes('tênis') || text.includes('tenis') || text.includes('sneaker')) return 'sneaker'
  if (text.includes('sandália') || text.includes('sandalia') || text.includes('salto') || text.includes('slingback')) return 'slingback'
  if (text.includes('bota') || text.includes('sapato') || text.includes('oxford') || text.includes('mocassim') || text.includes('loafer')) return 'loafer'

  // Calças & Saias
  if (text.includes('saia')) return 'skirt'
  if (text.includes('calça') || text.includes('calca') || text.includes('short') || text.includes('bermuda') || text.includes('jeans')) return 'pants'

  // Blusas, Camisas & Casacos
  if (text.includes('trench') || text.includes('sobretudo')) return 'trench'
  if (text.includes('blazer') || text.includes('terno')) return 'blazer'
  if (text.includes('jaqueta') || text.includes('couro') || text.includes('biker')) return 'leather_jacket'
  if (text.includes('suéter') || text.includes('sueter') || text.includes('moletom') || text.includes('tricô') || text.includes('cardigan')) return 'sweater'
  if (text.includes('regata') || text.includes('top') || text.includes('colete') || text.includes('cropped')) return 'tank'
  if (text.includes('camisa') || text.includes('camiseta') || text.includes('blusa') || text.includes('polo')) return 'shirt'

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

// Categorização de compartimentos
function getPieceCompartment(piece: Piece): CompartmentKey {
  const cat = (piece.category || '').toLowerCase()
  const name = (piece.name || '').toLowerCase()
  const text = `${cat} ${name}`

  // 1. Calçados
  if (
    text.includes('tênis') || text.includes('tenis') || text.includes('sapato') ||
    text.includes('oxford') || text.includes('bota') || text.includes('sandália') ||
    text.includes('sandalia') || text.includes('chinelo') || text.includes('mocassim') ||
    text.includes('salto') || text.includes('calçado') || text.includes('calcado')
  ) {
    return 'sapateira'
  }

  // 2. Acessórios
  if (
    text.includes('acessório') || text.includes('acessorio') || text.includes('relógio') ||
    text.includes('relogio') || text.includes('bolsa') || text.includes('chapéu') ||
    text.includes('chapeu') || text.includes('boné') || text.includes('bone') ||
    text.includes('óculos') || text.includes('oculos') || text.includes('cinto') ||
    text.includes('joia') || text.includes('carteira')
  ) {
    return 'acessorios'
  }

  // 3. Calças & Saias
  if (
    text.includes('calça') || text.includes('calca') || text.includes('short') ||
    text.includes('bermuda') || text.includes('saia') || text.includes('jeans') ||
    text.includes('legging')
  ) {
    return 'gaveteiro'
  }

  // 4. Cabideiro (Blusas, Camisas, Casacos, Vestidos)
  return 'cabideiro'
}

export default function InteractiveWardrobe({
  pieces,
  anchorPieceId,
  onSelectPiece,
}: InteractiveWardrobeProps) {
  const router = useRouter()
  const [activeCompartment, setActiveCompartment] = useState<CompartmentKey>('cabideiro')
  const [activePiece, setActivePiece] = useState<Piece | null>(null)
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0)
  const [activeAnchorId, setActiveAnchorId] = useState<string | null>(anchorPieceId ?? null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Detecta modo dark para traço dinâmico dos SVGs
  useEffect(() => {
    const checkDark = () => {
      setIsDarkMode(document.documentElement.classList.contains('mode-dark'))
    }
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Atualiza âncora se prop mudar
  useEffect(() => {
    if (anchorPieceId !== undefined) {
      setActiveAnchorId(anchorPieceId)
    }
  }, [anchorPieceId])

  // Trava scroll do body e fecha modal com a tecla Escape
  useEffect(() => {
    if (!activePiece) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePiece(null)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activePiece])

  // Agrupamento de peças por compartimento
  const groupedPieces = useMemo(() => {
    const map: Record<CompartmentKey, Piece[]> = {
      acessorios: [],
      cabideiro: [],
      gaveteiro: [],
      sapateira: [],
    }

    pieces.forEach(piece => {
      const comp = getPieceCompartment(piece)
      map[comp].push(piece)
    })

    return map
  }, [pieces])

  const strokeColor = isDarkMode ? '#D4AF6A' : '#1A1A1A'

  const compartmentNames: Record<CompartmentKey, string> = {
    cabideiro: 'Cabideiro Principal de Blusas, Camisas & Casacos',
    gaveteiro: 'Calceiro com Varão de Calças, Bermudas & Saias',
    sapateira: 'Sapateira Rasante de Calçados',
    acessorios: 'Prateleira de Acessórios & Bolsas',
  }

  const focusedPieces = groupedPieces[activeCompartment]

  const handlePieceClick = (piece: Piece) => {
    setActivePiece(piece)
    setActivePhotoIndex(0)
    if (onSelectPiece) {
      onSelectPiece(piece)
    }
  }

  // Lista ordenada de fotos da peça ativa
  const activePhotos = useMemo(() => {
    if (!activePiece) return []
    return sortPiecePhotos(activePiece)
  }, [activePiece])

  const currentDisplayPhoto = activePhotos[activePhotoIndex] || activePhotos[0]
  const currentPhotoUrl = currentDisplayPhoto?.url ?? activePiece?.photo_url ?? null

  const handleToggleAnchor = (pieceId: string) => {
    const newAnchorId = activeAnchorId === pieceId ? null : pieceId
    setActiveAnchorId(newAnchorId)
    if (newAnchorId) {
      sessionStorage.setItem('anchor_piece', JSON.stringify({ id: newAnchorId }))
    } else {
      sessionStorage.removeItem('anchor_piece')
    }
  }

  const handleCreateLookWithPiece = (piece: Piece) => {
    const msg = `Crie 3 opções de outfits combinando minha peça âncora "${piece.name}" (${piece.category}).`
    sessionStorage.setItem('mia_auto_message', msg)
    router.push('/mia')
  }

  // Renderizador de miniatura de peça (SVG vetorial fiel com foto opcional se presente)
  const renderPieceThumbnail = (piece: Piece, sizeClass = '') => {
    const svgType = getPieceSvgType(piece)
    const colorHex = getColorHex(piece.color)

    if (piece.photo_url) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={piece.photo_url}
          alt={piece.name}
          className={`garment-item-photo-img ${sizeClass}`}
        />
      )
    }

    return renderGarmentSvg(svgType, colorHex, strokeColor)
  }

  return (
    <div className="wardrobe-container">
      {/* ─── NARRATIVE HEADER ─── */}
      <div className="wardrobe-narrative-header">
        <div className="wardrobe-narrative-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Visualização Arquitetônica & Tátil</span>
        </div>
        <h2 className="wardrobe-narrative-title">O seu closet, organizado com inteligência.</h2>
        <p className="wardrobe-narrative-sub">
          Toque em qualquer compartimento para focar no setor, inspecionar peças e definir itens âncora.
        </p>
      </div>

      {/* ─── THE SCANDINAVIAN LUXURY CABINET CROSS-SECTION ─── */}
      <div className="wardrobe-cabinet">

        {/* 1. Cabideiro / Varão de Blusas, Camisas & Casacos */}
        <div
          id="shelf-cabideiro"
          className={`wardrobe-section hanging-rail-section ${activeCompartment === 'cabideiro' ? 'focused' : ''}`}
          onClick={() => setActiveCompartment('cabideiro')}
        >
          <span className="hotspot-badge">
            <span className="hotspot-pulse" />
            <span>✦ {groupedPieces.cabideiro.length} Blusas & Casacos</span>
          </span>

          <div className="section-meta-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ec-accent)" strokeWidth="2">
              <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
              <path d="M7 7h.01" />
            </svg>
            <span>Cabideiro Principal — Blusas, Camisas & Casacos</span>
          </div>

          <div className="metal-rail-bar" />

          <div className="hangers-rack">
            {groupedPieces.cabideiro.length === 0 ? (
              <span className="wardrobe-empty-hint">Nenhuma blusa, camisa ou casaco pendurado.</span>
            ) : (
              groupedPieces.cabideiro.map(p => (
                <div
                  key={p.id}
                  className="hanger-piece"
                  onClick={e => {
                    e.stopPropagation()
                    handlePieceClick(p)
                  }}
                >
                  {activeAnchorId === p.id && (
                    <span className="anchor-mini-badge" title="Peça Âncora">📌</span>
                  )}
                  <div className="hanger-hook" />
                  <div className="hanger-silhouette">
                    {renderPieceThumbnail(p)}
                  </div>
                  <span className="garment-item-name" style={{ marginTop: 4 }}>
                    {p.name}
                  </span>
                  <span className="garment-item-brand">{p.brand || p.color || 'Peça'}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Calceiro Tátil — Calças, Shorts & Saias (Modelo idêntico ao cabideiro principal) */}
        <div
          id="shelf-gaveteiro"
          className={`wardrobe-section hanging-rail-section calceiro-section ${activeCompartment === 'gaveteiro' ? 'focused' : ''}`}
          onClick={() => setActiveCompartment('gaveteiro')}
        >
          <span className="hotspot-badge">
            <span className="hotspot-pulse" />
            <span>✦ {groupedPieces.gaveteiro.length} Calças & Saias</span>
          </span>

          <div className="section-meta-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ec-accent)" strokeWidth="2">
              <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
              <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
              <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
            </svg>
            <span>Calceiro com Varão — Calças, Shorts & Saias</span>
          </div>

          <div className="metal-rail-bar" />

          <div className="hangers-rack">
            {groupedPieces.gaveteiro.length === 0 ? (
              <span className="wardrobe-empty-hint">Nenhuma calça, short ou saia pendurada no calceiro.</span>
            ) : (
              groupedPieces.gaveteiro.map(p => (
                <div
                  key={p.id}
                  className="hanger-piece"
                  onClick={e => {
                    e.stopPropagation()
                    handlePieceClick(p)
                  }}
                >
                  {activeAnchorId === p.id && (
                    <span className="anchor-mini-badge" title="Peça Âncora">📌</span>
                  )}
                  <div className="hanger-hook" />
                  <div className="hanger-silhouette">
                    {renderPieceThumbnail(p)}
                  </div>
                  <span className="garment-item-name" style={{ marginTop: 4 }}>
                    {p.name}
                  </span>
                  <span className="garment-item-brand">{p.brand || p.color || 'Peça'}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Sapateira Inferior — Deck Rasante com Iluminação LED */}
        <div
          id="shelf-sapateira"
          className={`wardrobe-section shoe-rack-section ${activeCompartment === 'sapateira' ? 'focused' : ''}`}
          onClick={() => setActiveCompartment('sapateira')}
        >
          <span className="hotspot-badge">
            <span className="hotspot-pulse" />
            <span>✦ {groupedPieces.sapateira.length} Calçados Selecionados</span>
          </span>

          <div className="section-meta-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ec-accent)" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
            <span>Sapateira com Luz Rasante — Calçados</span>
          </div>

          <div className="boutique-deck">
            {groupedPieces.sapateira.length === 0 ? (
              <span className="wardrobe-empty-hint">Nenhum calçado cadastrado na sapateira.</span>
            ) : (
              groupedPieces.sapateira.map(p => (
                <div
                  key={p.id}
                  className="boutique-shelf-item"
                  onClick={e => {
                    e.stopPropagation()
                    handlePieceClick(p)
                  }}
                >
                  {activeAnchorId === p.id && (
                    <span className="anchor-mini-badge" title="Peça Âncora">📌</span>
                  )}
                  <div className="boutique-item-visual">
                    {renderPieceThumbnail(p)}
                  </div>
                  <span className="garment-item-name">{p.name}</span>
                  <span className="garment-item-brand">{p.brand || p.color || 'Calçado'}</span>
                </div>
              ))
            )}
          </div>
          <div className="shelf-ledge-bar" />
        </div>

        {/* 4. Prateleira Vitrine — Bolsas & Acessórios */}
        <div
          id="shelf-accessories"
          className={`wardrobe-section accessories-shelf ${activeCompartment === 'acessorios' ? 'focused' : ''}`}
          onClick={() => setActiveCompartment('acessorios')}
        >
          <span className="hotspot-badge">
            <span className="hotspot-pulse" />
            <span>✦ {groupedPieces.acessorios.length} Bolsas & Acessórios</span>
          </span>

          <div className="section-meta-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ec-accent)" strokeWidth="2">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
            <span>Prateleira Expositora — Bolsas & Acessórios</span>
          </div>

          <div className="boutique-deck">
            {groupedPieces.acessorios.length === 0 ? (
              <span className="wardrobe-empty-hint">Nenhum acessório ou bolsa cadastrado.</span>
            ) : (
              groupedPieces.acessorios.map(p => (
                <div
                  key={p.id}
                  className="boutique-shelf-item"
                  onClick={e => {
                    e.stopPropagation()
                    handlePieceClick(p)
                  }}
                >
                  {activeAnchorId === p.id && (
                    <span className="anchor-mini-badge" title="Peça Âncora">📌</span>
                  )}
                  <div className="boutique-item-visual">
                    {renderPieceThumbnail(p)}
                  </div>
                  <span className="garment-item-name">{p.name}</span>
                  <span className="garment-item-brand">{p.brand || p.color || 'Acessório'}</span>
                </div>
              ))
            )}
          </div>
          <div className="glass-shelf-ledge" />
        </div>

      </div>

      {/* ─── DYNAMIC QUICK-INSPECTION TRAY FOR ACTIVE COMPARTMENT ─── */}
      <div className="compartment-focus-panel" id="compartment-focus-panel">
        <div className="cfp-header">
          <div className="cfp-title">
            <span>{compartmentNames[activeCompartment]} ({focusedPieces.length} peças cadastradas)</span>
          </div>
          <button
            type="button"
            className="btn-sub-action"
            style={{ flex: 'none', padding: '6px 14px' }}
            onClick={() => {
              // Notifica o componente pai se houver handler
              if (onSelectPiece && focusedPieces[0]) {
                onSelectPiece(focusedPieces[0])
              } else {
                router.push('/closet/nova-peca')
              }
            }}
          >
            <span>+ Adicionar nesta seção</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5v14" />
            </svg>
          </button>
        </div>

        <div className="cfp-grid">
          {focusedPieces.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', color: 'var(--ec-text-muted)', fontSize: 13 }}>
              Nenhuma peça cadastrada neste compartimento. Toque em "+" para cadastrar novas peças.
            </p>
          ) : (
            focusedPieces.map(p => {
              const svgType = getPieceSvgType(p)
              const colorHex = getColorHex(p.color)

              return (
                <div
                  key={p.id}
                  className="cfp-card"
                  onClick={e => {
                    e.stopPropagation()
                    handlePieceClick(p)
                  }}
                >
                  <div className="cfp-thumb">
                    {p.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo_url} alt={p.name} />
                    ) : (
                      renderGarmentSvg(svgType, colorHex, strokeColor)
                    )}
                  </div>
                  <div className="cfp-info">
                    <span className="cfp-cat">
                      {p.category} {activeAnchorId === p.id ? '• Âncora 📌' : ''}
                    </span>
                    <div className="cfp-name" title={p.name}>{p.name}</div>
                    <div className="cfp-desc">{[p.brand, p.color, p.season].filter(Boolean).join(' · ')}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ─── SPLIT MODAL: DETALHE DA PEÇA (PIECE DETAIL DIALOG) ─── */}
      {activePiece && (
        <div
          className="wardrobe-modal-overlay"
          onClick={e => {
            if (e.target === e.currentTarget) {
              setActivePiece(null)
            }
          }}
        >
          <div
            className="piece-detail-dialog"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={e => {
                e.stopPropagation()
                setActivePiece(null)
              }}
              aria-label="Fechar Modal"
            >
              ✕
            </button>

            {/* Left: Photo & Thumbs (55%) */}
            <div className="pdd-gallery-side">
              <div className="pdd-main-photo-box">
                {currentDisplayPhoto?.is_studio && (
                  <span className="pdd-main-badge">✦ Foto Estúdio IA</span>
                )}
                {currentPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentPhotoUrl}
                    alt={activePiece.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  renderGarmentSvg(getPieceSvgType(activePiece), getColorHex(activePiece.color), strokeColor)
                )}
              </div>

              {/* Linha de Miniaturas (Thumbnails) */}
              <div className="pdd-thumbs-row">
                {activePhotos.length > 0 ? (
                  <>
                    {activePhotos.map((ph, idx) => (
                      <div
                        key={ph.id || idx}
                        className={`pdd-thumb-card ${activePhotoIndex === idx ? 'active' : ''} ${ph.is_cover ? 'is-cover' : ''} ${ph.is_studio ? 'is-studio' : ''}`}
                        onClick={() => setActivePhotoIndex(idx)}
                        title={ph.is_studio ? 'Foto Estúdio IA' : (ph.is_cover ? 'Foto de Capa' : `Foto ${idx + 1}`)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ph.url}
                          alt={`${activePiece.name} foto ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                    {!activePhotos.some(ph => ph.is_studio) && (
                      <div
                        className="pdd-thumb-card pdd-thumb-studio-cta"
                        onClick={() => router.push(`/closet/${activePiece.id}`)}
                        title="Gerar foto profissional de estúdio com IA"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ec-accent)" strokeWidth="2">
                          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                        </svg>
                        <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--ec-accent)', textTransform: 'uppercase' }}>
                          + Estúdio
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  /* Sem fotos reais: reproduz os 4 slots vetoriais fiéis ao protótipo (Original + 3 Estúdio) */
                  <>
                    <div
                      className={`pdd-thumb-card ${activePhotoIndex === 0 ? 'active' : ''} is-cover`}
                      onClick={() => setActivePhotoIndex(0)}
                      title="Silhueta Vetorial Original"
                    >
                      {renderGarmentSvg(getPieceSvgType(activePiece), getColorHex(activePiece.color), strokeColor)}
                    </div>
                    <div
                      className={`pdd-thumb-card ${activePhotoIndex === 1 ? 'active' : ''} is-studio`}
                      onClick={() => setActivePhotoIndex(1)}
                      title="Estúdio IA (Simulação)"
                    >
                      {renderGarmentSvg(getPieceSvgType(activePiece), getColorHex(activePiece.color), strokeColor)}
                    </div>
                    <div
                      className={`pdd-thumb-card ${activePhotoIndex === 2 ? 'active' : ''} is-studio`}
                      onClick={() => setActivePhotoIndex(2)}
                      title="Ghost Mannequin (Simulação)"
                    >
                      {renderGarmentSvg(getPieceSvgType(activePiece), getColorHex(activePiece.color), strokeColor)}
                    </div>
                    <div
                      className={`pdd-thumb-card ${activePhotoIndex === 3 ? 'active' : ''} is-studio`}
                      onClick={() => setActivePhotoIndex(3)}
                      title="Enquadramento Detalhe"
                    >
                      {renderGarmentSvg(getPieceSvgType(activePiece), getColorHex(activePiece.color), strokeColor)}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: Specs & Actions (45%) */}
            <div className="pdd-info-side">
              <span className="pdd-cat-badge">{activePiece.category}</span>
              <h2 className="pdd-piece-title">{activePiece.name}</h2>

              <div className="pdd-specs-table">
                <div className="pdd-spec-row">
                  <span className="pdd-spec-label">Marca</span>
                  <span className="pdd-spec-val">{activePiece.brand || 'Não informada'}</span>
                </div>
                <div className="pdd-spec-row">
                  <span className="pdd-spec-label">Cor Principal</span>
                  <span className="pdd-spec-val">{activePiece.color || 'Não informada'}</span>
                </div>
                {activePiece.color_secondary && (
                  <div className="pdd-spec-row">
                    <span className="pdd-spec-label">Cor Secundária</span>
                    <span className="pdd-spec-val">{activePiece.color_secondary}</span>
                  </div>
                )}
                <div className="pdd-spec-row">
                  <span className="pdd-spec-label">Caimento / Fit</span>
                  <span className="pdd-spec-val">{activePiece.fit || 'Regular'}</span>
                </div>
                <div className="pdd-spec-row">
                  <span className="pdd-spec-label">Estação Ideal</span>
                  <span className="pdd-spec-val">{activePiece.season || 'Todas as Estações'}</span>
                </div>
              </div>

              <div className="pdd-tags-group">
                {activePiece.fit && <span className="pdd-tag">{activePiece.fit}</span>}
                {activePiece.style_type && <span className="pdd-tag">{activePiece.style_type}</span>}
                {activePiece.season && <span className="pdd-tag">{activePiece.season}</span>}
                {activePiece.color_secondary && <span className="pdd-tag">{activePiece.color_secondary}</span>}
              </div>

              <div className="pdd-desc-box">
                <span className="pdd-desc-label">Análise de Visão Mia AI</span>
                <p className="pdd-desc-text">
                  {activePiece.description ||
                    'Peça estruturada e versátil do seu acervo inteligente. A Mia AI utiliza sua tonalidade, textura e caimento para calcular combinações harmônicas e elevar a silhueta em diversas ocasiões.'}
                </p>
              </div>

              <div className="pdd-action-cta-stack">
                <button
                  type="button"
                  className={`btn-anchor-toggle ${activeAnchorId === activePiece.id ? 'active' : ''}`}
                  onClick={() => handleToggleAnchor(activePiece.id)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="17" x2="12" y2="22" />
                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                  </svg>
                  <span>
                    {activeAnchorId === activePiece.id ? '✓ Peça Âncora Ativa 📌' : 'Definir como Peça Âncora'}
                  </span>
                </button>

                <div className="pdd-sub-actions">
                  <button
                    type="button"
                    className="btn-sub-action"
                    onClick={() => handleCreateLookWithPiece(activePiece)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    </svg>
                    <span>Gerar Look com Esta Peça</span>
                  </button>

                  <button
                    type="button"
                    className="btn-sub-action"
                    onClick={() => router.push(`/closet/${activePiece.id}`)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" />
                      <path d="m14 7 3 3" />
                      <path d="M5 6v4" />
                      <path d="M19 14v4" />
                      <path d="M10 2v2" />
                    </svg>
                    <span>✦ Foto Estúdio IA</span>
                  </button>

                  <button
                    type="button"
                    className="btn-sub-action"
                    onClick={() => router.push(`/closet/${activePiece.id}`)}
                  >
                    <span>Ver no Closet →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
