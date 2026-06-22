/* eslint-disable */
// Sinh dữ liệu demo KosumiApp (ngành xưởng đúc). Chạy: node scripts/gen-demo.js
// Xuất ra file demo_data.sql ở thư mục gốc. UUID literal => liên kết FK chắc chắn.
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

// ---- helpers ----
const esc = (s) => (s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);
const num = (n) => (n === null || n === undefined ? 'NULL' : String(n));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const ri = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pad = (n, w) => String(n).padStart(w, '0');
const dstr = (d) => d.toISOString().slice(0, 10);
const dtstr = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
const addDays = (base, n) => new Date(base.getTime() + n * 86400000);
const TODAY = new Date('2026-06-17T00:00:00Z');

// chèn nhiều dòng theo lô để câu lệnh không quá dài
function multiInsert(table, cols, rows, chunk = 40) {
  let out = '';
  for (let i = 0; i < rows.length; i += chunk) {
    const part = rows.slice(i, i + chunk);
    out += `INSERT INTO ${table} (${cols.join(', ')}) VALUES\n` + part.join(',\n') + ';\n\n';
  }
  return out;
}

// ---- từ điển tên ----
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Phan', 'Võ', 'Trương', 'Đinh', 'Tô'];
const DEM_M = ['Văn', 'Hữu', 'Đình', 'Quốc', 'Công', 'Minh', 'Đức', 'Trọng', 'Xuân', 'Bá'];
const DEM_F = ['Thị', 'Thu', 'Ngọc', 'Hồng', 'Kim', 'Mỹ', 'Thanh', 'Phương'];
const TEN_M = ['Hùng', 'Sơn', 'Lò', 'Đúc', 'Phay', 'Đột', 'Thép', 'Cường', 'Dũng', 'Khoa', 'Nam', 'Tâm', 'Lực', 'Bình', 'An', 'Tài', 'Phát', 'Lâm', 'Quân', 'Hải'];
const TEN_F = ['Khuôn', 'Hoa', 'Lan', 'Hằng', 'Trang', 'Mai', 'Linh', 'Nhung', 'Yến', 'Thảo'];

function vname(gender) {
  const ho = pick(HO);
  if (gender === 'female') return `${ho} ${pick(DEM_F)} ${pick(TEN_F)}`;
  return `${ho} ${pick(DEM_M)} ${pick(TEN_M)}`;
}

let sql = '';
sql += `USE u774510961_kosumi;\n`;
sql += `-- =========================================================================\n`;
sql += `-- DỮ LIỆU DEMO KOSUMI APP (NGÀNH XƯỞNG ĐÚC) — BẢN ĐẦY ĐỦ (~100+ bản ghi/bảng chính)\n`;
sql += `-- Sinh tự động bởi scripts/gen-demo.js. Mốc thời gian: 2026-06-17.\n`;
sql += `-- Chạy nguyên khối trong phpMyAdmin / MySQL CLI.\n`;
sql += `-- =========================================================================\n\n`;

sql += `SET FOREIGN_KEY_CHECKS = 0;\n`;
for (const t of ['timesheet_entries', 'task_assignments', 'tasks', 'quote_payment_steps', 'quote_items', 'quotes', 'projects', 'worker_contracts', 'workers', 'customer_contacts', 'customers', 'sites']) {
  sql += `TRUNCATE TABLE ${t};\n`;
}
sql += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;

