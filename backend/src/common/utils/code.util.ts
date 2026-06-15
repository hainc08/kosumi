export function makeCode(prefix: string, seq: number, pad = 3): string {
  return `${prefix}${String(seq).padStart(pad, '0')}`
}
