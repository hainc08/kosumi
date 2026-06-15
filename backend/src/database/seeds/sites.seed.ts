import { DataSource } from 'typeorm'
import { Site } from '../../modules/sites/entities/site.entity'
import { makeCode } from '../../common/utils/code.util'

export async function seedSites(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Site)
  if (await repo.count() > 0) return
  const data = [
    // Ported from frontend/src/mocks/seed/sites.ts
    {
      name: 'Xưởng Cơ khí Hà Nội',
      type: 'factory',
      industrialZone: 'KCN Thăng Long',
      address: 'Lô A1, KCN Thăng Long, Đông Anh',
      city: 'Hà Nội',
      phone: '0241234567',
      areaM2: 1200,
      status: 'active',
      notes: null,
    },
    {
      name: 'Xưởng Nội thất Long Biên',
      type: 'factory',
      industrialZone: null,
      address: 'Số 5 Ngõ 100 Nguyễn Văn Cừ, Long Biên',
      city: 'Hà Nội',
      phone: '0249876543',
      areaM2: 800,
      status: 'active',
      notes: null,
    },
    {
      name: 'Công trường Aeon Bình Tân',
      type: 'construction',
      industrialZone: null,
      address: 'Aeon Mall Bình Tân, TP.HCM',
      city: 'TP.HCM',
      phone: '0281122334',
      areaM2: null,
      status: 'preparing',
      notes: null,
    },
    {
      name: 'Kho vật tư Bắc Ninh',
      type: 'warehouse',
      industrialZone: 'KCN Quế Võ',
      address: 'Đường TS5, KCN Quế Võ, Bắc Ninh',
      city: 'Bắc Ninh',
      phone: '0222345678',
      areaM2: 2500,
      status: 'active',
      notes: null,
    },
    {
      name: 'Công trường Vincity Hà Nam',
      type: 'construction',
      industrialZone: null,
      address: 'Khu đô thị Vincity, Phủ Lý, Hà Nam',
      city: 'Hà Nam',
      phone: '0226789012',
      areaM2: null,
      status: 'paused',
      notes: 'Tạm hoãn chờ phê duyệt mặt bằng',
    },
  ]
  await repo.save(data.map((d, i) => repo.create({ ...d, code: makeCode('CS', i + 1) })))
}
