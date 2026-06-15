export function makeCode(prefix: string, seq: number, pad = 3): string {
  return `${prefix}${String(seq).padStart(pad, '0')}`
}

/**
 * Mã báo giá theo kiểu MAX-based (KHÔNG dùng count): parse phần số của TẤT CẢ code
 * hiện có (kể cả đã xóa mềm), lấy max (mặc định 80 nếu chưa có), +1, pad 4 chữ số.
 * Khớp `nextQuoteCode` ở frontend/src/api/quotes.ts.
 */
export function nextQuoteCode(existingCodes: string[]): string {
  const nums = existingCodes.map((c) => parseInt(c.replace(/^WS/, ''), 10)).filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 80
  return 'WS' + String(max + 1).padStart(4, '0')
}

/** Cộng số ngày vào một ngày ISO (yyyy-mm-dd hoặc đầy đủ) → trả về yyyy-mm-dd. */
export function addDays(iso: string, days: number): string {
  const d = iso ? new Date(iso) : new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
