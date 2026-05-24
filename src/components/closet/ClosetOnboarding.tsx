'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STYLE_OPTIONS = ['Streetwear', 'Sportwear', 'Casual', 'Social', 'Minimalista']

interface ClosetOnboardingProps {
  open: boolean
  showNameField: boolean
  onComplete: () => void
}

export default function ClosetOnboarding({ open, showNameField, onComplete }: ClosetOnboardingProps) {
  const supabase = createClient()
  const [obStep, setObStep] = useState(1)
  const [obName, setObName] = useState('')
  const [obHeight, setObHeight] = useState('')
  const [obWeight, setObWeight] = useState('')
  const [obSelectedStyles, setObSelectedStyles] = useState<string[]>([])
  const [obCustomStyle, setObCustomStyle] = useState('')
  const [obSaving, setObSaving] = useState(false)

  const step1Valid = !!obHeight && !!obWeight && (!showNameField || !!obName.trim())
  const step2Valid = obSelectedStyles.length > 0 || !!obCustomStyle.trim()

  function toggleStyle(style: string) {
    setObSelectedStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    )
  }

  async function handleSave() {
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
    if (showNameField && obName.trim()) updates.name = obName.trim()

    await supabase.from('profiles').update(updates).eq('id', user.id)
    setObSaving(false)
    setObStep(3)
  }

  return (
    <div className={`onboarding-overlay ${open ? 'open' : ''}`}>
      <div className="onboarding-sheet">
        <div className="onboarding-handle" />
        <div className="onboarding-dots">
          {[1, 2, 3].map(s => (
            <div key={s} className={`onboarding-dot ${obStep === s ? 'active' : ''}`} />
          ))}
        </div>

        {obStep === 1 && (
          <>
            <div className="onboarding-logo">
              <div className="onboarding-diamond" />
              <div className="onboarding-title">Bem-vindo</div>
              <div className="onboarding-sub">Alguns dados para personalizar suas sugestões de outfit.</div>
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
            <button className="onboarding-btn" onClick={() => setObStep(2)} disabled={!step1Valid}>
              Próximo
            </button>
          </>
        )}

        {obStep === 2 && (
          <>
            <div className="onboarding-logo">
              <div className="onboarding-diamond" />
              <div className="onboarding-title">Seu Estilo</div>
              <div className="onboarding-sub">Escolha um ou mais estilos que descrevem você.</div>
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
              onClick={handleSave}
              disabled={obSaving || !step2Valid}
            >
              {obSaving ? 'Salvando...' : 'Concluir'}
            </button>
            <button className="onboarding-btn onboarding-btn--ghost" onClick={() => setObStep(1)}>
              Voltar
            </button>
          </>
        )}

        {obStep === 3 && (
          <div className="onboarding-success">
            <div className="onboarding-success-icon">✦</div>
            <div className="onboarding-success-title">Tudo Certo!</div>
            <div className="onboarding-success-text">
              Seu perfil está configurado. Agora a IA pode sugerir outfits perfeitos para você.
            </div>
            <button className="onboarding-btn" onClick={onComplete}>
              Explorar Closet
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
