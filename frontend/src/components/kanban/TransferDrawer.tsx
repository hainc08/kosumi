import { useMemo, useState } from 'react'
import { IconArrowsExchange, IconMapPin } from '@tabler/icons-react'
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

export function TransferDrawer({ context, onClose }: TransferDrawerProps) {
  const { data: tasks = [] } = useActiveTasks()
  const { data: sites = [] } = useSites()
  const { data: projects = [] } = useProjects()
  const transfer = useTransferWorker()
  const toast = useToastStore((s) => s.show)
  const [targetId, setTargetId] = useState<string | null>(null)

  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? '—'
  const projName = (id: string) => projects.find((p) => p.id === id)?.name ?? '—'

  // Nhóm task theo xưởng, loại trừ task hiện tại của công nhân
  const grouped = useMemo(() => {
    const map = new Map<string, typeof tasks>()
    tasks
      .filter((t) => t.id !== context?.fromTaskId && t.status !== 'completed')
      .forEach((t) => {
        const arr = map.get(t.siteId) ?? []
        arr.push(t)
        map.set(t.siteId, arr)
      })
    return [...map.entries()]
  }, [tasks, context?.fromTaskId])

  const reset = () => { setTargetId(null); onClose() }

  const handleConfirm = async () => {
    if (!context || !targetId) return
    await transfer.mutateAsync({ workerId: context.workerId, fromTaskId: context.fromTaskId, toTaskId: targetId })
    toast(`✓ Đã chuyển ${context.workerName} sang hạng mục mới`)
    reset()
  }

  return (
    <DetailDrawer
      open={!!context}
      onClose={reset}
      title="Chuyển công nhân"
      width="md"
      actions={
        <>
          <Button variant="default" onClick={reset}>Hủy</Button>
          <Button variant="primary" disabled={!targetId} onClick={handleConfirm}>Xác nhận chuyển</Button>
        </>
      }
    >
      {context && (
        <>
          <div className="tf-who">
            <span className="tf-who__av" style={{ background: context.workerColor }}>{context.workerInitials}</span>
            <div>
              <div className="tf-who__name">{context.workerName}</div>
              <div className="tf-who__from">
                <IconArrowsExchange size={13} /> Đang ở: {context.fromTaskTitle}
              </div>
            </div>
          </div>

          <div className="tf-hint">Chọn hạng mục mới để chuyển công nhân tới. Hệ thống sẽ kết thúc giờ công ở hạng mục cũ và bắt đầu tính ở hạng mục mới.</div>

          {grouped.map(([siteId, list]) => (
            <div key={siteId} className="tf-group">
              <div className="tf-group__site"><IconMapPin size={13} /> {siteName(siteId)}</div>
              {list.map((t) => (
                <label key={t.id} className={`tf-option ${targetId === t.id ? 'tf-option--on' : ''}`}>
                  <input type="radio" name="tf-target" checked={targetId === t.id} onChange={() => setTargetId(t.id)} />
                  <div>
                    <div className="tf-option__title">{t.title}</div>
                    <div className="tf-option__sub">{projName(t.projectId)} · {t.activeWorkers?.length ?? 0} người đang làm</div>
                  </div>
                </label>
              ))}
            </div>
          ))}
        </>
      )}
    </DetailDrawer>
  )
}
