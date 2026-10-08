import { describe, expect, it } from 'vitest'
import { formatNumber, formatUnrounded, NOT_AVAILABLE_TEXT, unroundedHint } from './format'

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

describe('formatUnrounded', () => {
  it.each([
    [0.9999996, '0,9999996'],
    [1.0000004, '1,0000004'],
    [0.99999995, '0,99999995'],
    // Rounds at the first precision that stays above 1; it need not print every digit.
    [1.00000005, '1,0000001'],
    [0.9999999999, '0,9999999999'],
    [1 + Number.EPSILON, '1,0000000000000002'],
  ])('keeps %f on its side of 1 instead of showing 1,00', (value, expected) => {
    expect(formatUnrounded(value)).toBe(expected)
  })

  it('shows exactly 1 as 1,00', () => {
    expect(formatUnrounded(1)).toBe('1,00')
  })

  it('never reads as 1 or crosses 1 for any value near 1', () => {
    for (let exponent = 3; exponent <= 15; exponent++) {
      for (const value of [1 - 10 ** -exponent, 1 + 10 ** -exponent]) {
        const shown = Number(formatUnrounded(value).replaceAll('.', '').replace(',', '.'))
        expect(Math.sign(shown - 1)).toBe(Math.sign(value - 1))
      }
    }
  })
})
