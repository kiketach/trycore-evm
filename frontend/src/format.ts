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
