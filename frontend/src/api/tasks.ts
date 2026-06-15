import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockRequest } from './client'
import { db, nextId } from '@/mocks/db'
import type { Task, TaskAssignment, Worker } from '@/types'

const now = () => new Date().toISOString()

type WorkerLite = Pick<Worker, 'id' | 'code' | 'fullName' | 'initials' | 'avatarColor'>
function toLite(w: Worker): WorkerLite {
  return { id: w.id, code: w.code, fullName: w.fullName, initials: w.initials, avatarColor: w.avatarColor }
}

/** Gắn assignments đang active + thông tin công nhân vào task. */
export function enrichTask(t: Task): Task {
  const assignments = db.taskAssignments
    .filter((a) => a.taskId === t.id && a.isActive)
    .map((a) => {
      const w = db.workers.find((x) => x.id === a.workerId)
      return { ...a, worker: w ? toLite(w) : undefined }
    })
  return {
    ...t,
    assignments,
    activeWorkers: assignments.map((a) => a.worker).filter(Boolean) as WorkerLite[],
  }
}

/** Danh sách quoteItemId thuộc 1 báo giá. */
function itemIdsOfQuote(quoteId: string): Set<string> {
  return new Set(db.quoteItems.filter((qi) => qi.quoteId === quoteId).map((qi) => qi.id as string))
}

/** Các task của 1 báo giá (qua quoteItemId). */
export function tasksForQuote(quoteId: string): Task[] {
  const ids = itemIdsOfQuote(quoteId)
  return db.tasks
    .filter((t) => t.quoteItemId && ids.has(t.quoteItemId))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(enrichTask)
}

/** id công nhân đang bận (có ít nhất 1 assignment active). */
export function busyWorkerIds(): Set<string> {
  return new Set(db.taskAssignments.filter((a) => a.isActive).map((a) => a.workerId))
}

/** Công nhân sẵn sàng nhận việc (đang làm việc & chưa bận). */
export function availableWorkersAtSite(_siteId: string): Worker[] {
  const busy = busyWorkerIds()
  return db.workers.filter((w) => w.status === 'working' && !busy.has(w.id))
}

export function assignWorkerInDb(taskId: string, workerId: string): TaskAssignment {
  const a: TaskAssignment = {
    id: nextId('ta'), taskId, workerId,
    assignedAt: now(), startedAt: now(), endedAt: null, isActive: true,
    createdAt: now(), updatedAt: now(),
  }
  db.taskAssignments.push(a)
  const task = db.tasks.find((t) => t.id === taskId)
  if (task && task.status === 'unassigned') { task.status = 'in_progress'; task.updatedAt = now() }
  return a
}

export function unassignWorkerInDb(taskId: string, workerId: string): void {
  const a = db.taskAssignments.find((x) => x.taskId === taskId && x.workerId === workerId && x.isActive)
  if (a) { a.isActive = false; a.endedAt = now(); a.updatedAt = now() }
  const task = db.tasks.find((t) => t.id === taskId)
  const stillActive = db.taskAssignments.some((x) => x.taskId === taskId && x.isActive)
  if (task && !stillActive) { task.status = 'unassigned'; task.updatedAt = now() }
}

/** Chuyển công nhân sang task mới: kết thúc assignment cũ, tạo assignment mới. */
export function transferWorkerInDb(workerId: string, fromTaskId: string, toTaskId: string): TaskAssignment {
  unassignWorkerInDb(fromTaskId, workerId)
  const a = assignWorkerInDb(toTaskId, workerId)
  a.transferredFromTaskId = fromTaskId
  return a
}

/** Lưu toàn bộ phân công nháp (taskId -> danh sách workerId). Trả về số lượt giao. */
export function saveAssignmentsInDb(draft: Record<string, string[]>): number {
  let count = 0
  for (const [taskId, workerIds] of Object.entries(draft)) {
    for (const workerId of workerIds) { assignWorkerInDb(taskId, workerId); count += 1 }
  }
  return count
}

// ─── HOOKS ───────────────────────────────────────────────────────────────────

export function useQuoteTasks(quoteId: string | null) {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'quote', quoteId],
    queryFn: () => mockRequest(() => tasksForQuote(quoteId!)),
    enabled: !!quoteId,
  })
}

export function useAvailableWorkers(siteId: string | null) {
  return useQuery<Worker[]>({
    queryKey: ['tasks', 'available-workers', siteId],
    queryFn: () => mockRequest(() => availableWorkersAtSite(siteId!)),
    enabled: !!siteId,
  })
}

/** Tất cả task đang có người làm (cho Transfer Drawer + bảng tổng quan). */
export function useActiveTasks() {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'active'],
    queryFn: () => mockRequest(() => db.tasks.map(enrichTask)),
  })
}

export function useAssignWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, workerId }: { taskId: string; workerId: string }) =>
      mockRequest(() => assignWorkerInDb(taskId, workerId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUnassignWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, workerId }: { taskId: string; workerId: string }) =>
      mockRequest(() => unassignWorkerInDb(taskId, workerId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useTransferWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ workerId, fromTaskId, toTaskId }: { workerId: string; fromTaskId: string; toTaskId: string }) =>
      mockRequest(() => transferWorkerInDb(workerId, fromTaskId, toTaskId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useSaveAssignments() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (draft: Record<string, string[]>) => mockRequest(() => saveAssignmentsInDb(draft)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
