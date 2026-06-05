import type { Metadata, Viewport } from 'next'
import { Inter, Bebas_Neue } from 'next/font/google'
import './globals.css'
import { GoogleAnalytics } from '@next/third-parties/google'
import Script from 'next/script'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
})

export const viewport: Viewport = {
  themeColor: '#080808',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'Mia Outfit AI — Sua stylist pessoal com IA',
    template: '%s | Mia Outfit AI',
  },
  description: 'Cadastre suas roupas e receba looks personalizados baseados no clima, ocasião e seu estilo. Sua stylist pessoal com inteligência artificial.',
  keywords: ['moda', 'outfit', 'looks', 'inteligência artificial', 'stylist', 'closet', 'roupas'],
  authors: [{ name: 'Mia Outfit AI' }],
  creator: 'Mia Outfit AI',
  publisher: 'Mia Outfit AI',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://www.miaoutfitai.com.br',
    siteName: 'Mia Outfit AI',
    title: 'Mia Outfit AI — Sua stylist pessoal com IA',
    description: 'Cadastre suas roupas e receba looks personalizados baseados no clima, ocasião e seu estilo.',
    images: [
      {
        url: 'https://www.miaoutfitai.com.br/logos-mia-ai/banner-1.png',
        width: 1200,
        height: 630,
        alt: 'Mia Outfit AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mia Outfit AI — Sua stylist pessoal com IA',
    description: 'Cadastre suas roupas e receba looks personalizados baseados no clima, ocasião e seu estilo.',
    images: ['https://www.miaoutfitai.com.br/logos-mia-ai/banner-1.png'],
  },
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/favicon/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon/favicon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var theme=localStorage.getItem('mia_theme')||'light';document.documentElement.setAttribute('data-theme',theme);document.documentElement.setAttribute('data-auth-theme',theme);}catch(e){}})();`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var mode=localStorage.getItem('mia-mode')||'claire';document.documentElement.classList.toggle('mode-dark',mode==='dark');})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${bebas.variable}`}>
        {children}
        <GoogleAnalytics gaId="G-BE79RBHKKT" />
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .catch(function(err) {
                      console.error('SW erro:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}