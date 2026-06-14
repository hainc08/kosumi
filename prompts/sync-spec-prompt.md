# PROMPT: Sync Spec từ HTML Prototype
# Dùng khi: bạn vừa update workshop_pro.html và muốn sync lại spec

---

## Cách dùng

Khi bạn chỉnh sửa `workshop_pro.html`, chỉ cần paste 1 trong các prompt dưới đây vào chat với AI Agent.

---

## PROMPT A — Sync toàn bộ (sau khi thay đổi nhiều)

```
Tôi vừa cập nhật workshop_pro.html.

Hãy:
1. Đọc lại toàn bộ workshop_pro.html
2. So sánh với workshop_pro_spec.md hiện tại
3. Liệt kê tất cả các phần có trên HTML nhưng chưa được spec hoặc spec không đúng
4. Trình bày dưới dạng TODO có đánh số để tôi xác nhận
5. Sau khi tôi confirm → update spec
```

---

## PROMPT B — Sync một module cụ thể (nhanh hơn, ít token hơn)

```
Tôi vừa cập nhật module [TÊN MODULE] trong workshop_pro.html.
Cụ thể: [mô tả ngắn những gì đã thay đổi]

Hãy:
1. Đọc phần HTML của module đó (id="mod-[tên]")
2. So sánh với section tương ứng trong workshop_pro_spec.md
3. Liệt kê gap
4. Sau khi tôi confirm → update spec
```

**Ví dụ:**
```
Tôi vừa thêm tab "Lịch sử thanh toán" vào detail drawer của Báo giá.
Hãy đọc phần mod-quotes trong HTML, so sánh với Module 6 trong spec, liệt kê gap và update.
```

---

## PROMPT C — Thêm UI mới (field / component)

```
Tôi vừa thêm [mô tả] vào workshop_pro.html.
Hãy xác nhận xem workshop_pro_spec.md đã phản ánh thay đổi này chưa.
Nếu chưa, hãy đề xuất nội dung cần thêm vào spec (data model + UI screens).
```

---

## PROMPT D — Review định kỳ (mỗi sprint)

```
Hãy thực hiện full audit:
1. Đọc toàn bộ workshop_pro.html
2. Đối chiếu từng module với workshop_pro_spec.md
3. Tạo báo cáo gap dạng bảng: Module | Có trên HTML | Có trong Spec | Gap
4. Đề xuất update batch cho spec
```

---

## Lưu ý
- **Luôn đọc `context/project-context.md` trước** — có quy tắc workflow quan trọng
- Spec được sync **từ HTML → Spec**, không bao giờ ngược lại
- HTML prototype (`workshop_pro.html`) là **nguồn sự thật duy nhất** cho UI
- Sau khi spec được sync → mới bắt đầu code production từ spec
