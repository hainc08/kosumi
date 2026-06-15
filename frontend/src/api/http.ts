import axios from 'axios'

const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

http.interceptors.response.use(
  (r) => r.data.data,
  (err) => Promise.reject(err.response?.data ?? { message: 'Lỗi kết nối máy chủ' }),
)

// Lưu ý: interceptor trên đã "bóc" envelope { data } nên giá trị resolve thực tế
// là payload (T), không phải AxiosResponse<T>. Các wrapper dưới đây phản ánh
// đúng kiểu trả về thực tế để nơi gọi không cần ép kiểu thủ công.
export const apiGet = <T>(url: string, config?: object) => http.get(url, config) as unknown as Promise<T>
export const apiPost = <T>(url: string, body?: unknown) => http.post(url, body) as unknown as Promise<T>
export const apiPut = <T>(url: string, body?: unknown) => http.put(url, body) as unknown as Promise<T>
export const apiPatch = <T>(url: string, body?: unknown) => http.patch(url, body) as unknown as Promise<T>

export default http
