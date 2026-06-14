# WorkShop Pro — Component Library Spec
# Dùng file này như "bản vẽ" để agent generate React components

## Stack
- React 18 + TypeScript
- Vanilla CSS + CSS variables (tokens: design/tokens.css)
- @tabler/icons-react (outline only)
- @tanstack/react-query (data fetching)
- zustand (global state)
- @hello-pangea/dnd (kanban drag-drop)

---

## 1. Layout Components

### AppShell
```typescript
// src/components/layout/AppShell.tsx
interface AppShellProps {
  children: React.ReactNode
}
// - Sidebar (220px, collapsible to 56px)
// - Main area (flex-1, flex-col)
// - Topbar (52px, fixed)
// - Page content area (flex-1, overflow-y-auto)
```

### Sidebar
```typescript
// src/components/layout/Sidebar.tsx
interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  currentModule: ModuleId
  onNavigate: (id: ModuleId) => void
}
type ModuleId = 'dashboard'|'customers'|'sites'|'workers'|'projects'|'quotes'|'assign'|'timesheet'|'report'
// Note: màn "Xem trước & In ấn báo giá" (quote-preview) là full-page sub-route của quotes, không phải nav item riêng.
```

### Topbar
```typescript
// src/components/layout/Topbar.tsx
interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode   // slot for page-level buttons
}
```

---

## 2. Data Display Components

### DataTable
```typescript
// src/components/ui/DataTable.tsx
interface Column<T> {
  key: keyof T | string
  header: string
  width?: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
}
interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  onRowClick?: (row: T) => void
  emptyText?: string
}
// Features:
// - Sticky header
// - Row hover highlight
// - Loading skeleton (3 rows)
// - Empty state with icon
// - Overflow-x scroll wrapper
```

### KpiCard
```typescript
// src/components/ui/KpiCard.tsx
interface KpiCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  iconColor?: string
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
}
```

### Badge
```typescript
// src/components/ui/Badge.tsx
type BadgeVariant = 'green'|'blue'|'amber'|'red'|'purple'|'gray'
interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  dot?: boolean    // small circle prefix
}
```

### ProgressBar
```typescript
// src/components/ui/ProgressBar.tsx
interface ProgressBarProps {
  value: number      // 0-100
  color?: string     // CSS color
  showLabel?: boolean
  size?: 'sm'|'md'
}
```

### AvatarStack
```typescript
// src/components/ui/AvatarStack.tsx
interface AvatarStackProps {
  items: Array<{ initials: string; color: string; name?: string }>
  max?: number    // default 3, show "+N" for rest
  size?: 'sm'|'md'
}
```

---

## 3. Form Components

### FormModal
```typescript
// src/components/ui/FormModal.tsx
interface FormModalProps {
  open: boolean
  onClose: () => void
  title: string
  icon?: React.ReactNode
  size?: 'md'|'lg'            // 520px | 580px
  children: React.ReactNode
  footer?: React.ReactNode
  onSubmit?: () => void
  submitLabel?: string
  loading?: boolean
}
```

### DetailDrawer
```typescript
// src/components/ui/DetailDrawer.tsx
interface DetailDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
  width?: 'sm'|'md'           // 420px | 460px
}
```

### FormField
```typescript
// src/components/ui/FormField.tsx
interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode   // input/select/textarea
}
```

### SearchBox
```typescript
// src/components/ui/SearchBox.tsx
interface SearchBoxProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  width?: string
}
```

### FilterSelect
```typescript
// src/components/ui/FilterSelect.tsx
interface FilterSelectProps {
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (v: string) => void
  placeholder?: string
  width?: string
}
```

---

## 4. Feedback Components

### Toast (global, via zustand)
```typescript
// src/stores/toastStore.ts
interface ToastStore {
  message: string
  type: 'success'|'error'|'info'
  show: (message: string, type?: ToastStore['type']) => void
}
// Usage: useToastStore().show('✓ Đã lưu')
```

### ConfirmDialog
```typescript
// src/components/ui/ConfirmDialog.tsx
interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger'|'default'
  onConfirm: () => void
  onCancel: () => void
}
```

### LoadingSkeleton
```typescript
// src/components/ui/LoadingSkeleton.tsx
interface LoadingSkeletonProps {
  rows?: number
  columns?: number
}
```

---

## 5. Module-Specific Components

