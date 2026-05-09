import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Termos de uso do Mia Outfit AI.',
  robots: { index: false, follow: false },
}

export default function TermosLayout({ children }: { children: React.ReactNode }) {
  return children
}