// ---- 1. SITES (5) ----
const siteDefs = [
  ['S-DUC-01', 'Phân xưởng Đúc Nóng (Gang & Đồng)', 'factory', 'KCN Nhơn Trạch', 'Đồng Nai', 3500.5],
  ['S-CNC-01', 'Phân xưởng Gia công CNC & Làm nguội', 'factory', 'KCN Amata', 'Đồng Nai', 1200.0],
  ['S-REN-01', 'Phân xưởng Làm khuôn & Tạo mẫu', 'factory', 'KCN Biên Hòa 2', 'Đồng Nai', 900.0],
  ['S-KHO-01', 'Kho Vật tư & Thành phẩm', 'warehouse', 'KCN Sóng Thần', 'Bình Dương', 2000.0],
  ['S-LAP-01', 'Xưởng Lắp ráp & Hoàn thiện', 'construction', 'KCN Long Thành', 'Đồng Nai', 1500.0],
];
const sites = siteDefs.map((s, i) => ({ id: randomUUID(), code: s[0], name: s[1], type: s[2], zone: s[3], city: s[4], area: s[5], status: i < 4 ? 'active' : 'preparing' }));
sql += '-- 1. SITES\n';
sql += multiInsert('sites', ['id', 'code', 'name', 'type', 'industrial_zone', 'address', 'city', 'phone', 'area_m2', 'status', 'created_at', 'updated_at'],
  sites.map((s) => `(${esc(s.id)}, ${esc(s.code)}, ${esc(s.name)}, ${esc(s.type)}, ${esc(s.zone)}, ${esc('Lô ' + ri(1, 30) + ', ' + s.zone)}, ${esc(s.city)}, ${esc('025' + ri(1000000, 9999999))}, ${num(s.area)}, ${esc(s.status)}, NOW(), NOW())`));

// ---- 2. CUSTOMERS (15) ----
const cusNames = ['Phụ Tùng Ô tô VINA', 'Bơm Công Nghiệp Châu Á', 'Mỹ Nghệ Đúc Đồng Ý Yên', 'Cơ Khí Chính Xác Tân Tiến', 'Van & Phụ Kiện Thủy Lực', 'Đúc Gang Miền Nam', 'Thiết Bị Nặng Trường Hải', 'Linh Kiện Tàu Biển Sài Gòn', 'Khuôn Mẫu Kim Loại Đông Á', 'Tượng Đài & Mỹ Thuật Hà Nội', 'Phụ Tùng Máy Nông Nghiệp', 'Kết Cấu Thép Bình Dương', 'Bánh Răng & Trục Vít CNC', 'Đồ Thờ Đồng Truyền Thống', 'Thiết Bị Khai Khoáng Tây Nguyên'];
const cusTypes = ['business', 'business', 'studio', 'business', 'business', 'business', 'business', 'foreign', 'business', 'studio', 'business', 'business', 'business', 'studio', 'state'];
const customers = cusNames.map((n, i) => ({ id: randomUUID(), code: 'C-' + pad(i + 1, 3), name: (cusTypes[i] === 'studio' ? 'Cơ sở ' : 'Công ty ') + n, type: cusTypes[i], status: pick(['active', 'active', 'active', 'pending', 'inactive']) }));
sql += '-- 2. CUSTOMERS\n';
sql += multiInsert('customers', ['id', 'code', 'name', 'type', 'tax_code', 'address', 'website', 'status', 'default_validity_days', 'default_delivery_days', 'default_payment_terms', 'created_at', 'updated_at'],
  customers.map((c) => {
    const web = c.type === 'studio' ? 'NULL' : esc(c.code.toLowerCase() + '.vn');
    return `(${esc(c.id)}, ${esc(c.code)}, ${esc(c.name)}, ${esc(c.type)}, ${esc('0' + ri(300000000, 399999999))}, ${esc('KCN, ' + pick(['TP.HCM', 'Bình Dương', 'Đồng Nai', 'Long An', 'Hà Nội', 'Nam Định']))}, ${web}, ${esc(c.status)}, ${pick([10, 15, 30])}, ${pick([30, 45, 60])}, ${esc(pick(['100', '50-50', '30-40-30', '40-60']))}, NOW(), NOW())`;
  }));

// ---- 3. CUSTOMER CONTACTS (1-2 / customer) ----
const contacts = [];
for (const c of customers) {
  const n = ri(1, 2);
  for (let k = 0; k < n; k++) {
    const g = pick(['male', 'female']);
    contacts.push({ id: randomUUID(), cus: c.id, name: vname(g), title: pick(['Trưởng phòng Mua hàng', 'Giám đốc Kỹ thuật', 'Kế toán trưởng', 'Chủ cơ sở', 'Nhân viên Vật tư']), primary: k === 0, order: k });
  }
}
// lưu liên hệ chính theo customer để gắn vào quote
const primaryContact = {};
contacts.forEach((ct) => { if (ct.primary) primaryContact[ct.cus] = ct.id; });
sql += '-- 3. CUSTOMER CONTACTS\n';
sql += multiInsert('customer_contacts', ['id', 'customer_id', 'full_name', 'title', 'phone', 'email', 'is_primary', 'sort_order', 'created_at', 'updated_at'],
  contacts.map((ct) => `(${esc(ct.id)}, ${esc(ct.cus)}, ${esc(ct.name)}, ${esc(ct.title)}, ${esc('09' + ri(10000000, 99999999))}, ${ct.primary ? esc('lienhe' + ri(1, 999) + '@email.vn') : 'NULL'}, ${ct.primary ? 1 : 0}, ${ct.order}, NOW(), NOW())`));

