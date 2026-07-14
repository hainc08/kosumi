import { useEffect, useState } from 'react'
import { IconClock } from '@tabler/icons-react'

/** Badge đếm ngược tới giờ tan ca (mốc "HH:MM"). Tự cập nhật mỗi 30s. */
export function ShiftCountdown({ shiftEnd }: { shiftEnd: string }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 30_000)
    return () => clearInterval(t)
  }, [])
  const [h, m] = shiftEnd.split(':').map(Number)
  const now = new Date()
  const end = new Date(now); end.setHours(h, m, 0, 0)
  const mins = Math.round((+end - +now) / 60000)
  if (mins <= 0) {
    return <span className="kb-countdown kb-countdown--off"><IconClock size={14} /> Đã qua giờ tan ca ({shiftEnd})</span>
  }
  const hh = Math.floor(mins / 60), mm = mins % 60
  return <span className="kb-countdown"><IconClock size={14} /> Còn {hh ? `${hh}h ` : ''}{mm}p tới tan ca ({shiftEnd})</span>
}
