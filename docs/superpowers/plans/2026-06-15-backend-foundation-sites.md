# Backend Foundation + Sites Module — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng nền NestJS + TypeORM + MariaDB và hoàn thiện module **Sites** chạy thật end-to-end (DB → API → Frontend), thiết lập pattern cho 7 module còn lại.

**Architecture:** NestJS modular (controller/service/repository/dto/entities). TypeORM + MariaDB qua `data-source.ts`. Mọi response bọc envelope `{data}` bởi interceptor; FE axios bóc envelope nên component không đổi. Tráo FE qua cờ `VITE_USE_MOCK`, migrate từng module.

**Tech Stack:** NestJS, TypeORM, mysql2, MariaDB 10.11, class-validator, @nestjs/config, @nestjs/swagger, Jest + supertest (test), axios (FE).

**Specs nguồn:** `docs/superpowers/specs/2026-06-15-backend-db-schema-design.md`, `...-backend-api-design.md`, `...-frontend-integration-design.md`.

---

## File Structure (tạo mới)

```
backend/
├── package.json, tsconfig.json, nest-cli.json
├── .env, .env.example
├── src/
│   ├── main.ts                         bootstrap: pipe/filter/interceptor/CORS/swagger
│   ├── app.module.ts                   TypeORM + Config + SitesModule
│   ├── data-source.ts                  TypeORM CLI datasource (migrations)
│   ├── common/
│   │   ├── transformers/numeric.transformer.ts
│   │   ├── interceptors/response.interceptor.ts
│   │   ├── filters/http-exception.filter.ts
│   │   ├── guards/jwt-auth.guard.ts    (tạm: return true)
│   │   └── utils/code.util.ts          makeCode(prefix, seq, pad)
│   ├── database/
│   │   ├── migrations/1718000001000-CreateSites.ts
│   │   └── seeds/sites.seed.ts
│   └── modules/sites/
│       ├── sites.module.ts
│       ├── sites.controller.ts
│       ├── sites.service.ts
│       ├── entities/site.entity.ts
│       └── dto/{create-site.dto.ts, update-site.dto.ts, query-site.dto.ts}
└── test/
    ├── jest-e2e.json
    ├── unit/code.util.spec.ts
    └── sites.e2e-spec.ts
```

---

## PHASE 0 — Nền tảng

### Task 0.1: Scaffold NestJS project

**Files:** tạo `backend/*` (package.json, tsconfig, nest-cli.json, src/main.ts, src/app.module.ts)

