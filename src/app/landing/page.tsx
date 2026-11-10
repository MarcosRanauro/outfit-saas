'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PRECO_PRO_COMPACTO } from '@/lib/pricing'
import { ADDON_PACKAGES } from '@/config/plan-limits'
import '../landing.css'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const featureBlocks = [
  {
    number: '01',
    label: 'O SEU GUARDA-ROUPA',
    title: 'Cadastre suas peças. A Mia analisa tudo.',
    desc: 'Foto, cor, categoria — a Mia entende cada peça com visão computacional e monta combinações a partir das roupas que você já tem.',
    image: '/images/landing/01-guarda-roupa-preview.png',
    alt: 'Modal de análise de peça com IA e visão computacional',
    reverse: false,
  },
  {
    number: '02',
    label: 'LOOKS DO DIA',
    title: 'O look certo para o clima de hoje.',
    desc: 'Geolocalização em tempo real. A Mia considera temperatura, período do dia e ocasião antes de sugerir qualquer combinação.',
    image: '/images/landing/02-looks-dia-preview.png',
    alt: 'Arara de outfits e combinação de look do dia',
    reverse: true,
  },
  {
    number: '03',
    label: 'SUA STYLIST PESSOAL',
    title: 'Converse. Ela entende de moda.',
    desc: 'Peça um look para uma festa, uma viagem, uma reunião. A Mia responde com sugestões reais do seu closet — não de uma loja.',
    image: '/images/landing/03-stylist-preview.png',
    alt: 'Chat de consultoria de estilo com a IA Mia',
    reverse: false,
  },
]

const testimonials = [
  { name: 'Ana Paula', role: 'Usuária Pro', color: '#7F77DD', text: '"Finalmente um app que entende o meu estilo de verdade. A Mia sempre acerta o look para cada ocasião."' },
  { name: 'Rafael S.', role: 'Usuário Pro', color: '#1D9E75', text: '"Uso todo dia antes de sair. A Mia sabe o clima, minhas roupas e meu estilo. Revolucionou minha manhã."' },
  { name: 'Camila M.', role: 'Usuária Pro', color: '#D85A30', text: '"Ela analisou minhas peças e me disse o que estava faltando no closet. Muito mais útil do que esperava."' },
]

