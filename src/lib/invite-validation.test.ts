import { describe, expect, it } from 'vitest'
import {
  formatInvitePhoneE164,
  getNormalizedPhone,
  validateInviteFields,
} from './invite-validation'

describe('getNormalizedPhone', () => {
  it('accepts 9-digit local numbers', () => {
    expect(getNormalizedPhone('241234567')).toBe('241234567')
  })

  it('strips leading zero from 10-digit numbers', () => {
    expect(getNormalizedPhone('0241234567')).toBe('241234567')
  })

  it('strips country code from 12-digit numbers', () => {
    expect(getNormalizedPhone('233241234567')).toBe('241234567')
  })

  it('rejects invalid lengths', () => {
    expect(getNormalizedPhone('12345')).toBeNull()
  })
})

describe('validateInviteFields', () => {
  it('returns errors for empty form', () => {
    const errors = validateInviteFields({
      name: '',
      email: '',
      phone: '',
      message: '',
    })
    expect(errors.name).toBeDefined()
    expect(errors.email).toBeDefined()
    expect(errors.phone).toBeDefined()
    expect(errors.message).toBeDefined()
  })

  it('passes with valid data', () => {
    const errors = validateInviteFields({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '0241234567',
      message: 'Wedding booking',
    })
    expect(Object.keys(errors)).toHaveLength(0)
  })
})

describe('formatInvitePhoneE164', () => {
  it('formats ghana numbers', () => {
    expect(formatInvitePhoneE164('0241234567')).toBe('+233241234567')
  })
})
