# WorkShop Pro — Agentspace Starter Kit
## Hướng dẫn sử dụng với Google Agentspace

---

## Cấu trúc bộ file

```
workshop_pro_agentspace/
│
├── design/                         ← Upload vào Knowledge Base
│   ├── design-system.md            Color tokens, typography, component specs
│   ├── tokens.css                  CSS variables (design tokens) — import global
│   └── component-library.md       Component interfaces & folder structure
│
├── agents/                         ← System prompts cho từng agent
│   ├── 00-master-agent.md          Orchestrator — load đầu tiên
│   ├── 01-ui-agent.md              React component generator
│   ├── 02-backend-agent.md         NestJS API generator
│   ├── 03-database-agent.md        Migration & seed generator
│   ├── 05-kanban-agent.md          Kanban drag-drop specialist
│   └── 06-timesheet-agent.md       Pay calculation specialist
│
├── skills/                         ← Code utilities — copy vào src/utils/
│   ├── pay-calculator.skill.ts     Tính lương theo loại HĐ
│   └── api-client.skill.ts         Axios + React Query patterns
│
├── context/                        ← Upload vào Knowledge Base
│   ├── project-context.md          Business logic, flows, constraints
│   └── types.ts                    TypeScript type definitions (source of truth)
│
└── prompts/
    └── build-prompts.md            ← Prompts sẵn dùng, copy-paste vào Agentspace

Kèm theo (file riêng):
├── workshop_pro_spec.md            Product spec đầy đủ
└── workshop_pro.html               Mock UI đầy đủ 10 module (reference cho design + Kanban)
```

---

## Thiết lập Google Agentspace — 3 bước

### Bước 1: Tạo Knowledge Base
1. Vào **Google Agentspace** → **Knowledge** → **Create Knowledge Base**
2. Đặt tên: `WorkShop Pro Context`
3. Upload các files sau:
   - `context/project-context.md`
   - `context/types.ts`
   - `design/design-system.md`
   - `design/component-library.md`
   - `design/tokens.css`
   - `workshop_pro_spec.md`

### Bước 2: Tạo các Agents
Tạo 3 agents, mỗi agent có system prompt riêng:

**Agent 1: UI Builder**
- Name: `WorkShop UI Builder`
- System prompt: copy toàn bộ nội dung `agents/01-ui-agent.md`
- Knowledge: WorkShop Pro Context (từ bước 1)

**Agent 2: Backend Builder**
- Name: `WorkShop Backend Builder`
- System prompt: copy toàn bộ `agents/02-backend-agent.md`
- Knowledge: WorkShop Pro Context

**Agent 3: Master (optional)**
- Name: `WorkShop Architect`
- System prompt: copy `agents/00-master-agent.md`
- Có thể gọi cả 2 agents trên

### Bước 3: Build theo thứ tự

Dùng prompts từ `prompts/build-prompts.md`:

| Thứ tự | Prompt | Agent | Output |
|--------|--------|-------|--------|
| 1 | PROMPT 01 | UI Builder | Project scaffold |
| 2 | PROMPT 02 | UI Builder | Shared UI components |
| 3 | PROMPT 03 | UI Builder | Layout shell |
| 4 | PROMPT 08 | Backend Builder | Workers API (NestJS) |
| 5 | PROMPT 04 | UI Builder | Workers module (React) |
| 6 | PROMPT 09 | Backend Builder | Tasks/Kanban API |
| 7 | PROMPT 06 | UI Builder | Kanban module (React) |
| 8 | PROMPT 05 | UI Builder | Quotes module |
| 9 | PROMPT 07 | UI Builder | Timesheet module |
| 10 | PROMPT 10 | UI Builder | Dashboard + Reports |

---

## Workflow khuyến nghị

```
┌─────────────────────────────────────────────────────────┐
│ Mỗi prompt → 1 conversation riêng trong Agentspace      │
│                                                          │
│ 1. Paste prompt                                          │
│ 2. Agent generates code                                  │
│ 3. Review output                                        │
│ 4. Ask follow-up nếu cần chỉnh sửa                     │
│ 5. Copy code vào project                                │
│ 6. Test → fix → tiếp prompt tiếp theo                  │
└─────────────────────────────────────────────────────────┘
```

---

## Tips khi dùng Agentspace

**Nếu agent bỏ sót logic:**
> "Bạn chưa implement [X]. Hãy update function [Y] trong file [Z] để thêm validation cho trường hợp [...]"

**Nếu muốn generate thêm:**
> "Generate thêm cho tôi màn hình [tên module] theo cùng pattern đã dùng cho Workers."

**Nếu cần fix bug:**
> "File [path] đang bị lỗi [error message]. Đây là context: [paste code]. Hãy fix và giải thích."

**Nếu muốn customize:**
> "Thêm cột [tên cột] vào bảng Workers, hiển thị [thông tin], lấy từ field [field_name] trong API response."

---

## Checklist trước khi code

- [ ] Đã đọc `workshop_pro_spec.md` (toàn bộ)
- [ ] Đã setup Knowledge Base trên Agentspace
- [ ] Có MariaDB local (Docker Compose khuyến nghị)
- [ ] Đã cài Node.js 20+ và pnpm/npm
- [ ] Đã tạo `.env` file từ template trong `context/project-context.md`

---

## Reference Files (dùng khi review code)

- Mock UI đầy đủ: `workshop_pro.html` — mở trên browser để xem design
- Spec: `workshop_pro_spec.md` — business rules chi tiết từng module
