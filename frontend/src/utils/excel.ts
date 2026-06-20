import ExcelJS from 'exceljs'
import type { MonthlySummary } from '@/types'
import { CONTRACT_TYPE_LABELS } from '@/types'

/** Xuất bảng chấm công tháng ra file .xlsx và kích hoạt tải về. */
export async function exportTimesheetXlsx(rows: MonthlySummary[], yearMonth: string, contractTypeOf: (id: string) => string) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Kosumi Management Software'
  const ws = wb.addWorksheet(`Chấm công ${yearMonth}`)

  ws.columns = [
    { header: 'Mã CN', key: 'code', width: 10 },
    { header: 'Họ tên', key: 'name', width: 24 },
    { header: 'Loại HĐ', key: 'contract', width: 14 },
    { header: 'Ngày công', key: 'workdays', width: 11 },
    { header: 'Giờ thường', key: 'regular', width: 12 },
    { header: 'Giờ OT', key: 'ot', width: 9 },
    { header: 'Nghỉ', key: 'leave', width: 8 },
    { header: 'Vắng', key: 'absent', width: 8 },
    { header: 'Thực lĩnh (VND)', key: 'pay', width: 18 },
  ]
  ws.getRow(1).font = { bold: true }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } }
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

  rows.forEach((r) => {
    ws.addRow({
      code: r.worker?.code ?? '',
      name: r.worker?.fullName ?? '',
      contract: CONTRACT_TYPE_LABELS[contractTypeOf(r.workerId) as keyof typeof CONTRACT_TYPE_LABELS] ?? contractTypeOf(r.workerId),
      workdays: r.totalWorkdays,
      regular: r.totalRegularHours,
      ot: r.totalOtHours,
      leave: r.totalLeaveDays,
      absent: r.totalAbsentDays,
      pay: r.totalPay,
    })
  })
  ws.getColumn('pay').numFmt = '#,##0'

  // Dòng tổng cộng
  const total = ws.addRow({
    name: 'TỔNG CỘNG',
    workdays: rows.reduce((s, r) => s + r.totalWorkdays, 0),
    regular: rows.reduce((s, r) => s + r.totalRegularHours, 0),
    ot: rows.reduce((s, r) => s + r.totalOtHours, 0),
    pay: rows.reduce((s, r) => s + r.totalPay, 0),
  })
  total.font = { bold: true }

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cham-cong-${yearMonth}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
