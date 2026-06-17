import axios from 'axios'
import { logger } from '@/lib/logger'

const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

// Log request đi (đính kèm thời điểm để đo thời lượng ở response).
http.interceptors.request.use((config) => {
  ;(config as { _startedAt?: number })._startedAt = Date.now()
  logger.info('api.request', {
    method: config.method?.toUpperCase(),
    url: (config.baseURL ?? '') + (config.url ?? ''),
    params: config.params,
    // body chỉ log cho method ghi; logger phía sau không che — tránh log mật khẩu ở đây.
    hasBody: config.data != null,
  })
  return config
})

http.interceptors.response.use(
  (r) => {
    const cfg = r.config as { _startedAt?: number }
    logger.info('api.response', {
      method: r.config.method?.toUpperCase(),
      url: (r.config.baseURL ?? '') + (r.config.url ?? ''),
      status: r.status,
      requestId: r.headers['x-request-id'],
      durationMs: cfg._startedAt ? Date.now() - cfg._startedAt : undefined,
      // tóm tắt payload đã bóc envelope: mảng → length, object → keys
      shape: shapeOf(r.data?.data),
    })
    return r.data.data
  },
  (err) => {
    const cfg = (err.config ?? {}) as { _startedAt?: number; method?: string; baseURL?: string; url?: string }
    logger.error('api.error', {
      method: cfg.method?.toUpperCase(),
      url: (cfg.baseURL ?? '') + (cfg.url ?? ''),
      status: err.response?.status,
      requestId: err.response?.headers?.['x-request-id'],
      durationMs: cfg._startedAt ? Date.now() - cfg._startedAt : undefined,
      response: err.response?.data,
      message: err.message,
    })
    return Promise.reject(err.response?.data ?? { message: 'Lỗi kết nối máy chủ' })
  },
)

/** Tóm tắt hình dạng payload để log gọn (không đổ cả mảng to vào log). */
function shapeOf(data: unknown): Record<string, unknown> {
  if (Array.isArray(data)) return { kind: 'array', length: data.length }
  if (data && typeof data === 'object') return { kind: 'object', keys: Object.keys(data).slice(0, 20) }
  return { kind: typeof data }
}

// Lưu ý: interceptor trên đã "bóc" envelope { data } nên giá trị resolve thực tế
// là payload (T), không phải AxiosResponse<T>. Các wrapper dưới đây phản ánh
// đúng kiểu trả về thực tế để nơi gọi không cần ép kiểu thủ công.
export const apiGet = <T>(url: string, config?: object) => http.get(url, config) as unknown as Promise<T>
export const apiPost = <T>(url: string, body?: unknown) => http.post(url, body) as unknown as Promise<T>
export const apiPut = <T>(url: string, body?: unknown) => http.put(url, body) as unknown as Promise<T>
export const apiPatch = <T>(url: string, body?: unknown) => http.patch(url, body) as unknown as Promise<T>

export default http
