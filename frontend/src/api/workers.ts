import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockRequest } from './client'
import { db, nextId } from '@/mocks/db'
import { deriveInitials, avatarColorFor, nextWorkerCode } from '@/utils/worker-helpers'
import type { Worker, WorkerContract, PrimarySkill, ContractType } from '@/types'

export interface WorkerFilters { search?: string; siteId?: string; status?: string; skill?: string }
export interface WorkerFormValues {
  fullName: string; gender: 'male' | 'female'; dateOfBirth?: string; idNumber?: string
  phone?: string; address?: string; siteId?: string; primarySkill: PrimarySkill
  experienceYears: number; notes?: string
  contractType: ContractType; startDate: string
  rateNormal?: number; rateOvertime?: number; baseSalary?: number; allowance?: number
  ratePerUnit?: number; unitName?: string
}

const now = () => new Date().toISOString()

function buildContract(workerId: string, v: WorkerFormValues): WorkerContract {
  return {
    id: nextId('c'), workerId, contractType: v.contractType, startDate: v.startDate, endDate: null,
    rateNormal: v.rateNormal ?? null, rateOvertime: v.rateOvertime ?? null,
    baseSalary: v.baseSalary ?? null, allowance: v.allowance ?? null,
    ratePerUnit: v.ratePerUnit ?? null, unitName: v.unitName ?? null,
    isActive: true, createdAt: now(), updatedAt: now(),
  }
}

export function filterWorkers(list: Worker[], f: WorkerFilters): Worker[] {
  return list.filter((w) => {
    if (f.siteId && w.siteId !== f.siteId) return false
    if (f.status && w.status !== f.status) return false
    if (f.skill && w.primarySkill !== f.skill) return false
    if (f.search) {
      const q = f.search.toLowerCase()
      if (!w.fullName.toLowerCase().includes(q) && !w.code.toLowerCase().includes(q)) return false
    }
    return true
  })
}

export function createWorkerInDb(v: WorkerFormValues): Worker {
  const id = nextId('w')
  const code = nextWorkerCode(db.workers.map((w) => w.code))
  const site = db.sites.find((s) => s.id === v.siteId)
  const worker: Worker = {
    id, code, fullName: v.fullName, gender: v.gender,
    dateOfBirth: v.dateOfBirth ?? null, idNumber: v.idNumber ?? null, phone: v.phone ?? null,
    address: v.address ?? null, siteId: v.siteId ?? null, primarySkill: v.primarySkill,
    experienceYears: v.experienceYears, status: 'working', notes: v.notes ?? null,
    createdAt: now(), updatedAt: now(),
    initials: deriveInitials(v.fullName), avatarColor: avatarColorFor(id),
    site: site ? { id: site.id, name: site.name } : undefined,
    activeContract: buildContract(id, v),
  }
  db.workers.unshift(worker)
  return worker
}

export function updateWorkerInDb(id: string, v: WorkerFormValues): Worker | undefined {
  const w = db.workers.find((x) => x.id === id)
  if (!w) return undefined
  const site = db.sites.find((s) => s.id === v.siteId)
  Object.assign(w, {
    fullName: v.fullName, gender: v.gender, dateOfBirth: v.dateOfBirth ?? null,
    idNumber: v.idNumber ?? null, phone: v.phone ?? null, address: v.address ?? null,
    siteId: v.siteId ?? null, primarySkill: v.primarySkill, experienceYears: v.experienceYears,
    notes: v.notes ?? null, updatedAt: now(), initials: deriveInitials(v.fullName),
    site: site ? { id: site.id, name: site.name } : undefined,
  })
  if (w.activeContract) {
    Object.assign(w.activeContract, {
      contractType: v.contractType, startDate: v.startDate,
      rateNormal: v.rateNormal ?? null, rateOvertime: v.rateOvertime ?? null,
      baseSalary: v.baseSalary ?? null, allowance: v.allowance ?? null,
      ratePerUnit: v.ratePerUnit ?? null, unitName: v.unitName ?? null, updatedAt: now(),
    })
  }
  return w
}

export function setWorkerStatusInDb(id: string, status: Worker['status']): void {
  const w = db.workers.find((x) => x.id === id)
  if (w) { w.status = status; w.updatedAt = now() }
}

export function useWorkers(filters: WorkerFilters = {}) {
  return useQuery<Worker[]>({
    queryKey: ['workers', filters],
    queryFn: () => mockRequest(() => filterWorkers(db.workers, filters)),
  })
}

export function useCreateWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: WorkerFormValues) => mockRequest(() => createWorkerInDb(v)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workers'] }),
  })
}

export function useUpdateWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: WorkerFormValues }) =>
      mockRequest(() => updateWorkerInDb(id, values)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workers'] }),
  })
}

export function useUpdateWorkerStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Worker['status'] }) =>
      mockRequest(() => setWorkerStatusInDb(id, status)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workers'] }),
  })
}
