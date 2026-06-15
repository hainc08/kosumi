import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor'

describe('Timesheet (e2e)', () => {
  let app: INestApplication

  type SummaryDto = {
    workerId: string
    yearMonth: string
    totalWorkdays: number
    totalRegularHours: number
    totalOtHours: number
    totalLeaveDays: number
    totalAbsentDays: number
    totalPay: number
    baseSalary: number | null
    allowance: number | null
    status: string
    worker?: { id: string; code: string; fullName: string }
  }

  type EntryDto = {
    id: string
    workerId: string
    workDate: string
    status: string
  }

  let latestMonth: string
  let sampleWorkerId: string

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = mod.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.useGlobalInterceptors(new ResponseInterceptor())
    await app.init()

    const monthsRes = await request(app.getHttpServer()).get('/api/timesheet/months').expect(200)
    const months: string[] = monthsRes.body.data
    expect(Array.isArray(months)).toBe(true)
    expect(months.length).toBeGreaterThan(0)
    expect(months[0]).toMatch(/^\d{4}-\d{2}$/)
    latestMonth = months[0]

    const summariesRes = await request(app.getHttpServer())
      .get('/api/timesheet/summaries')
      .query({ yearMonth: latestMonth })
      .expect(200)
    const summaries: SummaryDto[] = summariesRes.body.data
    expect(Array.isArray(summaries)).toBe(true)
    expect(summaries.length).toBeGreaterThan(0)
    sampleWorkerId = summaries[0].workerId
  })

  afterAll(async () => { await app.close() })

  it('GET /api/timesheet/months trả mảng tháng YYYY-MM trong envelope', async () => {
    const res = await request(app.getHttpServer()).get('/api/timesheet/months').expect(200)
    const months: string[] = res.body.data
    expect(Array.isArray(months)).toBe(true)
    expect(months.length).toBeGreaterThan(0)
    for (const m of months) expect(m).toMatch(/^\d{4}-\d{2}$/)
  })

  it('GET /api/timesheet/summaries?yearMonth=<month> trả MonthlySummary cho từng worker', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/timesheet/summaries')
      .query({ yearMonth: latestMonth })
      .expect(200)
    const summaries: SummaryDto[] = res.body.data
    expect(Array.isArray(summaries)).toBe(true)
    expect(summaries.length).toBeGreaterThan(0)

    const row = summaries[0]
    expect(row).toHaveProperty('workerId')
    expect(row).toHaveProperty('totalWorkdays')
    expect(row).toHaveProperty('totalRegularHours')
    expect(row).toHaveProperty('totalOtHours')
    expect(row).toHaveProperty('totalLeaveDays')
    expect(row).toHaveProperty('totalAbsentDays')
    expect(row).toHaveProperty('totalPay')
    expect(row).toHaveProperty('status')
    expect(row.worker).toHaveProperty('id')
    expect(row.worker).toHaveProperty('code')
    expect(row.worker).toHaveProperty('fullName')
  })

  it('GET /api/timesheet/summaries (không yearMonth) mặc định tháng mới nhất, không rỗng', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/timesheet/summaries')
      .query({ yearMonth: '', siteId: '', search: '' })
      .expect(200)
    const summaries: SummaryDto[] = res.body.data
    expect(Array.isArray(summaries)).toBe(true)
    expect(summaries.length).toBeGreaterThan(0)
    expect(summaries[0].yearMonth).toBe(latestMonth)
  })

  it('GET /api/timesheet/entries?workerId=&yearMonth= trả ngày công của worker, sắp theo ngày tăng dần', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/timesheet/entries')
      .query({ workerId: sampleWorkerId, yearMonth: latestMonth })
      .expect(200)
    const entries: EntryDto[] = res.body.data
    expect(Array.isArray(entries)).toBe(true)
    expect(entries.length).toBeGreaterThan(0)
    for (const e of entries) expect(e.workerId).toBe(sampleWorkerId)

    const dates = entries.map((e) => e.workDate)
    const sorted = [...dates].sort()
    expect(dates).toEqual(sorted)
  })

  it('POST /api/timesheet/approve -> sau khi duyệt, summary worker đó = approved (idempotent)', async () => {
    // Idempotent: không phụ thuộc có worker 'submitted' sẵn (không có API tạo entry pending).
    // Duyệt 1 worker bất kỳ rồi xác nhận trạng thái = approved; chạy lại nhiều lần vẫn đúng.
    await request(app.getHttpServer())
      .post('/api/timesheet/approve')
      .send({ workerId: sampleWorkerId, yearMonth: latestMonth })
      .expect(201)

    const afterRes = await request(app.getHttpServer())
      .get('/api/timesheet/summaries')
      .query({ yearMonth: latestMonth })
      .expect(200)
    const after: SummaryDto[] = afterRes.body.data
    const row = after.find((s) => s.workerId === sampleWorkerId)
    expect(row?.status).toBe('approved')
  })
})
