import * as Sentry from '@sentry/nextjs'
import { getSentryBaseOptions } from './sentry.shared'

Sentry.init(getSentryBaseOptions())
