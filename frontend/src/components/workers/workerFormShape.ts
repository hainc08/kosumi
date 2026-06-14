import { z } from 'zod'
import type { PrimarySkill, ContractType, Worker } from '@/types'
import type { WorkerFormValues } from '@/api/workers'

/** Form dùng input text cho mọi field số (convert sang number khi submit). */
export interface WorkerFormShape {
  fullName: string
  gender: 'male' | 'female'
  dateOfBirth: string
  idNumber: string
  phone: string
  address: string
  siteId: string
  primarySkill: PrimarySkill
  experienceYears: string
  notes: string
  contractType: ContractType
  startDate: string
  rateNormal: string
  rateOvertime: string
  baseSalary: string
  allowance: string
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
    siteId: z.string(),
    primarySkill: z.enum([
      'welding_electric', 'welding_tig', 'cnc_cutting', 'laser_cutting',
      'assembly', 'painting', 'qc_inspection', 'other',
    ]),
    experienceYears: z.string().refine((v) => {
      const n = Number(v)
      return v !== '' && !Number.isNaN(n) && n >= 0 && n <= 50
    }, 'Kinh nghiệm phải từ 0–50 năm'),
    notes: z.string(),
    contractType: z.enum(['hourly', 'daily', 'monthly', 'piece']),
    startDate: z.string().min(1, 'Bắt buộc chọn ngày bắt đầu'),
    rateNormal: z.string(),
    rateOvertime: z.string(),
    baseSalary: z.string(),
    allowance: z.string(),
    ratePerUnit: z.string(),
    unitName: z.string(),
  })
  .superRefine((v, ctx) => {
    const rn = num(v.rateNormal)
    if ((v.contractType === 'hourly' || v.contractType === 'daily') && (!rn || rn < 1000)) {
      ctx.addIssue({ code: 'custom', path: ['rateNormal'], message: 'Đơn giá tối thiểu 1.000đ' })
    }
    if (v.contractType === 'monthly' && (!num(v.baseSalary) || (num(v.baseSalary) ?? 0) < 1000)) {
      ctx.addIssue({ code: 'custom', path: ['baseSalary'], message: 'Nhập lương cơ bản' })
    }
    if (v.contractType === 'piece') {
      if (!num(v.ratePerUnit)) ctx.addIssue({ code: 'custom', path: ['ratePerUnit'], message: 'Nhập đơn giá/đơn vị' })
      if (v.unitName.trim() === '') ctx.addIssue({ code: 'custom', path: ['unitName'], message: 'Nhập tên đơn vị' })
    }
  })

export const emptyWorkerForm: WorkerFormShape = {
  fullName: '', gender: 'male', dateOfBirth: '', idNumber: '', phone: '', address: '',
  siteId: '', primarySkill: 'welding_electric', experienceYears: '0', notes: '',
  contractType: 'hourly', startDate: new Date().toISOString().slice(0, 10),
  rateNormal: '', rateOvertime: '', baseSalary: '', allowance: '', ratePerUnit: '', unitName: '',
}

export function workerToForm(w: Worker): WorkerFormShape {
  const c = w.activeContract
  const s = (n: number | null | undefined) => (n == null ? '' : String(n))
  return {
    fullName: w.fullName, gender: w.gender, dateOfBirth: w.dateOfBirth ?? '',
    idNumber: w.idNumber ?? '', phone: w.phone ?? '', address: w.address ?? '',
    siteId: w.siteId ?? '', primarySkill: w.primarySkill,
    experienceYears: String(w.experienceYears), notes: w.notes ?? '',
    contractType: c?.contractType ?? 'hourly', startDate: c?.startDate ?? emptyWorkerForm.startDate,
    rateNormal: s(c?.rateNormal), rateOvertime: s(c?.rateOvertime),
    baseSalary: s(c?.baseSalary), allowance: s(c?.allowance),
    ratePerUnit: s(c?.ratePerUnit), unitName: c?.unitName ?? '',
  }
}

export function formToValues(v: WorkerFormShape): WorkerFormValues {
  return {
    fullName: v.fullName, gender: v.gender,
    dateOfBirth: v.dateOfBirth || undefined, idNumber: v.idNumber || undefined,
    phone: v.phone || undefined, address: v.address || undefined,
    siteId: v.siteId || undefined, primarySkill: v.primarySkill,
    experienceYears: Number(v.experienceYears), notes: v.notes || undefined,
    contractType: v.contractType, startDate: v.startDate,
    rateNormal: num(v.rateNormal), rateOvertime: num(v.rateOvertime),
    baseSalary: num(v.baseSalary), allowance: num(v.allowance),
    ratePerUnit: num(v.ratePerUnit), unitName: v.unitName || undefined,
  }
}