// ---- 4. WORKERS (100) ----
const POS = ['team_leader', 'senior_worker', 'worker', 'apprentice', 'technician', 'supervisor', 'other'];
// Chuyên môn (specialty) theo ngành xưởng đúc — thay cho cột experience_years cũ.
const SPECIALTY = ['Đúc gang cầu', 'Đúc đồng mỹ nghệ', 'Làm khuôn cát', 'Làm khuôn thạch cao', 'Phay CNC', 'Tiện vạn năng', 'Mài & làm nguội', 'Hàn kết cấu', 'Mạ & đánh bóng', 'Kiểm tra siêu âm', 'Nấu rót kim loại', 'Quản lý tổ đúc', 'Vận hành lò trung tần', 'Phụ việc xưởng'];
const workers = [];
for (let i = 1; i <= 100; i++) {
  const g = pick(['male', 'male', 'male', 'female']);
  const pos = pick(POS);
  const exp = pos === 'apprentice' ? ri(0, 2) : pos === 'team_leader' ? ri(12, 25) : ri(2, 18);
  const dob = new Date(Date.UTC(2003 - exp - ri(0, 8), ri(0, 11), ri(1, 28)));
  workers.push({
    id: randomUUID(), code: 'W-' + pad(i, 3), name: vname(g), gender: g, dob: dstr(dob),
    idn: '0' + ri(12345678000, 12345699999), phone: '09' + ri(10000000, 99999999),
    pos, exp, specialty: pos === 'apprentice' ? 'Phụ việc xưởng' : pick(SPECIALTY),
    status: pick(['working', 'working', 'working', 'working', 'on_leave', 'absent', 'resigned']),
    site: pick(sites).id,
  });
}
sql += '-- 4. WORKERS (100)\n';
sql += multiInsert('workers', ['id', 'code', 'full_name', 'gender', 'date_of_birth', 'id_number', 'phone', 'position', 'specialty', 'status', 'site_id', 'created_at', 'updated_at'],
  workers.map((w) => `(${esc(w.id)}, ${esc(w.code)}, ${esc(w.name)}, ${esc(w.gender)}, ${esc(w.dob)}, ${esc(w.idn)}, ${esc(w.phone)}, ${esc(w.pos)}, ${esc(w.specialty)}, ${esc(w.status)}, ${esc(w.site)}, NOW(), NOW())`));

// ---- 5. WORKER CONTRACTS (1 / worker) ----
const CT = ['piece_rate', 'official', 'probation'];
sql += '-- 5. WORKER CONTRACTS\n';
sql += multiInsert('worker_contracts', ['id', 'worker_id', 'contract_type', 'start_date', 'end_date', 'base_salary', 'allowance_responsibility', 'allowance_attendance', 'rate_per_unit', 'unit_name', 'is_active', 'created_at', 'updated_at'],
  workers.map((w) => {
    const type = w.pos === 'apprentice' ? 'probation' : pick(['official', 'official', 'piece_rate']);
    const start = dstr(new Date(Date.UTC(2026 - Math.max(1, w.exp), ri(0, 11), ri(1, 28))));
    const end = type === 'probation' ? esc(dstr(addDays(TODAY, ri(10, 60)))) : 'NULL';
    const base = type === 'piece_rate' ? 'NULL' : num(ri(8, 20) * 1000000);
    const resp = w.pos === 'team_leader' || w.pos === 'supervisor' ? num(ri(2, 4) * 1000000) : 'NULL';
    const rate = type === 'piece_rate' ? num(ri(50, 200) * 1000) : 'NULL';
    const unit = type === 'piece_rate' ? esc('chiếc') : 'NULL';
    return `(${esc(randomUUID())}, ${esc(w.id)}, ${esc(type)}, ${esc(start)}, ${end}, ${base}, ${resp}, ${num(500000)}, ${rate}, ${unit}, 1, NOW(), NOW())`;
  }));

