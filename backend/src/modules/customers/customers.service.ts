import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { Customer } from './entities/customer.entity'
import { CustomerContact } from './entities/customer-contact.entity'
import { Project } from '../projects/entities/project.entity'
import { Quote } from '../quotes/entities/quote.entity'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { CreateCustomerContactDto } from './dto/create-customer-contact.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'
import { QueryCustomerDto } from './dto/query-customer.dto'
import { makeCode } from '../../common/utils/code.util'

export type CustomerWithContacts = Customer & {
  contacts: CustomerContact[]
  primaryContact?: { fullName: string; phone: string | null; email: string | null }
  projectCount: number
  quoteCount: number
  totalContractValue: number
}

type CustomerAgg = { projectCount: number; quoteCount: number; totalContractValue: number }
const ZERO_AGG: CustomerAgg = { projectCount: 0, quoteCount: 0, totalContractValue: 0 }

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private repo: Repository<Customer>,
    @InjectRepository(CustomerContact) private contactRepo: Repository<CustomerContact>,
    private dataSource: DataSource,
  ) {}

  /** Đếm số dự án/báo giá và tổng giá trị hợp đồng theo từng khách hàng (batch, tránh N+1). */
  private async loadAggregates(ids: string[]): Promise<Map<string, CustomerAgg>> {
    const map = new Map<string, CustomerAgg>()
    for (const id of ids) map.set(id, { projectCount: 0, quoteCount: 0, totalContractValue: 0 })
    if (ids.length === 0) return map

    const [projRows, quoteRows] = await Promise.all([
      this.dataSource.getRepository(Project).createQueryBuilder('p')
        .select('p.customerId', 'cid')
        .addSelect('COUNT(*)', 'cnt')
        .addSelect('COALESCE(SUM(p.contract_value), 0)', 'total')
        .where('p.customerId IN (:...ids)', { ids })
        .andWhere('p.deletedAt IS NULL')
        .groupBy('p.customerId')
        .getRawMany<{ cid: string; cnt: string; total: string }>(),
      this.dataSource.getRepository(Quote).createQueryBuilder('q')
        .select('q.customerId', 'cid')
        .addSelect('COUNT(*)', 'cnt')
        .where('q.customerId IN (:...ids)', { ids })
        .andWhere('q.deletedAt IS NULL')
        .groupBy('q.customerId')
        .getRawMany<{ cid: string; cnt: string }>(),
    ])
    for (const r of projRows) {
      const a = map.get(r.cid)
      if (a) { a.projectCount = Number(r.cnt); a.totalContractValue = Number(r.total) }
    }
    for (const r of quoteRows) {
      const a = map.get(r.cid)
      if (a) a.quoteCount = Number(r.cnt)
    }
    return map
  }

  /** Gắn contacts (sắp theo sortOrder), primaryContact và aggregate (số dự án/báo giá, tổng giá trị) cho 1 customer. */
  private enrich(customer: Customer, contacts: CustomerContact[], agg: CustomerAgg): CustomerWithContacts {
    const sorted = [...contacts].sort((a, b) => a.sortOrder - b.sortOrder)
    const primary = sorted.find((c) => c.isPrimary)
    return {
      ...customer,
      contacts: sorted,
      primaryContact: primary
        ? { fullName: primary.fullName, phone: primary.phone, email: primary.email }
        : undefined,
      projectCount: agg.projectCount,
      quoteCount: agg.quoteCount,
      totalContractValue: agg.totalContractValue,
    }
  }

  async findAll(q: QueryCustomerDto): Promise<CustomerWithContacts[]> {
    const qb = this.repo.createQueryBuilder('c').where('c.deleted_at IS NULL')
    if (q.search) {
      qb.andWhere(
        '(c.name LIKE :s OR c.code LIKE :s OR c.tax_code LIKE :s OR EXISTS (SELECT 1 FROM customer_contacts cc WHERE cc.customer_id = c.id AND cc.full_name LIKE :s))',
        { s: `%${q.search}%` },
      )
    }
    if (q.type) qb.andWhere('c.type = :type', { type: q.type })
    if (q.status) qb.andWhere('c.status = :status', { status: q.status })
    const customers = await qb.orderBy('c.created_at', 'DESC').getMany()
    if (customers.length === 0) return []

    const ids = customers.map((c) => c.id)
    const [contacts, aggById] = await Promise.all([
      this.contactRepo.find({ where: { customerId: In(ids) } }),
      this.loadAggregates(ids),
    ])
    const byCustomer = new Map<string, CustomerContact[]>()
    for (const ct of contacts) {
      const list = byCustomer.get(ct.customerId) ?? []
      list.push(ct)
      byCustomer.set(ct.customerId, list)
    }
    return customers.map((c) => this.enrich(c, byCustomer.get(c.id) ?? [], aggById.get(c.id) ?? ZERO_AGG))
  }

  async findOne(id: string): Promise<CustomerWithContacts> {
    const customer = await this.repo.findOne({ where: { id } })
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng')
    const [contacts, aggById] = await Promise.all([
      this.contactRepo.find({ where: { customerId: id } }),
      this.loadAggregates([id]),
    ])
    return this.enrich(customer, contacts, aggById.get(id) ?? ZERO_AGG)
  }

  /** Tạo entity contact theo "primary rule": contact đầu tiên = isPrimary true, sortOrder = index. */
  private buildContactEntities(customerId: string, raw: CreateCustomerContactDto[] | undefined): CustomerContact[] {
    const list = raw ?? []
    return list.map((c, i) =>
      this.contactRepo.create({
        customerId,
        fullName: c.fullName,
        title: c.title ?? null,
        phone: c.phone ?? null,
        email: c.email ?? null,
        isPrimary: i === 0,
        sortOrder: i,
      }),
    )
  }

  async create(dto: CreateCustomerDto): Promise<CustomerWithContacts> {
    const result = await this.dataSource.transaction(async (m) => {
      // Đếm CẢ bản đã xóa mềm để mã tăng đơn điệu, tránh trùng `code` (unique) sau khi xóa.
      const count = await m.count(Customer, { withDeleted: true })
      const customer = m.create(Customer, {
        name: dto.name,
        type: dto.type,
        taxCode: dto.taxCode ?? null,
        address: dto.address ?? null,
        website: dto.website ?? null,
        status: dto.status ?? 'active',
        defaultValidityDays: dto.defaultValidityDays ?? 10,
        defaultDeliveryDays: dto.defaultDeliveryDays ?? 50,
        defaultPaymentTerms: dto.defaultPaymentTerms ?? '30-25-35-10',
        defaultWarrantyNote: dto.defaultWarrantyNote ?? null,
        defaultSpecialNote: dto.defaultSpecialNote ?? null,
        notes: dto.notes ?? null,
        code: makeCode('KH', count + 1),
      })
      const saved = await m.save(customer)

      const contacts = this.buildContactEntities(saved.id, dto.contacts)
      const savedContacts = contacts.length ? await m.save(CustomerContact, contacts) : []

      return { customer: saved, contacts: savedContacts }
    })
    // Khách hàng mới chưa có dự án/báo giá nào → aggregate = 0.
    return this.enrich(result.customer, result.contacts, ZERO_AGG)
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerWithContacts> {
    const customer = await this.repo.findOne({ where: { id } })
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng')

    const { contacts, ...customerFields } = dto
    Object.assign(customer, customerFields)

    const result = await this.dataSource.transaction(async (m) => {
      const saved = await m.save(Customer, customer)

      // FE luôn gửi lại toàn bộ danh sách contact → thay thế hoàn toàn.
      await m.delete(CustomerContact, { customerId: id })
      const newContacts = this.buildContactEntities(id, contacts)
      const savedContacts = newContacts.length ? await m.save(CustomerContact, newContacts) : []

      return { customer: saved, contacts: savedContacts }
    })
    const aggById = await this.loadAggregates([id])
    return this.enrich(result.customer, result.contacts, aggById.get(id) ?? ZERO_AGG)
  }

  async remove(id: string): Promise<void> {
    const customer = await this.repo.findOne({ where: { id } })
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng')
    // TODO module projects/quotes: chặn xóa nếu còn project/quote đang gắn với khách hàng này → ConflictException
    await this.repo.softDelete(id)
  }
}
