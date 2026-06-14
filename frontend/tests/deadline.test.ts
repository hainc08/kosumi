import { describe, it, expect } from 'vitest'
import { deadlineState } from '@/utils/deadline'

describe('deadlineState', () => {
  const today = '2026-06-14'
  it('quá hạn', () => { expect(deadlineState('2026-06-01', today)).toBe('overdue') })
  it('sắp đến hạn (trong 14 ngày)', () => { expect(deadlineState('2026-06-20', today)).toBe('near') })
  it('còn xa', () => { expect(deadlineState('2026-08-01', today)).toBe('ok') })
})
