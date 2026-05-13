'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import '../landing.css'

export default function LandingPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
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
          <Link href="/cadastro" className="lp-nav-cta">Começar grátis</Link>
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
          <Link href="/cadastro" className="lp-btn-primary">Começar grátis</Link>
          <a href="#funcionalidades" className="lp-btn-secondary">Ver como funciona</a>
        </div>

        {installPrompt && !isInstalled && (
          <div style={{ marginTop: '12px' }}>
            <button onClick={handleInstall} className="lp-btn-install">
              📲 Instalar app no celular
            </button>
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

      {/* PLANOS */}
      <section className="lp-pricing" id="planos">
        <div className="lp-section-label">✦ Planos</div>
        <h2 className="lp-section-title">Simples e <em>transparente</em></h2>
        <div className="lp-pricing-grid">
          <div className="lp-pricing-card">
            <div className="lp-pricing-badge">Gratuito</div>
            <div className="lp-pricing-name">Free</div>
            <div className="lp-pricing-price">
              <span className="lp-amount">R$0</span>
              <span className="lp-period">/mês</span>
            </div>
            <ul className="lp-pricing-features">
              <li>✓ 10 mensagens com a Mia/mês</li>
              <li>✓ 3 análises de peças com IA/mês</li>
              <li>✓ 3 sugestões de wishlist/mês</li>
              <li>✓ Closet e Lookbook</li>
            </ul>
            <Link href="/cadastro" className="lp-pricing-btn lp-btn-outline">
              Começar grátis
            </Link>
          </div>

          <div className="lp-pricing-card lp-pricing-featured">
            <div className="lp-pricing-badge">Mais popular</div>
            <div className="lp-pricing-name">Pro</div>
            <div className="lp-pricing-price">
              <span className="lp-amount">R$19</span>
              <span className="lp-period">/mês</span>
            </div>
            <ul className="lp-pricing-features">
              <li>✓ Mensagens ilimitadas com a Mia</li>
              <li>✓ Outfits ilimitados</li>
              <li>✓ Análises ilimitadas</li>
              <li>✓ Wishlist inteligente</li>
              <li>✓ Cancele quando quiser</li>
            </ul>
            <Link href="/cadastro" className="lp-pricing-btn lp-btn-gold">
              Assinar Pro
            </Link>
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
          <Link href="/termos">Termos de Uso</Link>
          <Link href="/privacidade">Privacidade</Link>
          <a href="mailto:suporte@miaoutfitai.com.br">suporte@miaoutfitai.com.br</a>
        </div>
      </footer>

    </div>
  )
}
