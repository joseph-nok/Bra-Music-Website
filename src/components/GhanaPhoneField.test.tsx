import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import GhanaPhoneField from './GhanaPhoneField'

describe('GhanaPhoneField', () => {
  it('renders label, country code, and input', () => {
    render(
      <GhanaPhoneField
        id="momo-phone"
        label="MoMo Number"
        name="momoNumber"
        required
      />,
    )
    expect(screen.getByText('MoMo Number')).toBeInTheDocument()
    expect(screen.getByText('233')).toBeInTheDocument()
    expect(screen.getByTestId('momo-phone')).toHaveAttribute('name', 'momoNumber')
  })
})
