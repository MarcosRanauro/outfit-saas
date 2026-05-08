import type { NextConfig } from "next";

// Em produção, definir NEXT_PUBLIC_APP_URL=https://miaoutfitai.com.br no Vercel

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
