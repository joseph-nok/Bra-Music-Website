import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import {
  formatInvitePhoneE164,
  validateInviteFields,
} from '../lib/invite-validation'
import { Send, CheckCircle2, Loader2, Music, MapPin, Phone } from 'lucide-react'
import type { FC } from 'react'

const InviteUs: FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    [key: string]: string
  }>({})

  const addInvite = useMutation(api.invite.addInvite)

  const validate = () => {
    const errors = validateInviteFields({
      name,
      email,
      phone,
      message,
    })

    setFieldErrors(errors)

    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)

    try {
      const formattedPhone = formatInvitePhoneE164(phone)

      await addInvite({
        name,
        email,
        phone: formattedPhone,
        message,
      })

      setIsSuccess(true)

      setName('')
      setEmail('')
      setPhone('')
      setMessage('')
    } catch (err) {
      console.error(err)

      setFieldErrors({
        global:
          'Something went wrong. Please check your internet and try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative overflow-hidden bg-(--color-bg) px-6 py-24">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 -z-10 h-120 w-120 rounded-full bg-(--color-secondary)/5 blur-[120px]" />

      <div className="absolute right-1/4 bottom-0 -z-10 h-120 w-120 rounded-full bg-(--color-primary)/5 blur-[120px]" />

      <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        {/* Content Side */}
        <div className="space-y-8">
          <div className="space-y-4">
            <span className="eyebrow">Book the Vibe</span>

            <h1 className="font-display text-5xl leading-[1.1] font-extrabold tracking-tighter text-white lg:text-7xl">
              Invite Us to <br />
              <span className="text-(--color-primary)">Your Next Event</span>
            </h1>

            <p className="max-w-lg text-xl leading-relaxed text-(--color-copy-soft)">
              Whether it's a festival, club night, or private showcase, we bring
              the energy that moves the crowd.
            </p>
          </div>

          <div className="space-y-6">
            {/* Feature 1 */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-(--color-panel-strong)">
                <Music className="h-6 w-6 text-(--color-primary)" />
              </div>

              <div>
                <h3 className="text-sm font-semibold tracking-wider text-white uppercase">
                  Curated Performances
                </h3>

                <p className="text-sm text-(--color-copy-muted)">
                  Live sets tailored to your audience.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-(--color-panel-strong)">
                <Phone className="h-6 w-6 text-(--color-primary)" />
              </div>

              <div>
                <h3 className="text-sm font-semibold tracking-wider text-white uppercase">
                  Direct Communication
                </h3>

                <p className="text-sm text-(--color-copy-muted)">
                  Fast response via call or WhatsApp.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-(--color-panel-strong)">
                <MapPin className="h-6 w-6 text-(--color-primary)" />
              </div>

              <div>
                <h3 className="text-sm font-semibold tracking-wider text-white uppercase">
                  Global Reach
                </h3>

                <p className="text-sm text-(--color-copy-muted)">
                  Ready to travel wherever the music is.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="editorial-card relative overflow-hidden rounded-[1.6rem] p-8 lg:p-10">
          {isSuccess ? (
            <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center py-12 text-center duration-500">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-(--color-primary)/20 bg-(--color-primary)/10">
                <CheckCircle2 className="h-8 w-8 text-(--color-primary)" />
              </div>

              <h2 className="font-display mb-3 text-2xl font-bold text-white italic">
                Inquiry Received!
              </h2>

              <p className="mx-auto mb-8 max-w-[320px] leading-relaxed text-(--color-copy-soft)">
                Thank you for your invitation. We are reviewing your request and
                will get back to you soon. A confirmation email has been sent to
                your inbox.
              </p>

              <button
                onClick={() => setIsSuccess(false)}
                className="cursor-pointer border-b border-(--color-primary)/30 pb-1 text-xs font-bold tracking-[0.2em] text-(--color-primary) uppercase transition-colors hover:text-white"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="field-shell">
                <label htmlFor="name" className="field-label">
                  Your Name / Organization
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className={`field-input ${
                    fieldErrors.name ? 'ring-1 ring-(--color-secondary)' : ''
                  }`}
                />

                {fieldErrors.name ? (
                  <p
                    data-testid="field-error-name"
                    className="mt-1 text-[10px] font-bold tracking-wider text-(--color-secondary) uppercase"
                  >
                    {fieldErrors.name}
                  </p>
                ) : null}
              </div>

              {/* Email */}
              <div className="field-shell">
                <label htmlFor="email" className="field-label">
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className={`field-input ${
                    fieldErrors.email ? 'ring-1 ring-(--color-secondary)' : ''
                  }`}
                />

                {fieldErrors.email && (
                  <p className="mt-1 text-[10px] font-bold tracking-wider text-(--color-secondary) uppercase">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="field-shell">
                <label htmlFor="phone" className="field-label">
                  Phone Number
                </label>

                <div className="group/input relative">
                  <span className="absolute top-1/2 left-5 z-10 -translate-y-1/2 select-none text-sm font-bold text-(--color-copy-muted)">
                    +233
                  </span>

                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="024 123 4567"
                    maxLength={15}
                    className={`field-input pl-16! ${
                      fieldErrors.phone ? 'ring-1 ring-(--color-secondary)' : ''
                    }`}
                  />
                </div>

                {fieldErrors.phone && (
                  <p className="mt-1 text-[10px] font-bold tracking-wider text-(--color-secondary) uppercase">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              {/* Message */}
              <div className="field-shell">
                <label htmlFor="message" className="field-label">
                  Event Details
                </label>

                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about the date, location..."
                  rows={3}
                  className={`field-input resize-none ${
                    fieldErrors.message ? 'ring-1 ring-(--color-secondary)' : ''
                  }`}
                />

                {fieldErrors.message && (
                  <p className="mt-1 text-[10px] font-bold tracking-wider text-(--color-secondary) uppercase">
                    {fieldErrors.message}
                  </p>
                )}
              </div>

              {/* Global Error */}
              {fieldErrors.global && (
                <p className="text-center text-[10px] font-bold tracking-wider text-(--color-secondary) uppercase">
                  {fieldErrors.global}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="cta-primary w-full cursor-pointer justify-center py-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Submit Invitation
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default InviteUs
