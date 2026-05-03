'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import '../../outfit-ia.css'

const DAY_OCCASIONS = [
  { icon: '🏃', label: 'Dia a Dia' },
  { icon: '🛍', label: 'Shopping' },
  { icon: '🤝', label: 'Amigos' },
  { icon: '✈️', label: 'Viagem' },
  { icon: '🎓', label: 'Faculdade' },
  { icon: '💼', label: 'Trabalho' },
  { icon: '👔', label: 'Reunião' },
  { icon: '🏋️', label: 'Academia' },
  { icon: '☕', label: 'Café' },
  { icon: '🌊', label: 'Praia' },
  { icon: '🧘', label: 'Lazer' },
  { icon: '📸', label: 'Ensaio' },
  { icon: '🎨', label: 'Evento Cultural' },
  { icon: '🌿', label: 'Ao Ar Livre' },
]

const NIGHT_OCCASIONS = [
  { icon: '🎂', label: 'Aniversário' },
  { icon: '🎵', label: 'Balada' },
  { icon: '🍽', label: 'Jantar' },
  { icon: '🎭', label: 'Show' },
  { icon: '🥂', label: 'Festa' },
  { icon: '🎬', label: 'Cinema' },
  { icon: '🎲', label: 'Jogos' },
  { icon: '🍺', label: 'Bar' },
  { icon: '💑', label: 'Encontro' },
  { icon: '🎤', label: 'Karaokê' },
  { icon: '🎪', label: 'Festival' },
  { icon: '🌃', label: 'Passeio Noturno' },
  { icon: '👗', label: 'Evento Social' },
  { icon: '🎰', label: 'Cassino' },
]

const PERIODS = [
  { icon: '🌅', label: 'Manhã (8h–11h)', hour: 9 },
  { icon: '☀️', label: 'Tarde (12h–17h)', hour: 14 },
  { icon: '🌆', label: 'Fim de tarde (17h–20h)', hour: 18 },
  { icon: '🌙', label: 'Noite (20h+)', hour: 21 },
]

function buildDateChips() {
  const chips = []
  const today = new Date()
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  for (let i = 0; i < 16; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    chips.push({
      dayName: i === 0 ? 'Hoje' : dayNames[d.getDay()],
      dayNum: d.getDate(),
      date: d,
    })
  }
  return chips
}

function formatDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type GeneratedOutfit = {
  name: string
  subtitle: string
  style_tags: string[]
  why: string
  pieces: any[]
}

