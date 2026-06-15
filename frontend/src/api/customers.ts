import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockRequest } from './client'
import { apiGet, apiPost, apiPut } from './http'
import { db, nextId } from '@/mocks/db'
import type { Customer, CustomerContact, CreateCustomerDto } from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export interface CustomerFilters { search?: string; type?: string; status?: string }

const now = () => new Date().toISOString()

function nextCustomerCode(existing: string[]): string {
  const nums = existing.map((c) => parseInt(c.replace(/^KH/, ''), 10)).filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return 'KH' + String(max + 1).padStart(3, '0')
}

function buildContacts(customerId: string, raw: CreateCustomerDto['contacts']): CustomerContact[] {
  const list = raw ?? []
  return list.map((c, i) => ({
    id: nextId('ct'), customerId, fullName: c.fullName, title: c.title ?? null,
    phone: c.phone ?? null, email: c.email ?? null, isPrimary: i === 0, sortOrder: i,
  }))
}

export function filterCustomers(list: Customer[], f: CustomerFilters): Customer[] {
  return list.filter((c) => {
    if (f.type && c.type !== f.type) return false
    if (f.status && c.status !== f.status) return false
    if (f.search) {
      const q = f.search.toLowerCase()
      const inContacts = (c.contacts ?? []).some((ct) => ct.fullName.toLowerCase().includes(q))
      if (!c.name.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q) &&
          !(c.taxCode ?? '').toLowerCase().includes(q) && !inContacts) return false
    }
    return true
  })
}

export function createCustomerInDb(dto: CreateCustomerDto): Customer {
  const id = nextId('cust')
  const code = nextCustomerCode(db.customers.map((c) => c.code))
  const contacts = buildContacts(id, dto.contacts)
  const primary = contacts.find((c) => c.isPrimary)
  const customer: Customer = {
    id, code, name: dto.name, type: dto.type, taxCode: dto.taxCode ?? null,
    address: dto.address ?? null, website: dto.website ?? null, status: dto.status ?? 'active',
    defaultValidityDays: dto.defaultValidityDays ?? 10, defaultDeliveryDays: dto.defaultDeliveryDays ?? 50,
    defaultPaymentTerms: dto.defaultPaymentTerms ?? '30-25-35-10',
    defaultWarrantyNote: dto.defaultWarrantyNote ?? null, defaultSpecialNote: dto.defaultSpecialNote ?? null,
    notes: dto.notes ?? null, createdAt: now(), updatedAt: now(),
    contacts,
    primaryContact: primary ? { fullName: primary.fullName, phone: primary.phone, email: primary.email } : undefined,
    projectCount: 0, quoteCount: 0, totalContractValue: 0,
  }
  db.customers.unshift(customer)
  return customer
}

export function updateCustomerInDb(id: string, dto: CreateCustomerDto): Customer | undefined {
  const c = db.customers.find((x) => x.id === id)
  if (!c) return undefined
  const contacts = buildContacts(id, dto.contacts)
  const primary = contacts.find((x) => x.isPrimary)
  Object.assign(c, {
    name: dto.name, type: dto.type, taxCode: dto.taxCode ?? null, address: dto.address ?? null,
    website: dto.website ?? null, status: dto.status ?? c.status,
    defaultValidityDays: dto.defaultValidityDays ?? c.defaultValidityDays,
    defaultDeliveryDays: dto.defaultDeliveryDays ?? c.defaultDeliveryDays,
    defaultPaymentTerms: dto.defaultPaymentTerms ?? c.defaultPaymentTerms,
    defaultWarrantyNote: dto.defaultWarrantyNote ?? null, defaultSpecialNote: dto.defaultSpecialNote ?? null,
    notes: dto.notes ?? null, updatedAt: now(), contacts,
    primaryContact: primary ? { fullName: primary.fullName, phone: primary.phone, email: primary.email } : undefined,
  })
  return c
}

export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery<Customer[]>({
    queryKey: ['customers', filters],
    queryFn: () => USE_MOCK
      ? mockRequest(() => filterCustomers(db.customers, filters))
      : apiGet<Customer[]>('/customers', { params: filters }),
  })
}

export function useCustomer(id: string | null) {
  return useQuery<Customer | undefined>({
    queryKey: ['customers', id],
    queryFn: () => USE_MOCK
      ? mockRequest(() => db.customers.find((c) => c.id === id))
      : apiGet<Customer>(`/customers/${id}`),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCustomerDto) => USE_MOCK
      ? mockRequest(() => createCustomerInDb(dto))
      : apiPost<Customer>('/customers', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateCustomerDto }) => USE_MOCK
      ? mockRequest(() => updateCustomerInDb(id, dto))
      : apiPut<Customer>(`/customers/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}
