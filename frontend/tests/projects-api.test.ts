import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/mocks/db'
import { seedProjects } from '@/mocks/seed/projects'
import { createProjectInDb, filterProjects } from '@/api/projects'

beforeEach(() => { db.projects = structuredClone(seedProjects) })

describe('projects mock logic', () => {
  it('createProjectInDb sinh code PRJ00x + join tên customer/site', () => {
    const before = db.projects.length
    const p = createProjectInDb({
      name: 'Dự án thử', projectType: 'commercial', customerId: 'cust-1', siteId: 'site-1',
      deadline: '2026-09-01',
    })
    expect(db.projects.length).toBe(before + 1)
    expect(p.code).toBe('PRJ006')
    expect(p.customer?.name).toContain('Aeon')
    expect(p.site?.name).toContain('Cơ khí')
    expect(p.status).toBe('planning')
  })
  it('filterProjects lọc theo status và search', () => {
    expect(filterProjects(db.projects, { status: 'completed' }).length).toBe(1)
    expect(filterProjects(db.projects, { search: 'samsung' }).length).toBe(1)
    expect(filterProjects(db.projects, { siteId: 'site-1' }).length).toBe(3)
  })
})
