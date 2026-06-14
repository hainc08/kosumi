import { describe, it, expect } from 'vitest'
import { estimateMonthlyPay, calculateDayPay } from '@/utils/pay-calculator'

describe('pay-calculator', () => {
  it('hourly: ước tính tháng = rate × 8 × 26', () => {
    expect(estimateMonthlyPay({ contractType: 'hourly', rateNormal: 35000 }))
      .toBe(35000 * 8 * 26)
  })
  it('daily: ước tính tháng = rate × 26', () => {
    expect(estimateMonthlyPay({ contractType: 'daily', rateNormal: 300000 }))
      .toBe(300000 * 26)
  })
  it('monthly: base + allowance', () => {
    expect(estimateMonthlyPay({ contractType: 'monthly', baseSalary: 8000000, allowance: 500000 }))
      .toBe(8500000)
  })
  it('calculateDayPay hourly: giờ thường + OT', () => {
    expect(calculateDayPay({
      contractType: 'hourly', regularHours: 8, overtimeHours: 2,
      rateNormal: 35000, rateOvertime: 52500,
    })).toBe(8 * 35000 + 2 * 52500)
  })
})
