import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Send, CheckCircle2, Loader2, Music, MapPin, Phone } from 'lucide-react'
import type { FC } from 'react'

const InviteUs: FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})

  const addInvite = useMutation(api.invite.addInvite)

  const getNormalizedPhone = (input: string) => {
    const digits = input.replace(/\D/g, '')

    // If it starts with 233 and is 12 digits, take last 9
    if (digits.startsWith('233') && digits.length === 12) {
      return digits.substring(3)
    }

    // If it starts with 0 and is 10 digits, take last 9
    if (digits.startsWith('0') && digits.length === 10) {
      return digits.substring(1)
    }

    // If it's already 9 digits
    if (digits.length === 9) {
      return digits
    }

    return null
  }

  const validate = () => {
    const errors: { [key: string]: string } = {}

    if (!name.trim()) {
      errors.name = 'Please enter your full name or organization.'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim() || !emailRegex.test(email)) {
      errors.email =
        "The email address you entered doesn't look right. Example: name@example.com"
    }

    const normalized = getNormalizedPhone(phone)
    if (!normalized) {
      errors.phone =
        'Please enter a valid phone number (e.g. 024XXXXXXX or 24XXXXXXX).'
    }

    if (!message.trim()) {
      errors.message = "Don't forget to tell us a bit about your event!"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)

    try {
      const normalized = getNormalizedPhone(phone)
      const formattedPhone = `+233${normalized}`

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
    <section className="py-24 px-6 relative overflow-hidden bg-[var(--color-bg)]">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-[30rem] h-[30rem] bg-[var(--color-secondary)]/5 blur-[120px] -z-10 rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-[var(--color-primary)]/5 blur-[120px] -z-10 rounded-full" />

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Content Side */}
        <div className="space-y-8">
          <div className="space-y-4">
            <span className="eyebrow">Book the Vibe</span>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tighter leading-[1.1] font-display">
              Invite Us to <br />
              <span className="text-[var(--color-primary)]">
                Your Next Event
              </span>
            </h1>
            <p className="text-xl text-[var(--color-copy-soft)] max-w-lg leading-relaxed">
              Whether it's a festival, club night, or private showcase, we bring
              the energy that moves the crowd.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-panel-strong)] flex items-center justify-center border border-white/5">
                <Music className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <div>
                <h3 className="font-semibold text-white uppercase tracking-wider text-sm">
                  Curated Performances
                </h3>
                <p className="text-sm text-[var(--color-copy-muted)]">
                  Live sets tailored to your audience.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-panel-strong)] flex items-center justify-center border border-white/5">
                <Phone className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <div>
                <h3 className="font-semibold text-white uppercase tracking-wider text-sm">
                  Direct Communication
                </h3>
                <p className="text-sm text-[var(--color-copy-muted)]">
                  Fast response via call or WhatsApp.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-panel-strong)] flex items-center justify-center border border-white/5">
                <MapPin className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <div>
                <h3 className="font-semibold text-white uppercase tracking-wider text-sm">
                  Global Reach
                </h3>
                <p className="text-sm text-[var(--color-copy-muted)]">
                  Ready to travel wherever the music is.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="editorial-card p-8 lg:p-10 rounded-[1.6rem] relative overflow-hidden">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mb-6 border border-[var(--color-primary)]/20">
                <CheckCircle2 className="w-8 h-8 text-[var(--color-primary)]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 font-display italic">
                Inquiry Received!
              </h2>
              <p className="text-[var(--color-copy-soft)] mb-8 max-w-[320px] mx-auto leading-relaxed">
                Thank you for your invitation. We are reviewing your request and
                will get back to you soon. A confirmation email has been sent to
                your inbox.
              </p>
              <button
                onClick={() => setIsSuccess(false)}
                className="text-[var(--color-primary)] font-bold uppercase text-xs tracking-[0.2em] hover:text-white transition-colors cursor-pointer border-b border-[var(--color-primary)]/30 pb-1"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className={`field-input ${fieldErrors.name ? 'ring-1 ring-[var(--color-secondary)]' : ''}`}
                />
                {fieldErrors.name && (
                  <p className="text-[var(--color-secondary)] text-[10px] font-bold uppercase tracking-wider mt-1">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

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
                  className={`field-input ${fieldErrors.email ? 'ring-1 ring-[var(--color-secondary)]' : ''}`}
                />
                {fieldErrors.email && (
                  <p className="text-[var(--color-secondary)] text-[10px] font-bold uppercase tracking-wider mt-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="field-shell">
                <label htmlFor="phone" className="field-label">
                  Phone Number
                </label>
                <div className="relative group/input">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-copy-muted)] font-bold text-sm select-none z-10">
                    +233
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="024 123 4567"
                    maxLength={15}
                    className={`field-input !pl-16 ${fieldErrors.phone ? 'ring-1 ring-[var(--color-secondary)]' : ''}`}
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="text-[var(--color-secondary)] text-[10px] font-bold uppercase tracking-wider mt-1">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

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
                  className={`field-input ${fieldErrors.message ? 'ring-1 ring-[var(--color-secondary)]' : ''} resize-none`}
                />
                {fieldErrors.message && (
                  <p className="text-[var(--color-secondary)] text-[10px] font-bold uppercase tracking-wider mt-1">
                    {fieldErrors.message}
                  </p>
                )}
              </div>

              {fieldErrors.global && (
                <p className="text-[var(--color-secondary)] text-center text-[10px] font-bold uppercase tracking-wider">
                  {fieldErrors.global}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="cta-primary w-full justify-center py-4 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Submit Invitation
                    <Send className="w-4 h-4" />
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
