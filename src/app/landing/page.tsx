'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import '../landing.css'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const features = [
  { icon: '✦', title: 'Mia — Sua stylist IA', desc: 'Converse naturalmente. A Mia entende seu estilo, o clima e a ocasião para criar looks perfeitos.' },
  { icon: '👗', title: 'Closet inteligente', desc: 'Cadastre suas peças com foto. A Mia analisa automaticamente cor, fit e estilo de cada item.' },
  { icon: '🌤', title: 'Clima em tempo real', desc: 'Looks adaptados ao clima atual ou de qualquer data futura. Nunca mais errar na roupa.' },
  { icon: '📌', title: 'Peça âncora', desc: 'Quer usar uma peça específica? A Mia monta o look inteiro em torno dela.' },
  { icon: '📖', title: 'Lookbook pessoal', desc: 'Salve seus looks favoritos e acesse quando precisar. Filtre por ocasião ou período.' },
  { icon: '🛍', title: 'Wishlist inteligente', desc: 'A Mia sugere as peças que estão faltando no seu closet para completar seus looks.' },
]

const tickerItems = [
  '✦ STYLIST PESSOAL',
  '✦ INTELIGÊNCIA ARTIFICIAL',
  '✦ SEU CLOSET',
  '✦ LOOKS PERFEITOS',
  '✦ CLIMA EM TEMPO REAL',
  '✦ MIA OUTFIT AI',
  '✦ 15 DIAS GRÁTIS',
  '✦ STYLIST PESSOAL',
  '✦ INTELIGÊNCIA ARTIFICIAL',
  '✦ SEU CLOSET',
  '✦ LOOKS PERFEITOS',
  '✦ CLIMA EM TEMPO REAL',
  '✦ MIA OUTFIT AI',
  '✦ 15 DIAS GRÁTIS',
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
    localStorage.setItem('mia_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

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
          <button
            className="lp-theme-toggle"
            onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            title="Alternar tema"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <Link href="/cadastro" className="lp-nav-cta">15 dias grátis</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-content scroll-animate">
          <div className="lp-hero-badge">✦ Sua stylist pessoal com IA</div>
          <h1>
            Seu estilo,<br />
            <em>elevado pela IA</em>
          </h1>
          <p>
            A Mia conhece seu closet, entende seu estilo e
            monta looks perfeitos para cada ocasião —
            considerando o clima, seu biotipo e o que você
            quer comunicar.
          </p>
          <div className="lp-hero-btns">
            <Link href="/cadastro" className="lp-btn-primary">Começar 15 dias grátis</Link>
            <a href="#funcionalidades" className="lp-btn-secondary">Ver como funciona</a>
          </div>
          <div className="lp-hero-trust">
            <span>✦ Sem cartão de crédito</span>
            <span>✦ Cancele quando quiser</span>
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
              background: 'rgba(180,140,60,0.06)',
              border: '0.5px solid rgba(180,140,60,0.25)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'rgba(180,140,60,0.7)',
              lineHeight: 1.5,
            }}>
              📲 Para instalar: toque em{' '}
              <strong style={{ color: 'rgba(180,140,60,0.9)' }}>Compartilhar</strong>
              {' '}→{' '}
              <strong style={{ color: 'rgba(180,140,60,0.9)' }}>Adicionar à Tela de Início</strong>
            </div>
          )}
        </div>

        <div className="lp-hero-illustration scroll-animate scroll-animate-delay-2">
          <img
            src="/illustrations/Hero-principal.png"
            alt="Fashion illustration"
            className="lp-hero-img"
          />
        </div>
      </section>

      {/* TICKER */}
      <div className="lp-ticker">
        <div className="lp-ticker-track">
          {tickerItems.map((text, i) => (
            <span key={i} className="lp-ticker-item">{text}</span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="lp-features" id="funcionalidades">
        <div className="lp-features-inner">
          <div className="lp-features-text">
            <div className="lp-section-label scroll-animate">✦ Funcionalidades</div>
            <h2 className="lp-section-title scroll-animate">
              Tudo que você precisa para<br />
              <em>arrasar todos os dias</em>
            </h2>
            <div className="lp-features-grid">
              {features.map((f, i) => (
                <div
                  key={i}
                  className={`lp-feature-card scroll-animate scroll-animate-delay-${(i % 5) + 1}`}
                >
                  <div className="lp-feature-icon">{f.icon}</div>
                  <div className="lp-feature-title">{f.title}</div>
                  <div className="lp-feature-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="lp-features-illustration scroll-animate">
            <img
              src="/illustrations/Features.png"
              alt="Fashion items illustration"
              className="lp-features-img"
            />
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="lp-testimonials">
        <div className="lp-section-label scroll-animate">✦ Depoimentos</div>
        <h2 className="lp-section-title scroll-animate">O que dizem nossos <em>usuários</em></h2>
        <div className="lp-testimonials-grid">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`lp-testimonial-card scroll-animate scroll-animate-delay-${i + 1}`}
            >
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
          <div className="lp-curadoria-illustration scroll-animate">
            <img
              src="/illustrations/Curadoria.png"
              alt="Wardrobe illustration"
              className="lp-curadoria-img"
            />
          </div>
          <div className="lp-curadoria-content scroll-animate scroll-animate-delay-2">
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
        </div>
      </section>

      {/* PLANOS */}
      <section className="lp-pricing" id="planos">
        <div className="lp-section-label scroll-animate">✦ Planos</div>
        <h2 className="lp-section-title scroll-animate">Simples e <em>transparente</em></h2>
        <div className="lp-pricing-grid" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div className="lp-pricing-card lp-pricing-featured scroll-animate">
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
