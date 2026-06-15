import { useMemo, useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import {
  IconArrowLeft, IconBuildingWarehouse, IconBuilding, IconFileInvoice, IconUsers,
  IconSearch, IconRefresh, IconDeviceFloppy, IconArrowsExchange, IconX, IconGripVertical,
  IconDragDrop, IconCircleCheck,
} from '@tabler/icons-react'
import {
  PRIMARY_SKILL_LABELS, TASK_PRIORITY_LABELS, type TaskPriority,
} from '@/types'
import { useSites } from '@/api/sites'
import { useProjects } from '@/api/projects'
import { useQuotes } from '@/api/quotes'
import {
  useQuoteTasks, useAvailableWorkers, useSaveAssignments, useUnassignWorker,
} from '@/api/tasks'
import { PageShell } from '@/components/layout/PageShell'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { StepsBar } from '@/components/kanban/StepsBar'
import { LiveTimer } from '@/components/kanban/LiveTimer'
import { TransferDrawer, type TransferContext } from '@/components/kanban/TransferDrawer'
import { useToastStore } from '@/stores/toastStore'
import './Kanban.css'

const PRIORITY_VARIANT: Record<TaskPriority, BadgeVariant> = { high: 'red', medium: 'amber', low: 'gray' }

export default function KanbanPage() {
  const [step, setStep] = useState(1)
  const [siteId, setSiteId] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [quoteId, setQuoteId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string[]>>({})
  const [search, setSearch] = useState('')
  const [transferCtx, setTransferCtx] = useState<TransferContext | null>(null)

  const toast = useToastStore((s) => s.show)
  const { data: sites = [] } = useSites()
  const { data: projects = [] } = useProjects()
  const { data: quotes = [] } = useQuotes(projectId ? { projectId } : {})
  const { data: tasks = [] } = useQuoteTasks(quoteId)
  const { data: availableWorkers = [] } = useAvailableWorkers(siteId)
  const saveAssignments = useSaveAssignments()
  const unassign = useUnassignWorker()

  const site = sites.find((s) => s.id === siteId)
  const project = projects.find((p) => p.id === projectId)
  const quote = quotes.find((q) => q.id === quoteId)
  const projectsAtSite = projects.filter((p) => p.siteId === siteId)
  const quotesOfProject = projectId ? quotes : []

  // ── Pool công nhân (loại trừ người đã được kéo vào nháp) ──
  const draftWorkerIds = useMemo(
    () => new Set(Object.values(draft).flat()),
    [draft],
  )
  const workerMap = useMemo(
    () => new Map(availableWorkers.map((w) => [w.id, w])),
    [availableWorkers],
  )
  const poolWorkers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return availableWorkers.filter((w) => {
      if (draftWorkerIds.has(w.id)) return false
      if (!q) return true
      return w.fullName.toLowerCase().includes(q) || PRIMARY_SKILL_LABELS[w.primarySkill].toLowerCase().includes(q)
    })
  }, [availableWorkers, draftWorkerIds, search])

  const draftCount = draftWorkerIds.size

  // ── Điều hướng wizard ──
  const goTo = (n: number) => setStep(n)
  const selectSite = (id: string) => { setSiteId(id); setProjectId(null); setQuoteId(null); setDraft({}); setStep(2) }
  const selectProject = (id: string) => { setProjectId(id); setQuoteId(null); setDraft({}); setStep(3) }
  const selectQuote = (id: string) => { setQuoteId(id); setDraft({}); setStep(4) }
  const resetAll = () => { setStep(1); setSiteId(null); setProjectId(null); setQuoteId(null); setDraft({}); setSearch('') }

  // ── Drag & drop ──
  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    const from = source.droppableId
    const to = destination.droppableId
    if (from === to) return
    setDraft((prev) => {
      const next: Record<string, string[]> = { ...prev }
      if (from !== 'pool') next[from] = (next[from] ?? []).filter((id) => id !== draggableId)
      if (to !== 'pool') next[to] = [...(next[to] ?? []), draggableId]
      return next
    })
  }

  const removeDraft = (taskId: string, workerId: string) => {
    setDraft((prev) => ({ ...prev, [taskId]: (prev[taskId] ?? []).filter((id) => id !== workerId) }))
  }

  const handleUnassign = async (taskId: string, workerId: string, name: string) => {
    await unassign.mutateAsync({ taskId, workerId })
    toast(`Đã rút ${name} khỏi hạng mục`, 'info')
  }

  const handleSave = async () => {
    const n = await saveAssignments.mutateAsync(draft)
    setDraft({})
    toast(`✓ Đã lưu ${n} lượt giao việc`)
  }

  return (
    <PageShell title="Giao việc" subtitle="Phân công công việc hàng ngày">
      <div className="kanban">
        <StepsBar step={step} onJump={goTo} />

        <div className="kanban__body">
          {/* ───── BƯỚC 1: CHỌN CÔNG TRƯỜNG ───── */}
          {step === 1 && (
            <div className="kb-page">
              <div className="kb-page__head"><span className="kb-page__title">Chọn công trường / xưởng</span></div>
              <div className="kb-stats">
                <span className="kb-chip"><IconBuildingWarehouse size={15} color="var(--color-blue)" /> <strong>{sites.length}</strong> xưởng / công trường</span>
                <span className="kb-chip"><IconUsers size={15} color="var(--color-green)" /> <strong>{sites.reduce((s, x) => s + (x.workerCount ?? 0), 0)}</strong> công nhân</span>
              </div>
              <div className="kb-grid kb-grid--2">
                {sites.map((s) => (
                  <button key={s.id} className={`sel-card ${siteId === s.id ? 'sel-card--on' : ''}`} onClick={() => selectSite(s.id)}>
                    <div className="sel-card__icon" style={{ background: 'var(--color-surface-2)' }}><IconBuildingWarehouse size={20} /></div>
                    <div className="sel-card__name">{s.name}</div>
                    <div className="sel-card__sub">{s.industrialZone || s.city}</div>
                    <Badge variant="blue">{s.projectCount ?? 0} dự án</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ───── BƯỚC 2: CHỌN DỰ ÁN ───── */}
          {step === 2 && (
            <div className="kb-page">
              <div className="kb-page__head">
                <button className="kb-back" onClick={() => goTo(1)}><IconArrowLeft size={16} /></button>
                <span className="kb-page__title">Chọn dự án</span>
                <span className="kb-crumb">{site?.name}</span>
              </div>
              <div className="kb-grid kb-grid--3">
                {projectsAtSite.map((p) => (
                  <button key={p.id} className={`sel-card ${projectId === p.id ? 'sel-card--on' : ''}`} onClick={() => selectProject(p.id)}>
                    <div className="sel-card__icon" style={{ background: 'var(--color-surface-2)' }}><IconBuilding size={20} /></div>
                    <div className="sel-card__name">{p.name}</div>
                    <div className="sel-card__sub">{p.code}</div>
                    <Badge variant="green">Đang thi công</Badge>
                  </button>
                ))}
                {projectsAtSite.length === 0 && <div className="kb-empty">Xưởng này chưa có dự án</div>}
              </div>
            </div>
          )}

          {/* ───── BƯỚC 3: CHỌN BÁO GIÁ ───── */}
          {step === 3 && (
            <div className="kb-page">
              <div className="kb-page__head">
                <button className="kb-back" onClick={() => goTo(2)}><IconArrowLeft size={16} /></button>
                <span className="kb-page__title">Chọn số báo giá</span>
                <span className="kb-crumb">{project?.name}</span>
              </div>
              <div className="kb-quotes">
                {quotesOfProject.map((q) => (
                  <button key={q.id} className={`quote-card ${quoteId === q.id ? 'quote-card--on' : ''}`} onClick={() => selectQuote(q.id)}>
                    <div className="quote-card__top">
                      <span className="quote-card__id"><IconFileInvoice size={14} /> {q.code}</span>
                      <Badge variant="blue">{q.itemCount ?? 0} hạng mục</Badge>
                    </div>
                    <div className="quote-card__name">{q.title}</div>
                  </button>
                ))}
                {quotesOfProject.length === 0 && <div className="kb-empty">Dự án này chưa có báo giá</div>}
              </div>
            </div>
          )}

          {/* ───── BƯỚC 4: PHÂN CÔNG ───── */}
          {step === 4 && (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="kb-assign">
                {/* Panel công nhân */}
                <Droppable droppableId="pool">
                  {(provided, snap) => (
                    <div className="kb-pool" ref={provided.innerRef} {...provided.droppableProps}>
                      <div className="kb-pool__head">
                        <span className="kb-pool__title"><IconUsers size={15} /> Công nhân</span>
                        <span className="kb-pool__count">{poolWorkers.length} sẵn sàng</span>
                      </div>
                      <div className="kb-pool__search">
                        <IconSearch size={14} />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, kỹ năng..." />
                      </div>
                      <div className={`kb-pool__list ${snap.isDraggingOver ? 'is-over' : ''}`}>
                        {poolWorkers.map((w, i) => (
                          <Draggable key={w.id} draggableId={w.id} index={i}>
                            {(p, s) => (
                              <div className={`wk-card ${s.isDragging ? 'is-dragging' : ''}`} ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}>
                                <span className="wk-card__av" style={{ background: w.avatarColor }}>{w.initials}</span>
                                <div className="wk-card__info">
                                  <div className="wk-card__name">{w.fullName}</div>
                                  <div className="wk-card__role">{PRIMARY_SKILL_LABELS[w.primarySkill]}</div>
                                </div>
                                <span className="wk-card__dot" />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {poolWorkers.length === 0 && <div className="kb-pool__empty">Hết người sẵn sàng tại xưởng này</div>}
                      </div>
                    </div>
                  )}
                </Droppable>

                {/* Khu hạng mục */}
                <div className="kb-tasks">
                  <div className="kb-page__head">
                    <button className="kb-back" onClick={() => goTo(3)}><IconArrowLeft size={16} /></button>
                    <span className="kb-page__title">Phân công công nhân</span>
                    <span className="kb-crumb">{quote?.code} · {quote?.title}</span>
                  </div>
                  <div className="kb-notice"><IconDragDrop size={16} /> Kéo công nhân từ bảng bên trái thả vào hạng mục. Nhấn <strong>×</strong> để rút người ra, <strong>⇄</strong> để chuyển sang việc khác.</div>

                  <div className="kb-task-list">
                    {tasks.map((t) => {
                      const draftIds = draft[t.id] ?? []
                      return (
                        <div key={t.id} className="task-row">
                          <div className="task-row__head">
                            <div>
                              <div className="task-row__title">{t.title}</div>
                              {t.description && <div className="task-row__desc">{t.description}</div>}
                            </div>
                            <Badge variant={PRIORITY_VARIANT[t.priority]} dot>{TASK_PRIORITY_LABELS[t.priority]}</Badge>
                          </div>

                          {/* Người đang làm (đã lưu) */}
                          {(t.assignments ?? []).map((a) => (
                            <div key={a.id} className="chip chip--active">
                              <span className="chip__av" style={{ background: a.worker?.avatarColor }}>{a.worker?.initials}</span>
                              <span className="chip__name">{a.worker?.fullName}</span>
                              <LiveTimer since={a.assignedAt} />
                              <button className="chip__btn" title="Chuyển việc" onClick={() => setTransferCtx({
                                workerId: a.workerId, workerName: a.worker?.fullName ?? '', workerInitials: a.worker?.initials ?? '',
                                workerColor: a.worker?.avatarColor ?? '#888', fromTaskId: t.id, fromTaskTitle: t.title,
                              })}><IconArrowsExchange size={13} /></button>
                              <button className="chip__btn chip__btn--del" title="Rút người" onClick={() => handleUnassign(t.id, a.workerId, a.worker?.fullName ?? '')}><IconX size={13} /></button>
                            </div>
                          ))}

                          {/* Vùng thả + chip nháp */}
                          <Droppable droppableId={t.id} direction="horizontal">
                            {(provided, snap) => (
                              <div className={`task-row__drop ${snap.isDraggingOver ? 'is-over' : ''} ${draftIds.length === 0 && (t.assignments?.length ?? 0) === 0 ? 'is-empty' : ''}`} ref={provided.innerRef} {...provided.droppableProps}>
                                {draftIds.map((wid, i) => {
                                  const w = workerMap.get(wid)
                                  return (
                                    <Draggable key={wid} draggableId={wid} index={i}>
                                      {(p) => (
                                        <div className="chip chip--draft" ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}>
                                          <IconGripVertical size={12} className="chip__grip" />
                                          <span className="chip__av" style={{ background: w?.avatarColor }}>{w?.initials}</span>
                                          <span className="chip__name">{w?.fullName}</span>
                                          <span className="chip__tag">mới</span>
                                          <button className="chip__btn chip__btn--del" title="Bỏ" onClick={() => removeDraft(t.id, wid)}><IconX size={13} /></button>
                                        </div>
                                      )}
                                    </Draggable>
                                  )
                                })}
                                {provided.placeholder}
                                {draftIds.length === 0 && (t.assignments?.length ?? 0) === 0 && <span className="task-row__hint">Kéo công nhân vào đây</span>}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      )
                    })}
                    {tasks.length === 0 && <div className="kb-empty">Báo giá này chưa có hạng mục công việc</div>}
                  </div>
                </div>
              </div>
            </DragDropContext>
          )}
        </div>

        {/* Footer */}
        {step === 4 && (
          <div className="kanban__footer">
            <div className="kb-breadcrumb">
              <IconBuildingWarehouse size={14} /> {site?.name}
              <span className="kb-breadcrumb__sep">/</span> {project?.name}
              <span className="kb-breadcrumb__sep">/</span> {quote?.code}
            </div>
            <div className="kanban__footer-actions">
              <Button variant="default" icon={<IconRefresh size={15} />} onClick={resetAll}>Làm mới</Button>
              <Button variant="primary" icon={draftCount ? <IconDeviceFloppy size={15} /> : <IconCircleCheck size={15} />}
                disabled={draftCount === 0 || saveAssignments.isPending} onClick={handleSave}>
                {draftCount ? `Lưu giao việc (${draftCount})` : 'Đã phân công'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <TransferDrawer context={transferCtx} onClose={() => setTransferCtx(null)} />
    </PageShell>
  )
}
