import { Injectable, NotFoundException } from '@nestjs/common'
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
