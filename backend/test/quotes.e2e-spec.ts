import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor'

describe('Quotes (e2e)', () => {
  let app: INestApplication
  let projectId: string

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = mod.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.useGlobalInterceptors(new ResponseInterceptor())
    await app.init()

    const projects = await request(app.getHttpServer()).get('/api/projects').expect(200)
    projectId = projects.body.data[0].id
  })
  afterAll(async () => { await app.close() })

  let createdId: string
  let createdCode: string

  it('GET /api/quotes/next-code trả mã WS#### kế tiếp', async () => {
    const res = await request(app.getHttpServer()).get('/api/quotes/next-code').expect(200)
    expect(res.body.data).toMatch(/^WS\d{4}$/)
  })

  it('POST /api/quotes tạo mới với items + paymentSteps, tính tổng đúng', async () => {
    const res = await request(app.getHttpServer()).post('/api/quotes')
      .send({
        projectId,
        title: 'Báo giá Test E2E',
        quoteDate: '2026-06-15',
        taxRate: 8,
        validityDays: 14,
        deliveryDays: 30,
        paymentTerms: '50-50',
        items: [
          { itemName: 'Hạng mục A', unit: 'm2', quantity: 10, unitPrice: 100000 },
          { itemName: 'Hạng mục B', unit: 'cái', quantity: 5, unitPrice: 200000 },
        ],
        paymentSteps: [
          { percentage: 50, description: 'Tạm ứng' },
          { percentage: 50, description: 'Bàn giao' },
        ],
      }).expect(201)

    expect(res.body.data.code).toMatch(/^WS\d{4}$/)
    expect(res.body.data.status).toBe('draft')
    expect(res.body.data.itemCount).toBe(2)

    const subtotal = 10 * 100000 + 5 * 200000
    const expectedTotal = subtotal * (1 + 8 / 100)
    expect(res.body.data.subtotal).toBe(subtotal)
    expect(res.body.data.totalAmount).toBe(expectedTotal)

    createdId = res.body.data.id
    createdCode = res.body.data.code
  })

  it('POST /api/quotes với newProjectName + projectId rỗng → tạo dự án mới', async () => {
    const newProjectName = `Gói thầu mới từ báo giá E2E ${Date.now()}`
    const res = await request(app.getHttpServer()).post('/api/quotes')
      .send({
        projectId: '',
        newProjectName,
        title: 'Báo giá tạo dự án mới',
        quoteDate: '2026-06-15',
        taxRate: 8,
        validityDays: 14,
        deliveryDays: 30,
        paymentTerms: '50-50',
        items: [{ itemName: 'Hạng mục X', unit: 'm2', quantity: 1, unitPrice: 1000000 }],
        paymentSteps: [{ percentage: 100, description: 'Thanh toán 1 lần' }],
      }).expect(201)

    expect(res.body.data.projectId).toBeTruthy()
    expect(res.body.data.project?.name).toBe(newProjectName)

    const after = await request(app.getHttpServer()).get('/api/projects').expect(200)
    expect(after.body.data.find((p: { id: string }) => p.id === res.body.data.projectId)).toBeTruthy()
  })

  it('GET /api/quotes/:id trả items + paymentSteps + tổng', async () => {
    const res = await request(app.getHttpServer()).get(`/api/quotes/${createdId}`).expect(200)
    expect(res.body.data.id).toBe(createdId)
    expect(res.body.data.items).toHaveLength(2)
    expect(res.body.data.paymentSteps).toHaveLength(2)
    expect(res.body.data.totalAmount).toBeGreaterThan(0)
  })

  it('GET /api/quotes hỗ trợ filter', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/quotes')
      .query({ search: '', status: '', customerId: '', projectId: '' })
      .expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.find((q: { id: string }) => q.id === createdId)).toBeTruthy()
  })

  it('PATCH /api/quotes/:id/status chuyển sang pending', async () => {
    const res = await request(app.getHttpServer()).patch(`/api/quotes/${createdId}/status`)
      .send({ status: 'pending' }).expect(200)
    expect(res.body.data.status).toBe('pending')
  })

  it('POST /api/quotes/:id/duplicate tạo bản sao với mã mới + title (Copy)', async () => {
    const res = await request(app.getHttpServer()).post(`/api/quotes/${createdId}/duplicate`).expect(201)
    expect(res.body.data.code).toMatch(/^WS\d{4}$/)
    expect(res.body.data.code).not.toBe(createdCode)
    expect(res.body.data.title).toBe('Báo giá Test E2E (Copy)')
    expect(res.body.data.status).toBe('draft')
    expect(res.body.data.items).toHaveLength(2)
    expect(res.body.data.paymentSteps).toHaveLength(2)
  })

  it('DELETE /api/quotes/:id soft delete', async () => {
    await request(app.getHttpServer()).delete(`/api/quotes/${createdId}`).expect(200)
    await request(app.getHttpServer()).get(`/api/quotes/${createdId}`).expect(404)
  })
})
