import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor'

describe('Projects (e2e)', () => {
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
  it('POST /api/projects tạo mới + sinh code + defaults', async () => {
    const res = await request(app.getHttpServer()).post('/api/projects')
      .send({
        name: 'Dự án Test E2E',
        projectType: 'commercial',
        deadline: '2026-12-31',
      }).expect(201)
    expect(res.body.data.code).toMatch(/^PRJ\d{3}$/)
    expect(res.body.data.status).toBe('planning')
    expect(res.body.data.progressPct).toBe(0)
    createdId = res.body.data.id
  })

  it('GET /api/projects trả mảng trong envelope', async () => {
    const res = await request(app.getHttpServer()).get('/api/projects').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('GET /api/projects/:id trả project', async () => {
    const res = await request(app.getHttpServer()).get(`/api/projects/${createdId}`).expect(200)
    expect(res.body.data.id).toBe(createdId)
  })

  it('PATCH /api/projects/:id/status đổi trạng thái', async () => {
    const res = await request(app.getHttpServer()).patch(`/api/projects/${createdId}/status`)
      .send({ status: 'in_progress' }).expect(200)
    expect(res.body.data.status).toBe('in_progress')

    const get = await request(app.getHttpServer()).get(`/api/projects/${createdId}`).expect(200)
    expect(get.body.data.status).toBe('in_progress')
  })

  it('DELETE /api/projects/:id soft delete', async () => {
    await request(app.getHttpServer()).delete(`/api/projects/${createdId}`).expect(200)
    await request(app.getHttpServer()).get(`/api/projects/${createdId}`).expect(404)
  })
})
