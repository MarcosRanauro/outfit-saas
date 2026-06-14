'use client'

import { useState } from 'react'
import Link from 'next/link'
import '@/app/faq.css'

interface FaqItem {
  q: string
  a: string
}

interface FaqCategory {
  title: string
  items: FaqItem[]
}

const FAQ_DATA: FaqCategory[] = [
  {
    title: 'Sobre a Mia',
    items: [
      {
        q: 'O que é o Mia Outfit AI?',
        a: 'O Mia Outfit AI é um app de moda com inteligência artificial. A Mia é sua stylist pessoal — ela conhece seu closet, sabe o clima e entende seu estilo para sugerir looks perfeitos para cada ocasião.',
      },
      {
        q: 'A Mia é uma pessoa real?',
        a: 'A Mia é uma stylist virtual com inteligência artificial. Ela tem personalidade, conhecimento de moda e se adapta ao seu estilo — mas é uma IA, não uma pessoa real. Somos transparentes sobre isso.',
      },
      {
        q: 'Como a Mia gera os looks?',
        a: 'A Mia analisa seu closet completo, considera o clima atual ou previsto, o período do dia e a ocasião que você informou. Com essas informações, ela cria combinações personalizadas usando as peças que você já tem.',
      },
    ],
  },
  {
    title: 'Closet e peças',
    items: [
      {
        q: 'Como cadastro minhas peças?',
        a: 'Na aba Closet, toque em "+" para adicionar uma peça. Tire uma foto ou escolha da galeria. A Mia analisa automaticamente a imagem e preenche nome, categoria, cor e fit. Você só revisa e salva.',
      },
      {
        q: 'Quantas peças posso cadastrar?',
        a: 'No plano Free você pode cadastrar até 10 peças. No plano Pro o closet é ilimitado.',
      },
      {
        q: 'Posso excluir peças do closet?',
        a: 'Sim! Toque em qualquer peça para abrir os detalhes e use o botão de excluir. A peça e sua foto são removidas permanentemente.',
      },
    ],
  },
  {
    title: 'Planos e pagamento',
    items: [
      {
        q: 'Qual a diferença entre o Free e o Pro?',
        a: 'O plano Free inclui 10 mensagens com a Mia por mês, 3 análises de peças com IA e 3 sugestões de wishlist. O plano Pro tem tudo ilimitado por R$19,00/mês.',
      },
      {
        q: 'Como funciona o cancelamento?',
        a: 'Você pode cancelar a qualquer momento pelo botão "Gerenciar assinatura" no seu Perfil. Após cancelar, você continua com acesso Pro até o fim do período pago. Não fazemos reembolsos proporcionais.',
      },
      {
        q: 'Meus dados de pagamento ficam armazenados?',
        a: 'Não. Os pagamentos são processados pelo Stripe, uma das plataformas mais seguras do mundo. Nunca armazenamos dados do seu cartão.',
      },
    ],
  },
  {
    title: 'Privacidade e segurança',
    items: [
      {
        q: 'Minhas fotos ficam seguras?',
        a: 'Sim. Suas fotos são armazenadas de forma privada no Supabase e só você tem acesso. Usamos as imagens apenas para gerar suas sugestões de looks.',
      },
      {
        q: 'Vocês vendem meus dados?',
        a: 'Não. Nunca vendemos ou compartilhamos seus dados com terceiros para fins comerciais. Veja nossa Política de Privacidade para mais detalhes.',
      },
      {
        q: 'Como excluo minha conta?',
        a: 'Envie um email para suporte@miaoutfitai.com.br solicitando a exclusão. Removeremos todos os seus dados em até 30 dias.',
      },
    ],
  },
]

export default function FaqPage() {
  const [openKey, setOpenKey] = useState<string | null>(null)

  function toggle(key: string) {
    setOpenKey(prev => (prev === key ? null : key))
  }

  return (
    <main className="faq-wrap">
      {/* HEADER */}
      <header className="faq-header">
        <Link href="/landing" className="faq-logo">
          <div className="faq-logo-icon">✦</div>
          <span>Mia <em>Outfit AI</em></span>
        </Link>
      </header>

      {/* HERO */}
      <section className="faq-hero">
        <div className="faq-badge">FAQ</div>
        <h1>Perguntas Frequentes</h1>
        <p>Tire suas dúvidas sobre a Mia, planos e privacidade.</p>
      </section>

      {/* ACCORDION */}
      <div className="faq-content">
        {FAQ_DATA.map((category) => (
          <div key={category.title}>
            <h2 className="faq-category">{category.title}</h2>
            {category.items.map((item, idx) => {
              const key = `${category.title}-${idx}`
              const isOpen = openKey === key
              return (
                <div
                  key={key}
                  className={`faq-item${isOpen ? ' faq-item--open' : ''}`}
                >
                  <button
                    className="faq-question"
                    onClick={() => toggle(key)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <span className="faq-icon" aria-hidden="true">
                      {isOpen ? '×' : '+'}
                    </span>
                  </button>
                  <div className="faq-answer" aria-hidden={!isOpen}>
                    <p>{item.a}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <footer className="faq-footer">
        <div className="faq-footer-links">
          <Link href="/landing">Voltar para o início</Link>
          <Link href="/closet">Abrir o app</Link>
          <Link href="/termos">Termos de Uso</Link>
          <Link href="/privacidade">Privacidade</Link>
        </div>
        <p className="faq-footer-copy">
          © 2026 Mia Outfit AI · <a href="mailto:suporte@miaoutfitai.com.br">suporte@miaoutfitai.com.br</a>
        </p>
      </footer>
    </main>
  )
}
