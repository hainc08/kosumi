import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { Project } from './entities/project.entity'
import { Site } from '../sites/entities/site.entity'
import { Customer } from '../customers/entities/customer.entity'
import { Quote } from '../quotes/entities/quote.entity'
import { Task } from '../tasks/entities/task.entity'
import { TaskAssignment } from '../tasks/entities/task-assignment.entity'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { QueryProjectDto } from './dto/query-project.dto'
import { makeCode } from '../../common/utils/code.util'

export type QuoteMini = { id: string; code: string; title: string; status: string }

export type ProjectWithRelations = Project & {
  site?: { id: string; name: string }
  customer?: { id: string; name: string }
  quoteCount: number
  workerCount: number
  quotes: QuoteMini[]
}

type ProjectAgg = { quoteCount: number; workerCount: number; quotes: QuoteMini[] }
const ZERO_AGG: ProjectAgg = { quoteCount: 0, workerCount: 0, quotes: [] }

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private repo: Repository<Project>,
    @InjectRepository(Site) private siteRepo: Repository<Site>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    private dataSource: DataSource,
  ) {}

  /** Đếm số báo giá + số công nhân (distinct, đang active) theo từng dự án (batch, tránh N+1). */
  private async loadAggregates(ids: string[]): Promise<Map<string, ProjectAgg>> {
    const map = new Map<string, ProjectAgg>()
    for (const id of ids) map.set(id, { quoteCount: 0, workerCount: 0, quotes: [] })
    if (ids.length === 0) return map

    const [quoteRows, workerRows] = await Promise.all([
      // Lấy danh sách báo giá (mã, tiêu đề, trạng thái) của từng dự án — vừa để hiển thị vừa đếm.
      this.dataSource.getRepository(Quote).createQueryBuilder('q')
        .select('q.id', 'id')
        .addSelect('q.code', 'code')
        .addSelect('q.title', 'title')
        .addSelect('q.status', 'status')
        .addSelect('q.projectId', 'pid')
        .where('q.projectId IN (:...ids)', { ids })
        .andWhere('q.deletedAt IS NULL')
        .orderBy('q.code', 'ASC')
        .getRawMany<{ id: string; code: string; title: string; status: string; pid: string }>(),
      this.dataSource.getRepository(TaskAssignment).createQueryBuilder('ta')
        .innerJoin(Task, 't', 't.id = ta.task_id')
        .select('t.project_id', 'pid')
        .addSelect('COUNT(DISTINCT ta.worker_id)', 'cnt')
        .where('t.project_id IN (:...ids)', { ids })
        .andWhere('ta.isActive = :active', { active: true })
        .groupBy('t.project_id')
        .getRawMany<{ pid: string; cnt: string }>(),
    ])
    for (const r of quoteRows) {
      const a = map.get(r.pid)
      if (a) { a.quotes.push({ id: r.id, code: r.code, title: r.title, status: r.status }); a.quoteCount += 1 }
    }
    for (const r of workerRows) {
      const a = map.get(r.pid)
      if (a) a.workerCount = Number(r.cnt)
    }
    return map
  }

  /** Gắn site/customer mini-object và aggregate (số báo giá, số công nhân) cho 1 project. */
  private async enrich(project: Project): Promise<ProjectWithRelations> {
    const [site, customer, aggById] = await Promise.all([
      project.siteId ? this.siteRepo.findOne({ where: { id: project.siteId } }) : Promise.resolve(null),
      project.customerId ? this.customerRepo.findOne({ where: { id: project.customerId } }) : Promise.resolve(null),
      this.loadAggregates([project.id]),
    ])
    const agg = aggById.get(project.id) ?? ZERO_AGG
    return {
      ...project,
      site: site ? { id: site.id, name: site.name } : undefined,
      customer: customer ? { id: customer.id, name: customer.name } : undefined,
      quoteCount: agg.quoteCount,
      workerCount: agg.workerCount,
      quotes: agg.quotes,
    }
  }

  /** Gắn site/customer mini-object + aggregate cho nhiều project bằng batch query (tránh N+1). */
  private async enrichMany(projects: Project[]): Promise<ProjectWithRelations[]> {
    if (projects.length === 0) return []

    const siteIds = [...new Set(projects.map((p) => p.siteId).filter((id): id is string => !!id))]
    const customerIds = [...new Set(projects.map((p) => p.customerId).filter((id): id is string => !!id))]

    const [sites, customers, aggById] = await Promise.all([
      siteIds.length ? this.siteRepo.find({ where: { id: In(siteIds) } }) : Promise.resolve([]),
      customerIds.length ? this.customerRepo.find({ where: { id: In(customerIds) } }) : Promise.resolve([]),
      this.loadAggregates(projects.map((p) => p.id)),
    ])
    const siteById = new Map(sites.map((s) => [s.id, s]))
    const customerById = new Map(customers.map((c) => [c.id, c]))

    return projects.map((p) => {
      const site = p.siteId ? siteById.get(p.siteId) : undefined
      const customer = p.customerId ? customerById.get(p.customerId) : undefined
      const agg = aggById.get(p.id) ?? ZERO_AGG
      return {
        ...p,
        site: site ? { id: site.id, name: site.name } : undefined,
        customer: customer ? { id: customer.id, name: customer.name } : undefined,
        quoteCount: agg.quoteCount,
        workerCount: agg.workerCount,
        quotes: agg.quotes,
      }
    })
  }

  async findAll(q: QueryProjectDto): Promise<ProjectWithRelations[]> {
    const qb = this.repo.createQueryBuilder('p').where('p.deleted_at IS NULL')
    if (q.search) qb.andWhere('(p.name LIKE :s OR p.code LIKE :s)', { s: `%${q.search}%` })
    if (q.status) qb.andWhere('p.status = :status', { status: q.status })
    if (q.siteId) qb.andWhere('p.site_id = :siteId', { siteId: q.siteId })
    // Lọc theo mã báo giá: chỉ dự án có báo giá khớp mã (khớp 1 phần, không phân biệt hoa thường).
    if (q.quoteCode) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM quotes qq WHERE qq.project_id = p.id AND qq.deleted_at IS NULL AND qq.code LIKE :qc)',
        { qc: `%${q.quoteCode}%` },
      )
    }
    const projects = await qb.orderBy('p.created_at', 'DESC').getMany()
    return this.enrichMany(projects)
  }

  async findOne(id: string): Promise<ProjectWithRelations> {
    const project = await this.repo.findOne({ where: { id } })
    if (!project) throw new NotFoundException('Không tìm thấy dự án')
    return this.enrich(project)
  }

  async create(dto: CreateProjectDto): Promise<ProjectWithRelations> {
    const saved = await this.dataSource.transaction(async (m) => {
      // Đếm CẢ bản đã xóa mềm để mã tăng đơn điệu, tránh trùng `code` (unique) sau khi xóa.
      const count = await m.count(Project, { withDeleted: true })
      const project = m.create(Project, {
        name: dto.name,
        customerId: dto.customerId ?? null,
        projectType: dto.projectType,
        siteId: dto.siteId ?? null,
        contractValue: dto.contractValue ?? null,
        startDate: dto.startDate ?? null,
        deadline: dto.deadline,
        actualEndDate: null,
        progressPct: dto.progressPct ?? 0,
        status: dto.status ?? 'planning',
        description: dto.description ?? null,
        managerId: null,
        code: makeCode('PRJ', count + 1),
      })
      return m.save(project)
    })
    return this.enrich(saved)
  }

  async update(id: string, dto: UpdateProjectDto): Promise<ProjectWithRelations> {
    const project = await this.repo.findOne({ where: { id } })
    if (!project) throw new NotFoundException('Không tìm thấy dự án')
    Object.assign(project, dto)
    const saved = await this.repo.save(project)
    return this.enrich(saved)
  }

  async setStatus(id: string, status: string): Promise<ProjectWithRelations> {
    const project = await this.repo.findOne({ where: { id } })
    if (!project) throw new NotFoundException('Không tìm thấy dự án')
    project.status = status
    const saved = await this.repo.save(project)
    return this.enrich(saved)
  }

  async remove(id: string): Promise<void> {
    const project = await this.repo.findOne({ where: { id } })
    if (!project) throw new NotFoundException('Không tìm thấy dự án')
    // TODO module quotes: chặn xóa nếu còn quote đang gắn với dự án này → ConflictException
    await this.repo.softDelete(id)
  }
}