- [ ] **Step 1: Scaffold vào backend/**

Run (từ thư mục gốc repo):
```bash
cd backend
npx -y @nestjs/cli@latest new . --package-manager npm --skip-git
```
Khi hỏi overwrite thư mục không rỗng → chọn yes (backend hiện trống).

- [ ] **Step 2: Verify boot**

Run: `npm run start` rồi mở `http://localhost:3000`
Expected: trả "Hello World!" → Ctrl+C dừng.

- [ ] **Step 3: Commit**

```bash
cd ..
git add backend
git commit -m "chore(backend): scaffold NestJS project"
```

### Task 0.2: Cài dependencies

**Files:** Modify `backend/package.json`

- [ ] **Step 1: Cài runtime + dev deps**

Run (trong `backend/`):
```bash
npm i @nestjs/typeorm typeorm mysql2 @nestjs/config @nestjs/swagger class-validator class-transformer
npm i -D supertest @types/supertest
```

- [ ] **Step 2: Verify**

Run: `npm ls typeorm mysql2 @nestjs/config`
Expected: in ra version, không UNMET.

- [ ] **Step 3: Commit**

```bash
git add backend/package.json backend/package-lock.json
git commit -m "chore(backend): add typeorm, mysql2, config, swagger deps"
```

### Task 0.3: Docker DB + biến môi trường

**Files:** Create `backend/.env`, `backend/.env.example`

- [ ] **Step 1: Bật MariaDB + Redis**

Run (gốc repo): `docker compose up -d mariadb redis`
Expected: 2 container `workshop_pro_mariadb`, `workshop_pro_redis` chạy (`docker ps`).

- [ ] **Step 2: Tạo `backend/.env.example`**

```
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=user
DATABASE_PASSWORD=pass
DATABASE_NAME=workshop_pro
REDIS_URL=redis://localhost:6379
PORT=3000
```

- [ ] **Step 3: Tạo `backend/.env`** (copy từ example, cùng giá trị khớp `docker-compose.yml`).

- [ ] **Step 4: Commit** (`.env` đã bị `.gitignore` bỏ qua — chỉ commit example)

```bash
git add backend/.env.example
git commit -m "chore(backend): env template for db/redis"
```

### Task 0.4: TypeORM datasource + AppModule

**Files:** Create `backend/src/data-source.ts`; Modify `backend/src/app.module.ts`

- [ ] **Step 1: `src/data-source.ts`**

```ts
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'
dotenv.config()

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ['src/modules/**/entities/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
})
```

- [ ] **Step 2: `src/app.module.ts`**

```ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/modules/**/entities/*.entity.{ts,js}'],
      synchronize: false,
    }),
  ],
})
export class AppModule {}
```

- [ ] **Step 3: Thêm script migration vào `package.json`**

Trong `"scripts"` thêm:
```json
"typeorm": "typeorm-ts-node-commonjs -d src/data-source.ts",
"migration:run": "npm run typeorm migration:run",
"migration:revert": "npm run typeorm migration:revert",
"seed": "ts-node src/database/seeds/run-seed.ts"
```
Cài: `npm i -D ts-node`

- [ ] **Step 4: Verify kết nối**

Run: `npm run start`
Expected: log Nest khởi động, KHÔNG lỗi `ECONNREFUSED`/`ER_ACCESS_DENIED`. Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add backend/src/data-source.ts backend/src/app.module.ts backend/package.json backend/package-lock.json
git commit -m "feat(backend): typeorm datasource + mariadb connection"
```

### Task 0.5: Common infra (transformer, interceptor, filter, guard, util)

**Files:** Create các file trong `backend/src/common/`; Test `backend/test/unit/code.util.spec.ts`

- [ ] **Step 1: Viết test thất bại cho `makeCode`**

`test/unit/code.util.spec.ts`:
```ts
import { makeCode } from '../../src/common/utils/code.util'

describe('makeCode', () => {
  it('pads sequence to width', () => {
    expect(makeCode('CS', 1)).toBe('CS001')
    expect(makeCode('CN', 42)).toBe('CN042')
    expect(makeCode('CS', 1, 4)).toBe('CS0001')
  })
})
```

- [ ] **Step 2: Chạy test — phải FAIL**

Run: `npm run test -- code.util`
Expected: FAIL "Cannot find module code.util".

- [ ] **Step 3: `src/common/utils/code.util.ts`**

```ts
export function makeCode(prefix: string, seq: number, pad = 3): string {
  return `${prefix}${String(seq).padStart(pad, '0')}`
}
```

- [ ] **Step 4: Chạy test — phải PASS**

Run: `npm run test -- code.util`
Expected: PASS.

- [ ] **Step 5: `src/common/transformers/numeric.transformer.ts`**

```ts
import { ValueTransformer } from 'typeorm'
export class ColumnNumericTransformer implements ValueTransformer {
  to(v: number | null): number | null { return v }
  from(v: string | null): number | null { return v === null ? null : Number(v) }
}
```

- [ ] **Step 6: `src/common/interceptors/response.interceptor.ts`**

```ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) =>
      data && typeof data === 'object' && 'data' in data && 'meta' in data
        ? data            // service đã trả {data, meta}
        : { data },       // bọc payload trần
    ))
  }
}
```

- [ ] **Step 7: `src/common/filters/http-exception.filter.ts`**

```ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>()
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const payload = exception instanceof HttpException ? exception.getResponse() : { message: 'Lỗi máy chủ' }
    const body = typeof payload === 'string' ? { message: payload } : payload
    res.status(status).json({ statusCode: status, ...body as object })
  }
}
```

- [ ] **Step 8: `src/common/guards/jwt-auth.guard.ts` (tạm)**

```ts
import { CanActivate, Injectable } from '@nestjs/common'
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(): boolean { return true } // TODO phase auth: xác thực JWT thật
}
```

- [ ] **Step 9: Commit**

```bash
git add backend/src/common backend/test/unit
git commit -m "feat(backend): common infra (envelope, filter, numeric transformer, code util)"
```

### Task 0.6: Bootstrap main.ts

**Files:** Modify `backend/src/main.ts`

- [ ] **Step 1: `src/main.ts`**

```ts
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  app.enableCors({ origin: ['http://localhost:5173', 'http://localhost:5174'] })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())
  const cfg = new DocumentBuilder().setTitle('WorkShop Pro API').setVersion('1.0').build()
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, cfg))
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
```

- [ ] **Step 2: Verify swagger**

Run: `npm run start` → mở `http://localhost:3000/api/docs`
Expected: trang Swagger UI hiện. Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main.ts
git commit -m "feat(backend): bootstrap with global pipe/filter/interceptor, cors, swagger"
```

---

## PHASE 1 — Module Sites (vertical slice mẫu)

### Task 1.1: Site entity

**Files:** Create `backend/src/modules/sites/entities/site.entity.ts`

- [ ] **Step 1: Viết entity** (enum khớp Spec 1)

```ts
import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { ColumnNumericTransformer } from '../../../common/transformers/numeric.transformer'

@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ unique: true, length: 20 }) code: string
  @Column({ length: 200 }) name: string
  @Column({ type: 'enum', enum: ['factory', 'construction', 'warehouse'] }) type: string
  @Column({ name: 'industrial_zone', length: 200, nullable: true }) industrialZone: string | null
  @Column({ type: 'text' }) address: string
  @Column({ length: 100, nullable: true }) city: string | null
  @Column({ name: 'manager_id', type: 'char', length: 36, nullable: true }) managerId: string | null
  @Column({ length: 20, nullable: true }) phone: string | null
  @Column({ name: 'area_m2', type: 'decimal', precision: 10, scale: 2, nullable: true, transformer: new ColumnNumericTransformer() }) areaM2: number | null
  @Column({ type: 'enum', enum: ['active', 'paused', 'preparing'], default: 'active' }) status: string
  @Column({ type: 'text', nullable: true }) notes: string | null
  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date | null
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/sites/entities
git commit -m "feat(sites): site entity"
```

### Task 1.2: Migration CreateSites

**Files:** Create `backend/src/database/migrations/1718000001000-CreateSites.ts`

- [ ] **Step 1: Viết migration**

```ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateSites1718000001000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.createTable(new Table({
      name: 'sites',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true },
        { name: 'code', type: 'varchar', length: '20', isUnique: true },
        { name: 'name', type: 'varchar', length: '200' },
        { name: 'type', type: 'enum', enum: ['factory', 'construction', 'warehouse'] },
        { name: 'industrial_zone', type: 'varchar', length: '200', isNullable: true },
        { name: 'address', type: 'text' },
        { name: 'city', type: 'varchar', length: '100', isNullable: true },
        { name: 'manager_id', type: 'char', length: '36', isNullable: true },
        { name: 'phone', type: 'varchar', length: '20', isNullable: true },
        { name: 'area_m2', type: 'decimal', precision: 10, scale: 2, isNullable: true },
        { name: 'status', type: 'enum', enum: ['active', 'paused', 'preparing'], default: "'active'" },
        { name: 'notes', type: 'text', isNullable: true },
        { name: 'deleted_at', type: 'datetime', isNullable: true },
        { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
      ],
    }), true)
    await q.createIndex('sites', new TableIndex({ name: 'idx_sites_status', columnNames: ['status'] }))
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.dropTable('sites')
  }
}
```
> Lưu ý MariaDB: id `char(36)` (không dùng `gen_random_uuid()`), UUID do TypeORM sinh ở app layer; `CURRENT_TIMESTAMP` thay `NOW()`.

- [ ] **Step 2: Chạy migration**

Run: `npm run migration:run`
Expected: log "Migration CreateSites1718000001000 has been executed successfully".

- [ ] **Step 3: Verify bảng**

Run: `docker exec workshop_pro_mariadb mariadb -uuser -ppass workshop_pro -e "DESCRIBE sites;"`
Expected: liệt kê đủ cột.

- [ ] **Step 4: Commit**

```bash
git add backend/src/database/migrations
git commit -m "feat(sites): create sites table migration"
```

### Task 1.3: DTOs

**Files:** Create `backend/src/modules/sites/dto/{create-site,update-site,query-site}.dto.ts`

- [ ] **Step 1: `create-site.dto.ts`**

```ts
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateSiteDto {
  @IsString() @IsNotEmpty() name: string
  @IsEnum(['factory', 'construction', 'warehouse']) type: string
  @IsString() @IsNotEmpty() address: string
  @IsOptional() @IsString() industrialZone?: string
  @IsOptional() @IsString() city?: string
  @IsOptional() @IsString() managerId?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsNumber() areaM2?: number
  @IsOptional() @IsEnum(['active', 'paused', 'preparing']) status?: string
  @IsOptional() @IsString() notes?: string
}
```

- [ ] **Step 2: `update-site.dto.ts`**

```ts
import { PartialType } from '@nestjs/swagger'
import { CreateSiteDto } from './create-site.dto'
export class UpdateSiteDto extends PartialType(CreateSiteDto) {}
```

- [ ] **Step 3: `query-site.dto.ts`**

```ts
import { IsEnum, IsOptional, IsString } from 'class-validator'
export class QuerySiteDto {
  @IsOptional() @IsString() search?: string
  @IsOptional() @IsEnum(['factory', 'construction', 'warehouse']) type?: string
  @IsOptional() @IsEnum(['active', 'paused', 'preparing']) status?: string
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/sites/dto
git commit -m "feat(sites): create/update/query dtos"
```

### Task 1.4: SitesService

**Files:** Create `backend/src/modules/sites/sites.service.ts`

- [ ] **Step 1: Viết service**

```ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Site } from './entities/site.entity'
import { CreateSiteDto } from './dto/create-site.dto'
import { UpdateSiteDto } from './dto/update-site.dto'
import { QuerySiteDto } from './dto/query-site.dto'
import { makeCode } from '../../common/utils/code.util'

@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site) private repo: Repository<Site>,
    private dataSource: DataSource,
  ) {}

  async findAll(q: QuerySiteDto): Promise<Site[]> {
    const qb = this.repo.createQueryBuilder('s').where('s.deleted_at IS NULL')
    if (q.search) qb.andWhere('(s.name LIKE :s OR s.code LIKE :s)', { s: `%${q.search}%` })
    if (q.type) qb.andWhere('s.type = :type', { type: q.type })
    if (q.status) qb.andWhere('s.status = :status', { status: q.status })
    return qb.orderBy('s.created_at', 'DESC').getMany()
    // workerCount/projectCount: bổ sung COUNT khi có bảng workers/projects (module sau)
  }

  async findOne(id: string): Promise<Site> {
    const site = await this.repo.findOne({ where: { id } })
    if (!site) throw new NotFoundException('Không tìm thấy công trường')
    return site
  }

  async create(dto: CreateSiteDto): Promise<Site> {
    return this.dataSource.transaction(async (m) => {
      const count = await m.count(Site)
      const site = m.create(Site, { ...dto, code: makeCode('CS', count + 1) })
      return m.save(site)
    })
  }

  async update(id: string, dto: UpdateSiteDto): Promise<Site> {
    const site = await this.findOne(id)
    Object.assign(site, dto)
    return this.repo.save(site)
  }

  async setStatus(id: string, status: string): Promise<Site> {
    const site = await this.findOne(id)
    site.status = status
    return this.repo.save(site)
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    // TODO module workers/projects: chặn xóa nếu còn worker/project → ConflictException
    await this.repo.softDelete(id)
  }
}
```
> Ghi chú: `workerCount`/`projectCount` và chặn-xóa-khi-có-FK sẽ nối vào ở plan module Workers/Projects (cùng pattern). Spec 1 đã liệt kê là "tính khi đọc".

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/sites/sites.service.ts
git commit -m "feat(sites): service crud with code-gen + soft delete"
```

### Task 1.5: Controller + Module

**Files:** Create `backend/src/modules/sites/sites.controller.ts`, `sites.module.ts`; Modify `backend/src/app.module.ts`

- [ ] **Step 1: `sites.controller.ts`**

```ts
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { SitesService } from './sites.service'
import { CreateSiteDto } from './dto/create-site.dto'
import { UpdateSiteDto } from './dto/update-site.dto'
import { QuerySiteDto } from './dto/query-site.dto'

@Controller('sites')
@UseGuards(JwtAuthGuard)
export class SitesController {
  constructor(private svc: SitesService) {}
  @Get() findAll(@Query() q: QuerySiteDto) { return this.svc.findAll(q) }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id) }
  @Post() create(@Body() dto: CreateSiteDto) { return this.svc.create(dto) }
  @Put(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSiteDto) { return this.svc.update(id, dto) }
  @Patch(':id/status') setStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: string) { return this.svc.setStatus(id, status) }
  @Delete(':id') remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id) }
}
```

- [ ] **Step 2: `sites.module.ts`**

```ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Site } from './entities/site.entity'
import { SitesService } from './sites.service'
import { SitesController } from './sites.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Site])],
  controllers: [SitesController],
  providers: [SitesService],
})
export class SitesModule {}
```

- [ ] **Step 3: Đăng ký vào `app.module.ts`**

Thêm `import { SitesModule } from './modules/sites/sites.module'` và thêm `SitesModule` vào mảng `imports`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/sites/sites.controller.ts backend/src/modules/sites/sites.module.ts backend/src/app.module.ts
git commit -m "feat(sites): controller + module wiring"
```

### Task 1.6: E2E test Sites CRUD

**Files:** Create `backend/test/sites.e2e-spec.ts`; ensure `backend/test/jest-e2e.json` tồn tại (Nest scaffold sẵn)

- [ ] **Step 1: Viết e2e test**

```ts
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor'

describe('Sites (e2e)', () => {
  let app: INestApplication
  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = mod.createApplication()
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
```
> Sửa `createApplication` → đúng API: dùng `app = mod.createNestApplication()`.

- [ ] **Step 2: Sửa dòng tạo app**

Đổi `mod.createApplication()` thành `mod.createNestApplication()`.

- [ ] **Step 3: Chạy e2e (cần MariaDB chạy + migration đã run)**

Run: `npm run test:e2e -- sites`
Expected: 4 test PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/test/sites.e2e-spec.ts
git commit -m "test(sites): e2e crud + envelope + soft delete"
```

### Task 1.7: Seed Sites

**Files:** Create `backend/src/database/seeds/sites.seed.ts`, `backend/src/database/seeds/run-seed.ts`

- [ ] **Step 1: `sites.seed.ts`** (port từ `frontend/src/mocks/seed/sites.ts` — đọc file đó lấy 5 site thật)

```ts
import { DataSource } from 'typeorm'
import { Site } from '../../modules/sites/entities/site.entity'
import { makeCode } from '../../common/utils/code.util'

export async function seedSites(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Site)
  if (await repo.count() > 0) return
  const data = [
    { name: 'Xưởng cơ khí Hà Nội', type: 'factory', address: 'KCN Thăng Long, Đông Anh, Hà Nội', industrialZone: 'KCN Thăng Long', city: 'Hà Nội', status: 'active' },
    // ... port đủ 5 site từ frontend/src/mocks/seed/sites.ts
  ]
  await repo.save(data.map((d, i) => repo.create({ ...d, code: makeCode('CS', i + 1) })))
}
```
> Đọc `frontend/src/mocks/seed/sites.ts` để điền đủ 5 bản ghi đúng tên/loại/địa chỉ.

- [ ] **Step 2: `run-seed.ts`**

```ts
import { AppDataSource } from '../../data-source'
import { seedSites } from './sites.seed'

async function run() {
  await AppDataSource.initialize()
  await seedSites(AppDataSource)
  // các seed module sau gọi nối tiếp ở đây
  await AppDataSource.destroy()
  console.log('Seed xong')
}
run()
```

- [ ] **Step 3: Chạy seed**

Run: `npm run seed`
Expected: "Seed xong"; `docker exec workshop_pro_mariadb mariadb -uuser -ppass workshop_pro -e "SELECT code,name FROM sites;"` in 5 dòng.

- [ ] **Step 4: Commit**

```bash
git add backend/src/database/seeds
git commit -m "feat(sites): seed 5 sites from prototype data"
```

---

## PHASE 2 — Tráo Frontend module Sites

### Task 2.1: Axios client + env

**Files:** Create `frontend/src/api/http.ts`; Modify `frontend/.env` (tạo nếu chưa có), `frontend/.env.example`

- [ ] **Step 1: `frontend/src/api/http.ts`**

```ts
import axios from 'axios'

const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })
http.interceptors.response.use(
  (r) => r.data.data,
  (err) => Promise.reject(err.response?.data ?? { message: 'Lỗi kết nối máy chủ' }),
)
export default http
```

- [ ] **Step 2: `.env` + `.env.example`** (frontend)

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK=true
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/http.ts frontend/.env.example
git commit -m "feat(fe): axios http client + env flags"
```

### Task 2.2: Tráo `api/sites.ts` sang real (giữ signature + queryKey)

**Files:** Modify `frontend/src/api/sites.ts`

- [ ] **Step 1: Thêm cờ + nhánh real cho từng hàm**

Đầu file thêm:
```ts
import http from './http'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
```
Đổi `queryFn`/`mutationFn` theo mẫu (giữ nguyên `queryKey`, tham số hook):
```ts
// useSites
queryFn: () => USE_MOCK ? mockRequest(() => filterSites(filters)) : http.get('/sites', { params: filters }),
// useCreateSite
mutationFn: (dto) => USE_MOCK ? mockRequest(() => createSiteInDb(dto)) : http.post('/sites', dto),
// useUpdateSite
mutationFn: ({ id, dto }) => USE_MOCK ? mockRequest(() => updateSiteInDb(id, dto)) : http.put(`/sites/${id}`, dto),
// useSetSiteStatus
mutationFn: ({ id, status }) => USE_MOCK ? mockRequest(() => setSiteStatusInDb(id, status)) : http.patch(`/sites/${id}/status`, { status }),
```
> Giữ nguyên các hàm thuần (`filterSites`, `createSiteInDb`...) cho test Vitest.

- [ ] **Step 2: Verify build FE**

Run (trong `frontend/`): `npm run build`
Expected: `tsc -b && vite build` PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/sites.ts
git commit -m "feat(fe): wire sites api to backend behind VITE_USE_MOCK"
```

### Task 2.3: Verify end-to-end thật

**Files:** không sửa code

- [ ] **Step 1: Bật real mode**

Sửa `frontend/.env`: `VITE_USE_MOCK=false`. Đảm bảo backend `npm run start` đang chạy + đã `migration:run` + `seed`.

- [ ] **Step 2: Chạy FE + kiểm tra trên browser**

Run (trong `frontend/`): `npm run dev`
Mở trang **Công trường / Xưởng**.
Expected:
- Danh sách 5 công trường từ MariaDB (KPI tổng = 5).
- Tạo mới 1 công trường → toast "✓ Đã thêm…", danh sách tăng, mã CS00x.
- Đổi trạng thái → badge cập nhật.
- Xóa → biến mất khỏi danh sách (soft delete trong DB).
- Network tab: request tới `http://localhost:3000/api/sites`.

- [ ] **Step 3: Trả env về mock mặc định cho dev khác**

Sửa `frontend/.env` về `VITE_USE_MOCK=true` (mặc định an toàn khi backend chưa chạy). Real mode bật thủ công khi test tích hợp.

- [ ] **Step 4: Commit (nếu có thay đổi .env mẫu/ghi chú)** — thường không cần commit `.env` (đã ignore).

---

## Scope ngoài plan này (các plan kế tiếp, cùng pattern)

Sau khi Sites verify xong, mỗi module dưới đây = 1 plan riêng lặp lại Phase 1 + Phase 2 (entity→migration→dto→service→controller→e2e→seed→tráo FE→verify), theo thứ tự FK:

1. **Workers + WorkerContracts** (1-active contract, addContract; nối `workerCount` cho Sites)
2. **Customers + Contacts** (contacts lồng, primaryContact)
3. **Projects** (join site/customer, `quoteCount`/`workerCount`; nối `projectCount` cho Sites)
4. **Quotes + Items + PaymentSteps** (totals tính khi đọc, tạo project mới trong transaction, `/quotes/next-code` → sửa nhỏ QuoteForm async)
5. **Tasks + Assignments** (enrichTask, available-workers, assign/unassign/transfer/bulk, 1-active assignment)
6. **Timesheet** (PayCalculatorService port `timesheet-calc.ts`, summaries gộp `DATE_FORMAT('%Y-%m')`, approve)
7. **Dashboard** (stats/activity/workers-by-site aggregation)

Dọn cuối cùng (sau khi mọi module real): xóa `frontend/src/api/client.ts`, `mocks/db.ts`, `mocks/seed/*`; chuyển/loại test Vitest dùng mock.

Phase auth/users để sau cùng (bật `JwtAuthGuard` thật + `/auth/*`).
