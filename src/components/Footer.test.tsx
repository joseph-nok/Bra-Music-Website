import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithRouter } from '../test/router-wrapper'
import Footer from './Footer'

vi.mock('convex/react', () => ({
  useQuery: () => ({
    whatsapp: 'https://wa.me/233000000000',
    youtube: 'https://youtube.com/channel',
    instagram: 'https://instagram.com/test',
    tiktok: 'https://tiktok.com/@test',
  }),
}))

describe('Footer', () => {
  it('renders navigation and social links', async () => {
    await renderWithRouter(<Footer />)
    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Music' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/233000000000',
    )
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument()
  })
})
