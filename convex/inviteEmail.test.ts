import { describe, expect, it } from 'vitest'
import {
  DEFAULT_INVITE_AUTO_ACK_BODY,
  inviteAutoAckHtml,
  inviteAutoAckPlainText,
  officialResponseHtml,
} from './inviteEmail'

describe('inviteEmail templates', () => {
  it('includes recipient name in plain text ack', () => {
    const text = inviteAutoAckPlainText('Jane Doe')
    expect(text).toContain('Dear Jane,')
    expect(text).toContain(DEFAULT_INVITE_AUTO_ACK_BODY)
  })

  it('escapes html in auto ack', () => {
    const html = inviteAutoAckHtml('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('escapes html in official response', () => {
    const html = officialResponseHtml('Guest', '<b>Hello</b>')
    expect(html).toContain('&lt;b&gt;Hello&lt;/b&gt;')
  })
})
