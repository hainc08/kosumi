import { DataSource } from 'typeorm'
import { Task } from '../../modules/tasks/entities/task.entity'
import { TaskAssignment } from '../../modules/tasks/entities/task-assignment.entity'
import { Quote } from '../../modules/quotes/entities/quote.entity'
import { QuoteItem } from '../../modules/quotes/entities/quote-item.entity'
import { Project } from '../../modules/projects/entities/project.entity'
import { Site } from '../../modules/sites/entities/site.entity'
import { Worker } from '../../modules/workers/entities/worker.entity'

const minsAgo = (m: number) => new Date(Date.now() - m * 60_000)
const today = () => new Date().toISOString().slice(0, 10)

/**
 * Ported from frontend/src/mocks/seed/tasks.ts (seedTasks, seedTaskAssignments).
 * FK được map sang các bản ghi seed thật: quote_item_id thuộc WS0087/WS0088/WS0089,
 * project_id/site_id theo dự án + công trường của báo giá đó.
 */
export async function seedTasks(ds: DataSource): Promise<void> {
  const taskRepo = ds.getRepository(Task)
  const assignmentRepo = ds.getRepository(TaskAssignment)
  if (await taskRepo.count() > 0) return

  const quoteRepo = ds.getRepository(Quote)
  const itemRepo = ds.getRepository(QuoteItem)
  const projectRepo = ds.getRepository(Project)
  const siteRepo = ds.getRepository(Site)
  const workerRepo = ds.getRepository(Worker)

  const [ws0087, ws0088, ws0089] = await Promise.all([
    quoteRepo.findOne({ where: { code: 'WS0087' } }),
    quoteRepo.findOne({ where: { code: 'WS0088' } }),
    quoteRepo.findOne({ where: { code: 'WS0089' } }),
  ])
  if (!ws0087 || !ws0088 || !ws0089) return // chưa seed quotes

  const [items87, items88, items89] = await Promise.all([
    itemRepo.find({ where: { quoteId: ws0087.id }, order: { sortOrder: 'ASC' } }),
    itemRepo.find({ where: { quoteId: ws0088.id }, order: { sortOrder: 'ASC' } }),
    itemRepo.find({ where: { quoteId: ws0089.id }, order: { sortOrder: 'ASC' } }),
  ])

  const anySites = await siteRepo.find({ take: 1 })
  const anySite = anySites[0]

  const resolveProjectSite = async (projectId: string): Promise<{ projectId: string; siteId: string }> => {
    const project = await projectRepo.findOne({ where: { id: projectId } })
    const siteId = project?.siteId ?? anySite?.id
    if (!siteId) throw new Error('Không tìm thấy site nào để gán cho task')
    return { projectId, siteId }
  }

  const ps87 = await resolveProjectSite(ws0087.projectId)
  const ps88 = await resolveProjectSite(ws0088.projectId)
  const ps89 = await resolveProjectSite(ws0089.projectId)

  // item dùng cho từng nhóm task (lấy item đầu/cuối nếu có nhiều, lặp lại item duy nhất nếu chỉ có 1)
  const item87a = items87[0]
  const item87b = items87[1] ?? items87[0]
  const item88a = items88[0]
  const item89a = items89[0]

  const tasksData: Partial<Task>[] = [
    // ── WS0087 · item đầu ──
    { quoteItemId: item87a?.id ?? null, projectId: ps87.projectId, siteId: ps87.siteId,
      title: 'Lan can cầu thang khu A', description: 'Thép ống D42×2, sơn tĩnh điện',
      taskDate: today(), status: 'in_progress', priority: 'high', sortOrder: 1 },
    { quoteItemId: item87a?.id ?? null, projectId: ps87.projectId, siteId: ps87.siteId,
      title: 'Lan can hành lang tầng B', description: 'Tay vịn inox 304',
      taskDate: today(), status: 'unassigned', priority: 'medium', sortOrder: 2 },
    // ── WS0087 · item thứ hai (hoặc lặp lại nếu chỉ có 1 item) ──
    { quoteItemId: item87b?.id ?? null, projectId: ps87.projectId, siteId: ps87.siteId,
      title: 'Lan can ban công tầng 10', description: null,
      taskDate: today(), status: 'unassigned', priority: 'medium', sortOrder: 3 },
    { quoteItemId: item87b?.id ?? null, projectId: ps87.projectId, siteId: ps87.siteId,
      title: 'Cầu thang thép chính', description: 'Kết cấu bậc + chiếu nghỉ',
      taskDate: today(), status: 'unassigned', priority: 'high', sortOrder: 4 },

    // ── WS0088 ──
    { quoteItemId: item88a?.id ?? null, projectId: ps88.projectId, siteId: ps88.siteId,
      title: 'Khung kệ trang trí kim loại', description: 'Thép hộp 40×40 sơn tĩnh điện',
      taskDate: today(), status: 'in_progress', priority: 'medium', sortOrder: 1 },
    { quoteItemId: item88a?.id ?? null, projectId: ps88.projectId, siteId: ps88.siteId,
      title: 'Vách ngăn CNC hoa văn', description: null,
      taskDate: today(), status: 'unassigned', priority: 'low', sortOrder: 2 },
    { quoteItemId: item88a?.id ?? null, projectId: ps88.projectId, siteId: ps88.siteId,
      title: 'Tay nắm & phụ kiện inox', description: null,
      taskDate: today(), status: 'unassigned', priority: 'low', sortOrder: 3 },

    // ── WS0089 ──
    { quoteItemId: item89a?.id ?? null, projectId: ps89.projectId, siteId: ps89.siteId,
      title: 'Cột thép I300 nhà xưởng', description: 'Hàn bản mã + bu lông neo',
      taskDate: today(), status: 'in_progress', priority: 'high', sortOrder: 1 },
    { quoteItemId: item89a?.id ?? null, projectId: ps89.projectId, siteId: ps89.siteId,
      title: 'Kèo thép mái', description: null,
      taskDate: today(), status: 'unassigned', priority: 'medium', sortOrder: 2 },
    { quoteItemId: item89a?.id ?? null, projectId: ps89.projectId, siteId: ps89.siteId,
      title: 'Lắp dựng tôn lợp mái', description: 'Tôn 0.45mm',
      taskDate: today(), status: 'unassigned', priority: 'low', sortOrder: 3 },
  ]

  const savedTasks = await taskRepo.save(tasksData.map((t) => taskRepo.create(t)))

  // ── Active assignments: w-6(CN006) -> task 1 (Aeon), w-1(CN001) -> task 8 (Cơ khí HN), w-5(CN005) -> task 5 (Nội thất) ──
  const [cn001, cn005, cn006] = await Promise.all([
    workerRepo.findOne({ where: { code: 'CN001' } }),
    workerRepo.findOne({ where: { code: 'CN005' } }),
    workerRepo.findOne({ where: { code: 'CN006' } }),
  ])

  const assignmentsData: Partial<TaskAssignment>[] = []
  if (cn006) {
    const assignedAt = minsAgo(135)
    assignmentsData.push({
      taskId: savedTasks[0].id, workerId: cn006.id,
      assignedAt, startedAt: assignedAt, endedAt: null, isActive: true, transferredFromTaskId: null,
    })
  }
  if (cn001) {
    const assignedAt = minsAgo(90)
    assignmentsData.push({
      taskId: savedTasks[7].id, workerId: cn001.id,
      assignedAt, startedAt: assignedAt, endedAt: null, isActive: true, transferredFromTaskId: null,
    })
  }
  if (cn005) {
    const assignedAt = minsAgo(40)
    assignmentsData.push({
      taskId: savedTasks[4].id, workerId: cn005.id,
      assignedAt, startedAt: assignedAt, endedAt: null, isActive: true, transferredFromTaskId: null,
    })
  }

  if (assignmentsData.length) {
    await assignmentRepo.save(assignmentsData.map((a) => assignmentRepo.create(a)))
  }
}
