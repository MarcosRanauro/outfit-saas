'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import '../landing.css'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function LandingPage() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches
  })
  const [showIOSInstructions] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    if (window.matchMedia('(display-mode: standalone)').matches) return false
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    return isIOS && isSafari
  })

  useEffect(() => {
    if (isInstalled || showIOSInstructions) return

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    const handleInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [isInstalled, showIOSInstructions])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === 'accepted') {
      setInstallPrompt(null)
      setIsInstalled(true)
    }
  }

  return (
    <div className="lp">

      {/* NAV */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <div className="lp-diamond">✦</div>
          <span className="lp-brand">Mia <span>Outfit AI</span></span>
        </div>
        <div className="lp-nav-links">
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#planos">Planos</a>
          <Link href="/login">Entrar</Link>
          <Link href="/cadastro" className="lp-nav-cta">15 dias grátis</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-badge">✦ Sua stylist pessoal com IA</div>
        <h1>Sua <em>stylist pessoal</em><br />sempre disponível</h1>
        <p>
          A Mia conhece o seu closet, sabe o clima e entende o seu estilo.
          Receba looks perfeitos para cada ocasião — em segundos.
        </p>
        <div className="lp-hero-btns">
          <Link href="/cadastro" className="lp-btn-primary">15 dias grátis</Link>
          <a href="#funcionalidades" className="lp-btn-secondary">Ver como funciona</a>
        </div>

        {/* Android — botão automático */}
        {installPrompt && !isInstalled && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button onClick={handleInstall} className="lp-btn-install">
              📲 Instalar app no celular
            </button>
          </div>
        )}

        {/* iOS — instrução manual */}
        {showIOSInstructions && (
          <div style={{
            textAlign: 'center',
            marginTop: '12px',
            padding: '10px 16px',
            background: 'rgba(180,140,60,0.06)',
            border: '0.5px solid rgba(180,140,60,0.25)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'rgba(180,140,60,0.7)',
            lineHeight: 1.5,
          }}>
            📲 Para instalar: toque em <strong style={{color:'rgba(180,140,60,0.9)'}}>Compartilhar</strong> → <strong style={{color:'rgba(180,140,60,0.9)'}}>Adicionar à Tela de Início</strong>
          </div>
        )}

        {/* Phone mockup */}
        <div className="lp-phones">
          <div className="lp-phone">
            <div className="lp-phone-screen">
              <div className="lp-phone-header">
                <div className="lp-phone-avatar">✦</div>
                <div>
                  <div className="lp-phone-title">Mia</div>
                  <div className="lp-phone-status">
                    <span className="lp-status-dot" />
                    Sua stylist
                  </div>
                </div>
                <div className="lp-weather-pill">☀️ 28°C</div>
              </div>
              <div className="lp-quick-actions">
                <span className="lp-qa">🌤 Hoje</span>
                <span className="lp-qa">📅 Evento</span>
                <span className="lp-qa">🛍 Comprar</span>
              </div>
              <div className="lp-msg lp-msg-mia">
                <div className="lp-msg-av">✦</div>
                <div className="lp-bubble lp-bubble-mia">
                  Oi! Com 28°C aí, montei esse look leve e estiloso pra você 🌟
                </div>
              </div>
              <div className="lp-msg lp-msg-mia">
                <div className="lp-msg-av">✦</div>
                <div className="lp-bubble lp-bubble-mia">
                  <div className="lp-outfit-mini">
                    <div className="lp-outfit-photos">
                      <div className="lp-outfit-photo">👕</div>
                      <div className="lp-outfit-photo">👖</div>
                      <div className="lp-outfit-photo">👟</div>
                    </div>
                    <div className="lp-outfit-body">
                      <div className="lp-outfit-name">Casual Elevado</div>
                      <div className="lp-outfit-save">♡ Salvar no Lookbook</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lp-msg lp-msg-user">
                <div className="lp-bubble lp-bubble-user">
                  Tenho jantar amanhã às 20h
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-features" id="funcionalidades">
        <div className="lp-section-label">✦ Funcionalidades</div>
        <h2 className="lp-section-title">
          Tudo que você precisa para<br />
          <em>arrasar todos os dias</em>
        </h2>
        <div className="lp-features-grid">
          {[
            { icon: '✦', title: 'Mia — Sua stylist IA', desc: 'Converse naturalmente. A Mia entende seu estilo, o clima e a ocasião para criar looks perfeitos.' },
            { icon: '👗', title: 'Closet inteligente', desc: 'Cadastre suas peças com foto. A Mia analisa automaticamente cor, fit e estilo de cada item.' },
            { icon: '🌤', title: 'Clima em tempo real', desc: 'Looks adaptados ao clima atual ou de qualquer data futura. Nunca mais errar na roupa.' },
            { icon: '📌', title: 'Peça âncora', desc: 'Quer usar uma peça específica? A Mia monta o look inteiro em torno dela.' },
            { icon: '📖', title: 'Lookbook pessoal', desc: 'Salve seus looks favoritos e acesse quando precisar. Filtre por ocasião ou período.' },
            { icon: '🛍', title: 'Wishlist inteligente', desc: 'A Mia sugere as peças que estão faltando no seu closet para completar seus looks.' },
          ].map((f, i) => (
            <div key={i} className="lp-feature-card">
              <div className="lp-feature-icon">{f.icon}</div>
              <div className="lp-feature-title">{f.title}</div>
              <div className="lp-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="lp-testimonials">
        <div className="lp-section-label">✦ Depoimentos</div>
        <h2 className="lp-section-title">O que dizem nossos <em>usuários</em></h2>
        <div className="lp-testimonials-grid">
          {[
            { name: 'Ana Paula', role: 'Usuária Pro', color: '#7F77DD', text: '"Finalmente um app que entende o meu estilo de verdade. A Mia sempre acerta o look para cada ocasião."' },
            { name: 'Rafael S.', role: 'Usuário Pro', color: '#1D9E75', text: '"Uso todo dia antes de sair. A Mia sabe o clima, minhas roupas e meu estilo. Revolucionou minha manhã."' },
            { name: 'Camila M.', role: 'Usuária Pro', color: '#D85A30', text: '"Ela analisou minhas peças e me disse o que estava faltando no closet. Muito mais útil do que esperava."' },
          ].map((t, i) => (
            <div key={i} className="lp-testimonial-card">
              <div className="lp-stars">★★★★★</div>
              <p className="lp-testimonial-text">{t.text}</p>
              <div className="lp-author">
                <div className="lp-author-avatar" style={{ background: t.color }}>
                  {t.name[0]}
                </div>
                <div>
                  <div className="lp-author-name">{t.name}</div>
                  <div className="lp-author-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CURADORIA */}
      <section className="lp-curadoria">
        <div className="lp-curadoria-inner">
          <div className="lp-section-label">✦ CURADORIA</div>
          <h2 className="lp-curadoria-title">
            A Mia não é só tecnologia.<br />
            <em className="lp-curadoria-subtitle">É experiência de quem vive moda.</em>
          </h2>
          <div className="lp-curadoria-divider" />
          <p className="lp-curadoria-text">
            A Mia foi construída com quem vive moda todos os dias. Especialistas em consultoria de imagem,
            styling pessoal e comportamento de moda contribuíram para cada decisão — das categorias de peças
            ao jeito como ela analisa clima, biotipo e ocasião. O resultado é uma IA que não apenas sugere
            roupas, mas entende de estilo de verdade.
          </p>
        </div>
      </section>

      {/* PLANOS */}
      <section className="lp-pricing" id="planos">
        <div className="lp-section-label">✦ Planos</div>
        <h2 className="lp-section-title">Simples e <em>transparente</em></h2>
        <div className="lp-pricing-grid" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div className="lp-pricing-card lp-pricing-featured">
            <div className="lp-pricing-badge">Comece grátis</div>
            <div className="lp-pricing-name">Pro</div>
            <div className="lp-pricing-price">
              <span className="lp-amount">R$19</span>
              <span className="lp-period">/mês</span>
            </div>
            <div className="lp-trial-note">após 15 dias de teste gratuito</div>
            <ul className="lp-pricing-features">
              <li>✓ Mensagens ilimitadas com a Mia</li>
              <li>✓ Outfits ilimitados</li>
              <li>✓ Análises ilimitadas</li>
              <li>✓ Wishlist inteligente</li>
              <li>✓ Cancele quando quiser</li>
            </ul>
            <Link href="/cadastro" className="lp-pricing-btn lp-btn-gold">
              Começar 15 dias grátis
            </Link>
            <div className="lp-trial-note" style={{ marginTop: '12px' }}>
              ✦ 15 dias grátis · Sem cartão de crédito · Cancele quando quiser
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <h2>Comece a arrasar<br /><em>hoje mesmo</em></h2>
        <p>Cadastre-se grátis e conheça a Mia, sua nova stylist pessoal.</p>
        <Link href="/cadastro" className="lp-btn-primary lp-btn-lg">
          Criar conta grátis
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-brand">
          Mia <span>Outfit AI</span> · 2026
        </div>
        <div className="lp-footer-links">
          <Link href="/faq">FAQ</Link>
          <Link href="/sobre">Sobre</Link>
          <Link href="/termos">Termos de Uso</Link>
          <Link href="/privacidade">Privacidade</Link>
          <a href="mailto:suporte@miaoutfitai.com.br">suporte@miaoutfitai.com.br</a>
        </div>
      </footer>

    </div>
  )
}
