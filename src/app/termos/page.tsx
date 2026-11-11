'use client'

import Link from 'next/link'
import ModeToggle from '@/components/ui/ModeToggle'
import { PRECO_PRO_MENSAL } from '@/lib/pricing'
import '../legal.css'

export default function TermosPage() {
  const sections = [
    {
      num: '01',
      title: 'O que é o Mia Outfit AI',
      content:
        'O Mia Outfit AI é um aplicativo e plataforma web de consultoria de moda pessoal com inteligência artificial, acessível em www.miaoutfitai.com.br. O serviço permite que usuários cadastrem peças de roupa do seu próprio guarda-roupa, gerem fotos com fundo profissional e manequim fantasma, e recebam sugestões personalizadas de looks geradas por IA com base em clima, ocasião e estilo pessoal. O serviço é operado por Marcos Ranauro, com domicílio no Brasil.',
    },
    {
      num: '02',
      title: 'Cadastro e Acesso à Conta',
      items: [
        'Para utilizar o Mia Outfit AI, você deve criar uma conta com e-mail válido ou via autenticação Google.',
        'Você é inteiramente responsável por manter a confidencialidade de sua senha e pelos acessos à sua conta.',
        'É expressamente proibido criar contas falsas, duplicadas ou se passar por terceiros sem autorização.',
        'O serviço é destinado a usuários com idade igual ou superior a 13 anos.',
      ],
    },
    {
      num: '03',
      title: 'Planos, Trial de 15 Dias e Pacotes Extras',
      content:
        'O modelo de monetização do Mia Outfit AI é composto por período de teste gratuito, assinatura mensal e compra de pacotes avulsos:',
      items: [
        'Período de Teste Gratuito (Trial de 15 dias): todo novo usuário cadastrado recebe automaticamente 15 dias de teste com acesso completo, sem necessidade de cartão de crédito. O trial permite cadastrar até 20 peças no closet, inclui 3 fotos de estúdio (Manequim Fantasma) e libera o chat com a Mia e a geração de looks. Após o término dos 15 dias, novas inclusões no closet e fotos de estúdio ficam bloqueadas até a assinatura do Pro ou aquisição de pacotes avulsos.',
        `Assinatura do Plano Pro (${PRECO_PRO_MENSAL}): garante closet inteligente ilimitado (sem limite de peças), chat com a Mia ilimitado, geração ilimitada de looks para qualquer ocasião e uma cota de 20 fotos de estúdio (Manequim Fantasma) por ciclo de faturamento.`,
        'Regra da Cota Mensal do Pro: a franquia de 20 fotos de estúdio inclusa no Plano Pro renova a cada 30 dias e NÃO é cumulativa (fotos não utilizadas não acumulam para o mês seguinte).',
        'Pacotes Extras Avulsos (Manequim Fantasma): tanto usuários em teste quanto assinantes Pro podem adquirir pacotes adicionais de fotos de estúdio a qualquer momento (+10 fotos por R$ 9,90, +25 fotos por R$ 24,90, +50 fotos por R$ 49,90 e +100 fotos por R$ 89,90).',
        'Regra de Não Expiração dos Créditos Extras: os créditos de fotos adquiridos em pacotes avulsos NUNCA expiram e acumulam indefinidamente no saldo da conta do usuário.',
        'Processamento Seguro: todas as cobranças de assinaturas e compras avulsas são processadas com total segurança pela Stripe.',
      ],
    },
    {
      num: '04',
      title: 'Cancelamento e Reembolso',
      content:
        'Você tem total autonomia para gerenciar e cancelar sua assinatura Pro a qualquer momento diretamente pela página de Perfil no botão "Gerenciar assinatura" (portal Stripe).',
      items: [
        'Ao cancelar o Plano Pro, seu acesso aos benefícios ilimitados permanece ativo até o término do ciclo mensal já pago.',
        'Não realizamos reembolsos proporcionais por períodos parciais não utilizados de assinaturas ativas.',
        'Créditos de fotos avulsas não são reembolsáveis após a utilização parcial do pacote.',
        'Em caso de comprovada duplicidade ou cobrança indevida, nossa equipe fornecerá suporte imediato através de suporte@miaoutfitai.com.br dentro do prazo de 7 dias.',
      ],
    },
    {
      num: '05',
      title: 'Uso Aceitável e Regras de Conduta',
      content: 'Ao utilizar o Mia Outfit AI, você concorda em agir com boa-fé e em NÃO:',
      items: [
        'Utilizar a plataforma para atividades ilícitas, fraudulentas ou que violem direitos de terceiros.',
        'Enviar fotos ofensivas, pornográficas, violentas ou que desrespeitem direitos autorais ou de imagem.',
        'Tentar burlar os limites do plano Trial ou manipular os sistemas de rate limiting e APIs de inteligência artificial.',
        'Executar engenharia reversa, clonar a interface ou tentar extrair código-fonte e algoritmos.',
        'Empregar scrapers, spiders ou ferramentas automatizadas para sobrecarregar a infraestrutura do serviço.',
      ],
    },
    {
      num: '06',
      title: 'Inteligência Artificial e Isenção de Responsabilidade',
      items: [
        'As sugestões de looks e análises de imagem da Mia têm finalidade estilística, criativa e informativa.',
        'Não garantimos adequação absoluta de trajes a códigos de vestimenta específicos e não nos responsabilizamos por decisões de compra ou descarte de vestuário tomadas com base nas sugestões.',
        'A visão computacional depende da nitidez e iluminação das fotos enviadas e pode apresentar imprecisões pontuais na detecção de cores ou tecidos.',
      ],
    },
    {
      num: '07',
      title: 'Propriedade Intelectual',
      content:
        'A marca Mia Outfit AI, seu design de interface (Édition Claire e Dark Edition), layout de armário tátil, logotipos e códigos são de propriedade exclusiva do operador. As fotos das suas peças de roupas continuam sendo de sua propriedade — nós as utilizamos unicamente para fornecer as análises e consultorias contratadas.',
    },
    {
      num: '08',
      title: 'Encerramento de Conta e Exclusão',
      content:
        'Você pode excluir sua conta e todos os dados associados a qualquer momento pela tela de Perfil ("Apagar minha conta"). Reservamo-nos o direito de suspender ou encerrar contas que violem gravemente estes Termos, sem direito a compensação.',
    },
    {
      num: '09',
      title: 'Alterações destes Termos',
      content:
        'Estes Termos de Uso podem ser revisados periodicamente para refletir evoluções do produto ou exigências legais. Modificações substanciais serão comunicadas aos usuários cadastrados via e-mail ou aviso no aplicativo.',
    },
    {
      num: '10',
      title: 'Legislação Aplicável e Foro',
      content:
        'Estes termos são regidos e interpretados de acordo com as leis da República Federativa do Brasil, em especial o Marco Civil da Internet e a legislação de proteção ao consumidor. Fica eleito o foro da comarca do domicílio do operador para dirimir eventuais controvérsias.',
    },
  ]

  return (
    <main className="legal-page">
      <div className="legal-container">

        {/* Header com Navegação e Toggle de Modo */}
        <header className="legal-header">
          <Link href="/" className="legal-brand" aria-label="Ir para a página inicial">
            <div className="legal-brand-icon">✦</div>
            <div className="legal-brand-text">
              Mia <span>Outfit AI</span>
            </div>
          </Link>
          <ModeToggle />
        </header>

        <div className="legal-badge">✦ Documento Legal</div>

        <h1 className="legal-title">
          Termos de <em>Uso</em>
        </h1>
        <p className="legal-updated">
          Última atualização: Novembro de 2026 · Versão 1.9.1
        </p>

        <div className="legal-intro-box">
          <p className="legal-intro-text">
            Bem-vindo ao <strong>Mia Outfit AI</strong>. Ao criar uma conta, usufruir do período de teste gratuito ou contratar nossos serviços e pacotes, você expressa sua concordância integral com estes Termos de Uso.
          </p>
        </div>

        {sections.map((section) => (
          <section key={section.num} className="legal-section">
            <h2 className="legal-section-title">
              <span className="legal-section-num">{section.num}</span>
              {section.title}
            </h2>
            {section.content && (
              <p className="legal-section-content">{section.content}</p>
            )}
            {section.items && (
              <ul className="legal-list">
                {section.items.map((item, i) => (
                  <li key={i} className="legal-list-item">
                    <span className="legal-bullet">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* Card de Contato */}
        <div className="legal-contact-box">
          <div className="legal-contact-icon">✉</div>
          <div>
            <p className="legal-contact-label">Dúvidas sobre os Termos de Uso?</p>
            <a href="mailto:suporte@miaoutfitai.com.br" className="legal-contact-link">
              suporte@miaoutfitai.com.br
            </a>
          </div>
        </div>

        {/* Links de Rodapé */}
        <footer className="legal-footer-links">
          <Link href="/privacidade">Política de Privacidade →</Link>
          <Link href="/login" className="back-link">Voltar ao App</Link>
          <Link href="/" className="back-link">Página Inicial</Link>
        </footer>

      </div>
    </main>
  )
}
