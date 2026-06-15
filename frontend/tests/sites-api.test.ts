import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/mocks/db'
import { seedSites } from '@/mocks/seed/sites'
import { seedWorkers } from '@/mocks/seed/workers'
import { seedProjects } from '@/mocks/seed/projects'
import { filterSites, enrichSite, createSiteInDb, updateSiteInDb, setSiteStatusInDb } from '@/api/sites'

beforeEach(() => {
  db.sites = structuredClone(seedSites)
  db.workers = structuredClone(seedWorkers)
  db.projects = structuredClone(seedProjects)
})

describe('sites mock logic', () => {
  it('enrichSite đếm đúng số công nhân & dự án theo db', () => {
    const s1 = enrichSite(db.sites.find((s) => s.id === 'site-1')!)
    // site-1: workers w-1, w-3, w-4 (w-6/w-7 đã chuyển sang site-3)
    expect(s1.workerCount).toBe(3)
    // site-1: prj-3, prj-4, prj-5
    expect(s1.projectCount).toBe(3)
    const s3 = enrichSite(db.sites.find((s) => s.id === 'site-3')!)
    expect(s3.workerCount).toBe(2) // w-6, w-7
  })

  it('filterSites lọc theo status, type và search', () => {
    expect(filterSites(db.sites, { status: 'active' }).length).toBe(2) // site-1, site-2
    expect(filterSites(db.sites, { type: 'construction' }).map((s) => s.id)).toEqual(['site-3'])
    expect(filterSites(db.sites, { search: 'long biên' }).length).toBe(1)
  })

  it('createSiteInDb thêm xưởng mới với mã tăng dần', () => {
    const before = db.sites.length
    const s = createSiteInDb({ name: 'Xưởng mới Test', type: 'warehouse', status: 'preparing', address: 'Số 1 ABC' })
    expect(db.sites.length).toBe(before + 1)
    expect(s.code).toMatch(/^CS\d{3}$/)
    expect(s.workerCount).toBe(0)
  })

  it('updateSiteInDb cập nhật & setSiteStatusInDb đổi trạng thái', () => {
    const u = updateSiteInDb('site-2', { name: 'Xưởng LB đổi tên', type: 'factory', status: 'active', address: 'addr' })
    expect(u?.name).toBe('Xưởng LB đổi tên')
    const p = setSiteStatusInDb('site-2', 'paused')
    expect(p?.status).toBe('paused')
  })
})
