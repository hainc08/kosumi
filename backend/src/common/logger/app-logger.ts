/**
 * App logger — zero-dependency (không cần winston/pino để tránh phiền npm install
 * trên shared hosting Plesk). Ghi JSON-lines ra file theo ngày + echo console.
 *
 * File: <LOG_DIR>/app-YYYY-MM-DD.log   (mặc định LOG_DIR = <cwd>/logs)
 * Mỗi dòng là 1 JSON object → dễ grep / tail / import về sau.
 *
 * ENV điều khiển:
 *   LOG_LEVEL    debug|info|warn|error   (mặc định info)
 *   LOG_DIR      thư mục ghi log         (mặc định ./logs)
 *   LOG_TO_FILE  'false' để tắt ghi file (mặc định bật)
 */
import { appendFile, mkdirSync } from 'fs'
import { join } from 'path'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
const ORDER: LogLevel[] = ['debug', 'info', 'warn', 'error']

const MIN_LEVEL = (process.env.LOG_LEVEL as LogLevel) || 'info'
const LOG_DIR = process.env.LOG_DIR || join(process.cwd(), 'logs')
const TO_FILE = process.env.LOG_TO_FILE !== 'false'

/** Khóa nhạy cảm sẽ bị che khi ghi log (không lộ mật khẩu/token ra file). */
const SENSITIVE = /^(password|pass|token|secret|authorization|auth|jwt|accesstoken|refreshtoken)$/i
const MAX_STR = 2000 // cắt chuỗi quá dài để file không phình

function enabled(level: LogLevel): boolean {
  return ORDER.indexOf(level) >= ORDER.indexOf(MIN_LEVEL)
}

/** Deep-clone + che khóa nhạy cảm + cắt chuỗi dài. Không ném lỗi dù input lạ. */
export function redact(value: unknown, depth = 0): unknown {
  if (value == null) return value
  if (typeof value === 'string') return value.length > MAX_STR ? value.slice(0, MAX_STR) + '…(cắt)' : value
  if (typeof value !== 'object') return value
  if (depth > 6) return '…(sâu)'
  if (Array.isArray(value)) return value.slice(0, 100).map((v) => redact(v, depth + 1))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE.test(k) ? '***' : redact(v, depth + 1)
  }
  return out
}

let dirReady = false
function ensureDir() {
  if (dirReady) return
  try { mkdirSync(LOG_DIR, { recursive: true }); dirReady = true } catch { /* ignore */ }
}

function fileForToday(): string {
  const d = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
  return join(LOG_DIR, `app-${d}.log`)
}

/** Ghi 1 dòng log. scope = nguồn (HTTP/EXCEPTION/CLIENT/...). meta = dữ liệu kèm. */
export function writeLog(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>) {
  if (!enabled(level)) return
  const entry = {
    ts: new Date().toISOString(),
    level,
    scope,
    msg: message,
    ...(meta ? (redact(meta) as Record<string, unknown>) : {}),
  }
  const line = JSON.stringify(entry)

  // Echo console (Plesk hứng stdout/stderr) — gọn gàng để đọc nhanh.
  const head = `[${entry.ts}] ${level.toUpperCase().padEnd(5)} ${scope} ${message}`
  if (level === 'error') console.error(head, meta ?? '')
  else if (level === 'warn') console.warn(head)
  else console.log(head)

  if (!TO_FILE) return
  ensureDir()
  // fire-and-forget; mỗi append là 1 dòng nên không lo xen kẽ giữa các dòng.
  appendFile(fileForToday(), line + '\n', (err) => {
    if (err) console.error('[logger] không ghi được file log:', err.message)
  })
}

export const appLog = {
  debug: (scope: string, msg: string, meta?: Record<string, unknown>) => writeLog('debug', scope, msg, meta),
  info: (scope: string, msg: string, meta?: Record<string, unknown>) => writeLog('info', scope, msg, meta),
  warn: (scope: string, msg: string, meta?: Record<string, unknown>) => writeLog('warn', scope, msg, meta),
  error: (scope: string, msg: string, meta?: Record<string, unknown>) => writeLog('error', scope, msg, meta),
}

export const LOGGER_CONFIG = { LOG_DIR, MIN_LEVEL, TO_FILE, fileForToday }
