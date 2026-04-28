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
  { icon: '🏋️', label: 'Academia' },
  { icon: '☕', label: 'Café' },
  { icon: '🎮', label: 'Lazer' },
  { icon: '🌊', label: 'Praia' },
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
]

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

  const [period, setPeriod] = useState('dia')
  const [occasion, setOccasion] = useState('Dia a Dia')

  const [generating, setGenerating] = useState(false)
  const [outfits, setOutfits] = useState<GeneratedOutfit[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  const [selectedOutfit, setSelectedOutfit] = useState<GeneratedOutfit | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedIds, setSavedIds] = useState<number[]>([])

  useEffect(() => {
    getLocation()
  }, [])

  useEffect(() => {
    const occasions = period === 'dia' ? DAY_OCCASIONS : NIGHT_OCCASIONS
    setOccasion(occasions[0].label)
  }, [period])

  function getLocation() {
    if (!navigator.geolocation) {
      setWeatherLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords

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

          const weatherRes = await fetch(
            `/api/weather?lat=${latitude}&lon=${longitude}`
          )
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

  async function handleGenerate() {
    if (!weather) return
    setGenerating(true)
    setOutfits([])
    setErrorMsg('')

    try {
      const res = await fetch('/api/outfit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period,
          occasion,
          temp: weather.temp,
          weatherDesc: weather.desc,
        }),
      })

      const data = await res.json()
      console.log('Resposta da API:', data)
      if (data.outfits) {
        setOutfits(data.outfits)
        setSavedIds([])
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
    if (!user) return

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
      ) : weather ? (
        <div className="weather-card">
          <div className="weather-left">
            <span className="weather-icon">{weather.icon}</span>
            <div>
              <div className="weather-temp">{weather.temp}°C</div>
              <div className="weather-desc">{weather.desc}</div>
            </div>
          </div>
          <div className="weather-right">
            <div className="weather-city">{city}</div>
            <div className="weather-date">Agora</div>
          </div>
        </div>
      ) : null}

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
                <div className="outfit-detail-photos">
                  {selectedOutfit.pieces.slice(0, 3).map((piece: any, i: number) => (
                    <div key={i} className="outfit-detail-photo">
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
    </>
  )
}