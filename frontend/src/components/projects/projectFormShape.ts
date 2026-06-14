import { z } from 'zod'
import type { Project, ProjectType, ProjectStatus } from '@/types'
import type { ProjectFormValues } from '@/api/projects'

export interface ProjectFormShape {
  name: string
  customerId: string
  projectType: ProjectType
  siteId: string
  contractValue: string
  startDate: string
  deadline: string
  progressPct: string
  status: ProjectStatus
  description: string
}

const num = (s: string): number | undefined => (s.trim() === '' ? undefined : Number(s))

export const projectSchema = z.object({
  name: z.string().min(1, 'Bắt buộc nhập tên dự án'),
  customerId: z.string(),
  projectType: z.enum(['commercial', 'apartment', 'industrial', 'art', 'other']),
  siteId: z.string(),
  contractValue: z.string(),
  startDate: z.string(),
  deadline: z.string().min(1, 'Bắt buộc chọn ngày bàn giao'),
  progressPct: z.string().refine((v) => {
    if (v === '') return true
    const n = Number(v)
    return !Number.isNaN(n) && n >= 0 && n <= 100
  }, 'Tiến độ phải từ 0–100'),
  status: z.enum(['planning', 'in_progress', 'near_deadline', 'completed', 'paused', 'cancelled']),
  description: z.string(),
})

export const emptyProjectForm: ProjectFormShape = {
  name: '', customerId: '', projectType: 'commercial', siteId: '', contractValue: '',
  startDate: '', deadline: '', progressPct: '0', status: 'planning', description: '',
}

export function projectToForm(p: Project): ProjectFormShape {
  return {
    name: p.name, customerId: p.customerId ?? '', projectType: p.projectType, siteId: p.siteId,
    contractValue: p.contractValue == null ? '' : String(p.contractValue),
    startDate: p.startDate ?? '', deadline: p.deadline,
    progressPct: String(p.progressPct), status: p.status, description: p.description ?? '',
  }
}

export function formToValues(v: ProjectFormShape): ProjectFormValues {
  return {
    name: v.name, customerId: v.customerId || undefined, projectType: v.projectType,
    siteId: v.siteId || undefined, contractValue: num(v.contractValue),
    startDate: v.startDate || undefined, deadline: v.deadline,
    progressPct: num(v.progressPct), status: v.status, description: v.description || undefined,
  }
}
