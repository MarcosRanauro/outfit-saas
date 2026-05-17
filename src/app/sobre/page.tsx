import Link from 'next/link'
import './sobre.css'

export default function SobrePage() {
  const especialistas = [
    {
      inicial: 'A',
      nome: 'Ana Cristina',
      localizacao: 'São Paulo · 52 anos',
      especialidade: 'Consultora de imagem corporativa',
      texto:
        'Mais de 20 anos atendendo executivas em transição de carreira, noivas, mulheres que precisavam se reinventar. Ana trouxe para a Mia o olhar técnico sobre proporção, paleta de cores e dress code — o conhecimento que transforma uma roupa comum em uma declaração de intenção.',
    },
    {
      inicial: 'J',
      nome: 'Juliana',
      localizacao: 'Rio de Janeiro · 28 anos',
      especialidade: 'Styling pessoal e universo digital',
      texto:
        'Formada em moda há 3 anos, especializada em consultoria para o universo digital. Juliana representa a geração que entende moda como expressão, não como regra. Ela garantiu que a Mia fale a língua de quem está construindo seu estilo agora — sem elitismo, sem fórmula pronta.',
    },
    {
      inicial: 'R',
      nome: 'Rafael',
      localizacao: 'São Paulo · 34 anos',
      especialidade: 'Moda masculina e personal shopping',
      texto:
        '10 anos trabalhando com styling para homens que nunca souberam — ou nunca se permitiram — cuidar do visual. Rafael provou que homem também tem dúvida, também quer acertar, e também merece orientação real. Graças a ele, a Mia atende com a mesma profundidade para todos os públicos.',
    },
  ]

  return (
    <main className="sobre-wrap">
      <div className="sobre-bg-glow" />

      {/* SEÇÃO 1 — NOSSA HISTÓRIA */}
      <section className="sobre-section">
        <div className="sobre-inner">
          <div className="sobre-badge">✦ NOSSA HISTÓRIA</div>
          <h1 className="sobre-title">
            De vendedor a founder.<br />
            <em className="sobre-subtitle">Da necessidade ao produto.</em>
          </h1>
          <div className="sobre-divider" />
          <div className="sobre-body">
            <p>Tudo começou com um problema simples e muito real.</p>
            <p>
              Marcos Ranauro vendia roupas — Nike, Adidas, Farm, entre outras marcas. Bom nisso, mas sentia
              que algo faltava: a credibilidade visual que só vem quando você sabe se vestir. Para vender
              moda com autoridade, precisava primeiro aprender a usá-la.
            </p>
            <p>
              Como programador, a resposta natural foi criar uma solução. O que começou como um lookbook
              pessoal — um projeto para si mesmo, usando IA para montar combinações com as próprias roupas —
              se transformou em algo maior quando percebeu que essa dor não era só dele.
            </p>
            <p>
              Quantas pessoas acordam todo dia na frente de um armário cheio e não sabem o que vestir?
              Quantas compram mais roupas achando que é falta de peça, quando na verdade é falta de
              orientação?
            </p>
            <p>
              A Mia nasceu para resolver isso. Não apenas para quem tem grana para pagar uma consultora
              particular. Para todo mundo.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2 — A CURADORIA */}
      <section className="sobre-section sobre-section-alt">
        <div className="sobre-inner">
          <div className="sobre-badge">✦ A CURADORIA</div>
          <h2 className="sobre-title">
            Por trás de cada sugestão da Mia,<br />
            <em className="sobre-subtitle">há anos de experiência real.</em>
          </h2>
          <div className="sobre-divider" />
          <div className="sobre-body">
            <p>
              A Mia não foi treinada apenas com dados. Foi construída com o olhar de profissionais que
              entendem de gente — de corpos diferentes, estilos diferentes, realidades diferentes.
            </p>
            <p>Três especialistas contribuíram para moldar como a Mia pensa:</p>
          </div>

          <div className="sobre-cards">
            {especialistas.map((e) => (
              <div key={e.nome} className="sobre-card">
                <div className="sobre-card-header">
                  <div className="sobre-card-avatar">{e.inicial}</div>
                  <div>
                    <div className="sobre-card-nome">{e.nome}</div>
                    <div className="sobre-card-local">{e.localizacao}</div>
                  </div>
                </div>
                <div className="sobre-card-badge">{e.especialidade}</div>
                <p className="sobre-card-texto">{e.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO 3 — MISSÃO */}
      <section className="sobre-section">
        <div className="sobre-inner">
          <div className="sobre-badge">✦ MISSÃO</div>
          <h2 className="sobre-title">
            Democratizar o acesso<br />
            <em className="sobre-subtitle">à moda de verdade.</em>
          </h2>
          <div className="sobre-divider" />
          <blockquote className="sobre-quote">
            Acreditamos que estilo não é privilégio de quem tem dinheiro para pagar uma consultora.
            Que se vestir bem não depende de ter o armário cheio — depende de saber o que você tem e como
            combinar. Que com as peças certas e a orientação certa, qualquer pessoa consegue se sentir bem
            do jeito que é.
          </blockquote>
          <p className="sobre-destaque">
            A Mia existe para provar que com pouco também se tem estilo.
          </p>
        </div>
      </section>

      {/* SEÇÃO 4 — VISÃO */}
      <section className="sobre-section sobre-section-alt">
        <div className="sobre-inner">
          <div className="sobre-badge">✦ VISÃO</div>
          <p className="sobre-visao">
            Ser a stylist pessoal de cada brasileiro — independente de onde mora, quanto ganha ou como se
            veste hoje. Uma IA que cresce com você, aprende seu estilo e te ajuda a se expressar com
            confiança todos os dias.
          </p>
        </div>
      </section>

      {/* SEÇÃO 5 — O PRODUTO */}
      <section className="sobre-section">
        <div className="sobre-inner">
          <div className="sobre-badge">✦ O PRODUTO</div>
          <p className="sobre-produto-texto">
            A Mia é acessível em{' '}
            <a href="https://miaoutfitai.com.br" className="sobre-link">
              miaoutfitai.com.br
            </a>
            . Gratuita para começar, sem necessidade de cartão de crédito.
          </p>
          <Link href="/cadastro" className="sobre-cta">
            Começar grátis →
          </Link>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="sobre-footer">
        <Link href="/landing" className="sobre-footer-link">← Voltar</Link>
        <Link href="/termos" className="sobre-footer-link">Termos de Uso</Link>
        <Link href="/privacidade" className="sobre-footer-link">Privacidade</Link>
        <Link href="/closet" className="sobre-footer-link">Ir para o app</Link>
      </footer>
    </main>
  )
}
