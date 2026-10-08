import { describe, expect, it } from 'vitest'
import { formatNumber, NOT_AVAILABLE_TEXT } from './format'

describe('formatNumber', () => {
  it('uses Colombian separators and always two decimals', () => {
    expect(formatNumber(32951.05)).toBe('32.951,05')
    expect(formatNumber(10000)).toBe('10.000,00')
    expect(formatNumber(0.8)).toBe('0,80')
    expect(formatNumber(-1951.05)).toBe('-1.951,05')
  })

  it('shows N/D for indicators the backend could not compute', () => {
    expect(formatNumber(null)).toBe(NOT_AVAILABLE_TEXT)
  })
})
