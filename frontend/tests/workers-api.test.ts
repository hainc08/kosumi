import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/mocks/db'
import { seedWorkers } from '@/mocks/seed/workers'
import { createWorkerInDb, filterWorkers } from '@/api/workers'

beforeEach(() => { db.workers = structuredClone(seedWorkers) })

describe('workers mock logic', () => {
  it('createWorkerInDb thêm worker mới với code tăng + initials + activeContract', () => {
    const before = db.workers.length
    const w = createWorkerInDb({
      fullName: 'Phạm Văn Đức', gender: 'male', primarySkill: 'assembly',
      experienceYears: 2, contractType: 'hourly', startDate: '2026-06-01', rateNormal: 30000,
    })
    expect(db.workers.length).toBe(before + 1)
    expect(w.code).toBe('CN009')
    expect(w.initials).toBe('PĐ')
    expect(w.activeContract?.contractType).toBe('hourly')
    expect(w.status).toBe('working')
  })
  it('filterWorkers lọc theo status và search', () => {
    expect(filterWorkers(db.workers, { status: 'on_leave' }).length).toBe(1)
    expect(filterWorkers(db.workers, { search: 'mai' }).length).toBe(1)
  })
})
