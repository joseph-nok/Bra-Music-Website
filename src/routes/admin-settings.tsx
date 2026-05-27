import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { inviteAutoAckPlainText } from '../../convex/inviteEmail'
import { useState, useEffect } from 'react'
import {
  Settings,
  ShoppingCart,
  Shirt,
  GraduationCap,
  CheckCircle,
  Image as ImageIcon,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'

export const Route = createFileRoute('/admin-settings')({
  component: AdminSettingsPage,
})

function AdminSettingsPage() {
  const setSetting = useMutation(api.settings.setSetting)

  const marketPurchases = useQuery(api.settings.getSetting, {
    key: 'marketPurchasesEnabled',
  })
  const merchEnabled = useQuery(api.settings.getSetting, {
    key: 'merchLineEnabled',
  })
  const capEnabled = useQuery(api.settings.getSetting, {
    key: 'capLineEnabled',
  })
  const dbSenderEmail = useQuery(api.settings.getSetting, {
    key: 'sender_email',
  })

  const [isSaving, setIsSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [senderEmail, setSenderEmail] = useState('')

  useEffect(() => {
    if (dbSenderEmail) setSenderEmail(dbSenderEmail)
  }, [dbSenderEmail])

  const handleToggle = async (key: string, currentValue: boolean) => {
    setIsSaving(key)
    try {
      await setSetting({ key, value: !currentValue })
      setSuccess(key)
      setTimeout(() => setSuccess(null), 2000)
    } catch (error) {
      console.error('Failed to update setting:', error)
    } finally {
      setIsSaving(null)
    }
  }

  const handleUpdateSetting = async (key: string, value: any) => {
    setIsSaving(key)
    try {
      await setSetting({ key, value })
      setSuccess(key)
      setTimeout(() => setSuccess(null), 2000)
    } catch (error) {
      console.error('Failed to update setting:', error)
    } finally {
      setIsSaving(null)
    }
  }

  const upcomingEvent = useQuery(api.events.getUpcomingEvent)
  const updateUpcomingEvent = useMutation(api.events.updateUpcomingEvent)

  const [eventForm, setEventForm] = useState({
    title: '',
    dateIso: '',
    timeText: '',
    venue: '',
    city: '',
    town: '',
  })

  useEffect(() => {
    if (upcomingEvent && 'title' in upcomingEvent) {
      setEventForm({
        title: upcomingEvent.title,
        dateIso: upcomingEvent.dateIso,
        timeText: upcomingEvent.timeText,
        venue: upcomingEvent.venue || '',
        city: upcomingEvent.city || '',
        town: upcomingEvent.town || '',
      })
    }
  }, [upcomingEvent])

  const invites = useQuery(api.invite.listInvites)
  const sendResponse = useAction(api.invite.sendOfficialResponse)

  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState('')

  const handleSendResponse = async (invite: any) => {
    setIsSaving('sendingReply')
    try {
      await sendResponse({
        recipientEmail: invite.email,
        recipientName: invite.name,
        message: replyMessage,
      })
      setSuccess(`reply-${invite._id}`)
      setReplyingTo(null)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to send response:', error)
    } finally {
      setIsSaving(null)
    }
  }

  const albums = useQuery(api.gallery.getAlbums)
  const addAlbum = useMutation(api.gallery.addAlbum)
  const deleteAlbum = useMutation(api.gallery.deleteAlbum)

  const [albumForm, setAlbumForm] = useState<{
    category: string
    dateAdded: string
    coverImage: string
    images: string[]
  }>({
    category: '',
    dateAdded: '',
    coverImage: '',
    images: [] as string[],
  })

  const teamMembers = useQuery(api.content.listTeamMembers)
  const addMember = useMutation(api.team.addMember)
  const deleteMember = useMutation(api.team.deleteMember)

  const [memberForm, setMemberForm] = useState<{
    name: string
    role: string
    image: string
    bio: string
    instagram: string
    twitter: string
    tiktok: string
  }>({
    name: '',
    role: '',
    image: '',
    bio: '',
    instagram: '',
    twitter: '',
    tiktok: '',
  })

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving('addMember')
    try {
      await addMember(memberForm)
      setMemberForm({
        name: '',
        role: '',
        image: '',
        bio: '',
        instagram: '',
        twitter: '',
        tiktok: '',
      })
      setSuccess('addMember')
      setTimeout(() => setSuccess(null), 2000)
    } catch (error) {
      console.error('Failed to add member:', error)
    } finally {
      setIsSaving(null)
    }
  }
  const [newImageUrl, setNewImageUrl] = useState('')

  const handleAddAlbum = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving('addAlbum')
    try {
      await addAlbum({
        category: albumForm.category,
        dateAdded: albumForm.dateAdded,
        coverImage: albumForm.coverImage,
        images: albumForm.images,
      })
      setAlbumForm({ category: '', dateAdded: '', coverImage: '', images: [] })
      setSuccess('addAlbum')
      setTimeout(() => setSuccess(null), 2000)
    } catch (error) {
      console.error('Failed to add album:', error)
    } finally {
      setIsSaving(null)
    }
  }

  const handleDeleteAlbum = async (id: any) => {
    if (!confirm('Are you sure you want to delete this album?')) return
    try {
      await deleteAlbum({ id })
    } catch (error) {
      console.error('Failed to delete album:', error)
    }
  }

  const handleEventUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving('upcomingEvent')
    try {
      await updateUpcomingEvent(eventForm)
      setSuccess('upcomingEvent')
      setTimeout(() => setSuccess(null), 2000)
    } catch (error) {
      console.error('Failed to update event:', error)
    } finally {
      setIsSaving(null)
    }
  }

  return (
    <main className="px-4 pb-20 pt-24 min-h-screen">
      <section className="page-wrap max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="text-(--color-primary)" size={24} />
          <p className="eyebrow">Internal Dashboard</p>
        </div>
        <h1 className="font-display text-5xl font-bold tracking-[-0.04em] text-white sm:text-6xl mb-10">
          Site Settings
        </h1>

        <div className="grid gap-8">
          {/* Upcoming Event Section */}
          <section className="editorial-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-(--color-primary)">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Upcoming Event</h3>
                <p className="text-sm text-(--color-copy-soft)">
                  Manage the main countdown event on the homepage.
                </p>
              </div>
            </div>

            <form onSubmit={handleEventUpdate} className="grid gap-4">
              <label className="field-shell">
                <span className="field-label">Event Title</span>
                <input
                  type="text"
                  className="field-input"
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, title: e.target.value })
                  }
                  required
                />
              </label>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="field-shell">
                  <span className="field-label">Date (ISO 8601)</span>
                  <input
                    type="datetime-local"
                    className="field-input"
                    value={
                      eventForm.dateIso
                        ? new Date(
                            new Date(eventForm.dateIso).getTime() -
                              new Date().getTimezoneOffset() * 60000,
                          )
                            .toISOString()
                            .slice(0, 16)
                        : ''
                    }
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        dateIso: new Date(e.target.value).toISOString(),
                      })
                    }
                    required
                  />
                </label>
                <label className="field-shell">
                  <span className="field-label">Time Display Text</span>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="e.g. 5:00 PM UTC"
                    value={eventForm.timeText}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, timeText: e.target.value })
                    }
                    required
                  />
                </label>
              </div>
              <label className="field-shell">
                <span className="field-label">Venue</span>
                <input
                  type="text"
                  className="field-input"
                  value={eventForm.venue}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, venue: e.target.value })
                  }
                  required
                />
              </label>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="field-shell">
                  <span className="field-label">City</span>
                  <input
                    type="text"
                    className="field-input"
                    value={eventForm.city}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, city: e.target.value })
                    }
                    required
                  />
                </label>
                <label className="field-shell">
                  <span className="field-label">Town / Country</span>
                  <input
                    type="text"
                    className="field-input"
                    value={eventForm.town}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, town: e.target.value })
                    }
                    required
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={isSaving === 'upcomingEvent'}
                className="cta-primary w-full justify-center mt-2"
              >
                {isSaving === 'upcomingEvent'
                  ? 'Saving...'
                  : success === 'upcomingEvent'
                    ? 'Saved!'
                    : 'Update Event'}
              </button>
            </form>
          </section>

          {/* Recent Invites Section */}
          <section className="editorial-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-(--color-primary)">
                <ShoppingCart size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Recent Invitations
                </h3>
                <p className="text-sm text-(--color-copy-soft)">
                  Manage and respond to ministry invites.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {invites?.map((invite: any) => (
                <div
                  key={invite._id}
                  className="p-4 rounded-xl border border-white/5 bg-white/5"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-white">{invite.name}</p>
                      <p className="text-xs text-(--color-copy-muted)">
                        {invite.email} • {invite.phone}
                      </p>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-(--color-copy-muted)">
                      {new Date(invite._creationTime).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-(--color-copy-soft) mb-4 line-clamp-2">
                    {invite.message}
                  </p>

                  {replyingTo === invite._id ? (
                    <div className="mt-4 space-y-4 pt-4 border-t border-white/5">
                      <textarea
                        className="field-input min-h-[100px]"
                        placeholder="Write your official response..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSendResponse(invite)}
                          disabled={isSaving === 'sendingReply'}
                          className="cta-primary py-2 px-4 text-xs flex-1 justify-center"
                        >
                          {isSaving === 'sendingReply'
                            ? 'Sending...'
                            : 'Send Official Response'}
                        </button>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="homepage-button homepage-button--ghost py-2 px-4 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setReplyingTo(invite._id)
                        setReplyMessage(inviteAutoAckPlainText(invite.name))
                      }}
                      className="text-xs font-bold uppercase tracking-[0.2em] text-(--color-primary) hover:underline"
                    >
                      Reply Officially
                    </button>
                  )}
                  {success === `reply-${invite._id}` && (
                    <p className="mt-2 text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle size={12} /> Response Sent Successfully!
                    </p>
                  )}
                </div>
              ))}
              {invites?.length === 0 && (
                <p className="text-center py-10 text-sm text-(--color-copy-muted)">
                  No invitations received yet.
                </p>
              )}
            </div>
          </section>

          {/* Gallery Manager Section */}
          <section className="editorial-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-(--color-primary)">
                <ImageIcon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Gallery Manager
                </h3>
                <p className="text-sm text-(--color-copy-soft)">
                  Organize photos into categories/albums.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleAddAlbum}
              className="grid gap-4 mb-8 p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Create New Category
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="field-shell">
                  <span className="field-label">Album Category</span>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="e.g. Outreach 2024"
                    value={albumForm.category}
                    onChange={(e) =>
                      setAlbumForm({ ...albumForm, category: e.target.value })
                    }
                    required
                  />
                </label>
                <label className="field-shell">
                  <span className="field-label">Date Added</span>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="e.g. Oct 12, 2024"
                    value={albumForm.dateAdded}
                    onChange={(e) =>
                      setAlbumForm({ ...albumForm, dateAdded: e.target.value })
                    }
                    required
                  />
                </label>
              </div>
              <label className="field-shell">
                <span className="field-label">Leading Image URL (Cover)</span>
                <input
                  type="url"
                  className="field-input"
                  placeholder="https://..."
                  value={albumForm.coverImage}
                  onChange={(e) =>
                    setAlbumForm({ ...albumForm, coverImage: e.target.value })
                  }
                  required
                />
              </label>

              <div className="space-y-2">
                <span className="field-label">Gallery Images</span>
                <div className="flex gap-2">
                  <input
                    type="url"
                    className="field-input flex-1"
                    placeholder="Add image URL..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newImageUrl) {
                        setAlbumForm({
                          ...albumForm,
                          images: [...albumForm.images, newImageUrl],
                        })
                        setNewImageUrl('')
                      }
                    }}
                    className="homepage-button homepage-button--ghost p-2"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {albumForm.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden border border-white/10"
                    >
                      <img src={img} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setAlbumForm({
                            ...albumForm,
                            images: albumForm.images.filter(
                              (_, i) => i !== idx,
                            ),
                          })
                        }
                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving === 'addAlbum'}
                className="cta-primary w-full justify-center mt-2"
              >
                {isSaving === 'addAlbum'
                  ? 'Creating...'
                  : success === 'addAlbum'
                    ? 'Created!'
                    : 'Add Category'}
              </button>
            </form>

            <div className="grid gap-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Existing Categories
              </h4>
              {albums?.map((album: any) => (
                <div
                  key={album._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={album.coverImage}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-(--color-copy)">
                        {album.category}
                      </p>
                      <p className="text-xs text-(--color-copy-muted)">
                        {album.dateAdded} • {album.images.length} images
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAlbum(album._id)}
                    className="text-white/30 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-6">
            <h2 className="text-2xl font-bold text-white px-2">
              Global Toggles
            </h2>

            {/* Market Purchases Toggle */}
            <div className="editorial-card p-6 flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-(--color-primary)">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Market Purchases
                  </h3>
                  <p className="text-sm text-(--color-copy-soft)">
                    Enable or disable the "Add to Cart" functionality site-wide.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleToggle('marketPurchasesEnabled', !!marketPurchases)
                }
                disabled={isSaving === 'marketPurchasesEnabled'}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
                  marketPurchases ? 'bg-(--color-primary)' : 'bg-white/10'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    marketPurchases ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
                {success === 'marketPurchasesEnabled' && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle size={12} /> Saved
                  </span>
                )}
              </button>
            </div>

            {/* Merch Category Toggle */}
            <div className="editorial-card p-6 flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-(--color-primary)">
                  <Shirt size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Merch Visibility
                  </h3>
                  <p className="text-sm text-(--color-copy-soft)">
                    Show or hide all products in the "Merch" category.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('merchLineEnabled', !!merchEnabled)}
                disabled={isSaving === 'merchLineEnabled'}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
                  merchEnabled ? 'bg-(--color-primary)' : 'bg-white/10'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    merchEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
                {success === 'merchLineEnabled' && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle size={12} /> Saved
                  </span>
                )}
              </button>
            </div>

            {/* Cap Category Toggle */}
            <div className="editorial-card p-6 flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-(--color-primary)">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Cap Visibility
                  </h3>
                  <p className="text-sm text-(--color-copy-soft)">
                    Show or hide all products in the "Cap" category.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('capLineEnabled', !!capEnabled)}
                disabled={isSaving === 'capLineEnabled'}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
                  capEnabled ? 'bg-(--color-primary)' : 'bg-white/10'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    capEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
                {success === 'capLineEnabled' && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle size={12} /> Saved
                  </span>
                )}
              </button>
            </div>

            {/* Sender Email Setting */}
            <div className="editorial-card p-6 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-(--color-primary)">
                  <Settings size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Verified Sender Email
                  </h3>
                  <p className="text-sm text-(--color-copy-soft)">
                    The email address Resend uses to send automated messages.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <input
                  type="email"
                  className="field-input flex-1"
                  placeholder="onboarding@resend.dev"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                />
                <button
                  onClick={() =>
                    handleUpdateSetting('sender_email', senderEmail)
                  }
                  disabled={isSaving === 'sender_email'}
                  className="cta-primary py-2 px-6 text-sm"
                >
                  {isSaving === 'sender_email'
                    ? 'Saving...'
                    : success === 'sender_email'
                      ? 'Saved!'
                      : 'Update Email'}
                </button>
              </div>
              <p className="text-[10px] text-(--color-copy-muted) uppercase tracking-wider">
                Note: You must verify this email/domain in your Resend dashboard
                before it will work.
              </p>
            </div>
          </div>

          {/* Team Manager */}
          <section className="editorial-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-(--color-accent) flex items-center justify-center text-black">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Team Manager</h2>
                <p className="text-sm text-(--color-copy-soft)">
                  Manage ministry members and staff
                </p>
              </div>
            </div>

            <form
              onSubmit={handleAddMember}
              className="grid gap-6 mb-10 pb-10 border-b border-white/5"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <label className="field-shell">
                  <span className="field-label">Full Name</span>
                  <input
                    type="text"
                    className="field-input"
                    value={memberForm.name}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, name: e.target.value })
                    }
                    required
                  />
                </label>
                <label className="field-shell">
                  <span className="field-label">Role</span>
                  <input
                    type="text"
                    className="field-input"
                    value={memberForm.role}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, role: e.target.value })
                    }
                    required
                  />
                </label>
              </div>

              <label className="field-shell">
                <span className="field-label">Image URL</span>
                <input
                  type="url"
                  className="field-input"
                  value={memberForm.image}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, image: e.target.value })
                  }
                  required
                />
              </label>

              <label className="field-shell">
                <span className="field-label">Biography</span>
                <textarea
                  className="field-input min-h-[100px]"
                  value={memberForm.bio}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, bio: e.target.value })
                  }
                  required
                />
              </label>

              <div className="grid gap-6 md:grid-cols-3">
                <label className="field-shell">
                  <span className="field-label">Instagram (Optional)</span>
                  <input
                    type="url"
                    className="field-input"
                    value={memberForm.instagram}
                    onChange={(e) =>
                      setMemberForm({
                        ...memberForm,
                        instagram: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="field-shell">
                  <span className="field-label">Twitter (Optional)</span>
                  <input
                    type="url"
                    className="field-input"
                    value={memberForm.twitter}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, twitter: e.target.value })
                    }
                  />
                </label>
                <label className="field-shell">
                  <span className="field-label">TikTok (Optional)</span>
                  <input
                    type="url"
                    className="field-input"
                    value={memberForm.tiktok}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, tiktok: e.target.value })
                    }
                  />
                </label>
              </div>

              <button
                type="submit"
                className="btn-primary w-full md:w-auto"
                disabled={isSaving === 'addMember'}
              >
                {isSaving === 'addMember'
                  ? 'Saving Member...'
                  : success === 'addMember'
                    ? 'Member Added!'
                    : 'Add Team Member'}
              </button>
            </form>

            <div className="grid gap-4">
              {teamMembers?.map((member: any) => (
                <div
                  key={member._id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={member.image}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-bold text-white text-sm">
                        {member.name}
                      </p>
                      <p className="text-xs text-(--color-copy-muted)">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${member.name}?`)) {
                        deleteMember({ id: member._id })
                      }
                    }}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Member"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-12 p-6 rounded-2xl border border-white/5 bg-white/5 text-center">
          <p className="text-sm text-(--color-copy-muted)">
            This is a private administration page. Changes here affect all
            visitors to the site.
          </p>
        </div>
      </section>
    </main>
  )
}
