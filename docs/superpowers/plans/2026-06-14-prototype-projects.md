# Prototype — Projects Module Implementation Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** Module Dự án trên mock: danh sách + KPI + filter; form (link Khách hàng + Công trường, loại công trình, giá trị HĐ, ngày, tiến độ); drawer chi tiết; highlight dự án sắp đến hạn. Thay placeholder `/projects`.

**Depends on:** Foundation + Customers + Sites. Types `Project`/`ProjectStatus`/`ProjectType`/labels (đã có). **Spec:** Module 4 + backlog B5 (deadline alert UI).

## Files
```
src/mocks/seed/projects.ts          CREATE
src/mocks/db.ts                     MODIFY (+projects)
src/api/projects.ts                 CREATE (+test logic)
src/utils/deadline.ts               CREATE (isNearDeadline) + test
src/components/projects/projectFormShape.ts   CREATE
src/components/projects/ProjectForm.tsx + .css CREATE
src/components/projects/ProjectDetailDrawer.tsx + .css CREATE
src/pages/Projects.tsx + .css       CREATE
src/router/routes.tsx               MODIFY
tests/projects-api.test.ts, tests/deadline.test.ts   CREATE
```

## Task 1: deadline util (TDD)
- [ ] `isNearDeadline(deadlineISO, todayISO?)`: true nếu còn ≤14 ngày và chưa quá hạn-âm? → trả 'overdue' | 'near' | 'ok'. Test.

## Task 2: seed + db + API (TDD logic)
- [ ] seed 5 dự án link customers/sites, đủ trạng thái + progress.
- [ ] `filterProjects` (status, siteId, search name/code), `createProjectInDb` (code PRJ00x, join customer/site name), `updateProjectInDb`. Hooks useProjects/useProject/useCreateProject/useUpdateProject. Test create+filter.

## Task 3: form shape + ProjectForm
- [ ] zod: name bắt buộc, deadline bắt buộc, customerId optional select, contractValue số. Form fields: name, customerId(select từ useCustomers), projectType(select), siteId(select từ useSites), contractValue, startDate, deadline, progressPct(0–100, chỉ khi edit), status(select khi edit), description.

## Task 4: ProjectDetailDrawer
- [ ] Header + progress bar + thông tin + (quotes list: ghi chú "khi module Báo giá xong"). Nút sửa.

## Task 5: Page + route
- [ ] KPI: Tổng / Đang thi công (in_progress+near_deadline) / Sắp đến hạn / Hoàn thành. Toolbar search + filter status + site. Table: Dự án(name+code) · Khách hàng · Loại · Xưởng · Tiến độ(bar) · Ngày bàn giao · Trạng thái. Row near/overdue → class highlight. Wire route.
- [ ] build + browser verify. Commit.

## Task 6: Final verify — test + build PASS.

## Self-Review
- Spec Module 4 coverage: list+filter+KPI (T5), form link customer/site + progress (T3), drawer (T4), deadline alert UI highlight (T1+T5), API (T2). Danh sách quotes trong drawer = khi module Báo giá xong.
