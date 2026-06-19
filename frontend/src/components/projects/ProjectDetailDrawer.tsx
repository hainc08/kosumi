import { useMemo } from 'react'
import { IconEdit, IconRefresh, IconChecklist, IconCircleCheck, IconX } from '@tabler/icons-react'
import {
  PROJECT_TYPE_LABELS, PROJECT_STATUS_LABELS, TASK_STATUS_LABELS,
  type Project, type ProjectStatus, type Task, type TaskStatus,
} from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'
import { deadlineState } from '@/utils/deadline'
import { useProjectTasks, useGenerateTasksForProject, useCompleteTask, useCancelTask } from '@/api/tasks'
import { useToastStore } from '@/stores/toastStore'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import './ProjectDetailDrawer.css'

export const PROJECT_STATUS_VARIANT: Record<ProjectStatus, BadgeVariant> = {
  planning: 'gray', in_progress: 'blue', near_deadline: 'amber',
  completed: 'green', paused: 'purple', cancelled: 'red',
}

const TASK_STATUS_VARIANT: Record<TaskStatus, BadgeVariant> = {
  unassigned: 'gray', in_progress: 'blue', paused: 'amber', completed: 'green', cancelled: 'red',
}

const NO_SECTION = '— Không thuộc danh mục —'

interface Props { project: Project | null; open: boolean; onClose: () => void; onEdit: (p: Project) => void }

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="pd-row"><span className="pd-row__label">{label}</span><span className="pd-row__value">{value || '—'}</span></div>
}

export function ProjectDetailDrawer({ project, open, onClose, onEdit }: Props) {
  // Hooks phải đứng trước mọi return sớm.
  const { data: tasks = [] } = useProjectTasks(open && project ? project.id : null)
  const generate = useGenerateTasksForProject()
  const completeTask = useCompleteTask()
  const cancelTask = useCancelTask()
  const toast = useToastStore((s) => s.show)

  const fmtMin = (m: number) => { const h = Math.floor(m / 60), mm = m % 60; return h ? `${h}h${mm ? ` ${mm}p` : ''}` : `${mm}p` }
  const doComplete = async (id: string) => { await completeTask.mutateAsync(id); toast('✓ Đã hoàn thành hạng mục') }
  const doCancel = async (id: string) => { await cancelTask.mutateAsync(id); toast('Đã hủy hạng mục', 'info') }

  // Gom công việc theo danh mục (section_name), giữ thứ tự xuất hiện.
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tasks) {
      const key = t.section ?? NO_SECTION
      const arr = map.get(key) ?? []
      arr.push(t)
      map.set(key, arr)
    }
    return [...map.entries()]
  }, [tasks])

  if (!project) return null

  const handleGenerate = async () => {
    try {
      const r = await generate.mutateAsync(project.id)
      toast(r.created > 0 ? `✓ Đã tạo ${r.created} công việc từ báo giá` : 'Tất cả hạng mục báo giá đã có công việc', 'info')
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? 'Không tạo được công việc'
      toast(msg, 'error')
    }
  }

  const dl = deadlineState(project.deadline)
  const dlBadge = project.status === 'completed' ? null
    : dl === 'overdue' ? <Badge variant="red">Quá hạn</Badge>
    : dl === 'near' ? <Badge variant="amber">Sắp đến hạn</Badge> : null

  return (
    <DetailDrawer
      open={open} onClose={onClose} title="Chi tiết dự án"
      actions={<Button variant="primary" icon={<IconEdit size={15} />} onClick={() => onEdit(project)}>Chỉnh sửa</Button>}
    >
      <div className="pd-head">
        <div>
          <div className="pd-name">{project.name}</div>
          <div className="pd-code">{project.code} · {PROJECT_TYPE_LABELS[project.projectType]}</div>
        </div>
        <Badge variant={PROJECT_STATUS_VARIANT[project.status]} dot>{PROJECT_STATUS_LABELS[project.status]}</Badge>
      </div>

      <div className="pd-progress">
        <div className="pd-progress__top"><span>Tiến độ</span><strong>{project.progressPct}%</strong></div>
        <ProgressBar value={project.progressPct} color={project.progressPct >= 85 ? 'var(--color-green)' : 'var(--color-blue)'} />
      </div>

      <div className="pd-section">Thông tin</div>
      <Row label="Chủ đầu tư" value={project.customer?.name} />
      <Row label="Công trường" value={project.site?.name} />
      <Row label="Giá trị hợp đồng" value={project.contractValue ? formatCurrency(project.contractValue) : '—'} />
      <Row label="Ngày khởi công" value={formatDate(project.startDate)} />
      <Row label="Ngày bàn giao" value={<span>{formatDate(project.deadline)} {dlBadge}</span>} />
      {project.actualEndDate && <Row label="Hoàn thành thực tế" value={formatDate(project.actualEndDate)} />}
      <Row label="Số báo giá" value={project.quoteCount ?? 0} />
      {project.description && <Row label="Mô tả" value={project.description} />}

      <div className="pd-tasks-head">
        <div className="pd-section pd-section--inline"><IconChecklist size={13} /> Hạng mục công việc ({tasks.length})</div>
        <Button size="sm" icon={<IconRefresh size={13} />} onClick={handleGenerate} disabled={generate.isPending}>
          {generate.isPending ? 'Đang tạo...' : 'Tạo lại từ báo giá'}
        </Button>
      </div>

      {grouped.length === 0 ? (
        <div className="pd-tasks-empty">
          Chưa có công việc. Bấm <strong>“Tạo lại từ báo giá”</strong> để sinh từ các hạng mục báo giá
          {project.site ? '.' : ' — lưu ý cần gán công trường cho dự án trước.'}
        </div>
      ) : (
        grouped.map(([section, list]) => (
          <div key={section} className="pd-tg">
            <div className="pd-tg__name">{section}</div>
            {list.map((t) => {
              const open2 = t.status === 'unassigned' || t.status === 'in_progress' || t.status === 'paused'
              const workers = (t.workedBy && t.workedBy.length ? t.workedBy : t.activeWorkers) ?? []
              return (
              <div key={t.id} className="pd-task">
                <div className="pd-task__main">
                  <span className="pd-task__title">{t.title}</span>
                  <div className="pd-task__head-right">
                    {open2 && (
                      <>
                        <button className="pd-task__btn pd-task__btn--done" title="Hoàn thành" onClick={() => doComplete(t.id)}><IconCircleCheck size={14} /></button>
                        <button className="pd-task__btn pd-task__btn--cancel" title="Hủy" onClick={() => doCancel(t.id)}><IconX size={14} /></button>
                      </>
                    )}
                    <Badge variant={TASK_STATUS_VARIANT[t.status]} dot>{TASK_STATUS_LABELS[t.status]}</Badge>
                  </div>
                </div>
                {(workers.length > 0 || (t.totalMinutes ?? 0) > 0) && (
                  <div className="pd-task__meta">
                    <div className="pd-task__workers">
                      {workers.map((w) => (
                        <span key={w.id} className="pd-task__av" style={{ background: w.avatarColor }} title={w.fullName}>{w.initials}</span>
                      ))}
                    </div>
                    {(t.totalMinutes ?? 0) > 0 && (
                      <span className="pd-task__time">{fmtMin(t.totalMinutes!)}{(t.overtimeMinutes ?? 0) > 0 ? ` · OT ${fmtMin(t.overtimeMinutes!)}` : ''}</span>
                    )}
                  </div>
                )}
              </div>
              )
            })}
          </div>
        ))
      )}
    </DetailDrawer>
  )
}
