import { describe, it, expect } from 'vitest'
import { groupQuotes } from './groupQuotes'
import type { Quote } from '@/types'

const q = (over: Partial<Quote>): Quote => ({
  id: 'q1', code: 'WS0001', projectId: 'p1', customerId: null, contactId: null,
  title: 'BG', quoteDate: '2026-06-18', validUntil: null, status: 'draft', rejectReason: null,
  taxRate: 8, validityDays: 14, deliveryDays: 30, paymentTerms: '50-50', hasInstallation: false,
  warrantyNote: null, contractorNote: null, notes: null,
  createdAt: '', updatedAt: '', items: [], ...over,
} as Quote)

describe('groupQuotes', () => {
  it('gom theo dự án → đầu mục → hạng mục và OR hasInstallation', () => {
    const quotes = [
      q({ id: 'q1', projectId: 'p1', project: { id: 'p1', name: 'Aeon' }, hasInstallation: true,
        items: [{ sectionName: 'Thang thép', itemName: 'Kết cấu', unit: 'm', quantity: 2, unitPrice: 100, amount: 200, sectionNameEn: null, sortOrder: 1, description: null }] }),
      q({ id: 'q2', projectId: 'p1', project: { id: 'p1', name: 'Aeon' }, hasInstallation: false,
        items: [{ sectionName: 'Thang thép', itemName: 'Hàn', unit: 'cái', quantity: 1, unitPrice: 50, amount: 50, sectionNameEn: null, sortOrder: 1, description: null }] }),
    ]
    const groups = groupQuotes(quotes)
    expect(groups).toHaveLength(1)
    expect(groups[0].projectName).toBe('Aeon')
    expect(groups[0].hasInstallation).toBe(true)
    expect(groups[0].sections).toHaveLength(1)
    expect(groups[0].sections[0].sectionName).toBe('Thang thép')
    expect(groups[0].sections[0].items.map((i) => i.itemName)).toEqual(['Kết cấu', 'Hàn'])
  })

  it('sectionName rỗng → nhóm "Khác"', () => {
    const groups = groupQuotes([q({ items: [{ sectionName: null, itemName: 'X', unit: 'm', quantity: 1, unitPrice: 1, amount: 1, sectionNameEn: null, sortOrder: 1, description: null }] })])
    expect(groups[0].sections[0].sectionName).toBe('Khác')
  })
})
