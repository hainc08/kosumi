import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockRequest } from './client'
import { apiGet, apiPost } from './http'
import { db, nextId } from '@/mocks/db'
import type { Task, TaskAssignment, Worker, CompletedTask } from '@/types'
import { STAFF_POSITIONS } from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

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

/** Các hạng mục công việc của 1 dự án, kèm `section` (danh mục) từ hạng mục báo giá nguồn. */
export function tasksForProjectDb(projectId: string): Task[] {
  const minutesOf = (a: TaskAssignment) =>
    a.endedAt && a.startedAt ? Math.max(0, Math.round((+new Date(a.endedAt) - +new Date(a.startedAt)) / 60000)) : 0
  return db.tasks
    .filter((t) => t.projectId === projectId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((t) => {
      const item = t.quoteItemId ? db.quoteItems.find((qi) => qi.id === t.quoteItemId) : undefined
      const list = db.taskAssignments.filter((a) => a.taskId === t.id)
      const wids = [...new Set(list.map((a) => a.workerId))]
      const workedBy = wids.map((id) => db.workers.find((w) => w.id === id)).filter(Boolean)
        .map((w) => ({ id: w!.id, fullName: w!.fullName, initials: w!.initials, avatarColor: w!.avatarColor }))
      return {
        ...enrichTask(t), section: item?.sectionName ?? null,
        workedBy,
        totalMinutes: list.reduce((s, a) => s + minutesOf(a), 0),
        overtimeMinutes: list.filter((a) => a.isOvertime).reduce((s, a) => s + minutesOf(a), 0),
      }
    })
}

/** Sinh task từ 1 báo giá (mỗi hạng mục -> 1 task). Idempotent. Mock không throw để tránh lỗi setTimeout. */
export function generateFromQuoteInDb(quoteId: string): { created: number } {
  const quote = db.quotes.find((q) => q.id === quoteId)
  if (!quote) return { created: 0 }
  const project = db.projects.find((p) => p.id === quote.projectId)
  if (!project || !project.siteId) return { created: 0 } // chưa có công trường -> bỏ qua (real BE sẽ báo lỗi)
  const items = db.quoteItems.filter((qi) => qi.quoteId === quoteId).sort((a, b) => a.sortOrder - b.sortOrder)
  const have = new Set(db.tasks.map((t) => t.quoteItemId).filter(Boolean))
  const toCreate = items.filter((i) => !have.has(i.id as string))
  const today = now().slice(0, 10)
  toCreate.forEach((i) => {
    db.tasks.push({
      id: nextId('task'), quoteItemId: i.id as string, projectId: project.id, siteId: project.siteId as string,
      title: i.itemName, description: i.description ?? undefined, taskDate: today,
      status: 'unassigned', priority: 'medium', sortOrder: i.sortOrder, createdAt: now(), updatedAt: now(),
    } as Task)
  })
  return { created: toCreate.length }
}

/** Sinh task cho toàn bộ báo giá của 1 dự án. */
export function generateForProjectInDb(projectId: string): { created: number } {
  const quotes = db.quotes.filter((q) => q.projectId === projectId)
  let created = 0
  for (const q of quotes) created += generateFromQuoteInDb(q.id).created
  return { created }
}

/** id công nhân đang bận (có ít nhất 1 assignment active). */
export function busyWorkerIds(): Set<string> {
  return new Set(db.taskAssignments.filter((a) => a.isActive).map((a) => a.workerId))
}

/** Công nhân sẵn sàng nhận việc (đang làm việc & chưa bận). */
export function availableWorkersAtSite(_siteId: string): Worker[] {
  const busy = busyWorkerIds()
  return db.workers.filter((w) => w.status === 'working' && !busy.has(w.id) && STAFF_POSITIONS.includes(w.position))
}

export function assignWorkerInDb(taskId: string, workerId: string, otHours?: number): TaskAssignment {
  const overtime = typeof otHours === 'number' && otHours > 0
  const a: TaskAssignment = {
    id: nextId('ta'), taskId, workerId,
    assignedAt: now(), startedAt: now(), endedAt: null, isActive: true,
    isOvertime: overtime, otEndAt: null,
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
export function saveAssignmentsInDb(draft: Record<string, string[]>, otHours?: number): number {
  let count = 0
  for (const [taskId, workerIds] of Object.entries(draft)) {
    for (const workerId of workerIds) { assignWorkerInDb(taskId, workerId, otHours); count += 1 }
  }
  return count
}

/** Tan ca: đóng assignment active ca thường (không OT), NV về chờ. */
export function clockOutInDb(): { ended: number } {
  const actives = db.taskAssignments.filter((a) => a.isActive && !a.isOvertime)
  actives.forEach((a) => { a.isActive = false; a.endedAt = now(); a.updatedAt = now() })
  const taskIds = new Set(actives.map((a) => a.taskId))
  taskIds.forEach((id) => {
    const task = db.tasks.find((t) => t.id === id)
    if (!task || task.status === 'completed' || task.status === 'cancelled') return
    const still = db.taskAssignments.some((x) => x.taskId === id && x.isActive)
    if (!still && task.status !== 'unassigned') { task.status = 'unassigned'; task.updatedAt = now() }
  })
  return { ended: actives.length }
}

/** Đóng assignment active + đặt trạng thái kết thúc. */
function closeTaskInDb(taskId: string, status: 'completed' | 'cancelled'): Task | undefined {
  const task = db.tasks.find((t) => t.id === taskId)
  if (!task) return undefined
  db.taskAssignments.filter((a) => a.taskId === taskId && a.isActive)
    .forEach((a) => { a.isActive = false; a.endedAt = now(); a.updatedAt = now() })
  task.status = status; task.updatedAt = now()
  return task
}

/** Hoàn thành hạng mục. */
export function completeTaskInDb(taskId: string): Task | undefined { return closeTaskInDb(taskId, 'completed') }

/** Hủy hạng mục. */
export function cancelTaskInDb(taskId: string): Task | undefined { return closeTaskInDb(taskId, 'cancelled') }

/** Danh sách hạng mục đã hoàn thành + ai làm + tổng phút + phút OT. */
export function completedTasksFromDb(): CompletedTask[] {
  const minutesOf = (a: TaskAssignment) =>
    a.endedAt && a.startedAt ? Math.max(0, Math.round((+new Date(a.endedAt) - +new Date(a.startedAt)) / 60000)) : 0
  return db.tasks.filter((t) => t.status === 'completed').map((t) => {
    const list = db.taskAssignments.filter((a) => a.taskId === t.id)
    const wids = [...new Set(list.map((a) => a.workerId))]
    const workers = wids.map((id) => db.workers.find((w) => w.id === id)).filter(Boolean)
      .map((w) => ({ id: w!.id, fullName: w!.fullName, initials: w!.initials, avatarColor: w!.avatarColor }))
    return {
      ...t,
      workers,
      totalMinutes: list.reduce((s, a) => s + minutesOf(a), 0),
      overtimeMinutes: list.filter((a) => a.isOvertime).reduce((s, a) => s + minutesOf(a), 0),
    }
  })
}

// ─── HOOKS ───────────────────────────────────────────────────────────────────

export function useQuoteTasks(quoteId: string | null) {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'quote', quoteId],
    queryFn: () => USE_MOCK
      ? mockRequest(() => tasksForQuote(quoteId!))
      : apiGet<Task[]>('/tasks', { params: { quoteId } }),
    enabled: !!quoteId,
  })
}

