import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatHours } from '@/utils/format'

describe('format', () => {
  it('formatCurrency: VND không phần lẻ, ngăn cách nghìn bằng dấu chấm', () => {
    const out = formatCurrency(7280000)
    expect(out).toContain('7.280.000')
    expect(out).toContain('₫')
  })
  it('formatDate: ISO -> DD/MM/YYYY', () => {
    expect(formatDate('2026-06-14')).toBe('14/06/2026')
    expect(formatDate(null)).toBe('')
  })
  it('formatHours: giờ + phút', () => {
    expect(formatHours(8.5)).toBe('8h 30m')
    expect(formatHours(8)).toBe('8h')
  })
})
