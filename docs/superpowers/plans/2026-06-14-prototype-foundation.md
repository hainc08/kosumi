# Prototype Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng nền tảng React prototype của WorkShop Pro: project scaffold, lớp mock data cô lập, App Shell (Sidebar/Topbar/Toast) và thư viện UI component dùng chung — đủ để chạy `npm run dev`, điều hướng giữa các route và render được trang mẫu.

**Architecture:** Vite + React 18 + TypeScript. Server-state qua React Query, gọi vào **lớp mock in-code** (`src/mocks/db.ts` + `src/api/*`) thay cho backend; đổi sang axios sau này chỉ sửa ruột `src/api/*`. Styling bằng **Vanilla CSS** + CSS variables (`tokens.css`) và 1 file `.css` per component. State UI (sidebar/toast) bằng Zustand.

**Tech Stack:** React 18, TypeScript, Vite 5, @tanstack/react-query v5, zustand, react-router-dom v6, @tabler/icons-react, date-fns, vitest + @testing-library/react (test logic). (react-hook-form, zod, @hello-pangea/dnd, exceljs cài ở plan này nhưng dùng ở các plan module.)

**Testing approach:** TDD cho **logic** (utils `format`, `pay-calculator`, `mockRequest`) qua Vitest. Component thuần hình ảnh: dựng rồi **verify bằng trình duyệt** (`npm run dev`) — bước verify ghi rõ điều cần thấy. Một smoke test render AppShell để bắt lỗi import/runtime.

**Project root:** Toàn bộ lệnh chạy trong `frontend/` (thư mục đã tồn tại, đang trống). Đường dẫn file trong plan tương đối so với `frontend/`.

**Platform note:** Windows + PowerShell. Dùng `npm`. Lệnh git chạy từ repo root `900.KosumiApp/`.

---

## File Structure (tạo trong plan này)

```
frontend/
├── package.json, tsconfig.json, tsconfig.node.json, vite.config.ts, index.html, .env, .gitignore
├── src/
│   ├── main.tsx                      # entry: QueryClientProvider + RouterProvider
│   ├── App.tsx                       # (không bắt buộc — router là root)
│   ├── styles/
│   │   ├── tokens.css                # copy từ design/tokens.css
│   │   └── global.css                # reset + base + import tokens
│   ├── types/
│   │   └── index.ts                  # copy từ context/types.ts (source of truth)
│   ├── mocks/
│   │   ├── db.ts                     # in-memory store (mutable arrays)
│   │   └── seed/
│   │       ├── sites.ts
│   │       └── workers.ts
│   ├── api/
│   │   ├── client.ts                 # mockRequest<T>(resolver, delayMs)
│   │   └── sites.ts                  # useSites() (đọc-only, cho dropdown)
│   ├── stores/
│   │   ├── appStore.ts               # sidebar collapsed, mock current user
│   │   └── toastStore.ts             # toast message queue
│   ├── utils/
│   │   ├── format.ts                 # formatCurrency, formatDate, formatHours
│   │   └── pay-calculator.ts         # calculatePay, estimateMonthlyPay
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx + .css
│   │   │   ├── Sidebar.tsx + .css
│   │   │   └── Topbar.tsx + .css
│   │   └── ui/
│   │       ├── Badge.tsx + .css
│   │       ├── Button.tsx + .css
│   │       ├── KpiCard.tsx + .css
│   │       ├── ProgressBar.tsx + .css
│   │       ├── SearchBox.tsx + .css
│   │       ├── FilterSelect.tsx + .css
│   │       ├── FormField.tsx + .css
│   │       ├── DataTable.tsx + .css
│   │       ├── FormModal.tsx + .css
│   │       ├── DetailDrawer.tsx + .css
│   │       ├── ConfirmDialog.tsx + .css
│   │       ├── LoadingSkeleton.tsx + .css
│   │       ├── AvatarStack.tsx + .css
│   │       └── Toast.tsx + .css
│   ├── pages/
│   │   └── Placeholder.tsx           # "Đang phát triển" + dùng cho route chưa làm
│   └── router/
│       └── routes.tsx                # createBrowserRouter
└── tests/
    └── smoke.test.tsx                # render AppShell
```

> Mỗi plan module sau sẽ thêm seed/api/types-usage/pages của riêng nó. Foundation chỉ seed `sites` + `workers` (đủ để render shell và verify).

---

## Task 1: Scaffold Vite + React + TypeScript

**Files:**
- Create: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/tsconfig.node.json`, `frontend/vite.config.ts`, `frontend/index.html`, `frontend/.gitignore`, `frontend/.env`, `frontend/src/vite-env.d.ts`

- [ ] **Step 1: Tạo Vite project (React + TS)**

Run (trong `frontend/`):
```
npm create vite@latest . -- --template react-ts
```
Nếu hỏi ghi đè thư mục không trống → chọn "Ignore files and continue".

- [ ] **Step 2: Cài dependencies**

Run:
```
npm install @tanstack/react-query zustand react-router-dom @tabler/icons-react date-fns react-hook-form zod @hookform/resolvers @hello-pangea/dnd exceljs
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @types/node
```

- [ ] **Step 3: Cấu hình path alias `@/` trong `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
})
```

- [ ] **Step 4: Alias trong `tsconfig.json`** — thêm vào `compilerOptions`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

- [ ] **Step 5: Tạo `frontend/.env`**

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK=true
```

- [ ] **Step 6: Tạo `tests/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Thêm scripts vào `package.json`** (`"scripts"`):

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run"
}
```

- [ ] **Step 8: Verify dev server chạy**

Run: `npm run dev`
Expected: Vite in ra `Local: http://localhost:5173/`, mở trình duyệt thấy trang Vite mặc định, không lỗi terminal. Dừng server (Ctrl+C).

- [ ] **Step 9: Commit**

```
git add frontend
git commit -m "chore(prototype): scaffold Vite + React + TS with deps and alias"
```

---

## Task 2: Design tokens + global CSS

**Files:**
- Create: `frontend/src/styles/tokens.css` (copy từ `design/tokens.css`)
- Create: `frontend/src/styles/global.css`
- Modify: `frontend/src/main.tsx` (import global.css)
- Delete: `frontend/src/App.css`, `frontend/src/index.css` (file mặc định Vite, nếu có)

- [ ] **Step 1: Copy tokens**

Copy toàn bộ nội dung `design/tokens.css` (ở repo root) vào `frontend/src/styles/tokens.css`. Không sửa.

- [ ] **Step 2: Tạo `global.css`**

