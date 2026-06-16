# Hướng dẫn deploy KosumiApp lên Plesk (Mắt Bão) — 1 domain

Triển khai **KosumiApp / WorkShop Pro** (Frontend React + Backend NestJS + MariaDB)
lên hosting **Plesk** của Mắt Bão, trên **một domain duy nhất**:

- Giao diện: `https://poc.kosumi.vn/`
- API: `https://poc.kosumi.vn/api/`

> 💡 **Cách deploy nhanh (khuyến nghị): dùng folder `deploy/` + Git.**
> Build sẵn ở máy local, push lên git; server `git pull` là xong, không build trên hosting.
> Xem hướng dẫn riêng tại **[`deploy/README.md`](../../deploy/README.md)**. Tài liệu dưới
> đây mô tả chi tiết từng phần (DB, kiến trúc, troubleshooting) — đọc kèm.

---

## 1. Kiến trúc: NestJS serve luôn cả Frontend

Để dùng chung 1 domain, **backend NestJS phục vụ luôn frontend tĩnh**. Không cần
tách `api.*`, **không có vấn đề CORS** (cùng origin), chỉ 1 app Node chạy trên Plesk.

```
  https://poc.kosumi.vn/         →  index.html + assets (React build)   ┐
  https://poc.kosumi.vn/dashboard →  SPA fallback → index.html           ├─ 1 app NestJS
  https://poc.kosumi.vn/api/...   →  Controllers (REST API)             ┘     │
                                                                              ▼
                                                                          MariaDB (Plesk)
```

Cơ chế (đã cấu hình sẵn trong code):
- `backend/src/app.module.ts` dùng `ServeStaticModule` serve thư mục `backend/client`
  (chứa React build), với SPA fallback (deep-link `/dashboard`, `/workers/...` trả `index.html`).
- `exclude: ['/api/{*splat}']` → mọi request `/api*` **bỏ qua static**, rơi vào controller.
- `frontend/.env.production` đặt `VITE_API_BASE_URL=/api` (đường dẫn tương đối) +
  `VITE_USE_MOCK=false` → FE gọi API cùng origin, không mock.

> Đã smoke-test cục bộ: `/` và `/dashboard` trả 200 (index.html), `/api/*` rơi đúng vào Nest router.

---

## 2. Yêu cầu

- Gói Plesk có bật **Node.js** (Mắt Bão hỗ trợ).
- **Node.js 20+** (NestJS 11 yêu cầu) — Plesk cho chọn version.
- **MariaDB 10.6+ / MySQL 8** (schema dùng `utf8mb4_unicode_ci`).
- Quyền tạo Database + Database user trong Plesk.
- Subdomain `poc.kosumi.vn` đã tạo (đã có ✓).

> **Khuyến nghị build ở máy local rồi upload.** Hosting chia sẻ dễ thiếu RAM/CPU khi build.

---

## 3. Bước 1 — Tạo Database & import schema

1. Plesk → **Databases** → **Add Database**: tạo DB (vd `workshop_pro`) + 1 user/password.
   **Ghi lại**: host, port, db name, user, password.
2. Mở **phpMyAdmin** → chọn DB → tab **Import** → chọn `backend/database/schema.sql` → **Import**.
3. Kiểm tra: đủ **12 bảng** (sites, workers, worker_contracts, customers, customer_contacts,
   projects, quotes, quote_items, quote_payment_steps, tasks, task_assignments, timesheet_entries).

