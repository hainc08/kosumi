import { useCompletedTasks } from '@/api/tasks'

function fmt(min: number): string {
  const h = Math.floor(min / 60), m = min % 60
  return h ? `${h}h${m ? ` ${m}p` : ''}` : `${m}p`
}

/** Danh sách hạng mục đã hoàn thành: ai làm, tổng giờ, OT. */
export function CompletedTasksPanel() {
  const { data: rows = [] } = useCompletedTasks()
  if (rows.length === 0) return <div className="kb-empty">Chưa có hạng mục hoàn thành</div>
  return (
    <div className="ct-list">
      {rows.map((r) => (
        <div key={r.id} className="ct-row">
          <div className="ct-row__main">
            <div className="ct-row__title">{r.title}</div>
            <div className="ct-row__workers">
              {r.workers.map((w) => (
                <span key={w.id} className="ct-av" style={{ background: w.avatarColor }} title={w.fullName}>{w.initials}</span>
              ))}
            </div>
          </div>
          <div className="ct-row__time">
            <span>{fmt(r.totalMinutes)}</span>
            {r.overtimeMinutes > 0 && <span className="ct-ot">+OT {fmt(r.overtimeMinutes)}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
