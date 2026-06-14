import { describe, it, expect } from 'vitest'
import { deriveInitials, nextWorkerCode } from '@/utils/worker-helpers'

describe('worker-helpers', () => {
  it('deriveInitials: chữ đầu của từ đầu + từ cuối', () => {
    expect(deriveInitials('Nguyễn Văn Hùng')).toBe('NH')
    expect(deriveInitials('Mai')).toBe('M')
  })
  it('nextWorkerCode: CN + số tăng, pad 3 chữ số', () => {
    expect(nextWorkerCode(['CN001', 'CN009'])).toBe('CN010')
    expect(nextWorkerCode([])).toBe('CN001')
  })
})
