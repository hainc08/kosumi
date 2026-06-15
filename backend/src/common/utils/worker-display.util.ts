// Ported verbatim from frontend/src/utils/worker-helpers.ts để FE/BE trả cùng initials/avatarColor.
const PALETTE = ['#1D4ED8', '#16A34A', '#D97706', '#7C3AED', '#DC2626', '#0891B2']

export function deriveInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  const first = parts[0].charAt(0)
  const last = parts[parts.length - 1].charAt(0)
  return (first + last).toUpperCase()
}

export function avatarColorFor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}
