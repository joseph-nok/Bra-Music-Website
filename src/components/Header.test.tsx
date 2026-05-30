import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithRouter } from '../test/router-wrapper'
import Header from './Header'

vi.mock('../lib/cart', () => ({
  loadCart: () => [{ productLine: 'cap', productId: '1', quantity: 2 }],
}))

describe('Header', () => {
  it('renders brand and opens mobile menu', async () => {
    await renderWithRouter(<Header />)
    expect(screen.getByText('Baah Prosper Music')).toBeInTheDocument()
    expect(screen.getByTestId('header-menu-trigger')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('header-menu-trigger'))
    expect(screen.getByTestId('header-mobile-menu')).toBeInTheDocument()
    expect(screen.getByText('Gallery')).toBeInTheDocument()
  })

  it('shows cart badge when items exist', async () => {
    await renderWithRouter(<Header />)
    const cartLink = screen.getAllByLabelText('Cart')[0]
    expect(cartLink).toBeInTheDocument()
    expect(cartLink.parentElement).toHaveTextContent('2')
  })
})