```css
@import './tokens.css';

* { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; }

body {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }
button { font-family: inherit; cursor: pointer; }
input, select, textarea { font-family: inherit; }

/* Print: chỉ giữ vùng .print-area, ẩn phần no-print */
@media print {
  .no-print { display: none !important; }
}
```

- [ ] **Step 3: Cập nhật `main.tsx`** — bỏ import css mặc định, thêm:

```tsx
import './styles/global.css'
```
Xóa file `src/App.css` và `src/index.css` nếu Vite tạo, và bỏ mọi import của chúng.

- [ ] **Step 4: Verify**

Run: `npm run dev` → nền trang đổi sang xám nhạt (`--color-bg #F1F5F9`), font Inter (nếu mạng tải được). Không lỗi console.

- [ ] **Step 5: Commit**

```
git add frontend/src/styles frontend/src/main.tsx
git commit -m "feat(prototype): add design tokens and global vanilla CSS"
```

---

## Task 3: Types (source of truth)

**Files:**
- Create: `frontend/src/types/index.ts` (copy từ `context/types.ts`)

- [ ] **Step 1: Copy types**

Copy toàn bộ `context/types.ts` (đã đồng bộ spec v2.0, gồm Customer/Project/Quote...) vào `frontend/src/types/index.ts`. Sửa dòng comment đầu thành `// WorkShop Pro — Type Definitions (prototype)`.

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: không lỗi.

- [ ] **Step 3: Commit**

```
git add frontend/src/types
git commit -m "feat(prototype): add shared TypeScript types from spec v2.0"
```

---

## Task 4: Utils — format (TDD)

**Files:**
- Create: `frontend/src/utils/format.ts`
- Test: `frontend/tests/format.test.ts`

- [ ] **Step 1: Viết test fail**

```ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatHours } from '@/utils/format'

describe('format', () => {
  it('formatCurrency: VND không phần lẻ', () => {
    expect(formatCurrency(7280000)).toBe('7.280.000 ₫')
  })
  it('formatDate: ISO -> DD/MM/YYYY', () => {
    expect(formatDate('2026-06-14')).toBe('14/06/2026')
  })
  it('formatHours: giờ + phút', () => {
    expect(formatHours(8.5)).toBe('8h 30m')
    expect(formatHours(8)).toBe('8h')
  })
})
```

- [ ] **Step 2: Chạy test để chắc fail**

Run: `npx vitest run tests/format.test.ts`
Expected: FAIL (module chưa tồn tại).

- [ ] **Step 3: Implement**

```ts
// src/utils/format.ts
import { format, parseISO } from 'date-fns'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return format(parseISO(iso), 'dd/MM/yyyy')
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}
```

> Lưu ý: `Intl` vi-VN dùng dấu chấm ngăn cách nghìn và ký tự `₫`. Nếu môi trường test cho ra non-breaking space, chỉnh assertion cho khớp output thực tế khi chạy lần đầu.

- [ ] **Step 4: Chạy test pass**

Run: `npx vitest run tests/format.test.ts`
Expected: PASS (nếu khác về khoảng trắng/ký tự tiền tệ, sửa assertion theo output thật rồi chạy lại).

- [ ] **Step 5: Commit**

```
git add frontend/src/utils/format.ts frontend/tests/format.test.ts
git commit -m "feat(prototype): add vi-VN format utils with tests"
```

---

## Task 5: Utils — pay-calculator (TDD)

**Files:**
- Create: `frontend/src/utils/pay-calculator.ts`
- Test: `frontend/tests/pay-calculator.test.ts`
- Reference: `skills/pay-calculator.skill.ts` (repo root) + spec Module 3.4

- [ ] **Step 1: Viết test fail**

```ts
import { describe, it, expect } from 'vitest'
import { estimateMonthlyPay, calculateDayPay } from '@/utils/pay-calculator'

describe('pay-calculator', () => {
  it('hourly: ước tính tháng = rate × 8 × 26', () => {
    expect(estimateMonthlyPay({ contractType: 'hourly', rateNormal: 35000 }))
      .toBe(35000 * 8 * 26)
  })
  it('daily: ước tính tháng = rate × 26', () => {
    expect(estimateMonthlyPay({ contractType: 'daily', rateNormal: 300000 }))
      .toBe(300000 * 26)
  })
  it('monthly: base + allowance', () => {
    expect(estimateMonthlyPay({ contractType: 'monthly', baseSalary: 8000000, allowance: 500000 }))
      .toBe(8500000)
  })
  it('calculateDayPay hourly: giờ thường + OT', () => {
    expect(calculateDayPay({
      contractType: 'hourly', regularHours: 8, overtimeHours: 2,
      rateNormal: 35000, rateOvertime: 52500,
    })).toBe(8 * 35000 + 2 * 52500)
  })
})
```

- [ ] **Step 2: Chạy để fail**

Run: `npx vitest run tests/pay-calculator.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/utils/pay-calculator.ts
import type { ContractType } from '@/types'

const WORKDAYS = 26
const HOURS_PER_DAY = 8

export interface EstimateInput {
  contractType: ContractType
  rateNormal?: number
  baseSalary?: number
  allowance?: number
  ratePerUnit?: number
}

/** Ước tính lương tháng để preview trong form hợp đồng. */
export function estimateMonthlyPay(i: EstimateInput): number {
  switch (i.contractType) {
    case 'hourly': return (i.rateNormal ?? 0) * HOURS_PER_DAY * WORKDAYS
    case 'daily':  return (i.rateNormal ?? 0) * WORKDAYS
    case 'monthly': return (i.baseSalary ?? 0) + (i.allowance ?? 0)
    case 'piece':  return 0 // phụ thuộc sản lượng — không ước tính
  }
}

export interface DayPayInput {
  contractType: ContractType
  regularHours: number
  overtimeHours: number
  rateNormal?: number
  rateOvertime?: number
}

/** Tính lương 1 ngày từ giờ công (dùng ở Chấm công). */
export function calculateDayPay(i: DayPayInput): number {
  switch (i.contractType) {
    case 'hourly':
      return i.regularHours * (i.rateNormal ?? 0) + i.overtimeHours * (i.rateOvertime ?? 0)
    case 'daily':
      return Math.ceil(i.regularHours / HOURS_PER_DAY) * (i.rateNormal ?? 0)
    default:
      return 0
  }
}
```

- [ ] **Step 4: Chạy test pass**

