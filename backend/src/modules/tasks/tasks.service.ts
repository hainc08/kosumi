import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { Task } from './entities/task.entity'
import { TaskAssignment } from './entities/task-assignment.entity'
import { Worker } from '../workers/entities/worker.entity'
import { QuoteItem } from '../quotes/entities/quote-item.entity'
import { Quote } from '../quotes/entities/quote.entity'
import { Project } from '../projects/entities/project.entity'
import { deriveInitials, avatarColorFor } from '../../common/utils/worker-display.util'
import { STAFF_POSITIONS } from '../workers/worker-positions'
import { computeOtEndAt } from './shift'

export type WorkerMini = { id: string; code: string; fullName: string; initials: string; avatarColor: string }

export type TaskAssignmentWithWorker = TaskAssignment & { worker?: WorkerMini }

export type TaskWithRelations = Task & {
  assignments: TaskAssignmentWithWorker[]
  activeWorkers: WorkerMini[]
  // danh mục (section_name của hạng mục báo giá nguồn) — dùng để gom nhóm ở trang Dự án.
  section?: string | null
}

export type WorkerWithDisplay = Worker & { initials: string; avatarColor: string }

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private repo: Repository<Task>,
    @InjectRepository(TaskAssignment) private assignmentRepo: Repository<TaskAssignment>,
    @InjectRepository(Worker) private workerRepo: Repository<Worker>,
    @InjectRepository(QuoteItem) private quoteItemRepo: Repository<QuoteItem>,
    private dataSource: DataSource,
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

  /** Các hạng mục công việc của 1 dự án, kèm `section` (danh mục) lấy từ hạng mục báo giá nguồn. */
  async tasksForProject(projectId?: string): Promise<TaskWithRelations[]> {
    if (!projectId) return []
    const tasks = await this.repo.find({ where: { projectId }, order: { sortOrder: 'ASC' } })
    if (tasks.length === 0) return []
    const enriched = await this.enrichMany(tasks)

    // Gắn danh mục (section_name) từ hạng mục báo giá nguồn để FE gom nhóm.
    const itemIds = [...new Set(tasks.map((t) => t.quoteItemId).filter((id): id is string => !!id))]
    const items = itemIds.length ? await this.quoteItemRepo.find({ where: { id: In(itemIds) } }) : []
    const sectionByItem = new Map(items.map((i) => [i.id, i.sectionName]))
    return enriched.map((t) => ({ ...t, section: t.quoteItemId ? (sectionByItem.get(t.quoteItemId) ?? null) : null }))
  }

  /**
   * Sinh hạng mục công việc từ 1 báo giá: mỗi hạng mục báo giá -> 1 task (giữ quote_item_id).
   * Idempotent: bỏ qua hạng mục đã có task. site_id lấy từ công trường của dự án.
   */
  async generateFromQuote(quoteId: string): Promise<{ created: number }> {
    const quote = await this.dataSource.getRepository(Quote).findOne({ where: { id: quoteId } })
    if (!quote) throw new NotFoundException('Không tìm thấy báo giá')
    if (!quote.projectId) throw new BadRequestException('Báo giá chưa gắn dự án')

    const project = await this.dataSource.getRepository(Project).findOne({ where: { id: quote.projectId } })
    if (!project) throw new NotFoundException('Không tìm thấy dự án')
    if (!project.siteId) {
      throw new BadRequestException('Dự án chưa có công trường — hãy gán công trường cho dự án trước khi tạo công việc')
    }

    const items = await this.quoteItemRepo.find({ where: { quoteId }, order: { sortOrder: 'ASC' } })
    if (items.length === 0) return { created: 0 }

    // Bỏ qua hạng mục đã sinh task (tránh trùng, không đụng việc đang chạy).
    const existing = await this.repo.find({ where: { quoteItemId: In(items.map((i) => i.id)) } })
    const haveItemIds = new Set(existing.map((t) => t.quoteItemId))
    const toCreate = items.filter((i) => !haveItemIds.has(i.id))
    if (toCreate.length === 0) return { created: 0 }

    const today = new Date().toISOString().slice(0, 10)
    const entities = toCreate.map((i) =>
      this.repo.create({
        quoteItemId: i.id,
        projectId: project.id,
        siteId: project.siteId as string,
        title: i.itemName,
        description: i.description ?? null,
        taskDate: today,
        status: 'unassigned',
        priority: 'medium',
        sortOrder: i.sortOrder,
      }),
    )
    await this.repo.save(entities)
    return { created: entities.length }
  }

  /** Sinh hạng mục công việc cho toàn bộ báo giá của 1 dự án. */
  async generateForProject(projectId: string): Promise<{ created: number }> {
    const quotes = await this.dataSource.getRepository(Quote).find({ where: { projectId } })
    let created = 0
    for (const q of quotes) {
      const r = await this.generateFromQuote(q.id)
      created += r.created
    }
    return { created }
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
    const workers = await this.workerRepo.find({ where: { status: 'working', position: In(STAFF_POSITIONS) } })
    return workers
      .filter((w) => !busyIds.has(w.id))
      .map((w) => ({ ...w, initials: deriveInitials(w.fullName), avatarColor: avatarColorFor(w.id) }))
  }

  /** Giao công nhân vào task: tạo assignment active; nếu task 'unassigned' -> 'in_progress'. Idempotent. */
  async assign(taskId: string, workerId: string, otHours?: number): Promise<TaskAssignment> {
    const task = await this.repo.findOne({ where: { id: taskId } })
    if (!task) throw new NotFoundException('Không tìm thấy công việc')

    const existing = await this.assignmentRepo.findOne({ where: { taskId, workerId, isActive: true } })
    if (existing) return existing

    const now = new Date()
    const overtime = typeof otHours === 'number' && otHours > 0
    const assignment = this.assignmentRepo.create({
      taskId, workerId,
      assignedAt: now, startedAt: now, endedAt: null, isActive: true,
      transferredFromTaskId: null,
      isOvertime: overtime,
      otEndAt: overtime ? computeOtEndAt(now, otHours as number) : null,
    })
    const saved = await this.assignmentRepo.save(assignment)
    if (task.status === 'unassigned') { task.status = 'in_progress'; await this.repo.save(task) }
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
