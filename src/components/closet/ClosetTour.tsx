'use client'

const TOUR_STEPS = [
  {
    title: '✦ Sugerir Peças',
    text: 'A IA analisa seu closet e sugere peças que faltam para criar mais combinações.',
  },
  {
    title: '♡ Sua Wishlist',
    text: 'Aqui ficam as peças que você quer comprar. Quando comprar, adicione direto ao closet com um toque.',
  },
  {
    title: '+ Adicionar Peça',
    text: 'Cadastre as peças que você já tem para a IA conhecer seu guarda-roupa e gerar outfits perfeitos.',
  },
]

interface ClosetTourProps {
  open: boolean
  step: number
  spotlightStyle: React.CSSProperties
  tooltipStyle: React.CSSProperties
  onNext: () => void
  onFinish: () => void
}

export default function ClosetTour({ open, step, spotlightStyle, tooltipStyle, onNext, onFinish }: ClosetTourProps) {
  if (!open) return null

  return (
    <div className="tour-overlay">
      <button className="tour-skip" onClick={onFinish}>Pular</button>
      <div className="tour-spotlight" style={spotlightStyle} />
      <div className="tour-tooltip" style={tooltipStyle}>
        <div className="tour-tooltip-title">{TOUR_STEPS[step].title}</div>
        <div className="tour-tooltip-text">{TOUR_STEPS[step].text}</div>
        <div className="tour-tooltip-footer">
          <div className="tour-dots">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`tour-dot ${i === step ? 'active' : ''}`} />
            ))}
          </div>
          <button className="tour-next" onClick={onNext}>
            {step === 2 ? 'Concluir' : 'Próximo →'}
          </button>
        </div>
      </div>
    </div>
  )
}
