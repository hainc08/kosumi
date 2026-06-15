import { z } from 'zod'
import type { Site, SiteType, SiteStatus } from '@/types'
import type { SiteFormValues } from '@/api/sites'

export interface SiteFormShape {
  name: string
  type: SiteType
  status: SiteStatus
  industrialZone: string
  address: string
  city: string
  phone: string
  areaM2: string
  notes: string
}

export const siteSchema = z.object({
  name: z.string().min(1, 'Bắt buộc nhập tên công trường'),
  type: z.enum(['factory', 'construction', 'warehouse']),
  status: z.enum(['active', 'paused', 'preparing']),
  industrialZone: z.string(),
  address: z.string().min(1, 'Bắt buộc nhập địa chỉ'),
  city: z.string(),
  phone: z.string(),
  areaM2: z.string().refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), 'Diện tích phải là số'),
  notes: z.string(),
})

export const emptySiteForm = (): SiteFormShape => ({
  name: '', type: 'factory', status: 'active',
  industrialZone: '', address: '', city: '', phone: '', areaM2: '', notes: '',
})

export function siteToForm(s: Site): SiteFormShape {
  return {
    name: s.name, type: s.type, status: s.status,
    industrialZone: s.industrialZone ?? '', address: s.address, city: s.city ?? '',
    phone: s.phone ?? '', areaM2: s.areaM2 == null ? '' : String(s.areaM2), notes: s.notes ?? '',
  }
}

export function formToValues(v: SiteFormShape): SiteFormValues {
  return {
    name: v.name, type: v.type, status: v.status,
    industrialZone: v.industrialZone || undefined, address: v.address, city: v.city || undefined,
    phone: v.phone || undefined, areaM2: v.areaM2 ? Number(v.areaM2) : undefined, notes: v.notes || undefined,
  }
}
