import { createFileRoute } from '@tanstack/react-router'
import InviteUs from '../components/InviteUs'

export const Route = createFileRoute('/invite-us')
 ({
  component: () => (
    <main className="min-h-screen bg-black">
      <InviteUs />
    </main>
  ),
})