export default function LandingPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('mia_theme') as 'light' | 'dark') || 'light'
  })
  const [mode, setMode] = useState<'claire' | 'dark'>('claire')
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const testimonialTrackRef = useRef<HTMLDivElement>(null)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches
  })
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    localStorage.setItem('mia_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const saved = localStorage.getItem('mia-mode') as 'claire' | 'dark' | null
    if (saved) setMode(saved)
  }, [])

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isIOS && !isStandalone) setShowIOSInstructions(true)
  }, [])

  const handleModeChange = (newMode: 'claire' | 'dark') => {
    setMode(newMode)
    localStorage.setItem('mia-mode', newMode)
    document.documentElement.classList.toggle('mode-dark', newMode === 'dark')
  }

  useEffect(() => {
    const track = testimonialTrackRef.current
    if (!track) return
    const handleScroll = () => {
      const index = Math.min(
        Math.round(track.scrollLeft / (track.scrollWidth / testimonials.length)),
        testimonials.length - 1
      )
      setActiveTestimonial(index)
    }
    track.addEventListener('scroll', handleScroll, { passive: true })
    return () => track.removeEventListener('scroll', handleScroll)
  }, [])


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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          }
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('.scroll-animate').forEach((el) => {
      observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

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
    <div className="lp" data-theme={theme}>

      {/* TOP ANNOUNCEMENT BANNER */}
      <div className="ec-top-banner">
        <span className="ec-top-banner-dot">✦</span>
        <span>
          <strong>15 dias grátis</strong> com até 20 peças no closet e 3 fotos de estúdio com Manequim Fantasma.
        </span>
        <Link href="/cadastro" className="ec-top-banner-link">
          Experimente agora →
        </Link>
      </div>

      {/* NAV */}
      <nav className="ec-nav">
        <div className="ec-nav-logo">
          {mode === 'dark' ? (
            <>
              <span className="logo-mia">MIA</span>
              <span className="logo-dot">·</span>
              <span className="logo-outfit">OUTFIT AI</span>
            </>
          ) : (
            <>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 20 }}>Mia</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 20, color: 'var(--ec-accent)' }}> Outfit AI</span>
            </>
          )}
        </div>
        <div className="ec-nav-links">
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#planos">Planos & Preços</a>
          <Link href="/sobre">Sobre</Link>
        </div>
        <div className="ec-nav-right">
          <div className="mode-toggle">
            <button
              className={`toggle-option${mode === 'claire' ? ' active' : ''}`}
              onClick={() => handleModeChange('claire')}
            >
              Édition Claire
            </button>
            <button
              className={`toggle-option${mode === 'dark' ? ' active' : ''}`}
              onClick={() => handleModeChange('dark')}
            >
              Dark Edition
            </button>
          </div>
          <Link href="/login" className="ec-nav-login">Entrar</Link>
          <Link href="/cadastro" className="ec-nav-cta">Testar 15 dias grátis</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="ec-hero">
        <div className="ec-hero-bg">
          <img src="/illustrations/Hero-principal.png" alt="" aria-hidden="true" />
        </div>
        <div className="ec-hero-content scroll-animate">
          <div className="badge">
            <span className="badge-dot" />
            <span className="badge-text">SUA STYLIST COM IA</span>
          </div>
          {mode === 'dark' ? (
            <h1>
              <span className="hero-line1">VESTE BEM</span><br />
              <span className="hero-line2">TODO DIA.</span>
            </h1>
          ) : (
            <h1>
              Seu estilo,<br />
              <em>finalmente entendido.</em>
            </h1>
          )}
          <p className="sub">A Mia analisa seu closet e monta o look certo para cada dia.</p>
          <div className="hero-highlight-pill">
            <span className="pill-sparkle">✦</span>
            <span>15 dias grátis com até 20 peças e 3 fotos de estúdio</span>
          </div>
          <Link href="/cadastro" className="cta-main">Começar 15 dias grátis →</Link>
          <div className="social-proof">
            <span className="stars">★★★★★</span>
            <span>500+ looks gerados esta semana · Sem cartão de crédito</span>
          </div>

          {installPrompt && !isInstalled && (
            <div style={{ marginTop: '12px' }}>
              <button onClick={handleInstall} className="lp-btn-install">
                📲 Instalar app no celular
              </button>
            </div>
          )}
          {showIOSInstructions && (
            <div style={{
              marginTop: '12px',
              padding: '10px 16px',
              background: 'rgba(193,127,90,0.06)',
              border: '0.5px solid rgba(193,127,90,0.25)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'rgba(193,127,90,0.7)',
              lineHeight: 1.5,
            }}>
              📲 Para instalar: toque em{' '}
              <strong style={{ color: 'rgba(193,127,90,0.9)' }}>Compartilhar</strong>
              {' '}→{' '}
              <strong style={{ color: 'rgba(193,127,90,0.9)' }}>Adicionar à Tela de Início</strong>
            </div>
          )}
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          <span className="ticker-content">STYLIST PESSOAL · INTELIGÊNCIA ARTIFICIAL · 15 DIAS GRÁTIS COM ATÉ 20 PEÇAS E 3 FOTOS DE ESTÚDIO · CLIMA EM TEMPO REAL · SEU CLOSET INTELIGENTE · </span>
          <span className="ticker-content">STYLIST PESSOAL · INTELIGÊNCIA ARTIFICIAL · 15 DIAS GRÁTIS COM ATÉ 20 PEÇAS E 3 FOTOS DE ESTÚDIO · CLIMA EM TEMPO REAL · SEU CLOSET INTELIGENTE · </span>
        </div>
      </div>

      {/* FEATURES */}
      <section className="ec-features" id="funcionalidades">
        <div className="ec-features-inner">
          <div className="ec-features-header scroll-animate">
            <div className="ec-section-label">FUNCIONALIDADES</div>
            <h2 className="ec-features-title">
              {mode === 'dark' ? 'SEU CLOSET. O CLIMA. O LOOK CERTO.' : <>Seu closet. O clima.<br />O look perfeito.</>}
            </h2>
          </div>
          {featureBlocks.map((block, i) => (
            <div
              key={i}
              className={`feature-block scroll-animate${block.reverse ? ' feature-block-reverse' : ''}`}
            >
              <div className="feature-image-wrap">
                <div className="feature-image-card">
                  <Image
                    src={block.image}
                    alt={block.alt}
                    width={1880}
                    height={953}
                    className="feature-preview-img"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 540px"
                    priority={i === 0}
                  />
                </div>
              </div>
              <div className="feature-text">
                <span className="feature-number">{block.number}</span>
                <div className="feature-label">{block.label}</div>
                <h3 className="feature-title">{block.title}</h3>
                <p className="feature-desc">{block.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="ec-testimonials">
        <div className="ec-testimonials-inner">
          <div className="scroll-animate">
            <h2 className="ec-testimonials-title">
              {mode === 'dark' ? 'O QUE DIZEM QUEM JÁ USA' : <>O que dizem quem já <em>usa</em></>}
            </h2>
          </div>
          <div className="testimonials-track" ref={testimonialTrackRef}>
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={mode === 'claire' ? { background: t.color } : undefined}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="testimonials-dots">
            {testimonials.map((_, i) => (
              <span
                key={i}
                className={`testimonials-dot${activeTestimonial === i ? ' active' : ''}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CURADORIA */}
      <section className="ec-curation">
        <div className="ec-curation-inner">
          <div className="curation-image-wrap scroll-animate">
            <img
              src="/illustrations/Curadoria.png"
              alt="Armário aquarela"
              className="curation-image"
            />
          </div>
          <div className="curation-content scroll-animate scroll-animate-delay-2">
            <div className="ec-section-label">CURADORIA</div>
            <h2 className="curation-title">
              A Mia não é só tecnologia.<br />
              <em>É experiência de quem vive moda.</em>
            </h2>
            <div className="curation-divider" />
            <p className="curation-text">
              A Mia foi construída com quem vive moda todos os dias. O resultado é uma IA que não apenas sugere roupas — entende estilo de verdade.
            </p>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section className="ec-pricing" id="planos">
        <div className="ec-pricing-inner">
          <div className="ec-pricing-header scroll-animate">
            <div className="ec-section-label">PLANOS & PREÇOS</div>
            <h2 className="ec-pricing-title">
              {mode === 'dark' ? 'SIMPLES E TRANSPARENTE' : <>Simples e <em>transparente</em></>}
            </h2>
            <p className="ec-pricing-sub">Experimente com 15 dias grátis. Sem surpresas, cancele quando quiser.</p>
          </div>

          <div className="plans-grid">
            {/* Card Trial */}
            <div className="plan-card plan-card-trial scroll-animate">
              <div className="plan-badge plan-badge-trial">15 DIAS GRÁTIS</div>
              <h3 className="plan-name">Período de Teste</h3>
              <div className="plan-price">
                <span className="plan-amount">R$ 0</span>
              </div>
              <p className="plan-period">por 15 dias de acesso completo</p>
              <div className="plan-divider" />
              <ul className="plan-features">
                <li><strong>15 dias grátis</strong> sem pedir cartão de crédito</li>
                <li><strong>Até 20 peças</strong> cadastradas no closet</li>
                <li><strong>3 fotos de estúdio</strong> com Manequim Fantasma</li>
                <li><strong>Chat com a Mia</strong> liberado para tirar dúvidas</li>
                <li><strong>Geração de looks</strong> ilimitada com clima real</li>
                <li>Análise de fotos com inteligência artificial</li>
              </ul>
              <Link href="/cadastro" className="plan-cta plan-cta-outline">
                Começar 15 dias grátis
              </Link>
              <p className="plan-note">Sem cartão · Cancele quando quiser</p>
            </div>

            {/* Card Pro em Destaque */}
            <div className="plan-card plan-card-pro plan-card-featured scroll-animate">
              <div className="plan-featured-tag">MAIS ESCOLHIDO</div>
              <div className="plan-badge plan-badge-pro">ACESSO ILIMITADO</div>
              <h3 className="plan-name">Plano Pro</h3>
              <div className="plan-price">
                <span className="plan-amount">{PRECO_PRO_COMPACTO}</span>
              </div>
              <p className="plan-period">/mês após o período de teste</p>
              <div className="plan-divider" />
              <ul className="plan-features">
                <li><strong>Closet ilimitado</strong> (cadastre quantas peças quiser)</li>
                <li><strong>20 fotos de estúdio/mês</strong> com Manequim Fantasma</li>
                <li><strong>Chat ilimitado</strong> com a Mia, sua stylist pessoal</li>
                <li><strong>Outfits ilimitados</strong> inteligentes para qualquer clima</li>
                <li>Análise visual avançada de tecidos, fit e ocasiões</li>
                <li>Sugestões inteligentes de compras na Wishlist</li>
                <li>Atualizações e novas funções em primeira mão</li>
              </ul>
              <Link href="/cadastro" className="plan-cta plan-cta-accent">
                Experimentar Pro Grátis
              </Link>
              <p className="plan-note">15 dias de teste incluídos · Cancele a qualquer momento</p>
            </div>
          </div>

          {/* Seção Pacotes Extras Avulsos */}
          <div className="addon-pricing-section scroll-animate">
            <div className="addon-pricing-header">
              <span className="addon-badge">✦ CRÉDITOS AVULSOS</span>
              <h3 className="addon-title">Fotos de Estúdio Extras (Manequim Fantasma)</h3>
              <p className="addon-sub">
                Precisa de mais fotos de estúdio para suas peças? Adquira pacotes de créditos avulsos a qualquer momento.
                {' '}<strong>Os créditos nunca expiram</strong> e acumulam com sua conta.
              </p>
            </div>

            <div className="addon-packages-grid">
              {ADDON_PACKAGES.map((pkg) => {
                const isPopular = pkg.id === 'addon_25'
                const isBestValue = pkg.id === 'addon_100'
                const formattedPrice = pkg.price.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
                const perPhoto = (pkg.price / pkg.photos).toFixed(2).replace('.', ',')

                return (
                  <div
                    key={pkg.id}
                    className={`addon-pkg-card ${isPopular ? 'popular' : ''} ${isBestValue ? 'best-value' : ''}`}
                  >
                    {isPopular && <span className="addon-tag">Mais Escolhido</span>}
                    {isBestValue && <span className="addon-tag best">Melhor Valor</span>}
                    <div className="addon-pkg-count">+{pkg.photos}</div>
                    <div className="addon-pkg-label">fotos</div>
                    <div className="addon-pkg-price">{formattedPrice}</div>
                    <div className="addon-pkg-unit">R$ {perPhoto}/foto</div>
                  </div>
                )
              })}
            </div>

            <p className="addon-guarantee-note">
              ✦ Créditos avulsos sem prazo de validade · Podem ser comprados a qualquer momento durante o teste ou no Pro
            </p>
          </div>

        </div>
      </section>

      {/* CTA FINAL */}
      <section className="ec-cta-final">
        <div className="ec-cta-final-inner">
          <div className="cta-badge scroll-animate">
            <span className="badge-dot" />
            <span className="badge-text">COMECE AGORA</span>
          </div>
          {mode === 'dark' ? (
            <h2 className="scroll-animate">
              <span className="cta-line1">COMECE A ARRASAR</span><br />
              <span className="cta-line2">HOJE MESMO.</span>
            </h2>
          ) : (
            <h2 className="scroll-animate">
              <em>Comece a arrasar</em><br />
              <em>hoje mesmo.</em>
            </h2>
          )}
          <p className="cta-sub scroll-animate">
            Cadastre-se grátis e ganhe 15 dias com até 20 peças e 3 fotos de estúdio.
          </p>
          <Link href="/cadastro" className="ec-cta-btn scroll-animate">
            Criar conta grátis →
          </Link>
          <p className="cta-note scroll-animate">
            15 dias grátis com até 20 peças e 3 fotos de estúdio · Sem cartão de crédito · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ec-footer">
        <div className="ec-footer-inner">
          <div className="footer-col footer-brand-col">
            <div className="footer-logo">
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 18 }}>Mia</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 18, color: 'var(--ec-accent)' }}> Outfit AI</span>
            </div>
            <p className="footer-tagline">
              {mode === 'dark' ? 'SEU ESTILO. TODA VEZ.' : 'Sua stylist pessoal com IA.'}
            </p>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Produto</div>
            <a href="#funcionalidades" className="footer-link">Funcionalidades</a>
            <a href="#planos" className="footer-link">Planos</a>
            <Link href="/faq" className="footer-link">FAQ</Link>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Legal</div>
            <Link href="/termos" className="footer-link">Termos de Uso</Link>
            <Link href="/privacidade" className="footer-link">Privacidade</Link>
            <Link href="/sobre" className="footer-link">Sobre</Link>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Contato</div>
            <a href="mailto:suporte@miaoutfitai.com.br" className="footer-link">suporte@miaoutfitai.com.br</a>
          </div>
        </div>
        <div className="ec-footer-bottom">
          <div className="ec-footer-inner">
            <span className="footer-copyright">© 2026 Mia Outfit AI. Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
