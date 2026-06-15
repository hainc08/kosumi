import { useEffect, useState } from 'react'

/** Định dạng số giây -> HH:MM:SS. */
export function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = String(Math.floor(s / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return `${h}:${m}:${sec}`
}

/** Đồng hồ đếm tiến từ mốc `since` (ISO), cập nhật mỗi giây. */
export function LiveTimer({ since }: { since: string }) {
  const start = new Date(since).getTime()
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="live-timer">{formatElapsed((Date.now() - start) / 1000)}</span>
}
