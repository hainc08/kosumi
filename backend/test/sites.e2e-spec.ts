import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor'

describe('Sites (e2e)', () => {
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
  it('POST /api/sites tạo mới + sinh code', async () => {
    const res = await request(app.getHttpServer()).post('/api/sites')
      .send({ name: 'Xưởng test', type: 'factory', address: 'Hà Nội' }).expect(201)
    expect(res.body.data.code).toMatch(/^CS\d{3}$/)
    createdId = res.body.data.id
  })
  it('GET /api/sites trả mảng trong envelope', async () => {
    const res = await request(app.getHttpServer()).get('/api/sites').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })
  it('PATCH /api/sites/:id/status đổi trạng thái', async () => {
    const res = await request(app.getHttpServer()).patch(`/api/sites/${createdId}/status`)
      .send({ status: 'paused' }).expect(200)
    expect(res.body.data.status).toBe('paused')
  })
  it('DELETE /api/sites/:id soft delete', async () => {
    await request(app.getHttpServer()).delete(`/api/sites/${createdId}`).expect(200)
    await request(app.getHttpServer()).get(`/api/sites/${createdId}`).expect(404)
  })
})
