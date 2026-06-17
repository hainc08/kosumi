import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { Site } from './entities/site.entity'
import { Worker } from '../workers/entities/worker.entity'
import { Project } from '../projects/entities/project.entity'
import { CreateSiteDto } from './dto/create-site.dto'
import { UpdateSiteDto } from './dto/update-site.dto'
import { QuerySiteDto } from './dto/query-site.dto'
import { makeCode } from '../../common/utils/code.util'

export type SiteWithCounts = Site & { workerCount: number; projectCount: number }

type SiteAgg = { workerCount: number; projectCount: number }
const ZERO_AGG: SiteAgg = { workerCount: 0, projectCount: 0 }

@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site) private repo: Repository<Site>,
    private dataSource: DataSource,
  ) {}

  /** Đếm số công nhân + số dự án theo từng công trường (batch, tránh N+1). */
  private async loadAggregates(ids: string[]): Promise<Map<string, SiteAgg>> {
    const map = new Map<string, SiteAgg>()
    for (const id of ids) map.set(id, { workerCount: 0, projectCount: 0 })
    if (ids.length === 0) return map

    const [workerRows, projRows] = await Promise.all([
      this.dataSource.getRepository(Worker).createQueryBuilder('w')
        .select('w.siteId', 'sid')
        .addSelect('COUNT(*)', 'cnt')
        .where('w.siteId IN (:...ids)', { ids })
        .andWhere('w.deletedAt IS NULL')
        .groupBy('w.siteId')
        .getRawMany<{ sid: string; cnt: string }>(),
      this.dataSource.getRepository(Project).createQueryBuilder('p')
        .select('p.siteId', 'sid')
        .addSelect('COUNT(*)', 'cnt')
        .where('p.siteId IN (:...ids)', { ids })
        .andWhere('p.deletedAt IS NULL')
        .groupBy('p.siteId')
        .getRawMany<{ sid: string; cnt: string }>(),
    ])
    for (const r of workerRows) {
      const a = map.get(r.sid)
      if (a) a.workerCount = Number(r.cnt)
    }
    for (const r of projRows) {
      const a = map.get(r.sid)
      if (a) a.projectCount = Number(r.cnt)
    }
    return map
  }

  private enrich(site: Site, agg: SiteAgg): SiteWithCounts {
    return { ...site, workerCount: agg.workerCount, projectCount: agg.projectCount }
  }

  async findAll(q: QuerySiteDto): Promise<SiteWithCounts[]> {
    const qb = this.repo.createQueryBuilder('s').where('s.deleted_at IS NULL')
    if (q.search) qb.andWhere('(s.name LIKE :s OR s.code LIKE :s)', { s: `%${q.search}%` })
    if (q.type) qb.andWhere('s.type = :type', { type: q.type })
    if (q.status) qb.andWhere('s.status = :status', { status: q.status })
    const sites = await qb.orderBy('s.created_at', 'DESC').getMany()
    if (sites.length === 0) return []
    const aggById = await this.loadAggregates(sites.map((s) => s.id))
    return sites.map((s) => this.enrich(s, aggById.get(s.id) ?? ZERO_AGG))
  }

  async findOne(id: string): Promise<Site> {
    const site = await this.repo.findOne({ where: { id } })
    if (!site) throw new NotFoundException('Không tìm thấy công trường')
    return site
  }

  /** Như findOne nhưng kèm aggregate (dùng cho các endpoint trả về client). */
  private async findOneWithCounts(id: string): Promise<SiteWithCounts> {
    const site = await this.findOne(id)
    const aggById = await this.loadAggregates([id])
    return this.enrich(site, aggById.get(id) ?? ZERO_AGG)
  }

  async create(dto: CreateSiteDto): Promise<SiteWithCounts> {
    const saved = await this.dataSource.transaction(async (m) => {
      // Đếm CẢ bản đã xóa mềm để mã tăng đơn điệu, tránh trùng `code` (unique) sau khi xóa.
      const count = await m.count(Site, { withDeleted: true })
      const site = m.create(Site, { ...dto, code: makeCode('CS', count + 1) })
      return m.save(site)
    })
    // Công trường mới chưa có công nhân/dự án → aggregate = 0.
    return this.enrich(saved, ZERO_AGG)
  }

  async update(id: string, dto: UpdateSiteDto): Promise<SiteWithCounts> {
    const site = await this.findOne(id)
    Object.assign(site, dto)
    await this.repo.save(site)
    return this.findOneWithCounts(id)
  }

  async setStatus(id: string, status: string): Promise<SiteWithCounts> {
    const site = await this.findOne(id)
    site.status = status
    await this.repo.save(site)
    return this.findOneWithCounts(id)
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    // TODO module workers/projects: chặn xóa nếu còn worker/project → ConflictException
    await this.repo.softDelete(id)
  }
}
