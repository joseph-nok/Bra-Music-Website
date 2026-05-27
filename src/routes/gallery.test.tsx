import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GalleryPage } from './gallery'

const albums = [
  {
    _id: 'album1',
    category: 'Worship Night',
    dateAdded: '2026-01-01',
    coverImage: 'https://example.com/cover.jpg',
    images: ['https://example.com/a.jpg'],
  },
]

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: albums, isPending: false }),
}))

vi.mock('lucide-react', () => ({
  X: () => <span data-testid="close-icon" />,
}))

describe('GalleryPage', () => {
  it('opens and closes album modal', () => {
    render(<GalleryPage />)
    fireEvent.click(screen.getByTestId('gallery-album-album1'))
    const modal = screen.getByTestId('gallery-modal')
    expect(modal).toBeInTheDocument()
    expect(modal).toHaveTextContent('Worship Night')
    fireEvent.click(screen.getByRole('button', { name: 'Close album' }))
    expect(screen.queryByTestId('gallery-modal')).not.toBeInTheDocument()
  })
})
