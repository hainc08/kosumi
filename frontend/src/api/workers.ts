import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockRequest } from './client'
import { apiGet, apiPost, apiPut, apiPatch } from './http'
import { db, nextId } from '@/mocks/db'
import { deriveInitials, avatarColorFor, nextWorkerCode } from '@/utils/worker-helpers'
import type { Worker, WorkerContract, Position, ContractType } from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export interface WorkerFilters { search?: string; status?: string; position?: string }
export interface WorkerFormValues {
  fullName: string; gender: 'male' | 'female'; dateOfBirth?: string; idNumber?: string
  phone?: string; address?: string; position: Position
  experienceYears: number; notes?: string
  contractType: ContractType; startDate: string
  baseSalary?: number
  allowanceResponsibility?: number
  allowanceAttendance?: number
  ratePerUnit?: number; unitName?: string
}

const now = () => new Date().toISOString()

function buildContract(workerId: string, v: WorkerFormValues): WorkerContract {
  return {
    id: nextId('c'), workerId, contractType: v.contractType, startDate: v.startDate, endDate: null,
    baseSalary: v.baseSalary ?? null,
    allowanceResponsibility: v.allowanceResponsibility ?? null,
    allowanceAttendance: v.allowanceAttendance ?? null,
    ratePerUnit: v.ratePerUnit ?? null, unitName: v.unitName ?? null,
    isActive: true, createdAt: now(), updatedAt: now(),
  }
}

export function filterWorkers(list: Worker[], f: WorkerFilters): Worker[] {
  return list.filter((w) => {
    if (f.status && w.status !== f.status) return false
    if (f.position && w.position !== f.position) return false
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
  const worker: Worker = {
    id, code, fullName: v.fullName, gender: v.gender,
    dateOfBirth: v.dateOfBirth ?? null, idNumber: v.idNumber ?? null, phone: v.phone ?? null,
    address: v.address ?? null, position: v.position,
    experienceYears: v.experienceYears, status: 'working', notes: v.notes ?? null,
    createdAt: now(), updatedAt: now(),
    initials: deriveInitials(v.fullName), avatarColor: avatarColorFor(id),
    activeContract: buildContract(id, v),
  }
  db.workers.unshift(worker)
  return worker
}

export function updateWorkerInDb(id: string, v: WorkerFormValues): Worker | undefined {
  const w = db.workers.find((x) => x.id === id)
  if (!w) return undefined
  Object.assign(w, {
    fullName: v.fullName, gender: v.gender, dateOfBirth: v.dateOfBirth ?? null,
    idNumber: v.idNumber ?? null, phone: v.phone ?? null, address: v.address ?? null,
    position: v.position, experienceYears: v.experienceYears,
    notes: v.notes ?? null, updatedAt: now(), initials: deriveInitials(v.fullName),
  })
  if (w.activeContract) {
    Object.assign(w.activeContract, {
      contractType: v.contractType, startDate: v.startDate,
      baseSalary: v.baseSalary ?? null,
      allowanceResponsibility: v.allowanceResponsibility ?? null,
      allowanceAttendance: v.allowanceAttendance ?? null,
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
    queryFn: () => USE_MOCK
      ? mockRequest(() => filterWorkers(db.workers, filters))
      : apiGet<Worker[]>('/workers', { params: filters }),
  })
}

export function useCreateWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: WorkerFormValues) => USE_MOCK
      ? mockRequest(() => createWorkerInDb(v))
      : apiPost<Worker>('/workers', v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workers'] }),
  })
}

export function useUpdateWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: WorkerFormValues }) => USE_MOCK
      ? mockRequest(() => updateWorkerInDb(id, values))
      : apiPut<Worker>(`/workers/${id}`, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workers'] }),
  })
}

export function useUpdateWorkerStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Worker['status'] }): Promise<Worker | void> => USE_MOCK
      ? mockRequest(() => setWorkerStatusInDb(id, status))
      : apiPatch<Worker>(`/workers/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workers'] }),
  })
}
