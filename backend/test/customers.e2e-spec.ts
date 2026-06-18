import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor'

describe('Customers (e2e)', () => {
  let app: INestApplication
  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = mod.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.useGlobalInterceptors(new ResponseInterceptor())
    await app.init()
  })
  afterAll(async () => { await app.close() })

  let createdId: string
  it('POST /api/customers tạo mới + sinh code + contacts với primary rule', async () => {
    const res = await request(app.getHttpServer()).post('/api/customers')
      .send({
        name: 'Công ty Test E2E',
        type: 'domestic',
        taxCode: '0123456789',
        contacts: [
          { fullName: 'Nguyễn Văn A', title: 'Giám đốc', phone: '0900000001', email: 'a@test.com' },
          { fullName: 'Trần Thị B', title: 'Kế toán', phone: '0900000002', email: 'b@test.com' },
        ],
      }).expect(201)
    expect(res.body.data.code).toMatch(/^KH\d{3}$/)
    expect(res.body.data.contacts).toHaveLength(2)
    expect(res.body.data.contacts[0].isPrimary).toBe(true)
    expect(res.body.data.contacts[1].isPrimary).toBe(false)
    expect(res.body.data.primaryContact.fullName).toBe('Nguyễn Văn A')
    createdId = res.body.data.id
  })

  it('GET /api/customers trả mảng trong envelope', async () => {
    const res = await request(app.getHttpServer()).get('/api/customers').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('GET /api/customers/:id trả customer kèm contacts[]', async () => {
    const res = await request(app.getHttpServer()).get(`/api/customers/${createdId}`).expect(200)
    expect(res.body.data.id).toBe(createdId)
    expect(Array.isArray(res.body.data.contacts)).toBe(true)
    expect(res.body.data.contacts).toHaveLength(2)
  })

  it('PUT /api/customers/:id thay thế toàn bộ contacts', async () => {
    const res = await request(app.getHttpServer()).put(`/api/customers/${createdId}`)
      .send({
        name: 'Công ty Test E2E',
        type: 'domestic',
        contacts: [
          { fullName: 'Lê Văn C', title: 'Trưởng phòng', phone: '0900000003', email: 'c@test.com' },
        ],
      }).expect(200)
    expect(res.body.data.contacts).toHaveLength(1)
    expect(res.body.data.contacts[0].isPrimary).toBe(true)
    expect(res.body.data.contacts[0].fullName).toBe('Lê Văn C')

    const get = await request(app.getHttpServer()).get(`/api/customers/${createdId}`).expect(200)
    expect(get.body.data.contacts).toHaveLength(1)
    expect(get.body.data.contacts[0].fullName).toBe('Lê Văn C')
  })

  it('POST /api/customers chấp nhận type mới + industry; lọc ?type=domestic không 400', async () => {
    const res = await request(app.getHttpServer()).post('/api/customers')
      .send({
        name: 'Hộ KD Cơ khí Test',
        type: 'household',
        industry: 'Cơ khí chính xác',
        contacts: [{ fullName: 'Người LH', title: 'Chủ', phone: '0900000009', email: 'h@test.com' }],
      }).expect(201)
    expect(res.body.data.type).toBe('household')
    expect(res.body.data.industry).toBe('Cơ khí chính xác')

    const list = await request(app.getHttpServer()).get('/api/customers').query({ type: 'domestic' }).expect(200)
    expect(Array.isArray(list.body.data)).toBe(true)
  })

  it('DELETE /api/customers/:id soft delete', async () => {
    await request(app.getHttpServer()).delete(`/api/customers/${createdId}`).expect(200)
    await request(app.getHttpServer()).get(`/api/customers/${createdId}`).expect(404)
  })
})
