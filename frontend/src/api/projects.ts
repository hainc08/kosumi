import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockRequest } from './client'
import { apiGet, apiPost, apiPut } from './http'
import { db, nextId } from '@/mocks/db'
import type { Project, ProjectStatus, ProjectType } from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export interface ProjectFilters { search?: string; status?: string; siteId?: string; quoteCode?: string }
export interface ProjectFormValues {
  name: string; customerId?: string; projectType: ProjectType; siteId?: string
  contractValue?: number; startDate?: string; deadline: string
  progressPct?: number; status?: ProjectStatus; description?: string
}

const now = () => new Date().toISOString()

function nextProjectCode(existing: string[]): string {
  const nums = existing.map((c) => parseInt(c.replace(/^PRJ/, ''), 10)).filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return 'PRJ' + String(max + 1).padStart(3, '0')
}

/** Báo giá liên quan của 1 dự án (từ db mock). */
function quotesOfProject(projectId: string) {
  return db.quotes
    .filter((q) => q.projectId === projectId)
    .map((q) => ({ id: q.id, code: q.code, title: q.title, status: q.status }))
}

export function filterProjects(list: Project[], f: ProjectFilters): Project[] {
  return list
    .map((p) => {
      const quotes = quotesOfProject(p.id)
      return { ...p, quotes, quoteCount: quotes.length, hasInstallation: db.quotes.some((q) => q.projectId === p.id && q.hasInstallation) }
    })
    .filter((p) => {
      if (f.status && p.status !== f.status) return false
      if (f.siteId && p.siteId !== f.siteId) return false
      if (f.quoteCode && !p.quotes.some((q) => q.code.toLowerCase().includes(f.quoteCode!.toLowerCase()))) return false
      if (f.search) {
        const q = f.search.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q)) return false
      }
      return true
    })
}

export function createProjectInDb(v: ProjectFormValues): Project {
  const id = nextId('prj')
  const code = nextProjectCode(db.projects.map((p) => p.code))
  const site = db.sites.find((s) => s.id === v.siteId)
  const customer = db.customers.find((c) => c.id === v.customerId)
  const project: Project = {
    id, code, name: v.name, customerId: v.customerId ?? null, projectType: v.projectType,
    siteId: v.siteId ?? null, contractValue: v.contractValue ?? null,
    startDate: v.startDate ?? null, deadline: v.deadline, actualEndDate: null,
    progressPct: v.progressPct ?? 0, status: v.status ?? 'planning',
    description: v.description ?? null, managerId: null, createdAt: now(), updatedAt: now(),
    site: site ? { id: site.id, name: site.name } : undefined,
    customer: customer ? { id: customer.id, name: customer.name } : undefined,
    quoteCount: 0, workerCount: 0,
  }
  db.projects.unshift(project)
  return project
}

export function updateProjectInDb(id: string, v: ProjectFormValues): Project | undefined {
  const p = db.projects.find((x) => x.id === id)
  if (!p) return undefined
  const site = db.sites.find((s) => s.id === v.siteId)
  const customer = db.customers.find((c) => c.id === v.customerId)
  Object.assign(p, {
    name: v.name, customerId: v.customerId ?? null, projectType: v.projectType,
    siteId: v.siteId ?? p.siteId, contractValue: v.contractValue ?? null,
    startDate: v.startDate ?? null, deadline: v.deadline,
    progressPct: v.progressPct ?? p.progressPct, status: v.status ?? p.status,
    description: v.description ?? null, updatedAt: now(),
    site: site ? { id: site.id, name: site.name } : p.site,
    customer: customer ? { id: customer.id, name: customer.name } : undefined,
  })
  return p
}

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery<Project[]>({
    queryKey: ['projects', filters],
    queryFn: () => USE_MOCK
      ? mockRequest(() => filterProjects(db.projects, filters))
      : apiGet<Project[]>('/projects', { params: filters }),
  })
}

export function useProject(id: string | null) {
  return useQuery<Project | undefined>({
    queryKey: ['projects', id],
    queryFn: () => USE_MOCK
      ? mockRequest(() => db.projects.find((p) => p.id === id))
      : apiGet<Project>(`/projects/${id}`),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: ProjectFormValues) => USE_MOCK
      ? mockRequest(() => createProjectInDb(v))
      : apiPost<Project>('/projects', v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProjectFormValues }) => USE_MOCK
      ? mockRequest(() => updateProjectInDb(id, values))
      : apiPut<Project>(`/projects/${id}`, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}
