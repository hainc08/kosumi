import type { Site } from '@/types'

export const seedSites: Site[] = [
  {
    id: 'site-1', code: 'XHN001', name: 'Xưởng Cơ khí Hà Nội', type: 'factory',
    industrialZone: 'KCN Thăng Long', address: 'Lô A1, KCN Thăng Long, Đông Anh',
    city: 'Hà Nội', managerId: null, phone: '0241234567', areaM2: 1200,
    status: 'active', notes: null,
    createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z',
    workerCount: 10, projectCount: 3,
  },
  {
    id: 'site-2', code: 'XHN002', name: 'Xưởng Nội thất Long Biên', type: 'factory',
    industrialZone: null, address: 'Số 5 Ngõ 100 Nguyễn Văn Cừ, Long Biên',
    city: 'Hà Nội', managerId: null, phone: '0249876543', areaM2: 800,
    status: 'active', notes: null,
    createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z',
    workerCount: 8, projectCount: 2,
  },
  {
    id: 'site-3', code: 'CTSG001', name: 'Công trường Aeon Bình Tân', type: 'construction',
    industrialZone: null, address: 'Aeon Mall Bình Tân, TP.HCM',
    city: 'TP.HCM', managerId: null, phone: '0281122334', areaM2: null,
    status: 'preparing', notes: null,
    createdAt: '2026-03-15T00:00:00Z', updatedAt: '2026-03-15T00:00:00Z',
    workerCount: 2, projectCount: 1,
  },
]
