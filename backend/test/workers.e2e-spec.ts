import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor'

describe('Workers (e2e)', () => {
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
  it('POST /api/workers tạo mới + sinh code + activeContract + initials/avatarColor', async () => {
    const res = await request(app.getHttpServer()).post('/api/workers')
      .send({
        fullName: 'Nguyễn Văn Test',
        gender: 'male',
        position: 'worker',
        experienceYears: 2,
        contractType: 'official',
        startDate: '2026-01-01',
        baseSalary: 8000000,
      }).expect(201)
    expect(res.body.data.code).toMatch(/^CN\d{3}$/)
    expect(res.body.data.activeContract).toBeTruthy()
    expect(res.body.data.activeContract.contractType).toBe('official')
    expect(res.body.data.initials).toBeTruthy()
    expect(res.body.data.avatarColor).toBeTruthy()
    createdId = res.body.data.id
  })

  it('GET /api/workers trả mảng trong envelope', async () => {
    const res = await request(app.getHttpServer()).get('/api/workers').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('GET /api/workers/:id trả worker kèm activeContract', async () => {
    const res = await request(app.getHttpServer()).get(`/api/workers/${createdId}`).expect(200)
    expect(res.body.data.id).toBe(createdId)
    expect(res.body.data.activeContract).toBeTruthy()
  })

  it('PATCH /api/workers/:id/status đổi trạng thái', async () => {
    const res = await request(app.getHttpServer()).patch(`/api/workers/${createdId}/status`)
      .send({ status: 'on_leave' }).expect(200)
    expect(res.body.data.status).toBe('on_leave')
  })

  it('DELETE /api/workers/:id soft delete', async () => {
    await request(app.getHttpServer()).delete(`/api/workers/${createdId}`).expect(200)
    await request(app.getHttpServer()).get(`/api/workers/${createdId}`).expect(404)
  })
})
