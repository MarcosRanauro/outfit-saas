'use client'

import Link from 'next/link'

export default function PrivacidadePage() {
  return (
    <main style={{
      background: '#080808',
      minHeight: '100vh',
      padding: '40px 20px 80px'
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '40px',
          paddingBottom: '20px',
          borderBottom: '0.5px solid rgba(180,140,60,0.15)'
        }}>
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none'
          }}>
            <div style={{
              width: '28px', height: '28px',
              border: '1px solid rgba(180,140,60,0.4)',
              borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', color: 'rgba(180,140,60,0.9)'
            }}>✦</div>
            <span style={{
              fontFamily: 'Georgia, serif',
              fontSize: '16px',
              color: '#f0f0f0',
              letterSpacing: '1px'
            }}>Mia <span style={{color:'rgba(180,140,60,0.9)'}}>Outfit AI</span></span>
          </Link>
        </div>

        <div style={{
          display: 'inline-flex',
          background: 'rgba(180,140,60,0.08)',
          border: '0.5px solid rgba(180,140,60,0.15)',
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '11px',
          letterSpacing: '2px',
          textTransform: 'uppercase' as const,
          color: 'rgba(180,140,60,0.6)',
          marginBottom: '16px'
        }}>✦ Documento legal</div>

        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(28px, 5vw, 40px)',
          fontWeight: 300,
          color: '#f0f0f0',
          marginBottom: '8px',
          lineHeight: 1.2
        }}>
          Política de <em style={{color: 'rgba(180,140,60,0.9)'}}>Privacidade</em>
        </h1>
        <p style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.2)',
          marginBottom: '40px'
        }}>Última atualização: maio de 2026 · Versão 1.0</p>

        <div style={{
          background: 'rgba(180,140,60,0.06)',
          border: '0.5px solid rgba(180,140,60,0.15)',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '40px'
        }}>
          <p style={{color: 'rgba(180,140,60,0.8)', fontSize: '14px', margin: 0}}>
            Sua privacidade é importante para nós. Esta política explica como coletamos, usamos e protegemos seus dados pessoais.
          </p>
        </div>

        {[
          {
            num: '01', title: 'Quem somos',
            content: 'O Mia Outfit AI é operado por Marcos Ranauro, pessoa física, responsável pelo tratamento dos seus dados pessoais conforme a LGPD (Lei nº 13.709/2018). Contato: suporte@miaoutfitai.com.br'
          },
          {
            num: '02', title: 'Dados que coletamos',
            items: [
              'Nome e email (fornecidos no cadastro)',
              'Foto de perfil (opcional)',
              'Dados de login via Google quando aplicável',
              'Altura e peso para personalizar sugestões',
              'Estilo pessoal preferido',
              'Fotos e descrições das peças de roupa',
              'Outfits salvos e histórico de uso',
              'Localização aproximada para clima (não armazenada)',
              'Dados de pagamento processados pelo Stripe (não armazenamos dados de cartão)'
            ]
          },
          {
            num: '03', title: 'Como usamos seus dados',
            items: [
              'Gerar sugestões personalizadas de looks via IA',
              'Personalizar a experiência com base no seu estilo e biotipo',
              'Processar e gerenciar sua assinatura',
              'Enviar emails transacionais (confirmação, recuperação de senha)',
              'Melhorar o serviço e corrigir problemas técnicos',
              'Não usamos seus dados para publicidade. Não vendemos seus dados.'
            ]
          },
          {
            num: '04', title: 'Com quem compartilhamos',
            content: 'Seus dados são compartilhados apenas com:',
            items: [
              'Supabase — banco de dados e autenticação (servidores no Brasil)',
              'Anthropic — processamento de IA para sugestões de looks',
              'Stripe — processamento de pagamentos',
              'Vercel — hospedagem do aplicativo',
              'Open-Meteo — dados de clima (sem identificação do usuário)'
            ]
          },
          {
            num: '05', title: 'Por quanto tempo guardamos',
            items: [
              'Dados da conta: enquanto sua conta estiver ativa',
              'Fotos de peças: até você excluir ou encerrar a conta',
              'Logs técnicos: até 90 dias',
              'Dados fiscais: conforme exigido pela legislação brasileira',
              'Após encerramento da conta: exclusão em até 30 dias'
            ]
          },
          {
            num: '06', title: 'Seus direitos (LGPD)',
            content: 'Como titular dos dados, você tem direito a:',
            items: [
              'Acesso: solicitar cópia dos seus dados pessoais',
              'Correção: atualizar dados incompletos ou incorretos',
              'Exclusão: solicitar a remoção dos seus dados',
              'Portabilidade: receber seus dados em formato estruturado',
              'Revogação: revogar o consentimento a qualquer momento',
              'Para exercer esses direitos: suporte@miaoutfitai.com.br (respondemos em até 15 dias úteis)'
            ]
          },
          {
            num: '07', title: 'Segurança dos dados',
            items: [
              'Todas as comunicações são criptografadas via HTTPS/TLS',
              'Banco de dados com Row Level Security — cada usuário acessa só seus dados',
              'Senhas gerenciadas com criptografia bcrypt',
              'Dados de cartão nunca passam pelos nossos servidores (processados pelo Stripe)'
            ]
          },
          {
            num: '08', title: 'Cookies',
            content: 'Utilizamos apenas cookies estritamente necessários para autenticação e funcionamento do serviço. Não utilizamos cookies de rastreamento ou publicidade.'
          },
          {
            num: '09', title: 'Menores de idade',
            content: 'O serviço não é direcionado a menores de 13 anos. Entre em contato se tiver conhecimento de uso por menores.'
          },
          {
            num: '10', title: 'Alterações nesta política',
            content: 'Esta política pode ser atualizada periodicamente. Alterações significativas serão comunicadas por email com pelo menos 15 dias de antecedência.'
          }
        ].map((section) => (
          <div key={section.num} style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontFamily: 'Georgia, serif',
              fontSize: '20px',
              fontWeight: 400,
              color: '#f0f0f0',
              marginBottom: '14px',
              paddingBottom: '10px',
              borderBottom: '0.5px solid rgba(180,140,60,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                fontSize: '11px',
                letterSpacing: '2px',
                color: 'rgba(180,140,60,0.6)',
                fontFamily: 'sans-serif',
                fontWeight: 400
              }}>{section.num}</span>
              {section.title}
            </h2>
            {section.content && (
              <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: '10px' }}>
                {section.content}
              </p>
            )}
            {section.items && (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {section.items.map((item, i) => (
                  <li key={i} style={{
                    color: 'rgba(255,255,255,0.45)',
                    padding: '6px 0 6px 18px',
                    position: 'relative' as const,
                    borderBottom: '0.5px solid rgba(255,255,255,0.03)'
                  }}>
                    <span style={{
                      position: 'absolute' as const,
                      left: 0,
                      color: 'rgba(180,140,60,0.6)',
                      fontSize: '16px',
                      lineHeight: '1.5'
                    }}>·</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {/* Contact */}
        <div style={{
          background: '#111',
          border: '0.5px solid rgba(180,140,60,0.15)',
          borderRadius: '12px',
          padding: '20px 24px',
          marginTop: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '44px', height: '44px',
            border: '1px solid rgba(180,140,60,0.2)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0
          }}>✉</div>
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.2)', marginBottom: '4px' }}>
              Dúvidas sobre Privacidade e LGPD
            </p>
            <a href="mailto:suporte@miaoutfitai.com.br" style={{ color: 'rgba(180,140,60,0.9)', fontSize: '14px' }}>
              suporte@miaoutfitai.com.br
            </a>
          </div>
        </div>

        {/* Footer links */}
        <div style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '0.5px solid rgba(255,255,255,0.06)',
          display: 'flex',
          gap: '20px',
          fontSize: '12px'
        }}>
          <a href="/termos" style={{ color: 'rgba(180,140,60,0.6)', textDecoration: 'none' }}>
            Termos de Uso →
          </a>
          <a href="/login" style={{ color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
            Voltar ao app
          </a>
        </div>
      </div>
    </main>
  )
}
