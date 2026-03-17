function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  )
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount))
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  )
}

export interface ColorPalette {
  primary: string   // 메인 강조색 (사용자 선택)
  dark: string      // 가장 어두운 배경 (#002345 계열)
  mid: string       // 중간 배경 (#0B4379 계열)
  lightBg: string   // 연한 배경 (#DAE9F8 계열)
  veryLight: string // 아주 연한 배경 (#BDD9F4 계열)
}

export function buildPalette(primaryColor: string): ColorPalette {
  return {
    primary: primaryColor,
    dark: darken(primaryColor, 0.70),
    mid: darken(primaryColor, 0.35),
    lightBg: lighten(primaryColor, 0.82),
    veryLight: lighten(primaryColor, 0.88),
  }
}