### WorkerContractSection
```typescript
// src/components/workers/WorkerContractSection.tsx
// Section trong form thêm/sửa công nhân
interface WorkerContractSectionProps {
  value: ContractFormData
  onChange: (data: ContractFormData) => void
}
interface ContractFormData {
  contractType: 'hourly'|'daily'|'monthly'|'piece'
  startDate: string
  rateNormal?: number        // hourly/daily
  rateOvertime?: number      // hourly
  baseSalary?: number        // monthly
  allowance?: number         // monthly
  ratePerUnit?: number       // piece
  unitName?: string          // piece
}
// Features:
// - Dynamic fields based on contractType
// - Live calculator: ước tính lương tháng khi nhập đơn giá
// - Rate override for OT (default = rateNormal * 1.5)
```

### KanbanBoard
```typescript
// src/components/kanban/KanbanBoard.tsx
// Module 7 (Giao việc Kanban) - full board
interface KanbanBoardProps {
  siteId: string
  projectId: string
  quoteId: string
  date: string               // YYYY-MM-DD
}
// Sub-components:
// - KanbanColumn (5 columns: unassigned/in_progress/paused/completed/cancelled)
// - KanbanTaskCard
// - WorkerPanel (left sidebar)
// - WorkerChip (on task card, with transfer button)
// - TransferDrawer
// - StepWizard (4 bước chọn site→project→quote→board)
```

### TimesheetTable
```typescript
// src/components/timesheet/TimesheetTable.tsx
// Module 8 (Chấm công) - bảng chấm công
interface TimesheetTableProps {
  yearMonth: string          // 'YYYY-MM'
  siteId?: string
}
// Features:
// - Hiển thị giờ thường, giờ OT, đơn giá, thành tiền
// - Tự tính theo contract type (hourly/daily/monthly)
// - Inline edit giờ OT
// - Bulk approve
// - Export Excel
```

### QuoteItemsEditor
```typescript
// src/components/quotes/QuoteItemsEditor.tsx
// Trong form tạo/sửa báo giá
interface QuoteItemsEditorProps {
  items: QuoteItem[]
  onChange: (items: QuoteItem[]) => void
}
interface QuoteItem {
  id?: string
  itemName: string
  unit: string
  quantity: number
  unitPrice: number
  amount?: number            // computed: quantity * unitPrice
}
// Features:
// - Add/remove rows
// - Auto-calculate amount column
// - Subtotal + VAT + Total footer
```

---

## 6. File/Folder Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── ui/
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── DataTable.tsx
│   │   ├── DetailDrawer.tsx
│   │   ├── FilterSelect.tsx
│   │   ├── FormField.tsx
│   │   ├── FormModal.tsx
│   │   ├── KpiCard.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── SearchBox.tsx
│   │   └── Toast.tsx
│   ├── workers/
│   │   ├── WorkerContractSection.tsx
│   │   ├── WorkerForm.tsx
│   │   └── WorkerDetailDrawer.tsx
│   ├── kanban/
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   ├── KanbanTaskCard.tsx
│   │   ├── WorkerPanel.tsx
│   │   ├── WorkerChip.tsx
│   │   └── TransferDrawer.tsx
│   ├── quotes/
│   │   ├── QuoteItemsEditor.tsx
│   │   ├── QuoteForm.tsx
│   │   └── QuotePreview.tsx        # full-page A4 preview + print
│   ├── customers/
│   │   ├── CustomerForm.tsx        # 3-tab modal + multi-contacts
│   │   └── CustomerDetailDrawer.tsx
│   └── timesheet/
│       └── TimesheetTable.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Customers.tsx
│   ├── Sites.tsx
│   ├── Workers.tsx
│   ├── Projects.tsx
│   ├── Quotes.tsx
│   ├── Kanban.tsx
│   ├── Timesheet.tsx
│   └── Report.tsx
├── api/
│   ├── customers.ts
│   ├── sites.ts
│   ├── workers.ts
│   ├── projects.ts
│   ├── quotes.ts
│   ├── tasks.ts
│   └── timesheet.ts
├── stores/
│   ├── appStore.ts          # sidebar state, current module
│   ├── toastStore.ts
│   └── kanbanStore.ts       # realtime board state
├── types/
│   ├── customer.ts
│   ├── site.ts
│   ├── worker.ts
│   ├── project.ts
│   ├── quote.ts
│   ├── task.ts
│   └── timesheet.ts
└── utils/
    ├── pay-calculator.ts    # tính lương theo contract type
    ├── date.ts
    └── format.ts            # currency, number formatting (vi-VN)
```