export default function OutfitIAPage() {
  const supabase = createClient()

  const [weather, setWeather] = useState<{ temp: number; desc: string; icon: string } | null>(null)
  const [city, setCity] = useState('')
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)

  const [period, setPeriod] = useState('dia')
  const [occasion, setOccasion] = useState('Dia a Dia')

  const [generating, setGenerating] = useState(false)
  const [outfits, setOutfits] = useState<GeneratedOutfit[]>([])
  const [previousOutfits, setPreviousOutfits] = useState<string[][]>([])
  const [usedPieceIds, setUsedPieceIds] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  const [selectedOutfit, setSelectedOutfit] = useState<GeneratedOutfit | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedIds, setSavedIds] = useState<number[]>([])

  const [anchorPiece, setAnchorPiece] = useState<any>(null)

  const [dateModalOpen, setDateModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const [selectedPeriodHour, setSelectedPeriodHour] = useState<number | null>(null)
  const [customWeather, setCustomWeather] = useState<{ temp: number; desc: string; icon: string } | null>(null)
  const [dateChips] = useState(buildDateChips)

  useEffect(() => {
    getLocation()
  }, [])

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('outfit_ia_results')
      if (saved) {
        const parsed = JSON.parse(saved)
        const thirtyMinutes = 30 * 60 * 1000
        if (Date.now() - parsed.timestamp < thirtyMinutes) {
          setOutfits(parsed.outfits)
          if (parsed.usedPieceIds) {
            setUsedPieceIds(parsed.usedPieceIds)
          }
        } else {
          sessionStorage.removeItem('outfit_ia_results')
        }
      }
    } catch {}
    try {
      const savedAnchor = sessionStorage.getItem('anchor_piece')
      if (savedAnchor) {
        setAnchorPiece(JSON.parse(savedAnchor))
      }
    } catch {}
  }, [])

  useEffect(() => {
    const occasions = period === 'dia' ? DAY_OCCASIONS : NIGHT_OCCASIONS
    setOccasion(occasions[0].label)
    setPreviousOutfits([])
    setUsedPieceIds([])
    sessionStorage.removeItem('outfit_ia_results')
  }, [period])

  useEffect(() => {
    setPreviousOutfits([])
    setUsedPieceIds([])
    sessionStorage.removeItem('outfit_ia_results')
  }, [occasion])

  function getLocation() {
    if (!navigator.geolocation) {
      setWeatherLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setCoords({ lat: latitude, lon: longitude })

        try {
          const cityRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const cityData = await cityRes.json()
          const cityName = cityData.address?.city ||
            cityData.address?.town ||
            cityData.address?.suburb ||
            'Sua cidade'
          setCity(cityName)

          const weatherRes = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`)
          const weatherData = await weatherRes.json()
          setWeather(weatherData)
        } catch {
          setWeather({ temp: 25, desc: 'Clima agradável', icon: '⛅' })
          setCity('Sua cidade')
        }

        setWeatherLoading(false)
      },
      () => {
        setWeather({ temp: 25, desc: 'Clima agradável', icon: '⛅' })
        setCity('Sua cidade')
        setWeatherLoading(false)
      }
    )
  }

  async function handleConfirmDate() {
    if (!selectedDate || selectedPeriodHour === null || !coords) return
    try {
      const res = await fetch(
        `/api/weather?lat=${coords.lat}&lon=${coords.lon}&date=${formatDate(selectedDate)}&hour=${selectedPeriodHour}`
      )
      const data = await res.json()
      setCustomWeather(data)
    } catch {
      // silently keep previous weather
    }
    setPreviousOutfits([])
    setUsedPieceIds([])
    setDateModalOpen(false)
  }

  function handleResetDate() {
    setCustomWeather(null)
    setSelectedDate(null)
    setSelectedPeriod(null)
    setSelectedPeriodHour(null)
    setDateModalOpen(false)
  }

  async function handleGenerate() {
    const activeWeather = customWeather || weather
    if (!activeWeather) return
    setGenerating(true)

    let newUsedPieceIds = usedPieceIds
    let newPreviousOutfits = previousOutfits
    if (outfits.length > 0) {
      const currentIds = outfits.map((o) => o.pieces.map((p: any) => p.id))
      newPreviousOutfits = [...previousOutfits, ...currentIds]
      setPreviousOutfits(newPreviousOutfits)

      const usedIds = outfits.flatMap((o: any) =>
        o.pieces
          .filter((p: any) => {
            const cat = p.category?.toLowerCase() || ''
            return !cat.includes('acessório') &&
                   !cat.includes('acessorio') &&
                   !cat.includes('bolsa') &&
                   !cat.includes('chapéu') &&
                   !cat.includes('chapeu')
          })
          .map((p: any) => p.id)
      )
      newUsedPieceIds = [...new Set([...usedPieceIds, ...usedIds])]
      setUsedPieceIds(newUsedPieceIds)
    }

    setOutfits([])
    setErrorMsg('')

    const eventDate = selectedDate
      ? selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
      : null

    try {
      const res = await fetch('/api/outfit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period,
          occasion,
          temp: activeWeather.temp,
          weatherDesc: activeWeather.desc,
          eventDate,
          eventPeriod: selectedPeriod || null,
          previousOutfits: newPreviousOutfits,
          usedPieceIds: newUsedPieceIds,
          anchorPiece: anchorPiece ? {
            id: anchorPiece.id,
            name: anchorPiece.name,
            category: anchorPiece.category,
            color: anchorPiece.color,
          } : null,
        }),
      })

      const data = await res.json()
      if (data.outfits) {
        setOutfits(data.outfits)
        setSavedIds([])
        try {
          sessionStorage.setItem('outfit_ia_results', JSON.stringify({
            outfits: data.outfits,
            period,
            occasion,
            timestamp: Date.now(),
            usedPieceIds: newUsedPieceIds,
          }))
        } catch {}
      } else {
        setErrorMsg('Adicione peças ao closet antes de gerar outfits.')
      }
    } catch (err) {
      console.error('Erro ao gerar outfits:', err)
    }

    setGenerating(false)
  }

  async function handleSave(outfit: GeneratedOutfit, index: number) {
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    await supabase.from('outfits').insert({
      user_id: user.id,
      name: outfit.name,
      subtitle: outfit.subtitle,
      style_tags: outfit.style_tags,
      occasion_tags: [occasion],
      period,
      occasion,
      why: outfit.why,
      pieces: outfit.pieces.map((p: any) => p.id),
      notes: null,
    })

    setSavedIds(prev => [...prev, index])
    setSaving(false)
  }

  const occasions = period === 'dia' ? DAY_OCCASIONS : NIGHT_OCCASIONS

  const tagClass = (tag: string) => {
    const map: Record<string, string> = {
      'Neutro': 'tag-neutro',
      'Statement': 'tag-statement',
      'Retrô': 'tag-retro',
      'Cor Forte': 'tag-cor',
      'Casual': 'tag-casual',
      'Conjunto': 'tag-conjunto',
    }
    return map[tag] || 'tag-neutro'
  }

  const activeWeather = customWeather || weather

  const futureBadgeLabel = selectedDate && selectedPeriod
    ? `📅 ${selectedDate.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })} · ${selectedPeriod}`
    : null

  return (
    <>
      <div className="outfitia-header">
        <h1 className="outfitia-title">
          Outfit <span>IA</span>
        </h1>
      </div>

      {weatherLoading ? (
        <div className="weather-loading">
          <span>⏳</span>
          <span className="weather-loading-text">Detectando localização...</span>
        </div>
      ) : activeWeather ? (
        <div className={`weather-card ${customWeather ? 'future' : ''}`}>
          <div className="weather-top">
            <div className="weather-left">
              <span className="weather-icon">{activeWeather.icon}</span>
              <div>
                <div className="weather-temp">{activeWeather.temp}°C</div>
                <div className="weather-desc">{activeWeather.desc}</div>
                {futureBadgeLabel && (
                  <div className="weather-future-badge">{futureBadgeLabel}</div>
                )}
              </div>
            </div>
            <div className="weather-right">
              <div className="weather-city">{city}</div>
              <div className="weather-date">{customWeather ? 'Previsão' : 'Agora'}</div>
            </div>
          </div>
          <button
            className={`change-date-btn ${customWeather ? 'active' : ''}`}
            onClick={() => setDateModalOpen(true)}
          >
            <span>📅</span>
            Mudar data e horário
          </button>
        </div>
      ) : null}

      {anchorPiece && (
        <div className="anchor-card">
          <div className="anchor-card-photo">
            {anchorPiece.photo_url ? (
              <img src={anchorPiece.photo_url} alt={anchorPiece.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
            ) : (
              <span style={{ fontSize: '20px', opacity: 0.3 }}>👕</span>
            )}
          </div>
          <div className="anchor-card-info">
            <div className="anchor-card-label">📌 Peça âncora</div>
            <div className="anchor-card-name">{anchorPiece.name}</div>
            <div className="anchor-card-cat">
              {anchorPiece.category}{anchorPiece.color ? ` · ${anchorPiece.color}` : ''}
            </div>
          </div>
          <button
            className="anchor-remove"
            onClick={() => {
              sessionStorage.removeItem('anchor_piece')
              setAnchorPiece(null)
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="period-row">
        <button
          className={`period-btn ${period === 'dia' ? 'active' : ''}`}
          onClick={() => setPeriod('dia')}
        >
          ☀️ Dia
        </button>
        <button
          className={`period-btn ${period === 'noite' ? 'active' : ''}`}
          onClick={() => setPeriod('noite')}
        >
          🌙 Noite
        </button>
      </div>

      <div className="occ-row">
        {occasions.map(occ => (
          <button
            key={occ.label}
            className={`occ-chip ${occasion === occ.label ? 'active' : ''}`}
            onClick={() => setOccasion(occ.label)}
          >
            {occ.icon} {occ.label}
          </button>
        ))}
      </div>

      <div className="gen-wrap">
        <button
          className="gen-btn"
          onClick={handleGenerate}
          disabled={generating || weatherLoading}
        >
          {generating ? 'Gerando...' : '✦ Gerar 5 Outfits'}
        </button>
      </div>

      {errorMsg && (
        <div style={{
          background: '#111',
          border: '1px solid rgba(224,92,92,0.3)',
          borderRadius: '10px',
          padding: '14px',
          margin: '12px 16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <span style={{ color: 'rgba(224,92,92,0.8)', fontSize: '14px' }}>
            {errorMsg}
          </span>
          <a href="/closet" style={{
            color: 'rgba(180,140,60,0.9)',
            fontSize: '13px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            textDecoration: 'none',
          }}>
            Ir para o closet →
          </a>
        </div>
      )}

      {generating && (
        <div className="generating-state">
          <div className="generating-spinner" />
          <div className="generating-text">
            Analisando seu closet...
          </div>
        </div>
      )}

      {outfits.length > 0 && !generating && (
        <div className="generated-grid">
          {outfits.map((outfit, index) => (
            <div
              key={index}
              className="gen-card"
              onClick={() => {
                setSelectedOutfit(outfit)
                setModalOpen(true)
              }}
            >
              <div className="gen-card-photos">
                {outfit.pieces.slice(0, 3).map((piece: any, i: number) => (
                  <div key={i} className="gen-card-photo">
                    {piece.photo_url ? (
                      <img src={piece.photo_url} alt={piece.name} />
                    ) : (
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '3px',
                        background: 'rgba(180,140,60,0.08)',
                        border: '1px dashed rgba(180,140,60,0.15)'
                      }} />
                    )}
                    {i === 2 && outfit.pieces.length > 3 && (
                      <span className="pieces-badge-more">+{outfit.pieces.length - 3}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="gen-card-info">
                <div className="gen-card-name">{outfit.name}</div>
                <div className="gen-card-sub">{outfit.subtitle}</div>
                <div className="gen-card-tags">
                  {outfit.style_tags.slice(0, 2).map((tag: string) => (
                    <span key={tag} className={`tag ${tagClass(tag)}`}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal detalhe */}
      <div className={`outfit-modal ${modalOpen ? 'open' : ''}`}>
        <button
          className="outfit-modal-close"
          onClick={() => {
            setModalOpen(false)
            setSelectedOutfit(null)
          }}
        >
          ✕
        </button>

        <div className="outfit-modal-inner">
          {selectedOutfit && (() => {
            const index = outfits.indexOf(selectedOutfit)
            const isSaved = savedIds.includes(index)

            return (
              <>
                <div className="outfit-detail-photos" style={{
                  gridTemplateColumns: selectedOutfit.pieces.length === 4 ? '1fr 1fr' : '1fr 1fr 1fr'
                }}>
                  {selectedOutfit.pieces.map((piece: any, i: number) => (
                    <div
                      key={i}
                      className="outfit-detail-photo"
                      style={selectedOutfit.pieces.length === 5 && i === 4 ? { gridColumnStart: '3' } : undefined}
                    >
                      {piece.photo_url ? (
                        <img src={piece.photo_url} alt={piece.name} />
                      ) : (
                        <div className="outfit-detail-piece-photo-empty" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="outfit-detail-title">{selectedOutfit.name}</div>
                <div className="outfit-detail-sub">{selectedOutfit.subtitle}</div>

                <div className="outfit-detail-tags">
                  {selectedOutfit.style_tags.map((tag: string) => (
                    <span key={tag} className={`tag ${tagClass(tag)}`}>{tag}</span>
                  ))}
                </div>

                <div className="outfit-detail-section">Peças do Outfit</div>

                {selectedOutfit.pieces.map((piece: any, i: number) => (
                  <div key={i} className="outfit-detail-piece">
                    <div className="outfit-detail-piece-photo">
                      {piece.photo_url ? (
                        <img src={piece.photo_url} alt={piece.name} />
                      ) : (
                        <div className="outfit-detail-piece-photo-empty" />
                      )}
                    </div>
                    <div>
                      <div className="outfit-detail-piece-name">{piece.name}</div>
                      <div className="outfit-detail-piece-cat">{piece.category}</div>
                    </div>
                  </div>
                ))}

                <div className="outfit-why">
                  <div className="outfit-why-label">Por que funciona</div>
                  <div className="outfit-why-text">{selectedOutfit.why}</div>
                </div>

                <button
                  className={`save-outfit-btn ${isSaved ? 'saved' : ''}`}
                  onClick={() => !isSaved && handleSave(selectedOutfit, index)}
                  disabled={saving || isSaved}
                >
                  {isSaved ? '✓ Salvo no Lookbook' : '♡ Salvar no Lookbook'}
                </button>
              </>
            )
          })()}
        </div>
      </div>

      {/* Modal seleção de data */}
      <div className={`outfit-modal ${dateModalOpen ? 'open' : ''}`}>
        <button
          className="outfit-modal-close"
          onClick={() => setDateModalOpen(false)}
        >
          ✕
        </button>

        <div className="outfit-modal-inner">
          <div className="outfit-detail-section" style={{ marginBottom: '16px', fontSize: '12px' }}>
            Quando é o evento?
          </div>

          <div className="date-chips-row">
            {dateChips.map((chip, i) => (
              <button
                key={i}
                className={`date-chip ${selectedDate && formatDate(selectedDate) === formatDate(chip.date) ? 'active' : ''}`}
                onClick={() => setSelectedDate(chip.date)}
              >
                <span className="date-chip-day">{chip.dayName}</span>
                <span className="date-chip-num">{chip.dayNum}</span>
              </button>
            ))}
          </div>

          <div className="outfit-detail-section" style={{ marginBottom: '10px' }}>
            Período do dia
          </div>

          <div className="time-chips-row">
            {PERIODS.map((p) => (
              <button
                key={p.label}
                className={`time-chip ${selectedPeriod === p.label ? 'active' : ''}`}
                onClick={() => {
                  setSelectedPeriod(p.label)
                  setSelectedPeriodHour(p.hour)
                }}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>

          <button
            className="gen-btn"
            disabled={!selectedDate || !selectedPeriod}
            onClick={handleConfirmDate}
          >
            Confirmar
          </button>

          <button className="date-modal-btn-secondary" onClick={handleResetDate}>
            Usar clima atual
          </button>
        </div>
      </div>
    </>
  )
}