> Dữ liệu mẫu (tùy chọn): xem [mục 7](#7-seed-dữ-liệu-mẫu-tùy-chọn). Production thật nên để rỗng.

---

## 4. Bước 2 — Build Frontend & gộp vào Backend (làm ở máy local)

File `frontend/.env.production` đã có sẵn trong repo:

```ini
VITE_API_BASE_URL=/api
VITE_USE_MOCK=false
```

> ⚠️ Biến `VITE_*` được nhúng **lúc build**. Nếu sửa, phải build lại FE.

Chạy ở máy local:

```bash
# 1) Build frontend (tự dùng .env.production)
cd frontend
npm ci
npm run build                 # ra frontend/dist/

# 2) Build backend
cd ../backend
npm ci
npm run build                 # ra backend/dist/

# 3) Gộp FE build vào backend/client (NestJS sẽ serve thư mục này)
#    Windows PowerShell:
#      Remove-Item ../backend/client -Recurse -Force -ErrorAction SilentlyContinue
#      New-Item -ItemType Directory ../backend/client | Out-Null
#      Copy-Item ../frontend/dist/* ../backend/client/ -Recurse -Force
#    macOS/Linux:
rm -rf client && mkdir client && cp -r ../frontend/dist/* client/
```

Sau bước này `backend/` có cấu trúc cần upload:

```
backend/
├── dist/                  # backend build (chứa main.js)
├── client/                # frontend build (index.html, assets, .htaccess)
├── package.json
├── package-lock.json
├── database/schema.sql    # (tham khảo; đã import ở bước 1)
└── .env                   # TẠO MỚI trên server — KHÔNG commit (chứa mật khẩu DB)
```

> `ServeStaticModule` đọc `backend/client` qua `join(__dirname,'..','client')` → khi chạy
> `dist/main.js`, thư mục `client` phải **nằm cạnh** `dist`. Giữ nguyên cấu trúc trên.

---

## 5. Bước 3 — Tạo app Node.js trên Plesk

1. Upload nội dung thư mục `backend/` (mục 4) vào thư mục gốc của `poc.kosumi.vn`
   (thường là `httpdocs/`) qua **File Manager** hoặc FTP.
2. Tạo file **`.env`** trong thư mục đó (điền thông tin DB ở Bước 1):

   ```ini
   DATABASE_HOST=localhost
   DATABASE_PORT=3306
   DATABASE_USER=<db_user_matbao>
   DATABASE_PASSWORD=<db_pass_matbao>
   DATABASE_NAME=<db_name_matbao>
   PORT=3000
   NODE_ENV=production
   ```

   > `DATABASE_HOST` thường là `localhost`; một số gói dùng host riêng — lấy đúng theo Plesk cấp.
   > **Không cần** `CORS_ORIGIN` vì FE và API cùng origin.

3. Plesk → domain `poc.kosumi.vn` → **Node.js**:
   - **Node.js Version**: `20.x`+
   - **Application Root** & **Document Root**: thư mục chứa `package.json` (vd `/httpdocs`)
   - **Application Startup File**: `dist/main.js`
   - **Application Mode**: `production`
4. Bấm **NPM install** → đợi xong → **Restart App** (hoặc **Enable Node.js**).

**Kiểm tra:**
- `https://poc.kosumi.vn/` → giao diện hiện lên.
- `https://poc.kosumi.vn/api/sites` → JSON `{ "data": [...] }`.
- `https://poc.kosumi.vn/api/docs` → Swagger.

---

## 6. Bước 4 — Bật HTTPS (SSL)

Plesk → `poc.kosumi.vn` → **SSL/TLS Certificates** →
**Install free Let's Encrypt certificate**. Bắt buộc để tránh mixed-content.

---

## 7. Seed dữ liệu mẫu (tùy chọn)

**Cách A — chạy seed từ máy local trỏ vào DB Mắt Bão** (cần bật Remote MySQL +
whitelist IP trong Plesk → Database → Remote access):

```bash
cd backend
# tạm sửa .env trỏ DATABASE_* sang DB Mắt Bão
npm run seed
```

**Cách B — qua phpMyAdmin:** export dữ liệu demo từ DB local
(`mysqldump --no-create-info`) rồi import vào DB Mắt Bão.

---

## 8. Kiểm tra & xử lý sự cố

| Triệu chứng | Nguyên nhân | Cách xử lý |
|-------------|-------------|------------|
| `/` trắng trang | `client/` chưa upload hoặc sai vị trí | `client` phải nằm cạnh `dist`; chứa `index.html` |
| Refresh `/dashboard` ra 404 | App Node chưa chạy / sai startup file | Startup phải là `dist/main.js`; xem Logs |
| `/api/...` trả về HTML thay vì JSON | exclude không khớp | Đảm bảo đang chạy bản build mới (đã có `exclude: ['/api/{*splat}']`) |
| FE vẫn hiện dữ liệu giả | Quên `VITE_USE_MOCK=false` lúc build | Build lại FE rồi copy lại vào `client/` |
| API 500 `ER_ACCESS_DENIED` / `ECONNREFUSED` | Sai thông tin DB | Kiểm tra `DATABASE_*` trong `.env` |
| `auth_gssapi_client` / `unknown plugin` | Account MariaDB dùng auth plugin lạ | Tạo lại user DB với `mysql_native_password` (qua phpMyAdmin) |
| Mixed content | FE HTTPS gọi HTTP | Cài SSL; `VITE_API_BASE_URL=/api` (tương đối) đã tránh được |
| `Cannot find module` khi start | Chưa NPM install trên Plesk | Bấm **NPM install** → **Restart App** |

**Log backend:** Plesk → `poc.kosumi.vn` → **Node.js** → **Logs**.

---

## 9. Cập nhật phiên bản về sau

```bash
# Frontend đổi:
cd frontend && npm run build
cd ../backend && rm -rf client && mkdir client && cp -r ../frontend/dist/* client/
# upload lại backend/client → Restart App

# Backend đổi:
cd backend && npm run build
# upload lại backend/dist → Restart App
```

Có **migration mới** (đổi cấu trúc bảng): chạy SQL migration trên DB production qua
phpMyAdmin, hoặc `npm run migration:run` trỏ DB Mắt Bão. **Không** bật `synchronize` ở production.

---

## 10. Checklist

- [ ] Tạo DB + user trong Plesk (user dùng `mysql_native_password`), ghi lại thông tin
- [ ] Import `backend/database/schema.sql` (đủ 12 bảng)
- [ ] `npm run build` cho **frontend** (đã có `.env.production`)
- [ ] `npm run build` cho **backend**
- [ ] Copy `frontend/dist/*` → `backend/client/`
- [ ] Upload `backend/` (dist + client + package*.json) lên `httpdocs` của `poc.kosumi.vn`
- [ ] Tạo `.env` trên server (DATABASE_*, PORT, NODE_ENV)
- [ ] Plesk Node.js: Node 20+, startup `dist/main.js`, mode production → NPM install → Restart
- [ ] Cài SSL Let's Encrypt
- [ ] Test: `/` hiện giao diện, `/api/sites` trả JSON, không lỗi CORS/mixed-content
```