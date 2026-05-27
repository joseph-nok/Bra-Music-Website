import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '../test/router-wrapper'
import NotFound from './NotFound'

describe('NotFound', () => {
  it('renders 404 message and home link', async () => {
    await renderWithRouter(<NotFound />)
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
    expect(
      screen.getByText(/page you're looking for doesn't exist/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute(
      'href',
      '/',
    )
  })
})
