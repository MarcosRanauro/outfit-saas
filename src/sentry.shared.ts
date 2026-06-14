const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

/** Opções base compartilhadas entre client, server e edge. */
export function getSentryBaseOptions() {
  return {
    dsn,
    enabled: Boolean(dsn),
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
  }
}
