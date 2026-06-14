import type { NextConfig } from "next";
import type { SentryBuildOptions } from "@sentry/nextjs";
import { withSentryConfig } from "@sentry/nextjs";

// Em produção, definir NEXT_PUBLIC_APP_URL=https://miaoutfitai.com.br no Vercel

function getSupabaseHostname(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

function getSupabaseOrigin(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

const supabaseHostname = getSupabaseHostname();
const supabaseOrigin = getSupabaseOrigin();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [
            {
              protocol: 'https' as const,
              hostname: supabaseHostname,
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    // Report-Only de propósito: coleta violações sem bloquear tráfego legítimo.
    // Trocar para Content-Security-Policy (bloqueante) só após revisar relatórios em produção.
    const cspReportOnly = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      [
        "img-src 'self' data: blob:",
        supabaseOrigin,
        'https://*.supabase.co',
        'https://www.google-analytics.com',
        'https://www.googletagmanager.com',
      ].filter(Boolean).join(' '),
      [
        "connect-src 'self'",
        supabaseOrigin,
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://api.stripe.com',
        'https://www.google-analytics.com',
        'https://region1.google-analytics.com',
        'https://www.googletagmanager.com',
        'https://*.sentry.io',
        'https://*.ingest.sentry.io',
      ].filter(Boolean).join(' '),
      "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Permissions-Policy', value: 'camera=(self), geolocation=(self), microphone=()' },
      { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;
const sentrySourceMapsEnabled = Boolean(
  sentryAuthToken && sentryOrg && sentryProject
);

const sentryBuildOptions: SentryBuildOptions = {
  silent: !process.env.CI,
  sourcemaps: {
    disable: !sentrySourceMapsEnabled,
  },
};

if (sentrySourceMapsEnabled) {
  sentryBuildOptions.org = sentryOrg;
  sentryBuildOptions.project = sentryProject;
  sentryBuildOptions.authToken = sentryAuthToken;
  sentryBuildOptions.widenClientFileUpload = true;
}

export default withSentryConfig(nextConfig, sentryBuildOptions);
