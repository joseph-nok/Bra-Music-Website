import { v } from 'convex/values'
import { action, mutation, query } from './_generated/server'
import { api } from './_generated/api'
import { officialResponseHtml } from './inviteEmail'

// Helper function to look up your sender settings configuration
async function getSenderEmail(
  ctx: { runQuery: (query: any, args: { key: string }) => Promise<unknown> },
) {
  const senderSetting = await ctx.runQuery(api.settings.getSetting, {
    key: 'sender_email',
  })
  return (senderSetting as string) || 'onboarding@resend.dev'
}

// 1. List invites for your admin dashboard panels
export const listInvites = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('invites').order('desc').take(50)
  },
})

// 2. Add a new invite to the database and queue the notification to you
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

    // This securely sends the booking details straight to your inbox
    await ctx.scheduler.runAfter(0, api.invite.sendInviteEmail, {
      name: args.name,
      email: args.email,
      phone: args.phone,
      message: args.message,
    })

    return inviteId
  },
})

// 3. Admin notification alert (Hitting reply in your inbox goes to the user who filled the form)
export const sendInviteEmail = action({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error('Email service error: RESEND_API_KEY is missing on the Convex Dashboard!')
      return { success: false, error: 'Email service not configured' }
    }

    const fromEmail = await getSenderEmail(ctx)

    const notificationHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #000; padding: 20px; text-align: center; color: #fff;">
          <h2 style="margin: 0;">New Event Invitation</h2>
        </div>
        <div style="padding: 30px;">
          <p><strong>From:</strong> ${args.name}</p>
          <p><strong>Email:</strong> ${args.email}</p>
          <p><strong>Phone:</strong> ${args.phone}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Message:</strong></p>
          <div style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 8px;">${args.message}</div>
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://vercel.app" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View in Dashboard</a>
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
        from: 'onboarding@resend.dev',
        to: 'josephnok088@gmail.com', // Sends safely to your verified account
        reply_to: args.email, // Captures the user's email so you can reply instantly
        subject: `Invite: ${args.name}`,
        html: notificationHtml,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `Resend Error [HTTP ${response.status}]: ${errorText}`,
        '\n→ Check that RESEND_API_KEY is set on your PRODUCTION deployment in the Convex Dashboard (ideal-swan-429)',
      )
      return { success: false, error: `[${response.status}] ${errorText}` }
    }

    return { success: true }
  },
})

// 4. Official dashboard response action (Used if you respond directly from your web dashboard)
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
      console.error(
        `Resend Official Response Error [HTTP ${response.status}]: ${errorText}`,
        '\n→ Check that RESEND_API_KEY is set on your PRODUCTION deployment in the Convex Dashboard (ideal-swan-429)',
      )
      return { success: false, error: `[${response.status}] ${errorText}` }
    }

    return { success: true }
  },
})
