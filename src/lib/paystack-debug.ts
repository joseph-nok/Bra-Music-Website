export type PaystackLogScope =
  | 'PAYSTACK WEBHOOK'
  | 'INIT PAYMENT'
  | 'VERIFY PAYMENT'
  | 'MOMO PAYMENT'

const SENSITIVE_KEY_PATTERN =
  /secret|password|authorization|token|api[_-]?key|private[_-]?key|card|cvv|cvc|pin/i

export const PAYSTACK_DEBUG =
  typeof process !== 'undefined' && process.env?.PAYSTACK_DEBUG === 'false'
    ? false
    : typeof import.meta !== 'undefined' &&
        import.meta.env?.VITE_PAYSTACK_DEBUG === 'false'
      ? false
      : true

export type PaystackLogContext = {
  reference?: string
  checkoutId?: string
  orderId?: string
  [key: string]: unknown
}

export function correlationId(context?: PaystackLogContext): string {
  return (
    context?.reference ??
    context?.checkoutId ??
    context?.orderId ??
    'unknown'
  )
}

function sanitizeValue(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEY_PATTERN.test(key)) {
    return '[REDACTED]'
  }

  if (value === null || value === undefined) {
    return value
  }

  if (typeof value === 'string') {
    return value.length > 2000 ? `${value.slice(0, 2000)}…[truncated]` : value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item))
  }

  if (typeof value === 'object') {
    return sanitizeForLog(value as Record<string, unknown>)
  }

  return String(value)
}

export function sanitizeForLog(value: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, entryValue] of Object.entries(value)) {
    sanitized[key] = sanitizeValue(entryValue, key)
  }

  return sanitized
}

export function sanitizeHeaders(headers: Headers): Record<string, string> {
  const sanitized: Record<string, string> = {}

  headers.forEach((value, key) => {
    sanitized[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : value
  })

  return sanitized
}

export function paystackLog(
  scope: PaystackLogScope,
  message: string,
  context?: PaystackLogContext,
) {
  if (!PAYSTACK_DEBUG) {
    return
  }

  const id = correlationId(context)
  const payload =
    context && Object.keys(context).length > 0
      ? sanitizeForLog(context)
      : undefined

  if (payload) {
    console.log(`[${scope}] [${id}] ${message}`, payload)
    return
  }

  console.log(`[${scope}] [${id}] ${message}`)
}

export function paystackError(
  scope: PaystackLogScope,
  message: string,
  context?: PaystackLogContext,
  error?: unknown,
) {
  const id = correlationId(context)
  const payload =
    context && Object.keys(context).length > 0
      ? sanitizeForLog(context)
      : undefined

  if (error !== undefined) {
    console.error(`[${scope}] [${id}] ${message}`, payload ?? '', error)
    return
  }

  console.error(`[${scope}] [${id}] ${message}`, payload ?? '')
}
