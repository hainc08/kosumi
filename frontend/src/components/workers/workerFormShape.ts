import { z } from 'zod'
import type { Position, ContractType, Worker } from '@/types'
import type { WorkerFormValues } from '@/api/workers'

/** Form dùng input text cho mọi field số (convert sang number khi submit). */
export interface WorkerFormShape {
  fullName: string
  gender: 'male' | 'female'
  dateOfBirth: string
  idNumber: string
  phone: string
  address: string
  position: Position
  experienceYears: string
  notes: string
  contractType: ContractType
  startDate: string
  baseSalary: string
  allowanceResponsibility: string
  allowanceAttendance: string
  ratePerUnit: string
  unitName: string
}

const num = (s: string): number | undefined => (s.trim() === '' ? undefined : Number(s))

export const workerSchema = z
  .object({
    fullName: z.string().min(1, 'Bắt buộc nhập tên'),
    gender: z.enum(['male', 'female']),
    dateOfBirth: z.string(),
    idNumber: z.string(),
    phone: z.string().refine((v) => v === '' || /^(0[3-9]\d{8})$/.test(v), 'Số điện thoại không hợp lệ'),
    address: z.string(),
    position: z.enum([
      'team_leader', 'senior_worker', 'worker', 'apprentice', 'technician', 'supervisor', 'other',
    ]),
    experienceYears: z.string().refine((v) => {
      const n = Number(v)
      return v !== '' && !Number.isNaN(n) && n >= 0 && n <= 50
    }, 'Kinh nghiệm phải từ 0–50 năm'),
    notes: z.string(),
    contractType: z.enum(['piece_rate', 'official', 'probation']),
    startDate: z.string().min(1, 'Bắt buộc chọn ngày bắt đầu'),
    baseSalary: z.string(),
    allowanceResponsibility: z.string(),
    allowanceAttendance: z.string(),
    ratePerUnit: z.string(),
    unitName: z.string(),
  })
  .superRefine((v, ctx) => {
    if ((v.contractType === 'official' || v.contractType === 'probation') &&
        (!num(v.baseSalary) || (num(v.baseSalary) ?? 0) < 1000)) {
      ctx.addIssue({ code: 'custom', path: ['baseSalary'], message: 'Nhập lương cơ bản (tối thiểu 1.000đ)' })
    }
    if (v.contractType === 'piece_rate') {
      if (!num(v.ratePerUnit)) ctx.addIssue({ code: 'custom', path: ['ratePerUnit'], message: 'Nhập đơn giá/đơn vị' })
      if (v.unitName.trim() === '') ctx.addIssue({ code: 'custom', path: ['unitName'], message: 'Nhập tên đơn vị' })
    }
  })

export const emptyWorkerForm: WorkerFormShape = {
  fullName: '', gender: 'male', dateOfBirth: '', idNumber: '', phone: '', address: '',
  position: 'worker', experienceYears: '0', notes: '',
  contractType: 'official', startDate: new Date().toISOString().slice(0, 10),
  baseSalary: '', allowanceResponsibility: '', allowanceAttendance: '',
  ratePerUnit: '', unitName: '',
}

export function workerToForm(w: Worker): WorkerFormShape {
  const c = w.activeContract
  const s = (n: number | null | undefined) => (n == null ? '' : String(n))
  return {
    fullName: w.fullName, gender: w.gender, dateOfBirth: w.dateOfBirth ?? '',
    idNumber: w.idNumber ?? '', phone: w.phone ?? '', address: w.address ?? '',
    position: w.position,
    experienceYears: String(w.experienceYears), notes: w.notes ?? '',
    contractType: c?.contractType ?? 'official', startDate: c?.startDate ?? emptyWorkerForm.startDate,
    baseSalary: s(c?.baseSalary),
    allowanceResponsibility: s(c?.allowanceResponsibility),
    allowanceAttendance: s(c?.allowanceAttendance),
    ratePerUnit: s(c?.ratePerUnit), unitName: c?.unitName ?? '',
  }
}

export function formToValues(v: WorkerFormShape): WorkerFormValues {
  return {
    fullName: v.fullName, gender: v.gender,
    dateOfBirth: v.dateOfBirth || undefined, idNumber: v.idNumber || undefined,
    phone: v.phone || undefined, address: v.address || undefined,
    position: v.position,
    experienceYears: Number(v.experienceYears), notes: v.notes || undefined,
    contractType: v.contractType, startDate: v.startDate,
    baseSalary: num(v.baseSalary),
    allowanceResponsibility: num(v.allowanceResponsibility),
    allowanceAttendance: num(v.allowanceAttendance),
    ratePerUnit: num(v.ratePerUnit), unitName: v.unitName || undefined,
  }
}
