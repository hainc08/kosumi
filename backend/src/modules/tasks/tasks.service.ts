import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { Task } from './entities/task.entity'
import { TaskAssignment } from './entities/task-assignment.entity'
import { Worker } from '../workers/entities/worker.entity'
import { QuoteItem } from '../quotes/entities/quote-item.entity'
import { deriveInitials, avatarColorFor } from '../../common/utils/worker-display.util'

export type WorkerMini = { id: string; code: string; fullName: string; initials: string; avatarColor: string }

export type TaskAssignmentWithWorker = TaskAssignment & { worker?: WorkerMini }

export type TaskWithRelations = Task & {
  assignments: TaskAssignmentWithWorker[]
  activeWorkers: WorkerMini[]
}

export type WorkerWithDisplay = Worker & { initials: string; avatarColor: string }

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private repo: Repository<Task>,
    @InjectRepository(TaskAssignment) private assignmentRepo: Repository<TaskAssignment>,
    @InjectRepository(Worker) private workerRepo: Repository<Worker>,
    @InjectRepository(QuoteItem) private quoteItemRepo: Repository<QuoteItem>,
  ) {}

  private toMini(w: Worker): WorkerMini {
    return { id: w.id, code: w.code, fullName: w.fullName, initials: deriveInitials(w.fullName), avatarColor: avatarColorFor(w.id) }
  }

  /** Gắn assignments đang active (kèm worker mini) + activeWorkers cho 1 task. */
  private enrich(task: Task, activeAssignments: TaskAssignment[], workerById: Map<string, Worker>): TaskWithRelations {
    const assignments: TaskAssignmentWithWorker[] = activeAssignments
      .filter((a) => a.taskId === task.id)
      .map((a) => {
        const w = workerById.get(a.workerId)
        return { ...a, worker: w ? this.toMini(w) : undefined }
      })
    return {
      ...task,
      assignments,
      activeWorkers: assignments.map((a) => a.worker).filter((w): w is WorkerMini => !!w),
    }
  }

  /** Tải toàn bộ assignment active + worker liên quan cho danh sách task (tránh N+1). */
  private async loadActiveAssignments(taskIds: string[]): Promise<{ activeAssignments: TaskAssignment[]; workerById: Map<string, Worker> }> {
    if (taskIds.length === 0) return { activeAssignments: [], workerById: new Map() }
    const activeAssignments = await this.assignmentRepo.find({ where: { taskId: In(taskIds), isActive: true } })
    const workerIds = [...new Set(activeAssignments.map((a) => a.workerId))]
    const workers = workerIds.length ? await this.workerRepo.find({ where: { id: In(workerIds) } }) : []
    const workerById = new Map(workers.map((w) => [w.id, w]))
    return { activeAssignments, workerById }
  }

  private async enrichMany(tasks: Task[]): Promise<TaskWithRelations[]> {
    if (tasks.length === 0) return []
    const { activeAssignments, workerById } = await this.loadActiveAssignments(tasks.map((t) => t.id))
    return tasks.map((t) => this.enrich(t, activeAssignments, workerById))
  }

  /** Các task của 1 báo giá (qua quoteItemId), sắp theo sortOrder. */
  async tasksForQuote(quoteId?: string): Promise<TaskWithRelations[]> {
    // Thiếu quoteId -> trả rỗng (tránh TypeORM bỏ qua filter và trả TẤT CẢ task).
    if (!quoteId) return []
    const items = await this.quoteItemRepo.find({ where: { quoteId } })
    if (items.length === 0) return []
    const itemIds = items.map((i) => i.id)
    const tasks = await this.repo.find({ where: { quoteItemId: In(itemIds) }, order: { sortOrder: 'ASC' } })
    return this.enrichMany(tasks)
  }

  /** Tất cả task (cho Transfer Drawer + bảng tổng quan). */
  async activeTasksAll(): Promise<TaskWithRelations[]> {
    const tasks = await this.repo.find()
    return this.enrichMany(tasks)
  }

  /**
   * Công nhân sẵn sàng nhận việc (đang làm việc & chưa bận).
   * GHI CHÚ: giống prototype, `siteId` được nhận nhưng KHÔNG dùng để lọc.
   */
  async availableWorkers(_siteId?: string): Promise<WorkerWithDisplay[]> {
    const busy = await this.assignmentRepo.find({ where: { isActive: true } })
    const busyIds = new Set(busy.map((a) => a.workerId))
    const workers = await this.workerRepo.find({ where: { status: 'working' } })
    return workers
      .filter((w) => !busyIds.has(w.id))
      .map((w) => ({ ...w, initials: deriveInitials(w.fullName), avatarColor: avatarColorFor(w.id) }))
  }

  /** Giao công nhân vào task: tạo assignment active; nếu task 'unassigned' -> 'in_progress'. Idempotent. */
  async assign(taskId: string, workerId: string): Promise<TaskAssignment> {
    const task = await this.repo.findOne({ where: { id: taskId } })
    if (!task) throw new NotFoundException('Không tìm thấy công việc')

    const existing = await this.assignmentRepo.findOne({ where: { taskId, workerId, isActive: true } })
    if (existing) return existing

    const now = new Date()
    const assignment = this.assignmentRepo.create({
      taskId,
      workerId,
      assignedAt: now,
      startedAt: now,
      endedAt: null,
      isActive: true,
      transferredFromTaskId: null,
    })
    const saved = await this.assignmentRepo.save(assignment)

    if (task.status === 'unassigned') {
      task.status = 'in_progress'
      await this.repo.save(task)
    }

    return saved
  }

  /** Bỏ giao công nhân: kết thúc assignment active; nếu task không còn assignment active -> 'unassigned'. */
  async unassign(taskId: string, workerId: string): Promise<void> {
    const assignment = await this.assignmentRepo.findOne({ where: { taskId, workerId, isActive: true } })
    if (assignment) {
      assignment.isActive = false
      assignment.endedAt = new Date()
      await this.assignmentRepo.save(assignment)
    }

    const task = await this.repo.findOne({ where: { id: taskId } })
    if (task) {
      const stillActive = await this.assignmentRepo.count({ where: { taskId, isActive: true } })
      if (stillActive === 0 && task.status !== 'unassigned') {
        task.status = 'unassigned'
        await this.repo.save(task)
      }
    }
  }

  /** Chuyển công nhân sang task mới: kết thúc assignment cũ, tạo assignment mới với transferredFromTaskId. */
  async transfer(workerId: string, fromTaskId: string, toTaskId: string): Promise<TaskAssignment> {
    await this.unassign(fromTaskId, workerId)
    const assignment = await this.assign(toTaskId, workerId)
    assignment.transferredFromTaskId = fromTaskId
    return this.assignmentRepo.save(assignment)
  }

  /** Lưu toàn bộ phân công nháp (taskId -> danh sách workerId). Trả về số lượt giao. */
  async saveAssignments(draft: Record<string, string[]>): Promise<number> {
    let count = 0
    for (const [taskId, workerIds] of Object.entries(draft)) {
      for (const workerId of workerIds) {
        await this.assign(taskId, workerId)
        count += 1
      }
    }
    return count
  }
}
