// WorkShop Pro — Skill: API Client Pattern
// File: skills/api-client.skill.ts
// Copy pattern này cho mọi module API

import axios from 'axios'

// ─── AXIOS INSTANCE ───────────────────────────────────────────────────────────
// src/lib/axios.ts

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor: handle 401 → refresh
api.interceptors.response.use(
  res => res.data,   // unwrap .data automatically
  async err => {
    if (err.response?.status === 401) {
      // TODO: implement token refresh
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data ?? err)
  }
)

// ─── REACT QUERY KEYS ─────────────────────────────────────────────────────────
// Pattern: queryKeys.module.operation(params)

export const queryKeys = {
  sites: {
    all:    ['sites']                              as const,
    list:   (filters?: object) => ['sites', 'list', filters]  as const,
    detail: (id: string)       => ['sites', id]   as const,
  },
  workers: {
    all:    ['workers']                            as const,
    list:   (filters?: object) => ['workers', 'list', filters] as const,
    detail: (id: string)       => ['workers', id] as const,
  },
  projects: {
    all:    ['projects']                           as const,
    list:   (filters?: object) => ['projects', 'list', filters] as const,
    detail: (id: string)       => ['projects', id] as const,
  },
  quotes: {
    all:    ['quotes']                             as const,
    list:   (filters?: object) => ['quotes', 'list', filters] as const,
    detail: (id: string)       => ['quotes', id]  as const,
  },
  tasks: {
    board:  (params: object)   => ['tasks', 'board', params]  as const,
    detail: (id: string)       => ['tasks', id]   as const,
  },
  timesheet: {
    monthly: (yearMonth: string, siteId?: string) =>
      ['timesheet', 'monthly', yearMonth, siteId] as const,
    worker:  (workerId: string, yearMonth: string) =>
      ['timesheet', 'worker', workerId, yearMonth] as const,
  },
}

// ─── EXAMPLE: Workers API ─────────────────────────────────────────────────────
// src/api/workers.ts — copy pattern cho mọi module

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Worker, CreateWorkerDto, UpdateWorkerDto, WorkerStatus,
              CreateContractDto, WorkerContract } from '@/types'

interface WorkerFilters {
  search?:  string
  siteId?:  string
  status?:  WorkerStatus
  skill?:   string
}

// List
export function useWorkers(filters?: WorkerFilters) {
  return useQuery({
    queryKey: queryKeys.workers.list(filters),
    queryFn:  () => api.get('/workers', { params: filters }),
    staleTime: 30_000,    // 30s — workers don't change very often
  })
}

// Single
export function useWorker(id: string) {
  return useQuery({
    queryKey: queryKeys.workers.detail(id),
    queryFn:  () => api.get(`/workers/${id}`),
    enabled:  !!id,
  })
}

// Create
export function useCreateWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateWorkerDto) => api.post('/workers', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workers.all })
    },
  })
}

// Update
export function useUpdateWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateWorkerDto }) =>
      api.put(`/workers/${id}`, dto),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.workers.all })
      qc.invalidateQueries({ queryKey: queryKeys.workers.detail(id) })
    },
  })
}

// Status change
export function useUpdateWorkerStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: WorkerStatus }) =>
      api.patch(`/workers/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workers.all })
    },
  })
}

// Add contract
export function useAddContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ workerId, dto }: { workerId: string; dto: CreateContractDto }) =>
      api.post(`/workers/${workerId}/contracts`, dto),
    onSuccess: (_, { workerId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.workers.detail(workerId) })
    },
  })
}

// Delete (soft)
export function useDeleteWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/workers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workers.all })
    },
  })
}

// ─── TOAST STORE ─────────────────────────────────────────────────────────────
// src/stores/toastStore.ts

import { create } from 'zustand'

interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
  visible: boolean
  show: (message: string, type?: ToastState['type']) => void
  hide: () => void
}

export const useToastStore = create<ToastState>(set => ({
  message: '',
  type: 'success',
  visible: false,
  show: (message, type = 'success') => {
    set({ message, type, visible: true })
    setTimeout(() => set({ visible: false }), 3000)
  },
  hide: () => set({ visible: false }),
}))

// ─── USAGE EXAMPLE IN A COMPONENT ────────────────────────────────────────────

/*
function WorkerActions({ worker }: { worker: Worker }) {
  const toast = useToastStore()
  const deleteWorker = useDeleteWorker()

  async function handleDelete() {
    try {
      await deleteWorker.mutateAsync(worker.id)
      toast.show(`✓ Đã xóa công nhân ${worker.fullName}`)
    } catch (err: any) {
      toast.show(err.message ?? 'Có lỗi xảy ra', 'error')
    }
  }

  return (
    <button onClick={handleDelete} disabled={deleteWorker.isPending}>
      {deleteWorker.isPending ? 'Đang xóa...' : 'Xóa'}
    </button>
  )
}
*/
