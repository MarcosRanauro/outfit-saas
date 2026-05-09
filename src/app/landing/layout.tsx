import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mia Outfit AI — Sua stylist pessoal com IA',
  description: 'Cadastre suas roupas e receba looks personalizados baseados no clima, ocasião e seu estilo pessoal.',
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children
}
