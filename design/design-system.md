# WorkShop Pro — Design System

## 1. Triết lý thiết kế
- **Flat & Clean**: Không gradient, không shadow phức tạp. Surface trắng, viền mỏng 1px.
- **Data-dense**: Người dùng là quản lý xưởng cần xem nhiều thông tin cùng lúc → ưu tiên bảng dữ liệu, font nhỏ (12-13px), padding compact.
- **Action-clear**: Mọi hành động chính (Thêm, Lưu, Duyệt) phải nổi bật. Hành động nguy hiểm (Xóa) cần confirm.

---

## 2. Color Tokens

```css
:root {
  /* === Neutrals === */
  --color-bg:           #F1F5F9;   /* Page background */
  --color-surface:      #FFFFFF;   /* Card, panel, modal */
  --color-surface-2:    #F8FAFC;   /* Input bg, table header */
  --color-border:       #E2E8F0;   /* Default border */
  --color-border-focus: #93C5FD;   /* Input focus */

  /* === Text === */
  --color-text:         #0F172A;   /* Primary text */
  --color-text-2:       #475569;   /* Secondary text */
  --color-text-3:       #94A3B8;   /* Placeholder, muted */

  /* === Brand === */
  --color-blue:         #1D4ED8;   /* Primary CTA, active nav */
  --color-blue-light:   #DBEAFE;   /* Badge bg, chip bg */
  --color-blue-text:    #1E40AF;   /* Text on blue-light bg */

  /* === Semantic === */
  --color-green:        #16A34A;
  --color-green-light:  #DCFCE7;
  --color-green-text:   #166534;

  --color-amber:        #D97706;
  --color-amber-light:  #FEF3C7;
  --color-amber-text:   #92400E;

  --color-red:          #DC2626;
  --color-red-light:    #FEE2E2;
  --color-red-text:     #991B1B;

  --color-purple:       #7C3AED;
  --color-purple-light: #EDE9FE;
  --color-purple-text:  #5B21B6;

  /* === Sidebar === */
  --sidebar-bg:         #1E293B;
  --sidebar-text:       #CBD5E1;
  --sidebar-muted:      #64748B;
  --sidebar-active:     #1D4ED8;
  --sidebar-hover:      #253347;

  /* === Border Radius === */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

---

## 3. Typography

| Role | Size | Weight | Color |
|------|------|--------|-------|
| Page title | 15px | 600 | `--color-text` |
| Section label | 11px | 600 | `--color-text-3` (UPPERCASE) |
| Table header | 11px | 600 | `--color-text-3` (UPPERCASE) |
| Table body | 12px | 400 | `--color-text-2` |
| Table main col | 12px | 600 | `--color-text` |
| Form label | 11px | 600 | `--color-text-2` |
| Form input | 12px | 400 | `--color-text` |
| Badge | 10px | 600 | Semantic color |
| KPI value | 22px | 600 | `--color-text` |
| KPI label | 11px | 400 | `--color-text-3` |

**Font stack:** `'Inter', system-ui, -apple-system, sans-serif`

---

## 4. Component Specs

### 4.1 Button

```
Primary:   bg=#1D4ED8, text=#fff, hover=#1E40AF
Default:   bg=#fff, border=1px #E2E8F0, hover=bg:#F8FAFC
Danger:    bg=#FEE2E2, border=#FCA5A5, text=#DC2626
Size:      padding: 6px 14px, font: 12px 500, radius: var(--radius-sm)
Small:     padding: 4px 10px, font: 11px
```

### 4.2 Input / Select

```
Border:    1px solid #E2E8F0
Focus:     border-color: #93C5FD
Radius:    var(--radius-sm)
Padding:   7px 10px
Font:      12px
Height:    32px
```

### 4.3 Table

```
Header:    bg=#F8FAFC, border-bottom=1px, font=11px 600 UPPERCASE text-3
Row:       border-bottom=1px #E2E8F0, hover=bg:#F8FBFF
Cell:      padding: 10px 14px
Actions:   26×26px icon buttons, border=1px, radius=6px
```

### 4.4 Badge/Tag

```
Shape:     pill (border-radius: 10px)
Padding:   2px 8px
Font:      10px, weight 600
Variants:  green, blue, amber, red, purple, gray
```

### 4.5 Modal

```
Overlay:   rgba(15,23,42,0.4)
Width:     520px (default), 580px (large form)
Radius:    var(--radius-lg)
Header:    16px 20px, border-bottom
Body:      20px padding, max-height: 70vh, scroll
Footer:    12px 20px, border-top, right-align buttons
```

### 4.6 Drawer (Detail Panel)

```
Width:     460px (detail), 420px (action drawer)
Position:  fixed right, full height
Animation: translateX(100%) → translateX(0), 250ms cubic-bezier(.4,0,.2,1)
Overlay:   rgba(15,23,42,0.3)
```

### 4.7 KPI Card

```
Background: var(--color-surface)
Border:     1px solid var(--color-border)
Radius:     var(--radius-lg)
Padding:    14px 16px
Value:      22px 600
Label:      11px, icon 14px
```

### 4.8 Sidebar

```
Width:      220px (expanded), 56px (collapsed)
Background: #1E293B
Nav item:   padding 8px 14px, 36px min-height
Active:     bg=#1D4ED8, text=#fff
Icon:       17px Tabler outline
```

---

## 5. Icon Library

Sử dụng **Tabler Icons** (outline variant only).
CDN: `https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css`
NPM: `@tabler/icons-react` (cho React)

| Module | Icon |
|--------|------|
| Dashboard | `ti-layout-dashboard` |
| Sites/Xưởng | `ti-building-factory-2` |
| Workers | `ti-users` |
| Projects | `ti-building` |
| Quotes | `ti-file-invoice` |
| Kanban | `ti-columns` |
| Timesheet | `ti-clock` |
| Reports | `ti-chart-bar` |
| Add | `ti-plus` |
| Edit | `ti-edit` |
| Delete | `ti-trash` |
| View | `ti-eye` |
| Save | `ti-device-floppy` |
| Transfer | `ti-arrows-exchange` |
| Drag-drop | `ti-drag-drop` |
| Contract | `ti-file-certificate` |
| Money | `ti-currency-dong` |
| Filter | `ti-filter` |
| Search | `ti-search` |
| Export | `ti-download` |
| Print | `ti-printer` |

---

## 6. Layout Grid

```
App shell:    sidebar (220px) + main (flex:1)
Page shell:   padding 20px 24px
KPI row:      grid repeat(4, 1fr), gap 10px
Table card:   full width, border-radius lg
Split 2:      grid 1fr 1fr, gap 16px
Split 3:      grid 2fr 1fr, gap 16px
Form grid:    grid 1fr 1fr, gap 12px
```

---

## 7. Spacing Scale

```
4px   — icon-text gap, chip internal
6px   — small gaps
8px   — form row gap, button icon-text
10px  — card gap, grid gap
12px  — section internal padding
14px  — table cell padding
16px  — card padding, modal section gap
20px  — page padding
24px  — page padding horizontal
```

---

## 8. Responsive Breakpoints

```
lg: ≥1280px  — full layout (sidebar + content)
md: ≥768px   — sidebar collapsed by default
sm: <768px   — sidebar hidden, mobile nav bottom tab
```

*(Phase 1 chỉ cần lg. Mobile ở Phase 3)*

---

## 9. Animation

```
Modal open:     opacity 0→1 + translateY(12px→0), 200ms ease
Drawer open:    translateX(100%→0), 250ms cubic-bezier(.4,0,.2,1)
Button hover:   background transition 120ms
Row hover:      background transition 100ms
```

---

## 10. Status Color Mapping

| Status | Badge variant | Hex |
|--------|--------------|-----|
| Hoạt động / Đang làm / Có PO | green | #DCFCE7 / #166534 |
| Đang thi công / Theo giờ | blue | #DBEAFE / #1E40AF |
| Sắp bàn giao / Nghỉ phép / Chờ duyệt | amber | #FEF3C7 / #92400E |
| Vắng mặt / Hủy / Từ chối | red | #FEE2E2 / #991B1B |
| Cố định tháng | green | #DCFCE7 / #166534 |
| Khoán sản phẩm | purple | #EDE9FE / #5B21B6 |