// ---- 6. PROJECTS (25) ----
const PTYPE = ['commercial', 'apartment', 'industrial', 'art', 'other'];
const PSTAT = ['planning', 'in_progress', 'in_progress', 'near_deadline', 'completed', 'paused', 'cancelled'];
const prodNouns = ['vỏ động cơ', 'cánh bơm', 'bánh răng', 'thân van', 'khớp nối', 'tượng đồng', 'lư hương', 'trục khuỷu', 'bệ máy', 'nắp chặn', 'vành đai', 'gối đỡ'];
const projects = [];
for (let i = 1; i <= 25; i++) {
  const cus = pick(customers);
  const type = pick(PTYPE);
  const status = pick(PSTAT);
  const start = addDays(TODAY, ri(-120, -5));
  const deadline = addDays(start, ri(30, 150));
  const prog = status === 'completed' ? 100 : status === 'planning' ? 0 : ri(5, 95);
  projects.push({
    id: randomUUID(), code: 'P-' + pad(i, 3), name: 'Đúc/Gia công ' + ri(50, 1500) + ' ' + pick(prodNouns),
    cus: cus.id, type, site: pick(sites).id, value: ri(80, 2500) * 1000000,
    start: dstr(start), deadline: dstr(deadline), prog, status,
  });
}
sql += '-- 6. PROJECTS (25)\n';
sql += multiInsert('projects', ['id', 'code', 'name', 'customer_id', 'project_type', 'site_id', 'contract_value', 'start_date', 'deadline', 'progress_pct', 'status', 'description', 'created_at', 'updated_at'],
  projects.map((p) => `(${esc(p.id)}, ${esc(p.code)}, ${esc(p.name)}, ${esc(p.cus)}, ${esc(p.type)}, ${esc(p.site)}, ${num(p.value)}, ${esc(p.start)}, ${esc(p.deadline)}, ${p.prog}, ${esc(p.status)}, ${esc('Hợp đồng ' + p.code + ' — ' + p.name + '.')}, NOW(), NOW())`));

// ---- 7. QUOTES (1 / project = 25) + ITEMS + PAYMENT STEPS ----
const QSTAT = ['draft', 'pending', 'approved', 'approved', 'po_received', 'rejected'];
const quotes = [];
const quoteItems = [];
const paySteps = [];
const sectionNames = ['Công đoạn đúc', 'Gia công cơ khí', 'Hoàn thiện bề mặt', 'Tạo mẫu & khuôn', 'Kiểm định chất lượng'];
const itemNames = ['Đúc phôi gang cầu', 'Phay CNC tinh', 'Mài bavia & làm nguội', 'Làm khuôn thạch cao', 'Đánh bóng & mạ', 'Kiểm tra siêu âm', 'Tiện trục chính', 'Hàn & lắp ráp'];
for (const p of projects) {
  const q = { id: randomUUID(), code: 'BG-' + p.code.slice(2), project: p.id, cus: p.cus, contact: primaryContact[p.cus] || null, title: 'Báo giá ' + p.name, qdate: addDays(new Date(p.start), -10), status: pick(QSTAT), vdays: pick([10, 15, 30]), ddays: pick([30, 45, 60]), pterms: pick(['100', '50-50', '30-40-30']) };
  quotes.push(q);
  // 2-3 items
  const nItems = ri(2, 3);
  for (let s = 1; s <= nItems; s++) {
    const qty = ri(1, 1000);
    const price = ri(50, 3000) * 1000;
    quoteItems.push({ id: randomUUID(), quote: q.id, section: pick(sectionNames), order: s, name: pick(itemNames), unit: pick(['chiếc', 'bộ', 'kg', 'pho']), qty, price, amount: qty * price });
  }
  // payment steps theo pterms
  const parts = q.pterms.split('-').map(Number);
  parts.forEach((pct, idx) => paySteps.push({ id: randomUUID(), quote: q.id, order: idx + 1, pct, desc: idx === 0 ? 'Tạm ứng khi ký hợp đồng' : idx === parts.length - 1 ? 'Thanh toán khi nghiệm thu & giao hàng' : 'Thanh toán giữa kỳ' }));
}
sql += '-- 7a. QUOTES (25)\n';
sql += multiInsert('quotes', ['id', 'code', 'project_id', 'customer_id', 'contact_id', 'title', 'quote_date', 'valid_until', 'status', 'tax_rate', 'validity_days', 'delivery_days', 'payment_terms', 'notes', 'created_at', 'updated_at'],
  quotes.map((q) => `(${esc(q.id)}, ${esc(q.code)}, ${esc(q.project)}, ${esc(q.cus)}, ${q.contact ? esc(q.contact) : 'NULL'}, ${esc(q.title)}, ${esc(dstr(q.qdate))}, ${esc(dstr(addDays(q.qdate, q.vdays)))}, ${esc(q.status)}, 8.00, ${q.vdays}, ${q.ddays}, ${esc(q.pterms)}, ${esc('Báo giá ' + q.code)}, NOW(), NOW())`));
