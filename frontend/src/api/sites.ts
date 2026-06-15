import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockRequest } from './client'
import { apiGet, apiPost, apiPut, apiPatch } from './http'
import { db, nextId } from '@/mocks/db'
import type { Site, SiteType, SiteStatus } from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export interface SiteFilters { search?: string; status?: string; type?: string }
export interface SiteFormValues {
  name: string; type: SiteType; status: SiteStatus
  industrialZone?: string; address: string; city?: string
  phone?: string; areaM2?: number; notes?: string
}

const now = () => new Date().toISOString()

function nextSiteCode(existing: string[]): string {
  const nums = existing.map((c) => parseInt(c.replace(/\D/g, ''), 10)).filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return 'CS' + String(max + 1).padStart(3, '0')
}

/** Đếm dự án thực tế đang gắn vào xưởng (từ db). */
export function enrichSite(s: Site): Site {
  return {
    ...s,
    workerCount: db.workers.filter((w) => w.status === 'working').length, // global count
    projectCount: db.projects.filter((p) => p.siteId === s.id).length,
  }
}

export function filterSites(list: Site[], f: SiteFilters): Site[] {
  return list.filter((s) => {
    if (f.status && s.status !== f.status) return false
    if (f.type && s.type !== f.type) return false
    if (f.search) {
      const q = f.search.toLowerCase()
      if (!s.name.toLowerCase().includes(q) && !s.code.toLowerCase().includes(q)
        && !(s.city ?? '').toLowerCase().includes(q) && !(s.industrialZone ?? '').toLowerCase().includes(q)) return false
    }
    return true
  }).map(enrichSite)
}

export function createSiteInDb(v: SiteFormValues): Site {
  const site: Site = {
    id: nextId('site'), code: nextSiteCode(db.sites.map((s) => s.code)),
    name: v.name, type: v.type, status: v.status,
    industrialZone: v.industrialZone ?? null, address: v.address, city: v.city ?? null,
    managerId: null, phone: v.phone ?? null, areaM2: v.areaM2 ?? null, notes: v.notes ?? null,
    createdAt: now(), updatedAt: now(),
  }
  db.sites.push(site)
  return enrichSite(site)
}

export function updateSiteInDb(id: string, v: SiteFormValues): Site | undefined {
  const s = db.sites.find((x) => x.id === id)
  if (!s) return undefined
  Object.assign(s, {
    name: v.name, type: v.type, status: v.status,
    industrialZone: v.industrialZone ?? null, address: v.address, city: v.city ?? null,
    phone: v.phone ?? null, areaM2: v.areaM2 ?? null, notes: v.notes ?? null, updatedAt: now(),
  })
  return enrichSite(s)
}

/** Đổi trạng thái nhanh (Tạm dừng / kích hoạt lại). */
export function setSiteStatusInDb(id: string, status: SiteStatus): Site | undefined {
  const s = db.sites.find((x) => x.id === id)
  if (!s) return undefined
  s.status = status; s.updatedAt = now()
  return enrichSite(s)
}

// ─── HOOKS ───────────────────────────────────────────────────────────────────

export function useSites(filters: SiteFilters = {}) {
  return useQuery<Site[]>({
    queryKey: ['sites', filters],
    queryFn: () => USE_MOCK
      ? mockRequest(() => filterSites(db.sites, filters))
      : apiGet<Site[]>('/sites', { params: filters }),
  })
}

export function useCreateSite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: SiteFormValues) => USE_MOCK
      ? mockRequest(() => createSiteInDb(v))
      : apiPost<Site>('/sites', v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sites'] }),
  })
}

export function useUpdateSite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SiteFormValues }) => USE_MOCK
      ? mockRequest(() => updateSiteInDb(id, values))
      : apiPut<Site>(`/sites/${id}`, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sites'] }),
  })
}

export function useSetSiteStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SiteStatus }) => USE_MOCK
      ? mockRequest(() => setSiteStatusInDb(id, status))
      : apiPatch<Site>(`/sites/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sites'] }),
  })
}
