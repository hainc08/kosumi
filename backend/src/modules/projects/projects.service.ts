import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { Project } from './entities/project.entity'
import { Site } from '../sites/entities/site.entity'
import { Customer } from '../customers/entities/customer.entity'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { QueryProjectDto } from './dto/query-project.dto'
import { makeCode } from '../../common/utils/code.util'

export type ProjectWithRelations = Project & {
  site?: { id: string; name: string }
  customer?: { id: string; name: string }
  quoteCount: number
  workerCount: number
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private repo: Repository<Project>,
    @InjectRepository(Site) private siteRepo: Repository<Site>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    private dataSource: DataSource,
  ) {}

  /** Gắn site/customer mini-object và các aggregate (DEFERRED) cho 1 project. */
  private async enrich(project: Project): Promise<ProjectWithRelations> {
    const [site, customer] = await Promise.all([
      project.siteId ? this.siteRepo.findOne({ where: { id: project.siteId } }) : Promise.resolve(null),
      project.customerId ? this.customerRepo.findOne({ where: { id: project.customerId } }) : Promise.resolve(null),
    ])
    return {
      ...project,
      site: site ? { id: site.id, name: site.name } : undefined,
      customer: customer ? { id: customer.id, name: customer.name } : undefined,
      // TODO module quotes/tasks: thay 0 bằng COUNT thực tế khi có bảng quotes/tasks
      quoteCount: 0,
      workerCount: 0,
    }
  }

  /** Gắn site/customer mini-object cho nhiều project bằng 2 batch query (tránh N+1). */
  private async enrichMany(projects: Project[]): Promise<ProjectWithRelations[]> {
    if (projects.length === 0) return []

    const siteIds = [...new Set(projects.map((p) => p.siteId).filter((id): id is string => !!id))]
    const customerIds = [...new Set(projects.map((p) => p.customerId).filter((id): id is string => !!id))]

    const [sites, customers] = await Promise.all([
      siteIds.length ? this.siteRepo.find({ where: { id: In(siteIds) } }) : Promise.resolve([]),
      customerIds.length ? this.customerRepo.find({ where: { id: In(customerIds) } }) : Promise.resolve([]),
    ])
    const siteById = new Map(sites.map((s) => [s.id, s]))
    const customerById = new Map(customers.map((c) => [c.id, c]))

    return projects.map((p) => {
      const site = p.siteId ? siteById.get(p.siteId) : undefined
      const customer = p.customerId ? customerById.get(p.customerId) : undefined
      return {
        ...p,
        site: site ? { id: site.id, name: site.name } : undefined,
        customer: customer ? { id: customer.id, name: customer.name } : undefined,
        // TODO module quotes/tasks: thay 0 bằng COUNT thực tế khi có bảng quotes/tasks
        quoteCount: 0,
        workerCount: 0,
      }
    })
  }

  async findAll(q: QueryProjectDto): Promise<ProjectWithRelations[]> {
    const qb = this.repo.createQueryBuilder('p').where('p.deleted_at IS NULL')
    if (q.search) qb.andWhere('(p.name LIKE :s OR p.code LIKE :s)', { s: `%${q.search}%` })
    if (q.status) qb.andWhere('p.status = :status', { status: q.status })
    if (q.siteId) qb.andWhere('p.site_id = :siteId', { siteId: q.siteId })
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
