export type DeadlineState = 'overdue' | 'near' | 'ok'

/** Trạng thái deadline: quá hạn / sắp đến hạn (≤14 ngày) / còn xa. */
export function deadlineState(deadlineISO: string, todayISO?: string): DeadlineState {
  const today = todayISO ? new Date(todayISO) : new Date()
  const d = new Date(deadlineISO)
  const days = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'overdue'
  if (days <= 14) return 'near'
  return 'ok'
}
