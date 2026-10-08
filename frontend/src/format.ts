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

// Readable by default; more decimals only when needed to keep the value on its side of 1.
const UNROUNDED_BASE_DECIMALS = 6
// A double carries ~17 significant digits; beyond this nothing more can be revealed.
const UNROUNDED_MAX_DECIMALS = 20
const PERFORMANCE_BASELINE = 1

function formatWithDecimals(value: number, maximumFractionDigits: number): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: DISPLAY_DECIMALS,
    maximumFractionDigits,
  }).format(value)
}

function parseFormatted(text: string): number {
  return Number(text.replaceAll('.', '').replace(',', '.'))
}

// Never collapses an index that differs from 1 into "1,00" or onto the wrong side of 1:
// that would contradict the status it is meant to explain (D-06). 0.9999996 is shown as
// 0,9999996, not 1,00.
export function formatUnrounded(value: number): string {
  for (let decimals = UNROUNDED_BASE_DECIMALS; decimals < UNROUNDED_MAX_DECIMALS; decimals++) {
    const text = formatWithDecimals(value, decimals)
    const shown = parseFormatted(text)
    if (Math.sign(shown - PERFORMANCE_BASELINE) === Math.sign(value - PERFORMANCE_BASELINE)) {
      return text
    }
  }
  return formatWithDecimals(value, UNROUNDED_MAX_DECIMALS)
}

// Explains a rounded index: CPI 0.9996 is shown as 1,00 but read as below 1 (D-06).
export function unroundedHint(value: number | null): string {
  return value === null ? NOT_AVAILABLE_HINT : `Valor sin redondear: ${formatUnrounded(value)}`
}

// Amounts from one million up are shown in millions where space is tight (table cells,
// chart axis), so a figure never has to break across lines. The full value stays available.
const MILLION = 1_000_000
const MILLIONS_SUFFIX = ' M'
const AXIS_MAX_DECIMALS = 1

const axisFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })
const axisMillionsFormat = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: AXIS_MAX_DECIMALS,
})

export function isAbbreviated(value: number): boolean {
  return Math.abs(value) >= MILLION
}

// 2194787.38 -> "2,19 M"; 2283945061.7 -> "2.283,95 M"; below a million, the full amount.
export function formatAmountShort(value: number | null): string {
  if (value === null || !isAbbreviated(value)) {
    return formatNumber(value)
  }
  return `${numberFormat.format(value / MILLION)}${MILLIONS_SUFFIX}`
}

// Axis ticks are round numbers: no decimals below a million, millions above.
export function formatAxisTick(value: number): string {
  return isAbbreviated(value)
    ? `${axisMillionsFormat.format(value / MILLION)}${MILLIONS_SUFFIX}`
    : axisFormat.format(value)
}
