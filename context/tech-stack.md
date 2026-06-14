# WorkShop Pro — Tech Stack
# File: context/tech-stack.md
# Load file này vào mọi agent session cùng với project-context.md

## Frontend

### Core
| Package | Version | Mục đích |
|---------|---------|----------|
| react + react-dom | 18.x | UI framework |
| typescript | 5.x | Type safety |
| vite | 5.x | Build tool, dev server |

### Routing & State
| Package | Mục đích |
|---------|----------|
| react-router-dom v6 | Client-side routing, BrowserRouter |
| @tanstack/react-query v5 | Server state, caching, mutations |
| zustand | Client-side global state (auth, kanban, toasts) |

### UI & Styling
| Package | Mục đích |
|---------|----------|
| Vanilla CSS | Plain CSS + CSS variables (design tokens: design/tokens.css) |
| @tabler/icons-react | Icons — outline variant only |
| autoprefixer + postcss | PostCSS pipeline |

### Forms & Validation
| Package | Mục đích |
|---------|----------|
| react-hook-form | Form state management |
| zod | Schema validation |
| @hookform/resolvers | Bridge react-hook-form ↔ zod |

### Drag & Drop
| Package | Mục đích |
|---------|----------|
| @hello-pangea/dnd | Kanban drag-drop (maintained fork của react-beautiful-dnd) |

### HTTP & Utils
| Package | Mục đích |
|---------|----------|
| axios | HTTP client với interceptors |
| date-fns | Date formatting/manipulation |
| exceljs | Excel export (chấm công) |

---

## Backend

### Core
| Package | Mục đích |
|---------|----------|
| NestJS (latest) | Backend framework |
| TypeORM | ORM |
| MariaDB (MySQL driver) | Database |

### Auth & Security
| Package | Mục đích |
|---------|----------|
| @nestjs/jwt | JWT generation & validation |
| @nestjs/passport + passport-jwt | JWT strategy |
| bcrypt | Password hashing (saltRounds=12) |
| class-validator + class-transformer | DTO validation |

### Realtime & Infra
| Package | Mục đích |
|---------|----------|
| @nestjs/websockets + socket.io | Kanban realtime updates |
| @nestjs/swagger | API documentation |
| Redis | Session / refresh token store |

---

## Path Aliases (Frontend)

```typescript
// vite.config.ts + tsconfig.json
'@/' → 'src/'

// Ví dụ
import { Badge } from '@/components/ui/Badge'
import type { Worker } from '@/types/worker'
import { useWorkers } from '@/api/workers'
import { calculatePay } from '@/utils/pay-calculator'
```

---

## Coding Conventions

### Import Order (Frontend)
```typescript
// 1. React
import { useState, useCallback } from 'react'
// 2. External libs (alphabetical)
import { IconEdit } from '@tabler/icons-react'
// 3. Internal types
import type { Worker } from '@/types/worker'
// 4. Internal components
import { Badge } from '@/components/ui/Badge'
// 5. Internal hooks/utils
import { useWorkers } from '@/api/workers'
```

### API Pattern (React Query)
```typescript
// hooks trả về useQuery / useMutation từ @tanstack/react-query
// Không dùng useEffect + fetch trực tiếp
export function useWorkers(filters?: WorkerFilters) {
  return useQuery({
    queryKey: ['workers', filters],
    queryFn: () => api.get('/workers', { params: filters }).then(r => r.data),
  })
}
```

### Form Pattern
```typescript
// Luôn dùng react-hook-form + zod — không dùng controlled state thủ công
const schema = z.object({ name: z.string().min(1, 'Bắt buộc nhập tên') })
const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
```

### Monetary Values
- Lưu trong DB: `NUMERIC(15,2)`, đơn vị VNĐ
- Hiển thị: `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`
- Helper: `formatPay(amount)` từ `@/utils/pay-calculator`

### Dates
- API nhận/trả: `YYYY-MM-DD`
- Hiển thị UI: `DD/MM/YYYY` (dùng `date-fns/format` với locale vi)

---

## Môi trường

```
# Frontend (.env)
VITE_API_BASE_URL=http://localhost:3000/api

# Backend (.env)
DATABASE_URL=mysql://user:pass@localhost:3306/workshop_pro
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=8h
REFRESH_TOKEN_EXPIRES_IN=30d
PORT=3000
```

## Docker
`docker-compose.yml` đã có sẵn: MariaDB + Redis + NestJS backend.
Frontend dev server chạy riêng: `vite dev` tại cổng 5173.
