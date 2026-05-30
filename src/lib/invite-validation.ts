export type InviteFieldErrors = Record<string, string>

export function getNormalizedPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')

  if (digits.startsWith('233') && digits.length === 12) {
    return digits.substring(3)
  }

  if (digits.startsWith('0') && digits.length === 10) {
    return digits.substring(1)
  }

  if (digits.length === 9) {
    return digits
  }

  return null
}

export function validateInviteFields(input: {
  name: string
  email: string
  phone: string
  message: string
}): InviteFieldErrors {
  const errors: InviteFieldErrors = {}

  if (!input.name.trim()) {
    errors.name = 'Please enter your full name or organization.'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!input.email.trim() || !emailRegex.test(input.email)) {
    errors.email =
      "The email address you entered doesn't look right. Example: name@example.com"
  }

  if (!getNormalizedPhone(input.phone)) {
    errors.phone =
      'Please enter a valid phone number (e.g. 024XXXXXXX or 24XXXXXXX).'
  }

  if (!input.message.trim()) {
    errors.message = "Don't forget to tell us a bit about your event!"
  }

  return errors
}

export function formatInvitePhoneE164(phone: string): string {
  const normalized = getNormalizedPhone(phone)
  if (!normalized) {
    throw new Error('Invalid phone number')
  }
  return `+233${normalized}`
}
