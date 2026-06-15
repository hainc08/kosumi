import { useEffect, useState } from 'react'
import {
  IconArrowsExchange, IconMapPin, IconChevronRight, IconCheck, IconBuildingWarehouse,
  IconBuilding, IconTool, IconCircleCheck,
} from '@tabler/icons-react'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { Button } from '@/components/ui/Button'
import { useActiveTasks, useTransferWorker } from '@/api/tasks'
import { useSites } from '@/api/sites'
import { useProjects } from '@/api/projects'
import { useToastStore } from '@/stores/toastStore'

export interface TransferContext {
  workerId: string
  workerName: string
  workerInitials: string
  workerColor: string
  fromTaskId: string
  fromTaskTitle: string
}

interface TransferDrawerProps { context: TransferContext | null; onClose: () => void }

const STEPS = ['Công trường', 'Dự án', 'Hạng mục']

export function TransferDrawer({ context, onClose }: TransferDrawerProps) {
  const { data: tasks = [] } = useActiveTasks()
  const { data: sites = [] } = useSites()
  const { data: projects = [] } = useProjects()
  const transfer = useTransferWorker()
  const toast = useToastStore((s) => s.show)

  const [step, setStep] = useState(1)
  const [siteId, setSiteId] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [toTaskId, setToTaskId] = useState<string | null>(null)

  // Reset wizard mỗi lần mở cho 1 công nhân khác
  useEffect(() => {
    if (context) { setStep(1); setSiteId(null); setProjectId(null); setToTaskId(null) }
  }, [context?.workerId, context?.fromTaskId])

  const fromTask = tasks.find((t) => t.id === context?.fromTaskId)
  const siteName = (id: string | null) => sites.find((s) => s.id === id)?.name ?? '—'
  const projName = (id: string | null) => projects.find((p) => p.id === id)?.name ?? '—'

  const projectsAtSite = projects.filter((p) => p.siteId === siteId)
  const tasksOfProject = tasks.filter((t) => t.projectId === projectId && t.id !== context?.fromTaskId && t.status !== 'completed')
  const openTaskCount = (pid: string) => tasks.filter((t) => t.projectId === pid && t.status !== 'completed').length
  const projCountAtSite = (sid: string) => projects.filter((p) => p.siteId === sid).length

  const pickSite = (id: string) => { setSiteId(id); setProjectId(null); setToTaskId(null); setStep(2) }
  const pickProject = (id: string) => { setProjectId(id); setToTaskId(null); setStep(3) }
  const goStep = (n: number) => {
    if (n === 1) setStep(1)
    if (n === 2 && siteId) setStep(2)
    if (n === 3 && projectId) setStep(3)
  }

  const handleConfirm = async () => {
    if (!context || !toTaskId) return
    await transfer.mutateAsync({ workerId: context.workerId, fromTaskId: context.fromTaskId, toTaskId })
    toast(`✓ Đã chuyển ${context.workerName} sang hạng mục mới`)
    onClose()
  }

  return (
    <DetailDrawer
      open={!!context}
      onClose={onClose}
      title="Chuyển công nhân"
      width="md"
      actions={
        <>
          <Button variant="default" onClick={onClose}>Hủy</Button>
          <Button variant="primary" disabled={!toTaskId || transfer.isPending} onClick={handleConfirm}>Xác nhận chuyển</Button>
        </>
      }
    >
      {context && (
        <>
          {/* Công nhân đang chuyển */}
          <div className="tf-who">
            <span className="tf-who__av" style={{ background: context.workerColor }}>{context.workerInitials}</span>
            <div>
              <div className="tf-who__name">{context.workerName}</div>
              <div className="tf-who__from"><IconArrowsExchange size={13} /> Đang được chuyển</div>
            </div>
          </div>

          {/* Vị trí hiện tại */}
          <div className="tf-from">
            <IconMapPin size={14} />
            <div>
              <div className="tf-from__label">Vị trí hiện tại</div>
              <div className="tf-from__path">
                {siteName(fromTask?.siteId ?? null)} → {projName(fromTask?.projectId ?? null)}
                <span className="tf-from__task"> → {context.fromTaskTitle}</span>
              </div>
            </div>
          </div>

          {/* Tabs 3 bước */}
          <div className="tf-steps">
            {STEPS.map((label, i) => {
              const n = i + 1
              const done = n < step
              const active = n === step
              const clickable = n === 1 || (n === 2 && !!siteId) || (n === 3 && !!projectId)
              return (
                <div key={n} className="tf-steps__group">
                  <button type="button" className={`tf-step ${done ? 'tf-step--done' : ''} ${active ? 'tf-step--active' : ''}`}
                    disabled={!clickable} onClick={() => goStep(n)}>
                    <span className="tf-step__num">{done ? <IconCheck size={11} /> : n}</span>
                    <span className="tf-step__label">{label}</span>
                  </button>
                  {i < STEPS.length - 1 && <span className={`tf-step__sep ${done ? 'tf-step__sep--done' : ''}`} />}
                </div>
              )
            })}
          </div>

          {/* BƯỚC 1: Công trường */}
          {step === 1 && (
            <div className="tf-panel">
              <div className="tf-panel__label">Chọn công trường đích</div>
              {sites.map((s) => (
                <button type="button" key={s.id} className={`dopt ${siteId === s.id ? 'dopt--on' : ''}`} onClick={() => pickSite(s.id)}>
                  <span className="dopt__icon"><IconBuildingWarehouse size={17} /></span>
                  <div>
                    <div className="dopt__name">{s.name}</div>
                    <div className="dopt__sub">{(s.industrialZone || s.city)} · {projCountAtSite(s.id)} dự án</div>
                  </div>
                  <IconChevronRight size={16} className="dopt__arrow" />
                </button>
              ))}
            </div>
          )}

          {/* BƯỚC 2: Dự án */}
          {step === 2 && (
            <div className="tf-panel">
              <div className="tf-panel__label">Chọn dự án · {siteName(siteId)}</div>
              {projectsAtSite.map((p) => (
                <button type="button" key={p.id} className={`dopt ${projectId === p.id ? 'dopt--on' : ''}`} onClick={() => pickProject(p.id)}>
                  <span className="dopt__icon dopt__icon--green"><IconBuilding size={17} /></span>
                  <div>
                    <div className="dopt__name">{p.name}</div>
                    <div className="dopt__sub">{p.code} · {openTaskCount(p.id)} hạng mục</div>
                  </div>
                  <IconChevronRight size={16} className="dopt__arrow" />
                </button>
              ))}
              {projectsAtSite.length === 0 && <div className="tf-empty">Công trường này chưa có dự án</div>}
            </div>
          )}

          {/* BƯỚC 3: Hạng mục */}
          {step === 3 && (
            <div className="tf-panel">
              <div className="tf-panel__label">Chọn hạng mục đích · {projName(projectId)}</div>
              {tasksOfProject.map((t) => (
                <button type="button" key={t.id} className={`dtask-opt ${toTaskId === t.id ? 'dtask-opt--on' : ''}`} onClick={() => setToTaskId(t.id)}>
                  <div>
                    <div className="dtask-opt__name"><IconTool size={12} /> {t.title}</div>
                    <div className="dtask-opt__count">{t.activeWorkers?.length ? `${t.activeWorkers.length} người đang làm` : 'Chưa có người'}</div>
                  </div>
                  <IconCircleCheck size={18} className="dtask-opt__check" />
                </button>
              ))}
              {tasksOfProject.length === 0 && <div className="tf-empty">Dự án này không có hạng mục nào khác để chuyển</div>}
            </div>
          )}

          {toTaskId && (
            <div className="tf-confirm">
              <IconCircleCheck size={14} />
              <div>Chuyển tới: <strong>{tasksOfProject.find((t) => t.id === toTaskId)?.title}</strong>. Hệ thống sẽ kết thúc giờ công ở hạng mục cũ và bắt đầu tính ở hạng mục mới.</div>
            </div>
          )}
        </>
      )}
    </DetailDrawer>
  )
}
