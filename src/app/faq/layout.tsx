import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ — Perguntas Frequentes | Mia Outfit AI',
  description: 'Tire suas dúvidas sobre o Mia Outfit AI: planos, closet, pagamento, privacidade e mais.',
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
