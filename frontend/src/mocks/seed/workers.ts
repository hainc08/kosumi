import type { Worker } from '@/types'

export const seedWorkers: Worker[] = [
  {
    id: 'w-1', code: 'CN001', fullName: 'Nguyễn Văn Hùng', gender: 'male',
    dateOfBirth: '1990-05-12', idNumber: '001090012345', phone: '0901234567',
    address: 'Đông Anh, Hà Nội', siteId: 'site-1', primarySkill: 'welding_tig',
    experienceYears: 8, status: 'working', notes: null,
    createdAt: '2026-01-12T00:00:00Z', updatedAt: '2026-01-12T00:00:00Z',
    initials: 'NH', avatarColor: '#1D4ED8',
    site: { id: 'site-1', name: 'Xưởng Cơ khí Hà Nội' },
    activeContract: {
      id: 'c-1', workerId: 'w-1', contractType: 'hourly', startDate: '2026-01-12',
      endDate: null, rateNormal: 45000, rateOvertime: 67500, baseSalary: null,
      allowance: null, ratePerUnit: null, unitName: null, isActive: true,
      createdAt: '2026-01-12T00:00:00Z', updatedAt: '2026-01-12T00:00:00Z',
    },
  },
  {
    id: 'w-2', code: 'CN002', fullName: 'Trần Thị Mai', gender: 'female',
    dateOfBirth: '1995-09-03', idNumber: '001195067890', phone: '0912345678',
    address: 'Long Biên, Hà Nội', siteId: 'site-2', primarySkill: 'painting',
    experienceYears: 4, status: 'working', notes: null,
    createdAt: '2026-02-02T00:00:00Z', updatedAt: '2026-02-02T00:00:00Z',
    initials: 'TM', avatarColor: '#16A34A',
    site: { id: 'site-2', name: 'Xưởng Nội thất Long Biên' },
    activeContract: {
      id: 'c-2', workerId: 'w-2', contractType: 'monthly', startDate: '2026-02-02',
      endDate: null, rateNormal: null, rateOvertime: null, baseSalary: 9000000,
      allowance: 800000, ratePerUnit: null, unitName: null, isActive: true,
      createdAt: '2026-02-02T00:00:00Z', updatedAt: '2026-02-02T00:00:00Z',
    },
  },
  {
    id: 'w-3', code: 'CN003', fullName: 'Lê Văn Tâm', gender: 'male',
    dateOfBirth: '1988-12-20', idNumber: '001088054321', phone: '0987654321',
    address: 'Gia Lâm, Hà Nội', siteId: 'site-1', primarySkill: 'cnc_cutting',
    experienceYears: 10, status: 'on_leave', notes: 'Nghỉ phép năm',
    createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z',
    initials: 'LT', avatarColor: '#D97706',
    site: { id: 'site-1', name: 'Xưởng Cơ khí Hà Nội' },
    activeContract: {
      id: 'c-3', workerId: 'w-3', contractType: 'daily', startDate: '2026-01-15',
      endDate: null, rateNormal: 400000, rateOvertime: 75000, baseSalary: null,
      allowance: null, ratePerUnit: null, unitName: null, isActive: true,
      createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z',
    },
  },
]
