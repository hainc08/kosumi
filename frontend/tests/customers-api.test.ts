import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/mocks/db'
import { seedCustomers } from '@/mocks/seed/customers'
import { createCustomerInDb, filterCustomers } from '@/api/customers'

beforeEach(() => { db.customers = structuredClone(seedCustomers) })

describe('customers mock logic', () => {
  it('createCustomerInDb sinh code KH00x + contact đầu là primary', () => {
    const before = db.customers.length
    const c = createCustomerInDb({
      name: 'Công ty TNHH Thử Nghiệm', type: 'business',
      contacts: [
        { fullName: 'Ông A', title: 'GĐ', phone: '0900000000', email: null, isPrimary: false, sortOrder: 0 },
        { fullName: 'Bà B', title: 'KT', phone: null, email: null, isPrimary: false, sortOrder: 1 },
      ],
    })
    expect(db.customers.length).toBe(before + 1)
    expect(c.code).toBe('KH005')
    expect(c.contacts?.[0].isPrimary).toBe(true)
    expect(c.contacts?.[1].isPrimary).toBe(false)
    expect(c.primaryContact?.fullName).toBe('Ông A')
  })
  it('filterCustomers lọc theo type và search (gồm tên liên hệ)', () => {
    expect(filterCustomers(db.customers, { type: 'foreign' }).length).toBe(1)
    expect(filterCustomers(db.customers, { search: 'minh anh' }).length).toBe(1)
    expect(filterCustomers(db.customers, { status: 'pending' }).length).toBe(1)
  })
})
