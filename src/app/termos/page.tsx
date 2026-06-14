'use client'

import Link from 'next/link'
import { PRECO_PRO_MENSAL } from '@/lib/pricing'

export default function TermosPage() {
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
          Termos de <em style={{color: 'rgba(180,140,60,0.9)'}}>Uso</em>
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
            Ao criar uma conta ou utilizar o Mia Outfit AI, você concorda com estes Termos de Uso.
          </p>
        </div>

        {[
          {
            num: '01', title: 'O que é o Mia Outfit AI',
            content: `O Mia Outfit AI é um aplicativo de consultoria de moda com inteligência artificial, acessível em www.miaoutfitai.com.br. O serviço permite que usuários cadastrem suas peças de roupa e recebam sugestões personalizadas de looks geradas por IA, com base no clima, ocasião e estilo pessoal. O serviço é operado por Marcos Ranauro, pessoa física, com domicílio no Brasil.`
          },
          {
            num: '02', title: 'Cadastro e conta',
            items: [
              'Para usar o Mia Outfit AI você deve criar uma conta com email válido ou login via Google.',
              'Você é responsável por manter a segurança da sua senha e pelo acesso à sua conta.',
              'É proibido criar contas falsas, duplicadas ou em nome de terceiros sem autorização.',
              'Você deve ter pelo menos 13 anos de idade para usar o serviço.'
            ]
          },
          {
            num: '03', title: 'Planos e pagamento',
            content: 'O Mia Outfit AI oferece dois planos:',
            items: [
              'Plano Free (gratuito): acesso limitado às funcionalidades, incluindo 20 mensagens com a Mia, 5 gerações de outfits e 3 análises de peças por mês.',
              `Plano Pro (${PRECO_PRO_MENSAL}): acesso ilimitado a todas as funcionalidades do aplicativo.`,
              'Os pagamentos são processados de forma segura pela Stripe. A assinatura é renovada automaticamente a cada 30 dias.'
            ]
          },
          {
            num: '04', title: 'Cancelamento e reembolso',
            content: 'Você pode cancelar sua assinatura a qualquer momento pelo botão "Gerenciar assinatura" na página de Perfil.',
            items: [
              'Após o cancelamento, o acesso ao Plano Pro permanece ativo até o fim do período já pago.',
              'Não realizamos reembolsos proporcionais por períodos não utilizados.',
              'Em caso de cobrança indevida comprovada, entre em contato em suporte@miaoutfitai.com.br em até 7 dias.'
            ]
          },
          {
            num: '05', title: 'Uso aceitável',
            content: 'Ao usar o Mia Outfit AI, você concorda em não:',
            items: [
              'Usar o serviço para fins ilegais ou que violem direitos de terceiros.',
              'Tentar burlar os limites do plano Free ou manipular o sistema de IA.',
              'Fazer engenharia reversa, copiar ou redistribuir o serviço.',
              'Enviar conteúdo ofensivo, ilegal ou que viole direitos autorais.',
              'Usar bots ou automações para acessar o serviço em escala.'
            ]
          },
          {
            num: '06', title: 'Inteligência artificial e limitações',
            items: [
              'As sugestões de looks geradas pela Mia têm caráter informativo e estético.',
              'Não garantimos que as sugestões serão adequadas para todas as ocasiões ou pessoas.',
              'Não nos responsabilizamos por decisões de compra baseadas nas sugestões da IA.',
              'A IA pode apresentar limitações ou imprecisões nas análises de fotos de peças.'
            ]
          },
          {
            num: '07', title: 'Propriedade intelectual',
            content: 'O Mia Outfit AI, incluindo sua marca, interface, código e a personalidade da Mia, são de propriedade exclusiva do operador do serviço. As fotos de peças enviadas por você permanecem de sua propriedade — utilizamos apenas para gerar suas sugestões de looks.'
          },
          {
            num: '08', title: 'Encerramento de conta',
            content: 'Você pode solicitar o encerramento da sua conta a qualquer momento por email em suporte@miaoutfitai.com.br. Nos reservamos o direito de suspender contas que violem estes Termos, sem reembolso.'
          },
          {
            num: '09', title: 'Alterações nos termos',
            content: 'Podemos atualizar estes Termos de Uso periodicamente. Alterações significativas serão comunicadas por email. O uso continuado implica na aceitação dos novos termos.'
          },
          {
            num: '10', title: 'Lei aplicável',
            content: 'Estes termos são regidos pelas leis brasileiras. Eventuais disputas serão resolvidas no foro da comarca do domicílio do operador, no Brasil.'
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
              Dúvidas sobre os Termos de Uso
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
          <a href="/privacidade" style={{ color: 'rgba(180,140,60,0.6)', textDecoration: 'none' }}>
            Política de Privacidade →
          </a>
          <a href="/login" style={{ color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
            Voltar ao app
          </a>
        </div>
      </div>
    </main>
  )
}