Run: `npx vitest run tests/pay-calculator.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```
git add frontend/src/utils/pay-calculator.ts frontend/tests/pay-calculator.test.ts
git commit -m "feat(prototype): add pay-calculator util with tests"
```

---

## Task 6: Mock API client (TDD)

**Files:**
- Create: `frontend/src/api/client.ts`
- Test: `frontend/tests/client.test.ts`

- [ ] **Step 1: Viết test fail**

```ts
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
```

- [ ] **Step 2: Chạy để fail**

Run: `npx vitest run tests/client.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/api/client.ts
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
```

- [ ] **Step 4: Chạy test pass**

Run: `npx vitest run tests/client.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```
git add frontend/src/api/client.ts frontend/tests/client.test.ts
git commit -m "feat(prototype): add mock request layer with deep-clone isolation"
```

---

## Task 7: Mock store + seed (sites, workers)

**Files:**
- Create: `frontend/src/mocks/seed/sites.ts`
- Create: `frontend/src/mocks/seed/workers.ts`
- Create: `frontend/src/mocks/db.ts`

- [ ] **Step 1: Seed sites**

```ts
// src/mocks/seed/sites.ts
import type { Site } from '@/types'

export const seedSites: Site[] = [
  {
    id: 'site-1', code: 'XHN001', name: 'Xưởng Cơ khí Hà Nội', type: 'factory',
    industrialZone: 'KCN Thăng Long', address: 'Lô A1, KCN Thăng Long, Đông Anh',
    city: 'Hà Nội', managerId: null, phone: '0241234567', areaM2: 1200,
    status: 'active', notes: null,
    createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z',
    workerCount: 12, projectCount: 3,
  },
  {
    id: 'site-2', code: 'XHN002', name: 'Xưởng Nội thất Long Biên', type: 'factory',
    industrialZone: null, address: 'Số 5 Ngõ 100 Nguyễn Văn Cừ, Long Biên',
    city: 'Hà Nội', managerId: null, phone: '0249876543', areaM2: 800,
    status: 'active', notes: null,
    createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z',
    workerCount: 8, projectCount: 2,
  },
  {
    id: 'site-3', code: 'CTSG001', name: 'Công trường Aeon Bình Tân', type: 'construction',
    industrialZone: null, address: 'Aeon Mall Bình Tân, TP.HCM',
    city: 'TP.HCM', managerId: null, phone: '0281122334', areaM2: null,
    status: 'preparing', notes: null,
    createdAt: '2026-03-15T00:00:00Z', updatedAt: '2026-03-15T00:00:00Z',
    workerCount: 0, projectCount: 1,
  },
]
```

- [ ] **Step 2: Seed workers** (kèm activeContract)

```ts
// src/mocks/seed/workers.ts
import type { Worker } from '@/types'

export const seedWorkers: Worker[] = [
  {
    id: 'w-1', code: 'CN001', fullName: 'Nguyễn Văn Hùng', gender: 'male',
    dateOfBirth: '1990-05-12', idNumber: '001090012345', phone: '0901234567',
    address: 'Đông Anh, Hà Nội', siteId: 'site-1', primarySkill: 'welding_tig',
    experienceYears: 8, status: 'working', notes: null,
    createdAt: '2026-01-12T00:00:00Z', updatedAt: '2026-01-12T00:00:00Z',
    initials: 'NH', avatarColor: '#1D4ED8',
    site: { id: 'site-1', name: 'Xưởng Cơ khí Hà Nội' },
    activeContract: {
      id: 'c-1', workerId: 'w-1', contractType: 'hourly', startDate: '2026-01-12',
      endDate: null, rateNormal: 45000, rateOvertime: 67500, baseSalary: null,
      allowance: null, ratePerUnit: null, unitName: null, isActive: true,
      createdAt: '2026-01-12T00:00:00Z', updatedAt: '2026-01-12T00:00:00Z',
    },
  },
  {
    id: 'w-2', code: 'CN002', fullName: 'Trần Thị Mai', gender: 'female',
    dateOfBirth: '1995-09-03', idNumber: '001195067890', phone: '0912345678',
    address: 'Long Biên, Hà Nội', siteId: 'site-2', primarySkill: 'painting',
    experienceYears: 4, status: 'working', notes: null,
    createdAt: '2026-02-02T00:00:00Z', updatedAt: '2026-02-02T00:00:00Z',
    initials: 'TM', avatarColor: '#16A34A',
    site: { id: 'site-2', name: 'Xưởng Nội thất Long Biên' },
    activeContract: {
      id: 'c-2', workerId: 'w-2', contractType: 'monthly', startDate: '2026-02-02',
      endDate: null, rateNormal: null, rateOvertime: null, baseSalary: 9000000,
      allowance: 800000, ratePerUnit: null, unitName: null, isActive: true,
      createdAt: '2026-02-02T00:00:00Z', updatedAt: '2026-02-02T00:00:00Z',
    },
  },
  {
    id: 'w-3', code: 'CN003', fullName: 'Lê Văn Tâm', gender: 'male',
    dateOfBirth: '1988-12-20', idNumber: '001088054321', phone: '0987654321',
    address: 'Gia Lâm, Hà Nội', siteId: 'site-1', primarySkill: 'cnc_cutting',
    experienceYears: 10, status: 'on_leave', notes: 'Nghỉ phép năm',
    createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z',
    initials: 'LT', avatarColor: '#D97706',
    site: { id: 'site-1', name: 'Xưởng Cơ khí Hà Nội' },
    activeContract: {
      id: 'c-3', workerId: 'w-3', contractType: 'daily', startDate: '2026-01-15',
      endDate: null, rateNormal: 400000, rateOvertime: 75000, baseSalary: null,
      allowance: null, ratePerUnit: null, unitName: null, isActive: true,
      createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z',
    },
  },
]
```

- [ ] **Step 3: Tạo `db.ts`** (store mutable; module sau sẽ thêm mảng của mình)

```ts
// src/mocks/db.ts
// In-memory store cho prototype. Mutable: mutations trong src/api/* sửa thẳng vào đây.
import type { Site, Worker } from '@/types'
import { seedSites } from './seed/sites'
import { seedWorkers } from './seed/workers'

export const db = {
  sites:   structuredClone(seedSites)   as Site[],
  workers: structuredClone(seedWorkers) as Worker[],
  // Các module sau bổ sung: customers, customerContacts, projects, quotes,
  // quoteItems, quotePaymentSteps, tasks, taskAssignments, timesheetEntries
}

/** Sinh id giả tăng dần theo prefix (thay cho UUID DB). */
let counter = 1000
export function nextId(prefix: string): string {
  counter += 1
  return `${prefix}-${counter}`
}
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: không lỗi.

- [ ] **Step 5: Commit**

```
git add frontend/src/mocks
git commit -m "feat(prototype): add in-memory mock store with sites and workers seed"
```

---

## Task 8: sites API hook (đọc-only)

**Files:**
- Create: `frontend/src/api/sites.ts`

- [ ] **Step 1: Implement hook**

```ts
// src/api/sites.ts
import { useQuery } from '@tanstack/react-query'
import { mockRequest } from './client'
import { db } from '@/mocks/db'
import type { Site } from '@/types'

