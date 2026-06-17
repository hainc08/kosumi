# deploy/ — bản build sẵn để chạy trên server (Plesk / poc.kosumi.vn)

Thư mục này **đã build sẵn**, server không cần build lại. Quy trình: máy local build
rồi push; server `git pull` là có bản mới.

```
deploy/
├── dist/              # backend NestJS đã build (chạy: node dist/main.js)
├── client/            # frontend React đã build (NestJS serve tĩnh)
├── package.json       # để cài deps production
├── package-lock.json
├── .env.example       # mẫu — tạo .env thật trên server (KHÔNG commit)
└── .env               # (chỉ có trên server) chứa thông tin DB
```

> `dist/` và `client/` phải **nằm cạnh nhau**: app đọc frontend qua
> `join(__dirname, '..', 'client')`. Giữ nguyên cấu trúc, đừng tách rời.

---

## A. Cài đặt LẦN ĐẦU trên server

### 1. Đưa code về server bằng Git

**Cách 1 — Plesk Git (khuyến nghị):** Plesk → `poc.kosumi.vn` → **Git** →
- Repository: URL repo (`https://github.com/hainc08/kosumi.git`)
- Branch: `poc` (hoặc branch bạn deploy)
- Deployment path: `httpdocs`
- Bật **Automatic deployment** nếu muốn push là tự cập nhật.

**Cách 2 — SSH:** `git clone -b poc <repo-url> .` vào thư mục `httpdocs`.

### 2. Tạo file `.env`

Trong thư mục `deploy/` trên server: copy `.env.example` → `.env`, điền thông tin DB
(host, port, db name, user, password do Plesk cấp).

### 3. Cấu hình Plesk Node.js

Plesk → `poc.kosumi.vn` → **Node.js**:
- **Node.js Version**: 20+
- **Application Root**: thư mục `deploy` (vd `httpdocs/deploy`)
- **Application Startup File**: `dist/main.js`
- **Application Mode**: `production`

Bấm **NPM install** → đợi xong → **Restart App**.

### 4. Import database (chỉ lần đầu)

phpMyAdmin → import `backend/database/schema.sql` (12 bảng). Xem `docs/deploy/plesk-matbao.md`.

### 5. Kiểm tra

- `https://poc.kosumi.vn/` → giao diện
- `https://poc.kosumi.vn/api/sites` → JSON `{ "data": [...] }`

---

## B. CẬP NHẬT các lần sau

**Ở máy local** (sau khi sửa code):

```powershell
# build lại FE+BE và làm mới deploy/
./scripts/build-deploy.ps1
git add deploy && git commit -m "build: cap nhat deploy" && git push
```

**Trên server:**

1. `git pull` (hoặc Plesk Git → **Pull updates** / tự động nếu đã bật).
2. Nếu `package.json` đổi (thêm/bớt thư viện) → bấm **NPM install** lại.
3. **Restart App**.

> `git pull` chỉ cập nhật `dist/` + `client/`. File `.env` và `node_modules/` nằm ngoài
> git nên **không bị ghi đè** — không cần cấu hình lại mỗi lần.

---

## C. Có migration DB mới?

Nếu thay đổi cấu trúc bảng: chạy SQL migration trên DB production (qua phpMyAdmin),
hoặc `npm run migration:run` trỏ DB. **Không** bật `synchronize` ở production.

---

## D. Điều tra bug bằng log

App ghi log mọi request/lỗi (backend) và mọi thao tác/API/lỗi (frontend) vào **cùng 1 file**
theo ngày: `logs/app-YYYY-MM-DD.log` (mỗi dòng 1 JSON). Mỗi request có `requestId`
(trả về header `X-Request-Id`); log phía trình duyệt có `sessionId` → ghép lại để truy vết
xuyên FE ↔ BE.

**Bật log (trong `.env` trên server):**

```
TZ=UTC
LOG_LEVEL=info          # debug khi cần soi kỹ
LOG_TO_FILE=true
LOG_VIEW_TOKEN=<chuỗi-bí-mật-tự-đặt>
```

→ **Restart App** sau khi sửa `.env`.

**Xem log — 2 cách:**

1. **Qua API (nhanh, không cần SSH):**
   `https://poc.kosumi.vn/api/logs/tail?token=<LOG_VIEW_TOKEN>&lines=300`
   → trả JSON 300 dòng cuối. (Bắt buộc có token ở production, sai/thiếu → 403.)

2. **File trực tiếp:** Plesk File Manager → mở `…/deploy/logs/app-YYYY-MM-DD.log`
   (hoặc đường dẫn `LOG_DIR` nếu có đặt). Tải về, mở bằng editor.

**Quy trình soi 1 bug (vd "tạo nhân viên báo thành công nhưng không hiện"):**

1. Trên web, thực hiện lại thao tác lỗi (bấm Thêm → Lưu).
2. Mở log, tìm chuỗi sự kiện theo thời gian:
   - `CLIENT ui.click` (đã bấm gì) → `CLIENT api.request`/`api.response` (FE gọi & nhận gì)
   - `HTTP → POST /api/workers` … `HTTP ← POST … 201` (BE nhận & trả gì, `result.keys`)
   - rồi `HTTP ← GET /api/workers … result.length = ?` (danh sách refetch có bao nhiêu bản ghi)
3. Đối chiếu: nếu **BE trả length tăng nhưng FE `api.response` length cũ** → bị **cache proxy**
   (kiểm tra `requestId` FE có khớp BE không); nếu **POST 4xx/5xx** → xem `EXCEPTION` + `stack`
   để biết lỗi DB/validation; nếu cả hai đều đúng mà UI vẫn trống → lỗi render phía FE.

> Log tự che các khóa nhạy cảm (password/token...) và cắt chuỗi quá dài.
> File log **không commit** (đã gitignore) — chỉ nằm trên server.
