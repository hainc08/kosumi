import { describe, it, expect } from 'vitest'
import { mockRequest } from '@/api/client'

describe('mockRequest', () => {
  it('trả về kết quả của resolver (async)', async () => {
    const result = await mockRequest(() => [1, 2, 3], 0)
    expect(result).toEqual([1, 2, 3])
  })
  it('trả về bản sao sâu để tránh sửa store ngoài ý muốn', async () => {
    const src = [{ a: 1 }]
    const out = await mockRequest(() => src, 0)
    out[0].a = 99
    expect(src[0].a).toBe(1)
  })
})
