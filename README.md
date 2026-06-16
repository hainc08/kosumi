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