export function useSites() {
  return useQuery<Site[]>({
    queryKey: ['sites'],
    queryFn: () => mockRequest(() => db.sites),
  })
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: không lỗi (component dùng hook ở Task 12).

- [ ] **Step 3: Commit**

```
git add frontend/src/api/sites.ts
git commit -m "feat(prototype): add sites query hook"
```

---

## Task 9: Zustand stores (app + toast)

**Files:**
- Create: `frontend/src/stores/appStore.ts`
- Create: `frontend/src/stores/toastStore.ts`

- [ ] **Step 1: appStore**

```ts
// src/stores/appStore.ts
import { create } from 'zustand'

interface MockUser { fullName: string; role: string; initials: string }

interface AppState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  user: MockUser
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  user: { fullName: 'Mai Văn Hải', role: 'Quản lý xưởng', initials: 'MH' },
}))
```

- [ ] **Step 2: toastStore**

```ts
// src/stores/toastStore.ts
import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'
interface ToastState {
  message: string | null
  type: ToastType
  show: (message: string, type?: ToastType) => void
  hide: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'success',
  show: (message, type = 'success') => {
    set({ message, type })
    setTimeout(() => set({ message: null }), 3000)
  },
  hide: () => set({ message: null }),
}))
```

- [ ] **Step 3: Verify typecheck** — `npx tsc --noEmit` → không lỗi.

- [ ] **Step 4: Commit**

```
git add frontend/src/stores
git commit -m "feat(prototype): add app and toast zustand stores"
```

---

## Task 10: UI components — nhóm hiển thị (Badge, Button, KpiCard, ProgressBar, AvatarStack, LoadingSkeleton)

> Mỗi component = 1 file `.tsx` + 1 file `.css` cùng tên. Interface theo `design/component-library.md`. Verify bằng cách import vào trang demo ở Task 13 + smoke test Task 14.

**Files:** Create `frontend/src/components/ui/{Badge,Button,KpiCard,ProgressBar,AvatarStack,LoadingSkeleton}.{tsx,css}`

- [ ] **Step 1: Badge**

```tsx
// Badge.tsx
import './Badge.css'
export type BadgeVariant = 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'gray'
interface BadgeProps { variant: BadgeVariant; children: React.ReactNode; dot?: boolean }
export function Badge({ variant, children, dot }: BadgeProps) {
  return (
    <span className={`badge badge--${variant}`}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  )
}
```
```css
/* Badge.css */
.badge { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px;
  font-size: 10px; font-weight: 600; border-radius: var(--radius-pill); line-height: 1.6; }
.badge__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.badge--green  { background: var(--color-green-light);  color: var(--color-green-text); }
.badge--blue   { background: var(--color-blue-light);   color: var(--color-blue-text); }
.badge--amber  { background: var(--color-amber-light);  color: var(--color-amber-text); }
.badge--red    { background: var(--color-red-light);    color: var(--color-red-text); }
.badge--purple { background: var(--color-purple-light); color: var(--color-purple-text); }
.badge--gray   { background: var(--color-surface-2);    color: var(--color-text-2); }
```

- [ ] **Step 2: Button**

```tsx
// Button.tsx
import './Button.css'
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'default' | 'danger'
  size?: 'md' | 'sm'
  icon?: React.ReactNode
}
export function Button({ variant = 'default', size = 'md', icon, children, className = '', ...rest }: ButtonProps) {
  return (
    <button className={`btn btn--${variant} btn--${size} ${className}`} {...rest}>
      {icon}{children}
    </button>
  )
}
```
```css
/* Button.css */
.btn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--color-border);
  background: var(--color-surface); color: var(--color-text); border-radius: var(--radius-sm);
  transition: background 120ms; white-space: nowrap; }
.btn--md { padding: 6px 14px; font-size: 12px; font-weight: 500; }
.btn--sm { padding: 4px 10px; font-size: 11px; font-weight: 500; }
.btn:hover { background: var(--color-surface-2); }
.btn--primary { background: var(--color-blue); color: #fff; border-color: var(--color-blue); }
.btn--primary:hover { background: var(--color-blue-text); }
.btn--danger { background: var(--color-red-light); color: var(--color-red); border-color: #FCA5A5; }
.btn--danger:hover { background: #FDD; }
.btn:disabled { opacity: .55; cursor: not-allowed; }
```

- [ ] **Step 3: KpiCard**

```tsx
// KpiCard.tsx
import './KpiCard.css'
interface KpiCardProps {
  label: string; value: string | number; icon?: React.ReactNode
  iconColor?: string; change?: string; changeType?: 'up' | 'down' | 'neutral'
}
export function KpiCard({ label, value, icon, iconColor, change, changeType = 'neutral' }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-card__top">
        <span className="kpi-card__label">{label}</span>
        {icon && <span className="kpi-card__icon" style={{ color: iconColor }}>{icon}</span>}
      </div>
      <div className="kpi-card__value">{value}</div>
      {change && <div className={`kpi-card__change kpi-card__change--${changeType}`}>{change}</div>}
    </div>
  )
}
```
```css
/* KpiCard.css */
.kpi-card { background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: 14px 16px; }
.kpi-card__top { display: flex; justify-content: space-between; align-items: center; }
.kpi-card__label { font-size: 11px; color: var(--color-text-3); }
.kpi-card__icon { font-size: 14px; display: inline-flex; }
.kpi-card__value { font-size: 22px; font-weight: 600; margin-top: 6px; }
.kpi-card__change { font-size: 11px; margin-top: 2px; }
.kpi-card__change--up { color: var(--color-green); }
.kpi-card__change--down { color: var(--color-red); }
.kpi-card__change--neutral { color: var(--color-text-3); }
```

- [ ] **Step 4: ProgressBar**

```tsx
// ProgressBar.tsx
import './ProgressBar.css'
interface ProgressBarProps { value: number; color?: string; showLabel?: boolean; size?: 'sm' | 'md' }
export function ProgressBar({ value, color = 'var(--color-blue)', showLabel, size = 'md' }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={`progress progress--${size}`}>
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      {showLabel && <span className="progress__label">{pct}%</span>}
    </div>
  )
}
```
```css
/* ProgressBar.css */
.progress { display: flex; align-items: center; gap: 8px; }
.progress__track { flex: 1; background: var(--color-surface-2); border-radius: var(--radius-pill); overflow: hidden; }
.progress--md .progress__track { height: 8px; }
.progress--sm .progress__track { height: 6px; }
.progress__fill { height: 100%; border-radius: var(--radius-pill); transition: width 200ms; }
.progress__label { font-size: 11px; color: var(--color-text-2); min-width: 32px; text-align: right; }
```

- [ ] **Step 5: AvatarStack**

```tsx
// AvatarStack.tsx
import './AvatarStack.css'
interface AvatarItem { initials: string; color: string; name?: string }
interface AvatarStackProps { items: AvatarItem[]; max?: number; size?: 'sm' | 'md' }
export function AvatarStack({ items, max = 3, size = 'md' }: AvatarStackProps) {
  const shown = items.slice(0, max)
  const rest = items.length - shown.length
  return (
    <div className={`avatars avatars--${size}`}>
      {shown.map((a, i) => (
        <span key={i} className="avatars__item" style={{ background: a.color }} title={a.name}>{a.initials}</span>
      ))}
      {rest > 0 && <span className="avatars__item avatars__more">+{rest}</span>}
    </div>
  )
}
```
```css
/* AvatarStack.css */
.avatars { display: inline-flex; }
.avatars__item { display: inline-flex; align-items: center; justify-content: center; color: #fff;
  border: 2px solid var(--color-surface); border-radius: 50%; font-weight: 600; margin-left: -6px; }
.avatars__item:first-child { margin-left: 0; }
.avatars--md .avatars__item { width: 28px; height: 28px; font-size: 10px; }
.avatars--sm .avatars__item { width: 22px; height: 22px; font-size: 9px; }
.avatars__more { background: var(--color-surface-2); color: var(--color-text-2); }
```

- [ ] **Step 6: LoadingSkeleton**

```tsx
// LoadingSkeleton.tsx
import './LoadingSkeleton.css'
interface LoadingSkeletonProps { rows?: number; columns?: number }
export function LoadingSkeleton({ rows = 3, columns = 4 }: LoadingSkeletonProps) {
  return (
    <div className="skeleton">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton__row">
          {Array.from({ length: columns }).map((_, c) => <div key={c} className="skeleton__cell" />)}
        </div>
      ))}
    </div>
  )
}
```
```css
/* LoadingSkeleton.css */
.skeleton { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; }
.skeleton__row { display: flex; gap: 12px; }
.skeleton__cell { flex: 1; height: 14px; border-radius: var(--radius-sm);
  background: linear-gradient(90deg, var(--color-surface-2) 25%, #eef2f7 37%, var(--color-surface-2) 63%);
  background-size: 400% 100%; animation: skeleton-shine 1.4s ease infinite; }
@keyframes skeleton-shine { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
```

- [ ] **Step 7: Verify typecheck** — `npx tsc --noEmit` → không lỗi.

- [ ] **Step 8: Commit**

```
git add frontend/src/components/ui
git commit -m "feat(prototype): add display UI components (Badge, Button, KpiCard, ProgressBar, AvatarStack, Skeleton)"
```

---

## Task 11: UI components — nhóm input & overlay (SearchBox, FilterSelect, FormField, DataTable, FormModal, DetailDrawer, ConfirmDialog, Toast)

**Files:** Create `frontend/src/components/ui/{SearchBox,FilterSelect,FormField,DataTable,FormModal,DetailDrawer,ConfirmDialog,Toast}.{tsx,css}`

- [ ] **Step 1: SearchBox**

```tsx
// SearchBox.tsx
import { IconSearch } from '@tabler/icons-react'
import './SearchBox.css'
interface SearchBoxProps { value: string; onChange: (v: string) => void; placeholder?: string; width?: string }
export function SearchBox({ value, onChange, placeholder = 'Tìm kiếm...', width }: SearchBoxProps) {
  return (
    <div className="searchbox" style={{ width }}>
      <IconSearch size={15} className="searchbox__icon" />
      <input className="searchbox__input" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
```
```css
/* SearchBox.css */
.searchbox { position: relative; display: inline-flex; align-items: center; }
.searchbox__icon { position: absolute; left: 9px; color: var(--color-text-3); }
.searchbox__input { height: 32px; padding: 7px 10px 7px 30px; font-size: 12px; width: 100%;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm); outline: none; background: var(--color-surface); }
.searchbox__input:focus { border-color: var(--color-border-focus); }
```

- [ ] **Step 2: FilterSelect**

```tsx
// FilterSelect.tsx
import './FilterSelect.css'
interface Opt { value: string; label: string }
interface FilterSelectProps { options: Opt[]; value: string; onChange: (v: string) => void; placeholder?: string; width?: string }
export function FilterSelect({ options, value, onChange, placeholder, width }: FilterSelectProps) {
  return (
    <select className="filter-select" style={{ width }} value={value} onChange={(e) => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
```
```css
/* FilterSelect.css */
.filter-select { height: 32px; padding: 6px 10px; font-size: 12px; background: var(--color-surface);
  border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text); outline: none; }
.filter-select:focus { border-color: var(--color-border-focus); }
```

- [ ] **Step 3: FormField**

```tsx
// FormField.tsx
import './FormField.css'
interface FormFieldProps { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }
export function FormField({ label, required, error, hint, children }: FormFieldProps) {
  return (
    <div className="field">
      <label className="field__label">{label}{required && <span className="field__req">*</span>}</label>
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </div>
  )
}
```
```css
/* FormField.css */
.field { display: flex; flex-direction: column; gap: 4px; }
.field__label { font-size: 11px; font-weight: 600; color: var(--color-text-2); }
.field__req { color: var(--color-red); margin-left: 2px; }
.field__hint { font-size: 10px; color: var(--color-text-3); }
.field__error { font-size: 10px; color: var(--color-red); }
.field input, .field select, .field textarea { height: 32px; padding: 7px 10px; font-size: 12px;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm); outline: none; width: 100%; background: var(--color-surface); }
.field textarea { height: auto; min-height: 64px; resize: vertical; }
.field input:focus, .field select:focus, .field textarea:focus { border-color: var(--color-border-focus); }
```

- [ ] **Step 4: DataTable** (generic)

```tsx
// DataTable.tsx
import './DataTable.css'
import { LoadingSkeleton } from './LoadingSkeleton'
export interface Column<T> {
  key: string; header: string; width?: string; align?: 'left' | 'right' | 'center'
  render?: (row: T) => React.ReactNode
}
interface DataTableProps<T> {
  columns: Column<T>[]; data: T[]; loading?: boolean
  onRowClick?: (row: T) => void; emptyText?: string; rowKey: (row: T) => string
}
export function DataTable<T>({ columns, data, loading, onRowClick, emptyText = 'Chưa có dữ liệu', rowKey }: DataTableProps<T>) {
  return (
    <div className="dtable__wrap">
      <table className="dtable">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} style={{ width: c.width, textAlign: c.align }}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length}><LoadingSkeleton rows={3} columns={columns.length} /></td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} className="dtable__empty">{emptyText}</td></tr>
          ) : data.map((row) => (
            <tr key={rowKey(row)} className={onRowClick ? 'dtable__row--click' : ''} onClick={() => onRowClick?.(row)}>
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align }}>
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```
```css
/* DataTable.css */
.dtable__wrap { overflow-x: auto; background: var(--color-surface);
  border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
.dtable { width: 100%; border-collapse: collapse; }
.dtable th { position: sticky; top: 0; background: var(--color-surface-2); text-align: left;
  font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-text-3);
  padding: 10px 14px; border-bottom: 1px solid var(--color-border); }
.dtable td { padding: 10px 14px; font-size: 12px; color: var(--color-text-2); border-bottom: 1px solid var(--color-border); }
.dtable__row--click { cursor: pointer; }
.dtable tbody tr:hover { background: #F8FBFF; }
.dtable__empty { text-align: center; color: var(--color-text-3); padding: 28px; }
```

- [ ] **Step 5: FormModal**

```tsx
// FormModal.tsx
import { IconX } from '@tabler/icons-react'
import './FormModal.css'
interface FormModalProps {
  open: boolean; onClose: () => void; title: string; icon?: React.ReactNode
  size?: 'md' | 'lg'; children: React.ReactNode; footer?: React.ReactNode
}
export function FormModal({ open, onClose, title, icon, size = 'md', children, footer }: FormModalProps) {
  if (!open) return null
  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className={`modal modal--${size}`} onClick={(e) => e.stopPropagation()}>
        <header className="modal__header">
          <span className="modal__title">{icon}{title}</span>
          <button className="modal__close" onClick={onClose} aria-label="Đóng"><IconX size={18} /></button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  )
}
```
```css
/* FormModal.css */
.modal__overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); display: flex;
  align-items: flex-start; justify-content: center; padding-top: 6vh; z-index: 50; animation: fade-in 200ms ease; }
.modal { background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-modal);
  display: flex; flex-direction: column; max-height: 84vh; animation: modal-in 200ms ease; }
.modal--md { width: var(--modal-w); } .modal--lg { width: var(--modal-lg-w); }
.modal__header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--color-border); }
.modal__title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; }
.modal__close { border: none; background: none; color: var(--color-text-3); display: inline-flex; }
.modal__body { padding: 20px; overflow-y: auto; }
.modal__footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--color-border); }
@keyframes modal-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
```

- [ ] **Step 6: DetailDrawer**

```tsx
// DetailDrawer.tsx
import { IconX } from '@tabler/icons-react'
import './DetailDrawer.css'
interface DetailDrawerProps {
  open: boolean; onClose: () => void; title: string
  children: React.ReactNode; actions?: React.ReactNode; width?: 'sm' | 'md'
}
export function DetailDrawer({ open, onClose, title, children, actions, width = 'md' }: DetailDrawerProps) {
  if (!open) return null
  return (
    <div className="drawer__overlay" onClick={onClose}>
      <aside className={`drawer drawer--${width}`} onClick={(e) => e.stopPropagation()}>
        <header className="drawer__header">
          <span className="drawer__title">{title}</span>
          <button className="drawer__close" onClick={onClose} aria-label="Đóng"><IconX size={18} /></button>
        </header>
        <div className="drawer__body">{children}</div>
        {actions && <footer className="drawer__footer">{actions}</footer>}
      </aside>
    </div>
  )
}
```
```css
/* DetailDrawer.css */
.drawer__overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.3); z-index: 50; }
.drawer { position: fixed; top: 0; right: 0; height: 100%; background: var(--color-surface);
  box-shadow: var(--shadow-drawer); display: flex; flex-direction: column; animation: drawer-in 250ms cubic-bezier(.4,0,.2,1); }
.drawer--md { width: var(--drawer-w); } .drawer--sm { width: var(--drawer-sm-w); }
.drawer__header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--color-border); }
.drawer__title { font-size: 15px; font-weight: 600; }
.drawer__close { border: none; background: none; color: var(--color-text-3); display: inline-flex; }
.drawer__body { padding: 20px; overflow-y: auto; flex: 1; }
.drawer__footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--color-border); }
@keyframes drawer-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
```

- [ ] **Step 7: ConfirmDialog**

```tsx
// ConfirmDialog.tsx
import './ConfirmDialog.css'
import { Button } from './Button'
interface ConfirmDialogProps {
  open: boolean; title: string; message: string; confirmLabel?: string
  variant?: 'danger' | 'default'; onConfirm: () => void; onCancel: () => void
}
export function ConfirmDialog({ open, title, message, confirmLabel = 'Xác nhận', variant = 'default', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="confirm__overlay" onClick={onCancel}>
      <div className="confirm" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm__title">{title}</h3>
        <p className="confirm__msg">{message}</p>
        <div className="confirm__actions">
          <Button onClick={onCancel}>Hủy</Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
```
```css
/* ConfirmDialog.css */
.confirm__overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); display: flex;
  align-items: center; justify-content: center; z-index: 60; }
.confirm { background: var(--color-surface); border-radius: var(--radius-lg); padding: 20px; width: 380px; box-shadow: var(--shadow-modal); }
.confirm__title { margin: 0 0 8px; font-size: 15px; }
.confirm__msg { margin: 0 0 16px; font-size: 12px; color: var(--color-text-2); }
.confirm__actions { display: flex; justify-content: flex-end; gap: 8px; }
```

- [ ] **Step 8: Toast** (đọc từ toastStore)

```tsx
// Toast.tsx
import { IconCheck, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'
import { useToastStore } from '@/stores/toastStore'
import './Toast.css'
export function Toast() {
  const { message, type } = useToastStore()
  if (!message) return null
  const Icon = type === 'success' ? IconCheck : type === 'error' ? IconAlertTriangle : IconInfoCircle
  return (
    <div className={`toast toast--${type}`}>
      <Icon size={16} /><span>{message}</span>
    </div>
  )
}
```
```css
/* Toast.css */
.toast { position: fixed; bottom: 20px; right: 20px; display: flex; align-items: center; gap: 8px;
  background: var(--color-surface); border: 1px solid var(--color-border); border-left: 3px solid var(--color-green);
  border-radius: var(--radius-md); padding: 10px 14px; font-size: 12px; box-shadow: var(--shadow-modal);
  z-index: 70; animation: toast-in 200ms ease; }
.toast--success { border-left-color: var(--color-green); color: var(--color-green-text); }
.toast--error { border-left-color: var(--color-red); color: var(--color-red-text); }
.toast--info { border-left-color: var(--color-blue); color: var(--color-blue-text); }
@keyframes toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
```

- [ ] **Step 9: Verify typecheck** — `npx tsc --noEmit` → không lỗi.

- [ ] **Step 10: Commit**

```
git add frontend/src/components/ui
git commit -m "feat(prototype): add input and overlay UI components (table, modal, drawer, toast, etc.)"
```

---

## Task 12: Layout — Sidebar, Topbar, AppShell

**Files:** Create `frontend/src/components/layout/{Sidebar,Topbar,AppShell}.{tsx,css}`

- [ ] **Step 1: Sidebar** — nav theo `prompts/build-prompts.md` PROMPT 03. Module chưa làm (dashboard/sites/report) vẫn hiện, link tới route placeholder.

```tsx
// Sidebar.tsx
import { NavLink } from 'react-router-dom'
import {
  IconLayoutDashboard, IconUsersGroup, IconBuildingFactory2, IconUsers,
  IconBuilding, IconFileInvoice, IconColumns, IconClock, IconChartBar,
} from '@tabler/icons-react'
import { useAppStore } from '@/stores/appStore'
import './Sidebar.css'

interface NavItem { to: string; label: string; icon: React.ReactNode; group: string; ready: boolean }
const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <IconLayoutDashboard size={17} />, group: 'Tổng quan', ready: false },
  { to: '/customers', label: 'Khách hàng', icon: <IconUsersGroup size={17} />, group: 'Quản lý', ready: true },
  { to: '/sites', label: 'Công trường / Xưởng', icon: <IconBuildingFactory2 size={17} />, group: 'Quản lý', ready: false },
  { to: '/workers', label: 'Công nhân', icon: <IconUsers size={17} />, group: 'Quản lý', ready: true },
  { to: '/projects', label: 'Dự án', icon: <IconBuilding size={17} />, group: 'Quản lý', ready: true },
  { to: '/quotes', label: 'Báo giá', icon: <IconFileInvoice size={17} />, group: 'Quản lý', ready: true },
  { to: '/assign', label: 'Giao việc', icon: <IconColumns size={17} />, group: 'Sản xuất', ready: true },
  { to: '/timesheet', label: 'Chấm công', icon: <IconClock size={17} />, group: 'Sản xuất', ready: true },
  { to: '/report', label: 'Hiệu suất', icon: <IconChartBar size={17} />, group: 'Báo cáo', ready: false },
]

export function Sidebar() {
  const { sidebarCollapsed, user } = useAppStore()
  const groups = [...new Set(NAV.map((n) => n.group))]
  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__brand">{sidebarCollapsed ? 'WS' : 'WorkShop Pro'}</div>
      <nav className="sidebar__nav">
        {groups.map((g) => (
          <div key={g} className="sidebar__group">
            {!sidebarCollapsed && <span className="sidebar__group-label">{g}</span>}
            {NAV.filter((n) => n.group === g).map((n) => (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) => `sidebar__item ${isActive ? 'sidebar__item--active' : ''} ${!n.ready ? 'sidebar__item--soon' : ''}`}
                title={n.label}>
                {n.icon}{!sidebarCollapsed && <span>{n.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar__user">
        <span className="sidebar__avatar">{user.initials}</span>
        {!sidebarCollapsed && <div><div className="sidebar__user-name">{user.fullName}</div><div className="sidebar__user-role">{user.role}</div></div>}
      </div>
    </aside>
  )
}
```
```css
/* Sidebar.css */
.sidebar { width: var(--sidebar-w); background: var(--sidebar-bg); color: var(--sidebar-text);
  display: flex; flex-direction: column; height: 100%; transition: width 200ms; flex-shrink: 0; }
.sidebar--collapsed { width: var(--sidebar-collapsed-w); }
.sidebar__brand { padding: 16px; font-weight: 600; color: #fff; font-size: 15px; }
.sidebar__nav { flex: 1; overflow-y: auto; padding: 4px 8px; }
.sidebar__group { margin-bottom: 12px; }
.sidebar__group-label { display: block; font-size: 10px; text-transform: uppercase; color: var(--sidebar-muted); padding: 6px 8px; }
.sidebar__item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: var(--radius-sm);
  color: var(--sidebar-text); font-size: 12px; min-height: 36px; }
.sidebar__item:hover { background: var(--sidebar-hover); }
.sidebar__item--active { background: var(--sidebar-active); color: #fff; }
.sidebar__item--soon { opacity: .5; }
.sidebar__user { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-top: 1px solid var(--sidebar-hover); }
.sidebar__avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--color-blue); color: #fff;
  display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0; }
.sidebar__user-name { font-size: 12px; color: #fff; } .sidebar__user-role { font-size: 10px; color: var(--sidebar-muted); }
```

- [ ] **Step 2: Topbar**

```tsx
// Topbar.tsx
import { IconMenu2, IconSearch, IconBell, IconChevronDown } from '@tabler/icons-react'
import { useAppStore } from '@/stores/appStore'
import './Topbar.css'
interface TopbarProps { title: string; subtitle?: string; actions?: React.ReactNode }
export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const { toggleSidebar, user } = useAppStore()
  return (
    <header className="topbar">
      <button className="topbar__menu" onClick={toggleSidebar} aria-label="Thu gọn menu"><IconMenu2 size={18} /></button>
      <div className="topbar__title">
        <span className="topbar__title-main">{title}</span>
        {subtitle && <span className="topbar__title-sub">· {subtitle}</span>}
      </div>
      <div className="topbar__right">
        {actions}
        <button className="topbar__icon" aria-label="Tìm kiếm"><IconSearch size={17} /></button>
        <button className="topbar__icon" aria-label="Thông báo"><IconBell size={17} /></button>
        <div className="topbar__user"><span className="topbar__avatar">{user.initials}</span><span className="topbar__role">{user.role}</span><IconChevronDown size={14} /></div>
      </div>
    </header>
  )
}
```
```css
/* Topbar.css */
.topbar { height: 52px; display: flex; align-items: center; gap: 12px; padding: 0 20px;
  background: var(--color-surface); border-bottom: 1px solid var(--color-border); flex-shrink: 0; }
.topbar__menu, .topbar__icon { border: none; background: none; color: var(--color-text-2); display: inline-flex; padding: 6px; border-radius: var(--radius-sm); }
.topbar__menu:hover, .topbar__icon:hover { background: var(--color-surface-2); }
.topbar__title-main { font-size: 15px; font-weight: 600; }
.topbar__title-sub { font-size: 12px; color: var(--color-text-3); margin-left: 6px; }
.topbar__right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.topbar__user { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border: 1px solid var(--color-border); border-radius: var(--radius-pill); }
.topbar__avatar { width: 24px; height: 24px; border-radius: 50%; background: var(--color-blue); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; }
.topbar__role { font-size: 11px; color: var(--color-text-2); }
```

- [ ] **Step 3: AppShell** (layout với `<Outlet/>`)

```tsx
// AppShell.tsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Toast } from '@/components/ui/Toast'
import './AppShell.css'
export function AppShell() {
  return (
    <div className="shell">
      <Sidebar />
      <main className="shell__main"><Outlet /></main>
      <Toast />
    </div>
  )
}
```
```css
/* AppShell.css */
.shell { display: flex; height: 100%; }
.shell__main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
```

- [ ] **Step 4: Verify typecheck** — `npx tsc --noEmit` → không lỗi.

- [ ] **Step 5: Commit**

```
git add frontend/src/components/layout
git commit -m "feat(prototype): add AppShell, Sidebar, Topbar layout"
```

---

## Task 13: Placeholder page + router + page wrapper

**Files:**
- Create: `frontend/src/pages/Placeholder.tsx` + `.css`
- Create: `frontend/src/components/layout/PageShell.tsx` + `.css` (wrapper Topbar + nội dung trang)
- Create: `frontend/src/router/routes.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: PageShell** — mỗi trang dùng để có Topbar + vùng nội dung scroll.

```tsx
// PageShell.tsx
import { Topbar } from './Topbar'
import './PageShell.css'
interface PageShellProps { title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode }
export function PageShell({ title, subtitle, actions, children }: PageShellProps) {
  return (
    <>
      <Topbar title={title} subtitle={subtitle} actions={actions} />
      <div className="page">{children}</div>
    </>
  )
}
```
```css
/* PageShell.css */
.page { flex: 1; overflow-y: auto; padding: 20px 24px; }
```

- [ ] **Step 2: Placeholder page**

```tsx
// Placeholder.tsx
import { PageShell } from '@/components/layout/PageShell'
import './Placeholder.css'
export default function Placeholder({ title }: { title: string }) {
  return (
    <PageShell title={title} subtitle="Đang phát triển">
      <div className="placeholder"><p>🚧 Module "{title}" sẽ được xây dựng ở phase sau.</p></div>
    </PageShell>
  )
}
```
```css
/* Placeholder.css */
.placeholder { display: flex; align-items: center; justify-content: center; height: 60vh; color: var(--color-text-3); font-size: 14px; }
```

- [ ] **Step 3: routes.tsx** — module core trỏ tạm về Placeholder; plan module sau sẽ thay bằng trang thật.

```tsx
// routes.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import Placeholder from '@/pages/Placeholder'

export const router = createBrowserRouter([
  {
    path: '/', element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/workers" replace /> },
      { path: 'dashboard', element: <Placeholder title="Dashboard" /> },
      { path: 'customers', element: <Placeholder title="Khách hàng" /> },
      { path: 'sites', element: <Placeholder title="Công trường / Xưởng" /> },
      { path: 'workers', element: <Placeholder title="Công nhân" /> },
      { path: 'projects', element: <Placeholder title="Dự án" /> },
      { path: 'quotes', element: <Placeholder title="Báo giá" /> },
      { path: 'quotes/:id/preview', element: <Placeholder title="Xem trước báo giá" /> },
      { path: 'assign', element: <Placeholder title="Giao việc Kanban" /> },
      { path: 'timesheet', element: <Placeholder title="Chấm công" /> },
      { path: 'report', element: <Placeholder title="Hiệu suất" /> },
    ],
  },
])
```

- [ ] **Step 4: main.tsx**

```tsx
// main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router/routes'
import './styles/global.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 30_000 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
```

- [ ] **Step 5: Verify trên trình duyệt**

Run: `npm run dev` → mở `http://localhost:5173`.
Expected:
- Redirect tới `/workers`, thấy Sidebar tối màu bên trái với các nhóm (Tổng quan/Quản lý/Sản xuất/Báo cáo), Topbar trắng phía trên.
- Click qua các mục nav → nội dung "Đang phát triển" đổi theo; mục active đổi nền xanh.
- Click nút menu (☰) trên Topbar → sidebar thu gọn còn icon.
- Không lỗi console.

