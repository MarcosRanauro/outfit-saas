import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre',
  description: 'A história por trás do Mia Outfit AI — de vendedor a founder, da necessidade ao produto.',
}

export default function SobreLayout({ children }: { children: React.ReactNode }) {
  return children
}
