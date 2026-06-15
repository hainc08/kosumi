# Spec 3 — Tráo Frontend sang API thật

> Phụ thuộc Spec 2 (API). Mục tiêu: nối FE vào backend thật **không sửa page/component/UI**.

## Điểm mấu chốt
Cả 7 file `src/api/*` (sites, workers, customers, projects, quotes, tasks, timesheet) đều đi qua một "đường ống" duy nhất: `mockRequest()` trong `client.ts`. Đó là chỗ tráo. Hook giữ nguyên `queryKey` + signature → **component không sửa một dòng**.

## 1. Axios client — `src/api/http.ts` (mới)
```ts
import axios from 'axios'
const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

// response: bóc envelope {data} → trả payload trần (giống mockRequest hôm nay)
http.interceptors.response.use(
  (r) => r.data.data,
  (err) => Promise.reject(err.response?.data ?? err),  // {statusCode, message, errors}
)
// (phase sau) request interceptor gắn Bearer token
export default http
```

## 2. Cờ bật/tắt — chuyển dần từng module
Thêm `VITE_USE_MOCK=true|false` vào `.env`. Trong mỗi file `api/*`, đổi ruột hàm theo mẫu:
```ts
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// TRƯỚC: queryFn: () => mockRequest(() => filterSites(filters))
// SAU:
queryFn: () => USE_MOCK
  ? mockRequest(() => filterSites(filters))
  : http.get('/sites', { params: filters }),
```
→ Migrate **từng module một** (đúng phương án A): module xong thì gọi real, module chưa làm vẫn mock → app **không vỡ giữa chừng**.
→ Các hàm thuần (`filterSites`, `tasksForQuote`, `enrichTask`…) **giữ lại** vì test Vitest vẫn dùng. `mockRequest`/`db`/`seed` chỉ xóa khi tất cả module đã real (cuối Spec 3).

## 3. Thứ tự tráo (khớp thứ tự build BE)
Sites → Workers → Customers → Projects → Quotes → Tasks → Timesheet → Dashboard.
Mỗi module: BE chạy được → đổi `api/<module>.ts` → verify trên browser → module sau.

## 4. Chỗ cần khớp lại khi nối thật
| Vấn đề | Xử lý |
|---|---|
| `staleTime: 30_000` gây cache cũ | Giữ nguyên; mutation đã `invalidateQueries` đúng. |
| `peekNextQuoteCode()` (sync) → `GET /quotes/next-code` (async) | `QuoteForm` đổi sang `useQuery` lấy mã; field vẫn readonly. **Sửa nhỏ duy nhất trong component.** |
| Lỗi server (409/404) | Error interceptor → `mutation.onError` → `toastStore.show(msg, 'error')`. |
| `structuredClone` chống mutate | Không cần với real API; bỏ khi dọn `client.ts`. |
| CORS | BE bật CORS cho `5173/5174`. |
| Ngày `YYYY-MM-DD` vs ISO | BE đã chuẩn hóa (Spec 1); FE `date-fns` giữ nguyên. |

## Phạm vi sửa FE (toàn bộ)
- **Mới**: `src/api/http.ts`, biến `.env` (`VITE_API_BASE_URL`, `VITE_USE_MOCK`).
- **Đổi ruột**: 7 file `src/api/*.ts` (giữ signature + queryKey).
- **Sửa nhỏ**: `QuoteForm` (mã async), 1 dòng type `Worker.siteId` (Spec 1).
- **Dọn cuối**: `client.ts`, `mocks/db.ts`, `mocks/seed/*` (sau khi mọi module real & test chuyển sang test BE).
- **KHÔNG đụng**: mọi page, component UI, layout, router, styles.

## Tiêu chí hoàn thành
- `VITE_USE_MOCK=false` → cả 8 module hoạt động trên browser với DB MariaDB thật (CRUD, Kanban assign/transfer, duyệt chấm công, dashboard).
- `npm run build` FE pass; backend `npm run build` pass.