sql += '-- 7b. QUOTE ITEMS\n';
sql += multiInsert('quote_items', ['id', 'quote_id', 'section_name', 'sort_order', 'item_name', 'description', 'unit', 'quantity', 'unit_price', 'amount', 'created_at', 'updated_at'],
  quoteItems.map((it) => `(${esc(it.id)}, ${esc(it.quote)}, ${esc(it.section)}, ${it.order}, ${esc(it.name)}, ${esc(it.name + ' theo tiêu chuẩn kỹ thuật')}, ${esc(it.unit)}, ${it.qty}, ${num(it.price)}, ${num(it.amount)}, NOW(), NOW())`));
sql += '-- 7c. QUOTE PAYMENT STEPS\n';
sql += multiInsert('quote_payment_steps', ['id', 'quote_id', 'step_order', 'percentage', 'description', 'created_at', 'updated_at'],
  paySteps.map((s) => `(${esc(s.id)}, ${esc(s.quote)}, ${s.order}, ${s.pct}, ${esc(s.desc)}, NOW(), NOW())`));

// ---- 8. TASKS (60) ----
const TSTAT = ['unassigned', 'in_progress', 'in_progress', 'paused', 'completed', 'cancelled'];
const TPRIO = ['high', 'medium', 'medium', 'low'];
const tasks = [];
const itemsByQuoteProject = {}; // project -> [item ids] (qua quote)
const quoteByProject = {};
quotes.forEach((q) => { quoteByProject[q.project] = q.id; });
quoteItems.forEach((it) => {
  const proj = quotes.find((q) => q.id === it.quote).project;
  (itemsByQuoteProject[proj] ||= []).push(it.id);
});
for (let i = 1; i <= 60; i++) {
  const p = pick(projects);
  const items = itemsByQuoteProject[p.id] || [];
  const qi = items.length && Math.random() < 0.8 ? pick(items) : null;
  const status = pick(TSTAT);
  tasks.push({ id: randomUUID(), qi, project: p.id, site: p.site, title: 'Lô ' + ri(1, 20) + ' — ' + pick(prodNouns), date: dstr(addDays(TODAY, ri(-20, 10))), status, prio: pick(TPRIO), order: i });
}
sql += '-- 8. TASKS (60)\n';
sql += multiInsert('tasks', ['id', 'quote_item_id', 'project_id', 'site_id', 'title', 'description', 'task_date', 'status', 'priority', 'sort_order', 'created_at', 'updated_at'],
  tasks.map((t) => `(${esc(t.id)}, ${t.qi ? esc(t.qi) : 'NULL'}, ${esc(t.project)}, ${esc(t.site)}, ${esc(t.title)}, ${esc('Thực hiện ' + t.title)}, ${esc(t.date)}, ${esc(t.status)}, ${esc(t.prio)}, ${t.order}, NOW(), NOW())`));