/** Hạng mục công việc của 1 dự án (gom theo danh mục ở FE). */
export function useProjectTasks(projectId: string | null) {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'project', projectId],
    queryFn: () => USE_MOCK
      ? mockRequest(() => tasksForProjectDb(projectId!))
      : apiGet<Task[]>('/tasks', { params: { projectId } }),
    enabled: !!projectId,
  })
}

/** Sinh task từ 1 báo giá. */
export function useGenerateTasksFromQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (quoteId: string) => USE_MOCK
      ? mockRequest(() => generateFromQuoteInDb(quoteId))
      : apiPost<{ created: number }>(`/tasks/generate-from-quote?quoteId=${quoteId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

/** Sinh (tạo lại) task cho toàn bộ báo giá của 1 dự án. */
export function useGenerateTasksForProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => USE_MOCK
      ? mockRequest(() => generateForProjectInDb(projectId))
      : apiPost<{ created: number }>(`/tasks/generate-for-project?projectId=${projectId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useAvailableWorkers(siteId: string | null) {
  return useQuery<Worker[]>({
    queryKey: ['tasks', 'available-workers', siteId],
    queryFn: () => USE_MOCK
      ? mockRequest(() => availableWorkersAtSite(siteId!))
      : apiGet<Worker[]>('/tasks/available-workers', { params: { siteId } }),
    enabled: !!siteId,
  })
}

/** Tất cả task đang có người làm (cho Transfer Drawer + bảng tổng quan). */
export function useActiveTasks() {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'active'],
    queryFn: () => USE_MOCK
      ? mockRequest(() => db.tasks.map(enrichTask))
      : apiGet<Task[]>('/tasks/active'),
  })
}

export function useAssignWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, workerId, otHours }: { taskId: string; workerId: string; otHours?: number }) => USE_MOCK
      ? mockRequest(() => assignWorkerInDb(taskId, workerId, otHours))
      : apiPost(`/tasks/${taskId}/assign`, { workerId, otHours }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

/** Đánh dấu hoàn thành 1 hạng mục. */
export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => USE_MOCK
      ? mockRequest(() => completeTaskInDb(taskId))
      : apiPost(`/tasks/${taskId}/complete`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

/** Hủy 1 hạng mục. */
export function useCancelTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => USE_MOCK
      ? mockRequest(() => cancelTaskInDb(taskId))
      : apiPost(`/tasks/${taskId}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

/** Tan ca thủ công. */
export function useClockOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => USE_MOCK
      ? mockRequest(() => clockOutInDb())
      : apiPost<{ ended: number }>('/tasks/clock-out'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

/** Danh sách hạng mục đã hoàn thành. */
export function useCompletedTasks() {
  return useQuery<CompletedTask[]>({
    queryKey: ['tasks', 'completed'],
    queryFn: () => USE_MOCK
      ? mockRequest(() => completedTasksFromDb())
      : apiGet<CompletedTask[]>('/tasks/completed'),
  })
}

export function useUnassignWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, workerId }: { taskId: string; workerId: string }) => USE_MOCK
      ? mockRequest(() => unassignWorkerInDb(taskId, workerId))
      : apiPost(`/tasks/${taskId}/unassign`, { workerId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useTransferWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ workerId, fromTaskId, toTaskId }: { workerId: string; fromTaskId: string; toTaskId: string }) => USE_MOCK
      ? mockRequest(() => transferWorkerInDb(workerId, fromTaskId, toTaskId))
      : apiPost('/tasks/transfer', { workerId, fromTaskId, toTaskId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useSaveAssignments() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ draft, otHours }: { draft: Record<string, string[]>; otHours?: number }) => USE_MOCK
      ? mockRequest(() => saveAssignmentsInDb(draft, otHours))
      : apiPost('/tasks/assignments/bulk', { draft, otHours }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
