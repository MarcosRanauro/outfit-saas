'use client'

import Link from 'next/link'
import ModeToggle from '@/components/ui/ModeToggle'
import '../legal.css'

export default function PrivacidadePage() {
  const sections = [
    {
      num: '01',
      title: 'Quem Somos e Compromisso com a LGPD',
      content:
        'O Mia Outfit AI é um serviço operado por Marcos Ranauro, pessoa física responsável pelo tratamento dos seus dados pessoais em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018). Nosso compromisso é tratar seus dados com total transparência, lealdade e segurança. Para qualquer questão sobre privacidade: suporte@miaoutfitai.com.br.',
    },
    {
      num: '02',
      title: 'Dados Pessoais que Coletamos',
      items: [
        'Dados de cadastro e acesso: nome, endereço de e-mail e foto de perfil (quando fornecida via login direto ou autenticação Google).',
        'Dados de personalização estilística: altura, peso aproximado e estilo pessoal preferido (utilizados para calibrar caimento e proporções nas sugestões de looks).',
        'Acervo fotográfico e closet: fotografias das suas peças de vestuário, descrições, categorias, cores e notas cadastradas.',
        'Histórico e lookbook: combinações de roupas salvas, ocasiões marcadas e itens de interesse na Wishlist.',
        'Localização aproximada (não persistente): cidade ou coordenadas coletadas pontualmente via geolocalização do navegador para consultar a previsão meteorológica do momento (não mantemos histórico de rastreamento geográfico).',
        'Dados financeiros: transações intermediadas via Stripe. O Mia Outfit AI nunca tem acesso aos dados completos do seu cartão de crédito.',
      ],
    },
    {
      num: '03',
      title: 'Como Usamos seus Dados',
      items: [
        'Gerar combinações personalizadas e inteligentes de looks com base no seu closet e no clima em tempo real.',
        'Processar fotos com inteligência artificial para remover fundos e aplicar o efeito de Manequim Fantasma (Ghost Mannequin).',
        'Personalizar os conselhos de estilo da Mia de acordo com suas ocasiões e biotipo.',
        'Processar suas assinaturas e créditos avulsos através de integração segura com gateways de pagamento.',
        'Garantir suporte técnico e comunicações essenciais sobre sua conta ou atualizações do serviço.',
        'Compromisso estrito: NÃO vendemos seus dados para terceiros e NÃO os utilizamos para publicidade direcionada.',
      ],
    },
    {
      num: '04',
      title: 'Processamento Seguro de Pagamentos via Stripe',
      content:
        'Todas as transações financeiras do Mia Outfit AI — tanto a assinatura do Plano Pro quanto a compra de pacotes avulsos de fotos — são processadas pela Stripe, Inc., líder mundial em pagamentos com certificação máxima de segurança PCI-DSS Nível 1.',
      items: [
        'Isolamento de dados de cartão: número do cartão de crédito, código CVV/CVC e datas de expiração são digitados diretamente em campos seguros da Stripe e nunca passam nem ficam armazenados em nossos servidores.',
        'Sincronização segura: nosso servidor recebe apenas tokens seguros e confirmações de transação via webhooks criptografados (HMAC SHA-256) para conceder o plano Pro ou os créditos avulsos adquiridos.',
        'Gerenciamento simplificado: você pode gerenciar, alterar forma de pagamento ou cancelar assinaturas a qualquer momento através do Portal de Clientes oficial da Stripe.',
      ],
    },
    {
      num: '05',
      title: 'Processamento de Imagens e Dados via IA (Sem Treino Público)',
      content:
        'A Mia Outfit AI utiliza provedores de ponta em inteligência artificial para entregar análises estilísticas e fotos de estúdio de alta fidelidade. Mantemos políticas rigorosas de proteção e privacidade com todos eles:',
      items: [
        'Anthropic (Claude): responsável pela análise visual das peças, categorização, chat e curadoria de looks.',
        'Photoroom & Remove.bg: responsáveis pelo recorte de fotos, remoção de fundos complexos e geração do efeito estúdio Manequim Fantasma.',
        'OpenAI: utilizada pontualmente para validação e moderação de conteúdo impróprio ou não permitido.',
        'Garantia de Não Treinamento Público: por contrato e diretrizes de API empresarial (Enterprise/Business API), nenhuma foto de roupa, imagem enviada, mensagem no chat ou dado pessoal é utilizado pelas fornecedoras de IA (Anthropic, Photoroom, OpenAI) para treinamento público, aperfeiçoamento de seus modelos de linguagem ou formação de bases abertas de dados.',
        'O processamento é estritamente efêmero e confidencial, limitado ao tempo necessário para processar e devolver o resultado visual à sua conta.',
      ],
    },
    {
      num: '06',
      title: 'Compartilhamento de Dados com Parceiros Técnicos',
      content:
        'Seus dados são transmitidos unicamente para os fornecedores de infraestrutura imprescindíveis à operação do aplicativo:',
      items: [
        'Supabase: armazenamento de dados de perfil e fotos no bucket de storage, em servidores seguros localizados na região de São Paulo, Brasil.',
        'Vercel: plataforma de hospedagem da aplicação web e execução de funções serverless.',
        'Stripe: operadora de pagamentos e checkout seguro.',
        'Anthropic & Photoroom: provedoras de IA para análise e fotos de estúdio.',
        'Open-Meteo: API pública para consulta meteorológica (requisição técnica sem transmissão de dados pessoais do usuário).',
      ],
    },
    {
      num: '07',
      title: 'Retenção e Exclusão Definitiva de Dados',
      items: [
        'Enquanto sua conta estiver ativa, manteremos seus dados para que seu closet e histórico permaneçam disponíveis.',
        'Fotos de peças individuais podem ser excluídas a qualquer momento na tela de edição da peça.',
        'Exclusão completa de conta: você pode apagar sua conta a qualquer momento em Perfil → Apagar minha conta. A ação é irreversível: removemos imediatamente suas peças, fotos, looks salvos, perfil e cancelamos qualquer assinatura ativa no Stripe.',
        'Backups de segurança técnicos são rotacionados e descartados automaticamente em até 30 dias.',
      ],
    },
    {
      num: '08',
      title: 'Seus Direitos como Titular de Dados (LGPD)',
      content: 'A LGPD garante a você pleno controle sobre seus dados pessoais, incluindo os direitos de:',
      items: [
        'Confirmação e Acesso: saber se tratamos seus dados e solicitar uma cópia dos registros mantidos.',
        'Correção: atualizar informações incompletas, inexatas ou desatualizadas diretamente pelo seu perfil.',
        'Exclusão e Revogação: eliminar seus dados cadastrais e revogar seu consentimento quando desejar.',
        'Portabilidade: solicitar a exportação das suas informações em formato acessível.',
        'Canal direto: para exercer qualquer um dos seus direitos, envie um e-mail para suporte@miaoutfitai.com.br. Respondemos a todas as solicitações no prazo legal.',
      ],
    },
    {
      num: '09',
      title: 'Segurança da Informação',
      items: [
        'Todas as comunicações entre o seu navegador ou aplicativo e nossos servidores utilizam criptografia robusta HTTPS com certificados TLS modernos.',
        'O banco de dados PostgreSQL é protegido com políticas de Row Level Security (RLS), garantindo que cada usuário acesse única e exclusivamente os seus próprios registros.',
        'Credenciais sensíveis de parceiros e chaves de API nunca são expostas no código de frontend.',
      ],
    },
    {
      num: '10',
      title: 'Cookies e Tecnologias de Sessão',
      content:
        'Utilizamos apenas cookies essenciais para manter você autenticado com segurança e salvar sua preferência de visualização (Édition Claire ou Dark Edition). Não empregamos cookies de terceiros para rastreamento invasivo ou venda de anúncios.',
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

        <div className="legal-badge">✦ Transparência & Privacidade</div>

        <h1 className="legal-title">
          Política de <em>Privacidade</em>
        </h1>
        <p className="legal-updated">
          Última atualização: Novembro de 2026 · Versão 1.9.1
        </p>

        <div className="legal-intro-box">
          <p className="legal-intro-text">
            Sua confiança e a privacidade do seu estilo são prioridades fundamentais para nós. Esta política descreve de forma clara e objetiva como coletamos, tratamos, protegemos seus dados e garantimos a máxima segurança em pagamentos e inteligência artificial.
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

        {/* Card de Contato / Encarregado */}
        <div className="legal-contact-box">
          <div className="legal-contact-icon">🛡️</div>
          <div>
            <p className="legal-contact-label">Encarregado de Proteção de Dados (DPO)</p>
            <a href="mailto:suporte@miaoutfitai.com.br" className="legal-contact-link">
              suporte@miaoutfitai.com.br
            </a>
          </div>
        </div>

        {/* Links de Rodapé */}
        <footer className="legal-footer-links">
          <Link href="/termos">Termos de Uso →</Link>
          <Link href="/login" className="back-link">Voltar ao App</Link>
          <Link href="/" className="back-link">Página Inicial</Link>
        </footer>

      </div>
    </main>
  )
}
