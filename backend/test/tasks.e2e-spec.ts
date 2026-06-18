import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor'

describe('Tasks (e2e)', () => {
  let app: INestApplication

  type TaskDto = {
    id: string
    status: string
    activeWorkers?: { id: string }[]
    assignments?: { workerId: string; isActive: boolean; transferredFromTaskId?: string | null }[]
  }

  let unassignedTaskId: string
  let anotherUnassignedTaskId: string
  let freeWorkerId: string

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = mod.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.useGlobalInterceptors(new ResponseInterceptor())
    await app.init()

    const active = await request(app.getHttpServer()).get('/api/tasks/active').expect(200)
    const tasks: TaskDto[] = active.body.data
    expect(Array.isArray(tasks)).toBe(true)
    expect(tasks.length).toBeGreaterThan(0)

    const unassigned = tasks.filter((t) => t.status === 'unassigned')
    expect(unassigned.length).toBeGreaterThanOrEqual(2)
    unassignedTaskId = unassigned[0].id
    anotherUnassignedTaskId = unassigned[1].id

    const available = await request(app.getHttpServer())
      .get('/api/tasks/available-workers')
      .query({ siteId: 'any' })
      .expect(200)
    const workers: { id: string }[] = available.body.data
    expect(Array.isArray(workers)).toBe(true)
    expect(workers.length).toBeGreaterThan(0)
    freeWorkerId = workers[0].id
  })

  afterAll(async () => { await app.close() })

  it('GET /api/tasks/active trả danh sách task trong envelope', async () => {
    const res = await request(app.getHttpServer()).get('/api/tasks/active').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    const task = res.body.data[0]
    expect(task).toHaveProperty('assignments')
    expect(task).toHaveProperty('activeWorkers')
  })

  it('GET /api/tasks/available-workers trả danh sách worker kèm initials/avatarColor', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tasks/available-workers')
      .query({ siteId: 'any' })
      .expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    const worker = res.body.data[0]
    expect(worker).toHaveProperty('initials')
    expect(worker).toHaveProperty('avatarColor')
    expect(worker.status).toBe('working')
  })

  it('GET /api/tasks?quoteId= trả task của 1 báo giá (mảng rỗng nếu quote không có item)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tasks')
      .query({ quoteId: 'non-existent-quote-id' })
      .expect(200)
    expect(res.body.data).toEqual([])
  })

  it('POST /api/tasks/:id/assign giao công nhân -> task chuyển in_progress và worker xuất hiện trong activeWorkers', async () => {
    await request(app.getHttpServer())
      .post(`/api/tasks/${unassignedTaskId}/assign`)
      .send({ workerId: freeWorkerId })
      .expect(201)

    const active = await request(app.getHttpServer()).get('/api/tasks/active').expect(200)
    const task: TaskDto = active.body.data.find((t: TaskDto) => t.id === unassignedTaskId)
    expect(task.status).toBe('in_progress')
    expect(task.activeWorkers?.map((w) => w.id)).toContain(freeWorkerId)
  })

  it('POST /api/tasks/assign lần 2 với cùng (taskId, workerId) là idempotent', async () => {
    await request(app.getHttpServer())
      .post(`/api/tasks/${unassignedTaskId}/assign`)
      .send({ workerId: freeWorkerId })
      .expect(201)

    const active = await request(app.getHttpServer()).get('/api/tasks/active').expect(200)
    const task: TaskDto = active.body.data.find((t: TaskDto) => t.id === unassignedTaskId)
    const matching = task.activeWorkers?.filter((w) => w.id === freeWorkerId) ?? []
    expect(matching).toHaveLength(1)
  })

  it('POST /api/tasks/transfer chuyển công nhân sang task khác, assignment mới có transferredFromTaskId', async () => {
    await request(app.getHttpServer())
      .post('/api/tasks/transfer')
      .send({ workerId: freeWorkerId, fromTaskId: unassignedTaskId, toTaskId: anotherUnassignedTaskId })
      .expect(201)

    const active = await request(app.getHttpServer()).get('/api/tasks/active').expect(200)
    const tasks: TaskDto[] = active.body.data

    const fromTask = tasks.find((t) => t.id === unassignedTaskId)!
    expect(fromTask.activeWorkers?.map((w) => w.id)).not.toContain(freeWorkerId)

    const toTask = tasks.find((t) => t.id === anotherUnassignedTaskId)!
    expect(toTask.status).toBe('in_progress')
    expect(toTask.activeWorkers?.map((w) => w.id)).toContain(freeWorkerId)
    const assignment = toTask.assignments?.find((a) => a.workerId === freeWorkerId)
    expect(assignment?.transferredFromTaskId).toBe(unassignedTaskId)
  })

  it('POST /api/tasks/:id/unassign bỏ giao -> worker không còn trong activeWorkers', async () => {
    await request(app.getHttpServer())
      .post(`/api/tasks/${anotherUnassignedTaskId}/unassign`)
      .send({ workerId: freeWorkerId })
      .expect(201)

    const active = await request(app.getHttpServer()).get('/api/tasks/active').expect(200)
    const task: TaskDto = active.body.data.find((t: TaskDto) => t.id === anotherUnassignedTaskId)
    expect(task.activeWorkers?.map((w) => w.id)).not.toContain(freeWorkerId)
    expect(task.status).toBe('unassigned')
  })

  it('POST /assign với otHours -> assignment is_overtime + ot_end_at', async () => {
    // đảm bảo worker rảnh
    await request(app.getHttpServer()).post(`/api/tasks/${anotherUnassignedTaskId}/assign`)
      .send({ workerId: freeWorkerId, otHours: 2 }).expect(201)
    const active = await request(app.getHttpServer()).get('/api/tasks/active').expect(200)
    const t = active.body.data.find((x: { id: string }) => x.id === anotherUnassignedTaskId)
    const a = t.assignments.find((x: { workerId: string }) => x.workerId === freeWorkerId)
    expect(a.isOvertime).toBe(true)
    expect(a.otEndAt).toBeTruthy()
    // dọn dẹp
    await request(app.getHttpServer()).post(`/api/tasks/${anotherUnassignedTaskId}/unassign`).send({ workerId: freeWorkerId }).expect(201)
  })
})
