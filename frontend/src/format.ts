const DISPLAY_DECIMALS = 2
const LOCALE = 'es-CO'

const numberFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: DISPLAY_DECIMALS,
  maximumFractionDigits: DISPLAY_DECIMALS,
})

export const NOT_AVAILABLE_TEXT = 'N/D'
export const NOT_AVAILABLE_HINT = 'No disponible: la fórmula dividiría por cero.'

export function formatNumber(value: number | null): string {
  return value === null ? NOT_AVAILABLE_TEXT : numberFormat.format(value)
}

const UNROUNDED_MAX_DECIMALS = 6

const unroundedFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: DISPLAY_DECIMALS,
  maximumFractionDigits: UNROUNDED_MAX_DECIMALS,
})

// Explains a rounded index: CPI 0.9996 is shown as 1,00 but read as below 1 (D-06).
export function unroundedHint(value: number | null): string {
  return value === null ? NOT_AVAILABLE_HINT : `Valor sin redondear: ${unroundedFormat.format(value)}`
}