// ---- 9. TASK ASSIGNMENTS (~90: 1-2 thợ / task có trạng thái != unassigned) ----
const assigns = [];
const activeWorkers = workers.filter((w) => w.status === 'working');
for (const t of tasks) {
  if (t.status === 'unassigned') continue;
  const n = ri(1, 2);
  const chosen = new Set();
  for (let k = 0; k < n; k++) {
    const w = pick(activeWorkers);
    if (chosen.has(w.id)) continue;
    chosen.add(w.id);
    const assigned = new Date(t.date + 'T07:30:00Z');
    const started = ['in_progress', 'paused', 'completed'].includes(t.status) ? dtstr(addDays(assigned, 0)) : null;
    const ended = t.status === 'completed' ? dtstr(new Date(assigned.getTime() + 9 * 3600000)) : null;
    const active = ['in_progress', 'paused'].includes(t.status) ? 1 : 0;
    assigns.push({ id: randomUUID(), task: t.id, worker: w.id, assigned: dtstr(assigned), started, ended, active });
  }
}
sql += '-- 9. TASK ASSIGNMENTS\n';
sql += multiInsert('task_assignments', ['id', 'task_id', 'worker_id', 'assigned_at', 'started_at', 'ended_at', 'is_active', 'created_at', 'updated_at'],
  assigns.map((a) => `(${esc(a.id)}, ${esc(a.task)}, ${esc(a.worker)}, ${esc(a.assigned)}, ${a.started ? esc(a.started) : 'NULL'}, ${a.ended ? esc(a.ended) : 'NULL'}, ${a.active}, NOW(), NOW())`));

// ---- 10. TIMESHEET ENTRIES (~120: 30 thợ x 4 ngày gần nhất) ----
const DAYTYPE = ['workday', 'workday', 'workday', 'workday', 'leave_paid', 'holiday', 'absent'];
const ts = [];
const sample = activeWorkers.slice(0, 30);
for (let d = 0; d < 4; d++) {
  const day = dstr(addDays(TODAY, -1 - d));
  for (const w of sample) {
    const dayType = pick(DAYTYPE);
    const ctype = w.pos === 'apprentice' ? 'probation' : pick(['official', 'official', 'piece_rate']);
    const reg = dayType === 'workday' ? 8 : 0;
    const ot = dayType === 'workday' ? pick([0, 0, 1.5, 2]) : 0;
    const rn = ri(30, 90) * 1000;
    const ro = Math.round(rn * 1.5);
    const pay = Math.round(reg * (rn / 8) + ot * (ro / 8));
    ts.push({ id: randomUUID(), worker: w.id, date: day, site: w.site, reg: reg.toFixed(2), ot: ot.toFixed(2), dayType, ctype, rn, ro, pay, status: pick(['approved', 'approved', 'pending_approval', 'draft']) });
  }
}
sql += '-- 10. TIMESHEET ENTRIES (~120)\n';
sql += multiInsert('timesheet_entries', ['id', 'worker_id', 'work_date', 'site_id', 'regular_hours', 'overtime_hours', 'day_type', 'contract_type', 'rate_normal', 'rate_overtime', 'pay_amount', 'status', 'notes', 'created_at', 'updated_at'],
  ts.map((e) => `(${esc(e.id)}, ${esc(e.worker)}, ${esc(e.date)}, ${esc(e.site)}, ${e.reg}, ${e.ot}, ${esc(e.dayType)}, ${esc(e.ctype)}, ${num(e.rn)}, ${num(e.ro)}, ${num(e.pay)}, ${esc(e.status)}, NULL, NOW(), NOW())`));

sql += `-- =========================================================================\n`;
sql += `-- TỔNG: ${sites.length} sites, ${customers.length} customers, ${contacts.length} contacts,\n`;
sql += `--       ${workers.length} workers, ${workers.length} contracts, ${projects.length} projects,\n`;
sql += `--       ${quotes.length} quotes, ${quoteItems.length} items, ${paySteps.length} pay steps,\n`;
sql += `--       ${tasks.length} tasks, ${assigns.length} assignments, ${ts.length} timesheets.\n`;
sql += `-- =========================================================================\n`;

const outPath = path.join(__dirname, '..', 'demo_data.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log('Đã ghi', outPath);
console.log('Records:', { sites: sites.length, customers: customers.length, contacts: contacts.length, workers: workers.length, projects: projects.length, quotes: quotes.length, quoteItems: quoteItems.length, paySteps: paySteps.length, tasks: tasks.length, assigns: assigns.length, timesheets: ts.length });
