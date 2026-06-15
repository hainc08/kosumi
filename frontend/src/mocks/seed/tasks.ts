import type { Task, TaskAssignment } from '@/types'

// Mốc thời gian tương đối tính từ lúc nạp app -> live timer luôn hiển thị hợp lý
// bất kể đồng hồ máy đang ở mốc ngày nào.
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()
const today = new Date().toISOString().slice(0, 10)

export const seedTasks: Task[] = [
  // ── Quote WS0087 · prj-1 · site-3 (Aeon Bình Tân) ──
  { id: 'task-1', quoteItemId: 'qi-1', projectId: 'prj-1', siteId: 'site-3', title: 'Lan can cầu thang khu A',
    description: 'Thép ống D42×2, sơn tĩnh điện', taskDate: today, status: 'in_progress', priority: 'high', sortOrder: 1,
    createdAt: minsAgo(600), updatedAt: minsAgo(135) },
  { id: 'task-2', quoteItemId: 'qi-1', projectId: 'prj-1', siteId: 'site-3', title: 'Lan can hành lang tầng B',
    description: 'Tay vịn inox 304', taskDate: today, status: 'unassigned', priority: 'medium', sortOrder: 2,
    createdAt: minsAgo(600), updatedAt: minsAgo(600) },
  { id: 'task-3', quoteItemId: 'qi-2', projectId: 'prj-1', siteId: 'site-3', title: 'Lan can ban công tầng 10',
    description: undefined, taskDate: today, status: 'unassigned', priority: 'medium', sortOrder: 3,
    createdAt: minsAgo(600), updatedAt: minsAgo(600) },
  { id: 'task-4', quoteItemId: 'qi-2', projectId: 'prj-1', siteId: 'site-3', title: 'Cầu thang thép chính',
    description: 'Kết cấu bậc + chiếu nghỉ', taskDate: today, status: 'unassigned', priority: 'high', sortOrder: 4,
    createdAt: minsAgo(600), updatedAt: minsAgo(600) },

  // ── Quote WS0088 · prj-2 · site-2 (Nội thất Long Biên) ──
  { id: 'task-5', quoteItemId: 'qi-4', projectId: 'prj-2', siteId: 'site-2', title: 'Khung kệ trang trí kim loại',
    description: 'Thép hộp 40×40 sơn tĩnh điện', taskDate: today, status: 'in_progress', priority: 'medium', sortOrder: 1,
    createdAt: minsAgo(480), updatedAt: minsAgo(40) },
  { id: 'task-6', quoteItemId: 'qi-4', projectId: 'prj-2', siteId: 'site-2', title: 'Vách ngăn CNC hoa văn',
    description: undefined, taskDate: today, status: 'unassigned', priority: 'low', sortOrder: 2,
    createdAt: minsAgo(480), updatedAt: minsAgo(480) },
  { id: 'task-7', quoteItemId: 'qi-4', projectId: 'prj-2', siteId: 'site-2', title: 'Tay nắm & phụ kiện inox',
    description: undefined, taskDate: today, status: 'unassigned', priority: 'low', sortOrder: 3,
    createdAt: minsAgo(480), updatedAt: minsAgo(480) },

  // ── Quote WS0089 · prj-3 · site-1 (Cơ khí Hà Nội) ──
  { id: 'task-8', quoteItemId: 'qi-5', projectId: 'prj-3', siteId: 'site-1', title: 'Cột thép I300 nhà xưởng',
    description: 'Hàn bản mã + bu lông neo', taskDate: today, status: 'in_progress', priority: 'high', sortOrder: 1,
    createdAt: minsAgo(300), updatedAt: minsAgo(90) },
  { id: 'task-9', quoteItemId: 'qi-5', projectId: 'prj-3', siteId: 'site-1', title: 'Kèo thép mái',
    description: undefined, taskDate: today, status: 'unassigned', priority: 'medium', sortOrder: 2,
    createdAt: minsAgo(300), updatedAt: minsAgo(300) },
  { id: 'task-10', quoteItemId: 'qi-5', projectId: 'prj-3', siteId: 'site-1', title: 'Lắp dựng tôn lợp mái',
    description: 'Tôn 0.45mm', taskDate: today, status: 'unassigned', priority: 'low', sortOrder: 3,
    createdAt: minsAgo(300), updatedAt: minsAgo(300) },
]

export const seedTaskAssignments: TaskAssignment[] = [
  // Aeon (site-3) — w-6 đang làm, pool còn w-7
  { id: 'ta-1', taskId: 'task-1', workerId: 'w-6', assignedAt: minsAgo(135), startedAt: minsAgo(135),
    endedAt: null, isActive: true, createdAt: minsAgo(135), updatedAt: minsAgo(135) },
  // Samsung (site-1) — w-1 đang làm, pool còn w-4
  { id: 'ta-2', taskId: 'task-8', workerId: 'w-1', assignedAt: minsAgo(90), startedAt: minsAgo(90),
    endedAt: null, isActive: true, createdAt: minsAgo(90), updatedAt: minsAgo(90) },
  // Nội thất (site-2) — w-5 đang làm, pool còn w-2
  { id: 'ta-3', taskId: 'task-5', workerId: 'w-5', assignedAt: minsAgo(40), startedAt: minsAgo(40),
    endedAt: null, isActive: true, createdAt: minsAgo(40), updatedAt: minsAgo(40) },
]
