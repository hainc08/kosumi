/**
 * Client logger — ghi lại thao tác/API/lỗi phía trình duyệt rồi gửi (batch) về
 * backend `/api/logs/client` để điều tra bug khi đã deploy (không cần mở DevTools
 * trên máy người dùng). Dev mode (mock) chỉ in console.
 *
 * Mỗi phiên có 1 sessionId; ghép với requestId trả về từ BE (header X-Request-Id)
 * để truy vết xuyên FE ↔ BE.
 */
type Level = 'debug' | 'info' | 'warn' | 'error'

interface LogEvent {
  ts: string
  level: Level
  event: string
  sessionId: string
  url: string
  data?: unknown
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const SHIP = !USE_MOCK // chỉ gửi về server khi chạy real API (đã deploy / local real)
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api'
const ENDPOINT = `${API_BASE}/logs/client`
const FLUSH_MS = 3000
const MAX_BUFFER = 50

function getSessionId(): string {
  try {
    const k = 'ks_log_sid'
    let id = sessionStorage.getItem(k)
    if (!id) {
      id = (crypto.randomUUID?.() ?? String(Date.now()) + Math.random().toString(16).slice(2))
      sessionStorage.setItem(k, id)
    }
    return id
  } catch {
    return 'no-session'
  }
}

const sessionId = getSessionId()
let buffer: LogEvent[] = []
let timer: ReturnType<typeof setTimeout> | null = null

function scheduleFlush() {
  if (timer || !SHIP) return
  timer = setTimeout(flush, FLUSH_MS)
}

function flush(useBeacon = false) {
  if (timer) { clearTimeout(timer); timer = null }
  if (!SHIP || buffer.length === 0) return
  const events = buffer
  buffer = []
  const payload = JSON.stringify({ events })
  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'application/json' }))
    } else {
      // keepalive để request vẫn đi khi đang rời trang.
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true })
        .catch(() => { /* nuốt lỗi: không để logger tự gây lỗi */ })
    }
  } catch { /* ignore */ }
}

export function log(level: Level, event: string, data?: unknown) {
  const entry: LogEvent = {
    ts: new Date().toISOString(),
    level, event, sessionId,
    url: typeof location !== 'undefined' ? location.pathname + location.search : '',
    data,
  }

  if (import.meta.env.DEV) {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    fn(`%c[log] ${event}`, 'color:#6b7280', data ?? '')
  }

  if (!SHIP) return
  buffer.push(entry)
  if (buffer.length >= MAX_BUFFER) flush()
  else scheduleFlush()
}

export const logger = {
  debug: (e: string, d?: unknown) => log('debug', e, d),
  info: (e: string, d?: unknown) => log('info', e, d),
  warn: (e: string, d?: unknown) => log('warn', e, d),
  error: (e: string, d?: unknown) => log('error', e, d),
  sessionId,
  flush,
}

/** Gắn các bộ bắt lỗi/đời sống trang. Gọi 1 lần lúc khởi động app. */
export function initLogger() {
  if (typeof window === 'undefined') return

  logger.info('app.start', { ua: navigator.userAgent, base: API_BASE, useMock: USE_MOCK })

  window.addEventListener('error', (e) => {
    logger.error('window.error', {
      message: e.message, source: e.filename, line: e.lineno, col: e.colno,
      stack: e.error instanceof Error ? e.error.stack : undefined,
    })
  })

  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason
    logger.error('window.unhandledrejection', {
      message: r instanceof Error ? r.message : String(r),
      stack: r instanceof Error ? r.stack : undefined,
    })
  })

  // Ghi lại click vào nút bấm (thao tác chính trên màn hình) — kèm nhãn nút.
  window.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement)?.closest('button, a, [role="button"]') as HTMLElement | null
    if (!el) return
    const label = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 60)
    if (label) logger.info('ui.click', { label, tag: el.tagName.toLowerCase() })
  }, { capture: true })

  // Cố gửi nốt buffer khi rời trang.
  window.addEventListener('beforeunload', () => flush(true))
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(true) })
}
