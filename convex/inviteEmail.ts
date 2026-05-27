/** Default body sent to guests immediately after they submit an invite. */
export const DEFAULT_INVITE_AUTO_ACK_BODY = `Thank you for inviting Baah Prosper Music to your event.

Please be assured that we are currently reviewing your invitation. Our team will reach out to you soon with a personal response.

We appreciate your patience and look forward to connecting with you.`

export function inviteAutoAckPlainText(recipientName: string) {
  const firstName = recipientName.trim().split(/\s+/)[0] || 'there'
  return `Dear ${firstName},

${DEFAULT_INVITE_AUTO_ACK_BODY}

Warm regards,
Baah Prosper Music Team`
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function inviteAutoAckHtml(recipientName: string) {
  const firstName = escapeHtml(recipientName.trim().split(/\s+/)[0] || 'there')
  const paragraphs = DEFAULT_INVITE_AUTO_ACK_BODY.split('\n\n')
    .map(
      (paragraph) =>
        `<p style="margin: 0 0 16px; line-height: 1.65; color: #333;">${escapeHtml(paragraph)}</p>`,
    )
    .join('')

  return `<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; border: 1px solid #e8e8e8; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0a0a0a; padding: 24px; text-align: center;">
        <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #c9a227;">Automated confirmation</p>
        <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #ffffff;">Invitation received</h1>
      </div>
      <div style="padding: 32px 28px; background: #ffffff;">
        <p style="margin: 0 0 20px; font-size: 16px; color: #1a1a1a;">Dear ${firstName},</p>
        ${paragraphs}
        <p style="margin: 24px 0 0; font-size: 16px; color: #1a1a1a;">Warm regards,<br /><strong>Baah Prosper Music Team</strong></p>
      </div>
      <div style="padding: 16px 28px 24px; background: #f5f5f5; border-top: 1px solid #e8e8e8;">
        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #666;">
          This is an automated message confirming that we received your invitation.
          Please do not reply to this email — our team will contact you directly once your request has been reviewed.
        </p>
      </div>
    </div>`
}

export function officialResponseHtml(recipientName: string, message: string) {
  return `<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; border: 1px solid #e8e8e8; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0a0a0a; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #ffffff;">Baah Prosper Music</h1>
      </div>
      <div style="padding: 32px 28px; background: #ffffff;">
        <p style="margin: 0 0 16px; font-size: 16px; color: #1a1a1a;">Dear ${escapeHtml(recipientName)},</p>
        <div style="white-space: pre-wrap; line-height: 1.65; font-size: 16px; color: #333;">${escapeHtml(message)}</div>
        <p style="margin: 24px 0 0; font-size: 16px; color: #1a1a1a;">Blessings,<br /><strong>Baah Prosper Music Team</strong></p>
      </div>
    </div>`
}
