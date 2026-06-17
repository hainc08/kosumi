# Danh sách yêu cầu sửa (Fixes)

Bạn ghi các yêu cầu sửa vào mục **🆕 Cần xử lý** bên dưới. Claude sẽ đọc file này,
thực hiện sửa, rồi chuyển issue đã xong xuống mục **✅ Đã xong** (kèm ghi chú đã sửa gì / file nào).

> Mẹo: không cần ghi trang trọng — gạch đầu dòng ngắn gọn là đủ. Càng rõ "ở đâu / hiện tại sao /
> mong muốn thế nào" thì fix càng nhanh và đúng ý. Có ảnh chụp màn hình thì để link/đường dẫn ảnh.

**Template 1 issue (copy khi cần):**

```
### [ ] <Tiêu đề ngắn>
- Màn hình / đường dẫn: (vd Danh sách thợ /workers, hoặc form báo giá)
- Hiện tại: (đang bị gì)
- Mong muốn: (cần sửa thành gì)
- Ghi chú: (tùy chọn — ảnh, ưu tiên cao/thấp...)
```

---

## 🆕 Cần xử lý

<!-- Ghi issue mới vào đây. -->



---

## 🔧 Đang sửa

<!-- Claude sẽ chuyển issue vào đây khi bắt đầu xử lý -->

### [x] Logic Báo giá → Công việc → Giao việc bị đứt
- Hiện tại (trước fix): (1) báo giá không có hạng mục thì dự án không tạo được công việc;
  (2) tạo báo giá có hạng mục nhưng Giao việc không thấy task.
- Nguyên nhân: `quote_items` (hạng mục báo giá) và `tasks` (hạng mục công việc) là 2 bảng rời,
  KHÔNG có cơ chế nào sinh task từ báo giá; backend cũng không có endpoint tạo task (chỉ có seed).
- Quyết định (theo yêu cầu): **mọi công việc sinh từ báo giá** (hạng mục + danh mục); trang Dự án
  hiển thị danh sách; **không** thêm/sửa/xóa task trong Giao việc; giữ wizard, bắt gán công trường cho dự án trước.
- Đã sửa:
  - Backend `tasks`: `generateFromQuote`/`generateForProject` (1 task / 1 hạng mục, giữ `quote_item_id`,
    site từ dự án, idempotent, chặn nếu dự án chưa có công trường); `tasksForProject` (kèm `section`=danh mục);
    routes `GET /tasks?projectId=`, `POST /tasks/generate-from-quote|generate-for-project`.
  - Frontend: ProjectDetailDrawer thêm khu "Hạng mục công việc" gom theo danh mục→hạng mục + nút
    "Tạo lại từ báo giá"; QuoteForm tự sinh task sau khi tạo; `api/tasks.ts` thêm hooks + mock; type `Task.section`.
- Đã verify trình duyệt + API: tạo task từ báo giá (3 task), gom đúng danh mục (Cầu thang thép / cầu thang bộ),
  idempotent (chạy lại = 0), Giao việc (`tasksForQuote`) đã thấy task. KHÔNG đổi schema/migration.

---

## ✅ Đã xong

### [x] Cơ chế log điều tra bug khi deploy (+ fix lệch giờ created_at)
- Yêu cầu: log mọi thao tác trên màn hình để điều tra bug sau khi deploy Plesk; cụ thể
  bug "tạo nhân viên báo thành công nhưng không hiển thị".
- Đã thêm:
  - **Backend** (zero-dependency, an toàn shared hosting):
    - `common/logger/app-logger.ts` — ghi JSON-lines ra `logs/app-YYYY-MM-DD.log` + console,
      tự che khóa nhạy cảm (password/token), cắt chuỗi dài; cấu hình qua `LOG_LEVEL/LOG_DIR/LOG_TO_FILE`.
    - `common/interceptors/logging.interceptor.ts` — log mỗi request: `requestId` (trả header
      `X-Request-Id`), method/url/status/duration/body (method ghi)/tóm tắt response.
    - `http-exception.filter.ts` — log lỗi kèm stack (5xx) + context; trả `requestId` trong body lỗi.
    - `modules/logs` — `POST /api/logs/client` nhận log FE; `GET /api/logs/tail?token=&lines=`
      xem nhanh log (gated bằng `LOG_VIEW_TOKEN`, production thiếu token → 403).
    - `main.ts` — bắt `unhandledRejection`/`uncaughtException`; log BOOT.
  - **Frontend**:
    - `lib/logger.ts` — gom batch & gửi về `/api/logs/client` (real mode), console (dev);
      bắt `window.error`/`unhandledrejection`, ghi `ui.click` (nhãn nút), `sessionId` mỗi phiên.
    - `api/http.ts` — axios interceptor log `api.request`/`api.response`/`api.error`
      (status, `requestId` đối chiếu BE, duration, shape payload).
- **Phát hiện khi điều tra**: bug "tạo xong không hiển thị" **KHÔNG tái hiện ở local** (POST 201,
  GET trả danh sách tăng đúng, bản ghi mới lên đầu) → nguyên nhân thuộc môi trường Plesk
  (nhiều khả năng: cache proxy GET `/api/workers`, hoặc lỗi refetch). Log đã sẵn để bắt tại server.
