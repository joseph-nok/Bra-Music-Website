import { v } from 'convex/values'
import { action, mutation, query } from './_generated/server'
import { api } from './_generated/api'
import {
  inviteAutoAckHtml,
  inviteAutoAckPlainText,
  officialResponseHtml,
} from './inviteEmail'

async function getSenderEmail(
  ctx: { runQuery: (query: any, args: { key: string }) => Promise<unknown> },
) {
  const senderSetting = await ctx.runQuery(api.settings.getSetting, {
    key: 'sender_email',
  })
  return (senderSetting as string) || 'onboarding@resend.dev'
}

// List invites for the dashboard
export const listInvites = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('invites').order('desc').take(50)
  },
})

// Add a new invite and notify admin
export const addInvite = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const inviteId = await ctx.db.insert('invites', {
      name: args.name,
      email: args.email,
      phone: args.phone,
      message: args.message,
    })

    await ctx.scheduler.runAfter(0, api.invite.sendInviteEmail, {
      name: args.name,
      email: args.email,
      phone: args.phone,
      message: args.message,
    })

    await ctx.scheduler.runAfter(0, api.invite.sendAutoAcknowledgment, {
      name: args.name,
      email: args.email,
    })

    return inviteId
  },
})

// Admin notification (reply goes to the person who submitted the invite)
export const sendInviteEmail = action({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey)
      return { success: false, error: 'Email service not configured' }

    const fromEmail = await getSenderEmail(ctx)

    const notificationHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #000; padding: 20px; text-align: center; color: #fff;">
          <h2 style="margin: 0;">New Event Invite</h2>
        </div>
        <div style="padding: 30px;">
          <p><strong>From:</strong> ${args.name}</p>
          <p><strong>Email:</strong> ${args.email}</p>
          <p><strong>Phone:</strong> ${args.phone}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Message:</strong></p>
          <div style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 8px;">${args.message}</div>
          <div style="margin-top: 30px; text-align: center;">
            <a href="http://localhost:5173/admin-settings" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View in Dashboard</a>
          </div>
        </div>
      </div>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `Bra Music Invites <${fromEmail}>`,
        to: 'josephnok088@gmail.com',
        reply_to: args.email,
        subject: `Invite: ${args.name}`,
        html: notificationHtml,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Resend Error:', errorText)
      return { success: false, error: errorText }
    }

    return { success: true }
  },
})

// Personal follow-up from admin (replies go to the team inbox)
export const sendOfficialResponse = action({
  args: {
    recipientEmail: v.string(),
    recipientName: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) return { success: false, error: 'Not configured' }

    const fromEmail = await getSenderEmail(ctx)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `Baah Prosper Music <${fromEmail}>`,
        to: args.recipientEmail,
        reply_to: fromEmail,
        subject: 'Response from Baah Prosper Music',
        html: officialResponseHtml(args.recipientName, args.message),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Resend Official Response Error:', errorText)
      return { success: false, error: errorText }
    }

    return { success: true }
  },
})

// Automated acknowledgment — no reply expected
export const sendAutoAcknowledgment = action({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) return

    const fromEmail = await getSenderEmail(ctx)
    const plainText = inviteAutoAckPlainText(args.name)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `Baah Prosper Music <${fromEmail}>`,
        to: args.email,
        subject: 'We received your invitation — under review',
        html: inviteAutoAckHtml(args.name),
        text: plainText,
        headers: {
          'Auto-Submitted': 'auto-replied',
          Precedence: 'auto_reply',
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Resend Auto-Ack Error:', errorText)
    }
  },
})
