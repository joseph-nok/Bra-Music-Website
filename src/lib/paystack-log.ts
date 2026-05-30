export type PaystackStage = 'INIT' | 'WEBHOOK' | 'VERIFY' | 'MOMO'

function formatReference(reference?: string) {
  const value = reference?.trim()
  return value && value.length > 0 ? value : 'unknown'
}

export function paystackInfo(
  stage: PaystackStage,
  reference: string | undefined,
  message: string,
) {
  console.log(`[PAYSTACK][${stage}][${formatReference(reference)}] ${message}`)
}

export function paystackErr(
  stage: PaystackStage,
  reference: string | undefined,
  message: string,
  error?: unknown,
) {
  const detail =
    error instanceof Error
      ? error.message
      : error !== undefined
        ? String(error)
        : ''
  const suffix = detail ? `: ${detail}` : ''
  console.error(
    `[PAYSTACK][${stage}][${formatReference(reference)}] ${message}${suffix}`,
  )
}

export function maskPaystackUrl(url?: string) {
  if (!url) {
    return '[none]'
  }

  try {
    const parsed = new URL(url)
    return `${parsed.origin}${parsed.pathname}[masked]`
  } catch {
    return '[invalid-url]'
  }
}
