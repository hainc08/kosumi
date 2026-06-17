import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { Worker } from './entities/worker.entity'
import { WorkerContract } from './entities/worker-contract.entity'
import { CreateWorkerDto } from './dto/create-worker.dto'
import { UpdateWorkerDto } from './dto/update-worker.dto'
import { QueryWorkerDto } from './dto/query-worker.dto'
import { makeCode } from '../../common/utils/code.util'
import { deriveInitials, avatarColorFor } from '../../common/utils/worker-display.util'

export type WorkerWithContract = Worker & {
  activeContract: WorkerContract | null
  initials: string
  avatarColor: string
}

@Injectable()
export class WorkersService {
  constructor(
    @InjectRepository(Worker) private repo: Repository<Worker>,
    @InjectRepository(WorkerContract) private contractRepo: Repository<WorkerContract>,
    private dataSource: DataSource,
  ) {}

  /** Gắn activeContract + initials + avatarColor cho danh sách worker. */
  private async enrich(workers: Worker[]): Promise<WorkerWithContract[]> {
    if (workers.length === 0) return []
    const ids = workers.map((w) => w.id)
    const contracts = await this.contractRepo.find({ where: { workerId: In(ids), isActive: true } })
    const byWorker = new Map<string, WorkerContract>()
    for (const c of contracts) byWorker.set(c.workerId, c)
    return workers.map((w) => ({
      ...w,
      activeContract: byWorker.get(w.id) ?? null,
      initials: deriveInitials(w.fullName),
      avatarColor: avatarColorFor(w.id),
    }))
  }

  private async enrichOne(worker: Worker): Promise<WorkerWithContract> {
    const [result] = await this.enrich([worker])
    return result
  }

  async findAll(q: QueryWorkerDto): Promise<WorkerWithContract[]> {
    const qb = this.repo.createQueryBuilder('w').where('w.deleted_at IS NULL')
    if (q.search) qb.andWhere('(w.full_name LIKE :s OR w.code LIKE :s)', { s: `%${q.search}%` })
    if (q.status) qb.andWhere('w.status = :status', { status: q.status })
    if (q.position) qb.andWhere('w.position = :position', { position: q.position })
    if (q.siteId) qb.andWhere('w.site_id = :siteId', { siteId: q.siteId })
    const workers = await qb.orderBy('w.created_at', 'DESC').getMany()
    return this.enrich(workers)
  }

  async findOne(id: string): Promise<WorkerWithContract> {
    const worker = await this.repo.findOne({ where: { id } })
    if (!worker) throw new NotFoundException('Không tìm thấy nhân viên')
    return this.enrichOne(worker)
  }

  async create(dto: CreateWorkerDto): Promise<WorkerWithContract> {
    const worker = await this.dataSource.transaction(async (m) => {
      // Đếm CẢ bản đã xóa mềm để mã tăng đơn điệu, tránh trùng `code` (unique) sau khi xóa.
      const count = await m.count(Worker, { withDeleted: true })
      const worker = m.create(Worker, {
        fullName: dto.fullName,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ?? null,
        idNumber: dto.idNumber ?? null,
        phone: dto.phone ?? null,
        address: dto.address ?? null,
        position: dto.position,
        specialty: dto.specialty ?? null,
        notes: dto.notes ?? null,
        siteId: dto.siteId ?? null,
        status: 'working',
        code: makeCode('CN', count + 1),
      })
      const saved = await m.save(worker)

      const contract = m.create(WorkerContract, {
        workerId: saved.id,
        contractType: dto.contractType,
        startDate: dto.startDate,
        endDate: null,
        baseSalary: dto.baseSalary ?? null,
        allowanceResponsibility: dto.allowanceResponsibility ?? null,
        allowanceAttendance: dto.allowanceAttendance ?? null,
        ratePerUnit: dto.ratePerUnit ?? null,
        unitName: dto.unitName ?? null,
        isActive: true,
      })
      await m.save(contract)

      return saved
    })
    return this.enrichOne(worker)
  }

  async update(id: string, dto: UpdateWorkerDto): Promise<WorkerWithContract> {
    const worker = await this.repo.findOne({ where: { id } })
    if (!worker) throw new NotFoundException('Không tìm thấy nhân viên')

    const {
      contractType, startDate, baseSalary, allowanceResponsibility,
      allowanceAttendance, ratePerUnit, unitName, ...workerFields
    } = dto
    Object.assign(worker, workerFields)
    await this.repo.save(worker)

    // FE chỉnh sửa cùng activeContract đang tồn tại (không tạo hợp đồng mới).
    const activeContract = await this.contractRepo.findOne({ where: { workerId: id, isActive: true } })
    if (activeContract) {
      if (contractType !== undefined) activeContract.contractType = contractType
      if (startDate !== undefined) activeContract.startDate = startDate
      if (baseSalary !== undefined) activeContract.baseSalary = baseSalary
      if (allowanceResponsibility !== undefined) activeContract.allowanceResponsibility = allowanceResponsibility
      if (allowanceAttendance !== undefined) activeContract.allowanceAttendance = allowanceAttendance
      if (ratePerUnit !== undefined) activeContract.ratePerUnit = ratePerUnit
      if (unitName !== undefined) activeContract.unitName = unitName
      await this.contractRepo.save(activeContract)
    }

    return this.enrichOne(worker)
  }

  async setStatus(id: string, status: string): Promise<WorkerWithContract> {
    const worker = await this.repo.findOne({ where: { id } })
    if (!worker) throw new NotFoundException('Không tìm thấy nhân viên')
    worker.status = status
    await this.repo.save(worker)
    return this.enrichOne(worker)
  }

  async remove(id: string): Promise<void> {
    const worker = await this.repo.findOne({ where: { id } })
    if (!worker) throw new NotFoundException('Không tìm thấy nhân viên')
    // TODO module tasks: chặn xóa nếu còn task assignment đang active → ConflictException
    await this.repo.softDelete(id)
  }
}
