import { describe, it, expect } from 'vitest'
import { emptyQuoteForm, formToValues } from './quoteFormShape'

describe('quoteFormShape', () => {
  it('emptyQuoteForm mặc định hasInstallation=false', () => {
    expect(emptyQuoteForm().hasInstallation).toBe(false)
  })

  it('formToValues derive paymentTerms từ các đợt thanh toán và mang hasInstallation', () => {
    const f = emptyQuoteForm()
    f.hasInstallation = true
    f.paymentSteps = [
      { stepOrder: 1, percentage: '30', description: 'Tạm ứng' },
      { stepOrder: 2, percentage: '70', description: 'Bàn giao' },
    ]
    const v = formToValues(f)
    expect(v.paymentTerms).toBe('30-70')
    expect(v.hasInstallation).toBe(true)
  })
})
