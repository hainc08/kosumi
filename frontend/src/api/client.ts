// Lớp mock — sau này thay bằng axios instance, hook & component giữ nguyên.
const DEFAULT_DELAY = 250

/**
 * Giả lập một request mạng: chờ delay rồi trả về deep-clone kết quả resolver.
 * Deep-clone để consumer không vô tình mutate in-memory store.
 */
export function mockRequest<T>(resolver: () => T, delayMs: number = DEFAULT_DELAY): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(resolver())), delayMs)
  })
}
