import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Política de privacidade e proteção de dados do Mia Outfit AI.',
  robots: { index: false, follow: false },
}

export default function PrivacidadeLayout({ children }: { children: React.ReactNode }) {
  return children
}
