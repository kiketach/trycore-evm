import { describe, expect, it } from 'vitest'
import { formatNumber, NOT_AVAILABLE_TEXT, unroundedHint } from './format'

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

describe('unroundedHint', () => {
  it('shows up to six decimals so a rounded 1,00 can be explained', () => {
    expect(unroundedHint(0.9996)).toBe('Valor sin redondear: 0,9996')
    expect(unroundedHint(1.0004001600640255)).toBe('Valor sin redondear: 1,0004')
    expect(unroundedHint(10000 / 12000)).toBe('Valor sin redondear: 0,833333')
    expect(unroundedHint(1.25)).toBe('Valor sin redondear: 1,25')
  })

  it('explains why there is no value', () => {
    expect(unroundedHint(null)).toBe('No disponible: la fórmula dividiría por cero.')
  })
})
