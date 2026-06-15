import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { Customer } from './entities/customer.entity'
import { CustomerContact } from './entities/customer-contact.entity'
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

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private repo: Repository<Customer>,
    @InjectRepository(CustomerContact) private contactRepo: Repository<CustomerContact>,
    private dataSource: DataSource,
  ) {}

  /** Gắn contacts (sắp theo sortOrder), primaryContact và các aggregate (DEFERRED) cho 1 customer. */
  private enrich(customer: Customer, contacts: CustomerContact[]): CustomerWithContacts {
    const sorted = [...contacts].sort((a, b) => a.sortOrder - b.sortOrder)
    const primary = sorted.find((c) => c.isPrimary)
    return {
      ...customer,
      contacts: sorted,
      primaryContact: primary
        ? { fullName: primary.fullName, phone: primary.phone, email: primary.email }
        : undefined,
      // TODO module projects/quotes: thay 0 bằng COUNT/SUM thực tế khi có bảng projects/quotes
      projectCount: 0,
      quoteCount: 0,
      totalContractValue: 0,
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
    const contacts = await this.contactRepo.find({ where: { customerId: In(ids) } })
    const byCustomer = new Map<string, CustomerContact[]>()
    for (const ct of contacts) {
      const list = byCustomer.get(ct.customerId) ?? []
      list.push(ct)
      byCustomer.set(ct.customerId, list)
    }
    return customers.map((c) => this.enrich(c, byCustomer.get(c.id) ?? []))
  }

  async findOne(id: string): Promise<CustomerWithContacts> {
    const customer = await this.repo.findOne({ where: { id } })
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng')
    const contacts = await this.contactRepo.find({ where: { customerId: id } })
    return this.enrich(customer, contacts)
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
    return this.enrich(result.customer, result.contacts)
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
    return this.enrich(result.customer, result.contacts)
  }

  async remove(id: string): Promise<void> {
    const customer = await this.repo.findOne({ where: { id } })
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng')
    // TODO module projects/quotes: chặn xóa nếu còn project/quote đang gắn với khách hàng này → ConflictException
    await this.repo.softDelete(id)
  }
}