- **Fix kèm**: lệch giờ `created_at` -7h khi đọc (mysql2 đọc theo giờ máy). Thêm `timezone: '+00:00'`
  vào TypeORM (`app.module.ts` + `data-source.ts`) + khuyến nghị `TZ=UTC`. Đã verify: `createdAt`
  trả về khớp UTC thực. (Lưu ý: sai thứ tự KHÔNG do lỗi này vì ORDER BY chạy ở SQL trên giá trị thô.)
- Cách dùng: xem `deploy/README.md` mục **D. Điều tra bug bằng log**.

### [x] Màn Dự án: hiện báo giá liên quan + lọc theo mã báo giá
- Một dự án có thể có nhiều báo giá → thêm cột **"Báo giá"** (badge mã) trong bảng Dự án,
  và **FilterSelect lọc theo mã báo giá**.
- Backend: `projects.service` enrich `quotes[{id,code,title,status}]` cho mỗi dự án (batch);
  `QueryProjectDto.quoteCode` + filter `EXISTS quotes.code LIKE`. FE: types, api filter + mock, Projects.tsx cột + filter.
- Verify: Aeon = [WS0087, WS0090]; lọc WS0087 → chỉ Aeon.

### [x] Đổi nhãn báo giá + Công nhân→Nhân viên + Chuyên môn
- **Báo giá** (form): section "Hạng mục {n}" → **"{I,II,III}. Đầu mục"** (số La Mã);
  line "Danh mục {n}" → **"{1,2,3}. Hạng mục"**; cập nhật nút/aria/label/thông báo lỗi.
  Bản in QuotePreview cũng đồng bộ: "Cộng đầu mục I/II", fallback "Đầu mục báo giá".
- **Công nhân → Nhân viên** (app-wide): Sidebar, Nhân viên page, form/drawer, Dashboard,
  Công trường, Giao việc, Chấm công, POSITION_LABELS.worker, message backend.
- **Số năm kinh nghiệm → Chuyên môn**: đổi hẳn thành ô **chữ** (entity int experience_years →
  varchar specialty + migration 1718000013000 + schema.sql + ALTER docker DB); FE form/drawer/bảng;
  seed cập nhật chuyên môn (Hàn kết cấu, Vận hành CNC...).
- Đã verify trình duyệt: form báo giá "I. Đầu mục"/"1. Hạng mục"; trang Nhân viên cột Chuyên môn;
  API trả `specialty`, không còn `experienceYears`. Build BE+FE xanh.


### [x] Form "Sửa dự án" không hiển thị thông tin (Tên dự án, Khách hàng)
- Màn hình: /projects → Sửa dự án (đặc biệt dự án tạo tự động từ báo giá)
- Hiện tại (trước fix): bấm Sửa thì form trống, không nạp dữ liệu → edit không dùng được
- Nguyên nhân: `useForm` chỉ áp `defaultValues` lúc mount, mà form luôn mounted nên
  đổi dự án không nạp lại giá trị (bug React Hook Form kinh điển).
- Đã sửa: thêm `useEffect` reset form mỗi lần mở (theo đúng pattern QuoteForm). Áp cho **cả 4 form**
  cùng lỗi để Sửa hoạt động đồng nhất:
  - `frontend/src/components/projects/ProjectForm.tsx`
  - `frontend/src/components/workers/WorkerForm.tsx`
  - `frontend/src/components/sites/SiteForm.tsx`
  - `frontend/src/components/customers/CustomerForm.tsx`
- Đã verify bằng trình duyệt: form Sửa hiển thị đúng Tên dự án "PJ- test báo giá" +
  Khách hàng "Studio Kiến trúc Minh Anh" (lấy từ báo giá). Backend (auto-tạo project từ quote,
  update project) đã đúng sẵn, không cần sửa.

### [x] Thống kê (dashboard + module) hiển thị sai — nhiều aggregate hardcode 0
- Hiện tại (trước fix): số dự án/báo giá/tổng giá trị theo khách hàng = 0; "Công nhân theo xưởng"
  ở Dashboard đếm global (mọi xưởng như nhau); số báo giá theo dự án = 0.
- Nguyên nhân: các service backend để TODO, trả `0` thay vì COUNT/SUM thật.
- Đã sửa (tính bằng query batch, tránh N+1):
  - `customers.service.ts`: `projectCount`, `quoteCount`, `totalContractValue` (SUM contract_value theo KH)
  - `projects.service.ts`: `quoteCount` (theo project), `workerCount` (DISTINCT công nhân active qua task_assignments)
  - `sites.service.ts`: `workerCount` (theo site_id, thay vì global), `projectCount` (theo site_id)
- Đã verify trình duyệt: KH "Studio Kiến trúc Minh Anh" = 3 dự án / 2 báo giá / 500.000.000₫;
  KPI "Tổng giá trị HĐ" = 6.490.000.000₫; Dashboard "Công nhân theo xưởng" = 3/2/0/0/3 (tổng 8).
- Các KPI khác (Dashboard, Dự án, Công trường, Khách hàng) tính client-side từ list thật → vốn đã đúng.