- [ ] **Step 6: Commit**

```
git add frontend/src/pages frontend/src/router frontend/src/main.tsx frontend/src/components/layout/PageShell.tsx frontend/src/components/layout/PageShell.css
git commit -m "feat(prototype): wire router, page shell and placeholder pages"
```

---

## Task 14: Smoke test + final verify

**Files:**
- Create: `frontend/tests/smoke.test.tsx`

- [ ] **Step 1: Viết smoke test render Sidebar**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'

describe('Sidebar', () => {
  it('render các nhóm menu và mục Công nhân', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>)
    expect(screen.getByText('Công nhân')).toBeInTheDocument()
    expect(screen.getByText('Báo giá')).toBeInTheDocument()
    expect(screen.getByText('Sản xuất')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Chạy toàn bộ test**

Run: `npm run test`
Expected: tất cả test PASS (format, pay-calculator, client, smoke).

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit` rồi `npm run build`
Expected: build thành công, không lỗi type.

- [ ] **Step 4: Commit**

```
git add frontend/tests/smoke.test.tsx
git commit -m "test(prototype): add Sidebar smoke test"
```

---

## Self-Review Checklist (đã rà)

- **Spec coverage:** Foundation phủ mục 2 (stack), 3 (mock layer: client.ts/db.ts/seed), 4 (cấu trúc thư mục + routing + PageShell), 5 (tokens.css + bóc CSS — khởi tạo token, CSS chi tiết từng module ở plan sau), 6 bước 1–2 (foundation + App Shell + UI lib). 6 module nghiệp vụ = các plan riêng tiếp theo.
- **Placeholder scan:** Không có TODO/“xử lý sau” trong code steps — mọi component có code đầy đủ.
- **Type consistency:** `Column<T>` (DataTable) dùng `key/header/render`; `mockRequest` signature thống nhất giữa Task 6 và Task 8; `db` fields `sites/workers` khớp seed; store/hook tên thống nhất (`useAppStore`, `useToastStore`, `useSites`).
- **Known follow-ups (không phải placeholder):** routes core trỏ tạm `Placeholder` — plan module sẽ thay bằng trang thật; `db.ts` chỉ có sites/workers — plan module thêm entity của mình.
```
