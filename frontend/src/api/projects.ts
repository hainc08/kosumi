import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockRequest } from './client'
import { db, nextId } from '@/mocks/db'
import type { Project, ProjectStatus, ProjectType } from '@/types'

export interface ProjectFilters { search?: string; status?: string; siteId?: string }
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

export function filterProjects(list: Project[], f: ProjectFilters): Project[] {
  return list.filter((p) => {
    if (f.status && p.status !== f.status) return false
    if (f.siteId && p.siteId !== f.siteId) return false
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
    siteId: v.siteId ?? '', contractValue: v.contractValue ?? null,
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
    queryFn: () => mockRequest(() => filterProjects(db.projects, filters)),
  })
}

export function useProject(id: string | null) {
  return useQuery<Project | undefined>({
    queryKey: ['projects', id],
    queryFn: () => mockRequest(() => db.projects.find((p) => p.id === id)),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: ProjectFormValues) => mockRequest(() => createProjectInDb(v)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProjectFormValues }) =>
      mockRequest(() => updateProjectInDb(id, values)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}
