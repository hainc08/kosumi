# Prototype — Customers Module Implementation Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Module Khách hàng đầy đủ trên mock: danh sách + 4 KPI + filter/search; form 3 tab (Thông tin chung · Người liên hệ nhiều dòng · Điều khoản mặc định); drawer chi tiết. Thay placeholder `/customers`.

**Architecture:** `src/api/customers.ts` (hooks → `db.customers`, contacts lồng trong customer). Form: react-hook-form + `useFieldArray` cho contacts + zod. Aggregate (projectCount/quoteCount/totalContractValue) seed sẵn trên mock (sẽ tính từ quotes/projects khi các module đó xong).

**Depends on:** Foundation + types `Customer`/`CustomerContact`/`CUSTOMER_*`/`PAYMENT_TERMS_LABELS` (đã có). **Spec ref:** Module 5.

## Files
```
src/mocks/seed/customers.ts            CREATE
src/mocks/db.ts                        MODIFY (+customers)
src/api/customers.ts                   CREATE
src/components/customers/customerFormShape.ts   CREATE (zod + helpers)
src/components/customers/CustomerForm.tsx + .css CREATE (3 tabs + field array)
src/components/customers/CustomerDetailDrawer.tsx + .css CREATE
src/pages/Customers.tsx + .css         CREATE
src/router/routes.tsx                  MODIFY
tests/customers-api.test.ts            CREATE
```

## Task 1: Seed + db
- [ ] Thêm `seedCustomers` (4–5 KH, mỗi KH có `contacts[]` ≥1, contact[0].isPrimary=true, và aggregate fields). Thêm `customers` vào `db`.
- [ ] Commit cùng Task 2.

## Task 2: API (TDD logic)
- [ ] Test: `createCustomerInDb` sinh code `KH00x`, set contact đầu = primary; `filterCustomers` lọc type + search (name/code/taxCode/tên liên hệ).
- [ ] Implement `filterCustomers`, `createCustomerInDb`, `updateCustomerInDb`, hooks `useCustomers/useCustomer/useCreateCustomer/useUpdateCustomer`.
- [ ] Run tests pass → commit `feat(customers): mock customers API + tests`.

## Task 3: Form shape (zod + helpers)
- [ ] `customerFormShape.ts`: schema (name bắt buộc; ≥1 contact; contact.fullName bắt buộc; validityDays/deliveryDays là số ≥0). `emptyCustomerForm`, `customerToForm`, `formToCreateDto`.

## Task 4: CustomerForm (3 tab + useFieldArray)
- [ ] Tabs nội bộ (state activeTab). Tab 1 thông tin chung; Tab 2 contacts (useFieldArray, nút +/xóa, dòng đầu nhãn "Chính"); Tab 3 điều khoản mặc định (preset payment terms dropdown).
- [ ] Submit → create/update → toast → đóng. Commit cùng Task 6.

## Task 5: CustomerDetailDrawer
- [ ] Header (tên/mã/badge trạng thái) + thông tin chung + danh sách liên hệ + điều khoản mặc định. Ghi chú: lịch sử dự án/báo giá sẽ có khi module đó xong.

## Task 6: Page + route
- [ ] 4 KPI: Tổng KH / Có báo giá (quoteCount>0) / Chờ phản hồi (status=pending) / Tổng giá trị HĐ (sum totalContractValue). Toolbar: search + filter type + nút Thêm. Table: Tên+Mã, Loại, Liên hệ chính (SĐT), Dự án, Báo giá, Tổng giá trị, Trạng thái. Row→drawer. Wire route.
- [ ] `npm run build` + browser verify (list 4 KH; thêm KH 2 contacts → xuất hiện; filter type). Commit `feat(customers): page, form 3-tab, drawer, route`.

## Task 7: Final verify — `npm run test` + `npm run build` PASS.

## Self-Review
- Spec Module 5 coverage: list+KPI+filter (T6), form 3 tab + multi-contact (T4), drawer (T5), API (T2). Lịch sử giao dịch (projects/quotes) = out-of-scope tới khi module đó xong (ghi chú trong drawer).
- Aggregate seed sẵn; khi có quotes/projects sẽ chuyển sang tính thật.
