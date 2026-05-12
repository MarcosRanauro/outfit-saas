'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import '../../mia.css'

interface Message {
  role: 'mia' | 'user'
  content: string
  outfits?: any[]
  wishlist?: any[]
  time: string
}

interface Weather {
  temp: number
  desc: string
  icon: string
}

const QUICK_ACTIONS = [
  { label: '🌤 Outfit de hoje', message: 'Me monta um outfit para hoje' },
  { label: '📅 Para um evento', message: 'Preciso de um look para um evento especial' },
  { label: '🛍 O que comprar?', message: 'O que está faltando no meu closet?' },
  { label: '✦ Peça âncora', message: 'Quero montar um look em torno de uma peça específica' },
  { label: '💬 Dica de moda', message: 'Me dá uma dica de moda para o meu estilo' },
]

function getTime() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit'
  })
}

export default function MiaPage() {
  const supabase = createClient()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [savedOutfitIds, setSavedOutfitIds] = useState<Set<string>>(new Set())
  const [savedWishlistIds, setSavedWishlistIds] = useState<Set<string>>(new Set())
  const [expandedOutfits, setExpandedOutfits] = useState<Set<string>>(new Set())
  const [anchorPiece, setAnchorPiece] = useState<any>(() => {
    if (typeof window === 'undefined') return null
    try {
      const saved = sessionStorage.getItem('anchor_piece')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Carrega perfil e clima ao montar
  useEffect(() => {
    loadProfileAndWeather()
  }, [])

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function loadProfileAndWeather() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('name, style, height, weight')
      .eq('id', user.id)
      .single()

    // Busca clima
    let weatherData = null
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      })
      const { latitude: lat, longitude: lon } = position.coords
      setCoords({ lat, lon })
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
      if (res.ok) weatherData = await res.json()
    } catch {
      // sem clima
    }
    setWeather(weatherData)

    // Mensagem de boas vindas
    const name = profileData?.name?.split(' ')[0] || 'você'
    const weatherMsg = weatherData
      ? `Tô vendo que tá ${weatherData.temp}°C aí agora. `
      : ''

    setMessages([{
      role: 'mia',
      content: `Oi, ${name}! 👋 Sou a Mia, sua stylist pessoal.

${weatherMsg}Já dei uma olhadinha no seu closet e tenho várias ideias pra você. O que a gente monta hoje? 🌟`,
      time: getTime(),
    }])
  }

  async function fetchFutureWeather(date: string, hour: number): Promise<Weather | null> {
    if (!coords) return null
    try {
      const res = await fetch(
        `/api/weather?lat=${coords.lat}&lon=${coords.lon}&date=${date}&hour=${hour}`
      )
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: text.trim(),
      time: getTime(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    const history = messages
      .slice(1)
      .map(m => ({ role: m.role === 'mia' ? 'assistant' : 'user', content: m.content }))

    try {
      // PASSO 1 — Pré-chamada leve para extrair data se houver
      let activeWeather = weather
      let weatherContext: string | null = null

      if (coords) {
        const dateRes = await fetch('/api/mia/extract-date', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text.trim(), history }),
        })

        if (dateRes.ok) {
          const dateData = await dateRes.json()

          if (dateData.event_date && dateData.event_hour != null) {
            const futureWeather = await fetchFutureWeather(
              dateData.event_date,
              dateData.event_hour
            )

            if (futureWeather) {
              activeWeather = futureWeather
              weatherContext = `Clima previsto para ${dateData.event_date} às ${dateData.event_hour}h: ${futureWeather.temp}°C, ${futureWeather.desc}`
            }
          }
        }
      }

      // PASSO 2 — Chamada principal com clima correto
      const res = await fetch('/api/mia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history,
          weather: activeWeather,
          weatherContext,
          anchorPiece,
        }),
      })

      // Verifica rate limit antes de parsear
      if (res.status === 429) {
        const errorData = await res.json()
        setMessages(prev => [...prev, {
          role: 'mia',
          content: errorData.error || 'Você atingiu o limite do plano Free. Faça upgrade para o Pro para continuar usando a Mia sem limites! 🚀',
          time: getTime(),
        }])
        setLoading(false)
        return
      }

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setMessages(prev => [...prev, {
        role: 'mia',
        content: data.message,
        outfits: data.outfits || null,
        wishlist: data.wishlist || null,
        time: getTime(),
      }])
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch {
      setMessages(prev => [...prev, {
        role: 'mia',
        content: 'Ops, tive um probleminha aqui! 😅 Pode repetir?',
        time: getTime(),
      }])
    }

    setLoading(false)
  }

  async function handleSaveOutfit(outfit: any, msgIndex: number, outfitIndex: number) {
    const saveKey = `${msgIndex}-${outfitIndex}`
    if (savedOutfitIds.has(saveKey)) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('outfits').insert({
        user_id: user.id,
        name: outfit.name,
        subtitle: outfit.subtitle,
        style_tags: outfit.style_tags || [],
        occasion_tags: [],
        period: outfit.period || 'dia',
        occasion: outfit.occasion || 'Dia a Dia',
        why: outfit.why,
        pieces: outfit.piece_ids || outfit.pieces?.map((p: any) => p.id) || [],
      })

      if (error) throw error

      setSavedOutfitIds(prev => new Set([...prev, saveKey]))
    } catch {
      alert('Erro ao salvar outfit. Tente novamente.')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="mia-wrap">

      {/* Header */}
      <div className="mia-header">
        <div className="mia-avatar">✦</div>
        <div className="mia-header-info">
          <div className="mia-header-name">Mia</div>
          <div className="mia-header-sub">
            <div className="mia-status-dot" />
            Sua stylist pessoal
          </div>
        </div>
        {weather && (
          <div className="mia-weather-pill">
            {weather.icon} {weather.temp}°C
          </div>
        )}
      </div>

      {/* Ações rápidas */}
      <div className="mia-quick-actions">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            className="mia-quick-btn"
            onClick={() => { sendMessage(action.message); setTimeout(() => inputRef.current?.focus(), 100) }}
            disabled={loading}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Peça âncora */}
      {anchorPiece && (
        <div className="mia-anchor-card">
          <div className="mia-anchor-photo">
            {anchorPiece.photo_url
              ? <img src={anchorPiece.photo_url} alt={anchorPiece.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 18, opacity: 0.3 }}>👕</span>
            }
          </div>
          <div className="mia-anchor-info">
            <div className="mia-anchor-label">Peça âncora</div>
            <div className="mia-anchor-name">{anchorPiece.name}</div>
          </div>
          <button
            className="mia-anchor-remove"
            onClick={() => {
              setAnchorPiece(null)
              try { sessionStorage.removeItem('anchor_piece') } catch {}
            }}
          >×</button>
        </div>
      )}

      {/* Mensagens */}
      <div className="mia-messages">
        {messages.map((msg, msgIndex) => (
          <div key={msgIndex} className={`mia-msg ${msg.role}`}>
            {msg.role === 'mia' && (
              <div className="mia-msg-avatar">✦</div>
            )}
            <div className="mia-msg-content">
              <div className="mia-msg-bubble">
                {msg.content.split('\n').map((line, i) => (
                  <span key={i}>{line}{i < msg.content.split('\n').length - 1 && <br />}</span>
                ))}

                {/* Cards de outfit dentro da mensagem */}
                {msg.outfits && msg.outfits.map((outfit, outfitIndex) => {
                  const outfitKey = `${msgIndex}-${outfitIndex}`
                  const isSaved = savedOutfitIds.has(outfitKey)
                  const outfitPieces = outfit.pieces || []
                  const isExpanded = expandedOutfits.has(outfitKey)
                  const visiblePieces = isExpanded ? outfitPieces : outfitPieces.slice(0, 3)
                  const extraCount = outfitPieces.length - 3

                  return (
                    <div key={outfitIndex} className="mia-outfit-card">
                      <div className={`mia-outfit-photos${isExpanded ? ' expanded' : ''}`}>
                        {visiblePieces.map((piece: any, pi: number) => (
                          <div key={pi} className="mia-outfit-photo">
                            {piece.photo_url ? (
                              <img src={piece.photo_url} alt={piece.name} />
                            ) : (
                              <span className="mia-outfit-photo-placeholder">👕</span>
                            )}
                          </div>
                        ))}
                        {!isExpanded && extraCount > 0 && (
                          <div
                            className="mia-outfit-photo mia-outfit-more"
                            onClick={() => setExpandedOutfits(prev => new Set([...prev, outfitKey]))}
                          >
                            +{extraCount}
                          </div>
                        )}
                        {!isExpanded && outfitPieces.length < 3 && (
                          [...Array(Math.max(0, 3 - outfitPieces.length))].map((_, i) => (
                            <div key={`empty-${i}`} className="mia-outfit-photo">
                              <span className="mia-outfit-photo-placeholder">👕</span>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="mia-outfit-body">
                        <div className="mia-outfit-name">{outfit.name}</div>
                        {outfit.subtitle && (
                          <div className="mia-outfit-sub">{outfit.subtitle}</div>
                        )}
                        {outfit.style_tags?.length > 0 && (
                          <div className="mia-outfit-tags">
                            {outfit.style_tags.map((tag: string, ti: number) => (
                              <span key={ti} className="mia-outfit-tag">{tag}</span>
                            ))}
                          </div>
                        )}
                        <button
                          className={`mia-outfit-save ${isSaved ? 'saved' : ''}`}
                          onClick={() => handleSaveOutfit(outfit, msgIndex, outfitIndex)}
                          disabled={isSaved}
                        >
                          {isSaved ? '✓ Salvo no Lookbook' : '♡ Salvar no Lookbook'}
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Cards de wishlist dentro da mensagem */}
                {msg.wishlist && msg.wishlist.map((item: any, itemIndex: number) => {
                  const wishlistKey = `${msgIndex}-w-${itemIndex}`
                  const isWishlistSaved = savedWishlistIds.has(wishlistKey)
                  return (
                    <div key={itemIndex} className="mia-outfit-card" style={{ marginTop: itemIndex === 0 ? '8px' : '6px' }}>
                      <div className="mia-outfit-body" style={{ padding: '10px' }}>
                        <div style={{
                          fontSize: '8px',
                          letterSpacing: '2px',
                          textTransform: 'uppercase',
                          color: 'rgba(180,140,60,0.6)',
                          marginBottom: '4px'
                        }}>
                          {item.priority === 'high' ? '⭐ Essencial' :
                           item.priority === 'medium' ? '👍 Recomendado' : '✨ Nice to have'}
                        </div>
                        <div className="mia-outfit-name">{item.name}</div>
                        <div className="mia-outfit-sub">{item.category} · {item.color}</div>
                        <div style={{
                          fontSize: '11px',
                          color: 'rgba(255,255,255,0.4)',
                          lineHeight: '1.5',
                          marginTop: '6px',
                          marginBottom: '8px'
                        }}>
                          {item.reason}
                        </div>
                        <button
                          key={`${msgIndex}-wishlist-${itemIndex}`}
                          className={`mia-outfit-save ${isWishlistSaved ? 'saved' : ''}`}
                          disabled={isWishlistSaved}
                          onClick={async () => {
                            try {
                              const { data: { user } } = await supabase.auth.getUser()
                              if (!user) return
                              const { error } = await supabase
                                .from('wishlist_items')
                                .insert({
                                  user_id: user.id,
                                  name: item.name,
                                  category: item.category,
                                  color: item.color,
                                  reason: item.reason,
                                  priority: item.priority,
                                  purchased: false,
                                })
                              if (!error) {
                                setSavedWishlistIds(prev =>
                                  new Set([...prev, wishlistKey])
                                )
                              }
                            } catch {
                              alert('Erro ao salvar. Tente novamente.')
                            }
                          }}
                        >
                          {isWishlistSaved ? '✓ Salvo na Wishlist' : '♡ Salvar na Wishlist'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mia-msg-time">{msg.time}</div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="mia-msg mia">
            <div className="mia-msg-avatar">✦</div>
            <div className="mia-typing">
              <div className="mia-typing-dot" />
              <div className="mia-typing-dot" />
              <div className="mia-typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mia-input-wrap">
        <textarea
          ref={inputRef}
          className="mia-input"
          placeholder="Fala com a Mia..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
        />
        <button
          className="mia-send-btn"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
        >
          →
        </button>
      </div>

    </div>
  )
}
