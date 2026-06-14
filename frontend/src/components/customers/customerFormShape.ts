import { z } from 'zod'
import type { Customer, CustomerType, CustomerStatus, CreateCustomerDto } from '@/types'

export interface ContactRow { fullName: string; title: string; phone: string; email: string }
export interface CustomerFormShape {
  name: string
  type: CustomerType
  taxCode: string
  address: string
  website: string
  status: CustomerStatus
  notes: string
  defaultValidityDays: string
  defaultDeliveryDays: string
  defaultPaymentTerms: string
  defaultWarrantyNote: string
  defaultSpecialNote: string
  contacts: ContactRow[]
}

const intStr = (msg: string) => z.string().refine((v) => {
  const n = Number(v)
  return v !== '' && Number.isInteger(n) && n >= 0
}, msg)

export const customerSchema = z.object({
  name: z.string().min(1, 'Bắt buộc nhập tên khách hàng'),
  type: z.enum(['business', 'studio', 'foreign', 'state']),
  taxCode: z.string(),
  address: z.string(),
  website: z.string(),
  status: z.enum(['active', 'inactive', 'pending']),
  notes: z.string(),
  defaultValidityDays: intStr('Số ngày không hợp lệ'),
  defaultDeliveryDays: intStr('Số ngày không hợp lệ'),
  defaultPaymentTerms: z.string(),
  defaultWarrantyNote: z.string(),
  defaultSpecialNote: z.string(),
  contacts: z.array(z.object({
    fullName: z.string().min(1, 'Nhập họ tên'),
    title: z.string(),
    phone: z.string(),
    email: z.string(),
  })).min(1, 'Cần ít nhất 1 người liên hệ'),
})

export const emptyCustomerForm: CustomerFormShape = {
  name: '', type: 'business', taxCode: '', address: '', website: '', status: 'active', notes: '',
  defaultValidityDays: '10', defaultDeliveryDays: '50', defaultPaymentTerms: '30-25-35-10',
  defaultWarrantyNote: '', defaultSpecialNote: '',
  contacts: [{ fullName: '', title: '', phone: '', email: '' }],
}

export function customerToForm(c: Customer): CustomerFormShape {
  return {
    name: c.name, type: c.type, taxCode: c.taxCode ?? '', address: c.address ?? '',
    website: c.website ?? '', status: c.status, notes: c.notes ?? '',
    defaultValidityDays: String(c.defaultValidityDays), defaultDeliveryDays: String(c.defaultDeliveryDays),
    defaultPaymentTerms: c.defaultPaymentTerms, defaultWarrantyNote: c.defaultWarrantyNote ?? '',
    defaultSpecialNote: c.defaultSpecialNote ?? '',
    contacts: (c.contacts ?? []).map((ct) => ({
      fullName: ct.fullName, title: ct.title ?? '', phone: ct.phone ?? '', email: ct.email ?? '',
    })),
  }
}

export function formToCreateDto(v: CustomerFormShape): CreateCustomerDto {
  return {
    name: v.name, type: v.type, taxCode: v.taxCode || undefined, address: v.address || undefined,
    website: v.website || undefined, status: v.status,
    defaultValidityDays: Number(v.defaultValidityDays), defaultDeliveryDays: Number(v.defaultDeliveryDays),
    defaultPaymentTerms: v.defaultPaymentTerms,
    defaultWarrantyNote: v.defaultWarrantyNote || undefined, defaultSpecialNote: v.defaultSpecialNote || undefined,
    notes: v.notes || undefined,
    contacts: v.contacts.map((c, i) => ({
      fullName: c.fullName, title: c.title || null, phone: c.phone || null, email: c.email || null,
      isPrimary: i === 0, sortOrder: i,
    })),
  }
}
