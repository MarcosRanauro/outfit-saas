import type { NextConfig } from "next";

// Em produção, definir NEXT_PUBLIC_APP_URL=https://miaoutfitai.com.br no Vercel

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
