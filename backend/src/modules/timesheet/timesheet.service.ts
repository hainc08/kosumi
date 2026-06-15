import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { TimesheetEntry } from './entities/timesheet-entry.entity'
import { Worker } from '../workers/entities/worker.entity'
import { WorkerContract } from '../workers/entities/worker-contract.entity'
import { QuerySummariesDto } from './dto/query-summaries.dto'

export interface MonthlySummaryRow {
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
  status: 'submitted' | 'approved'
  worker: { id: string; code: string; fullName: string }
}

@Injectable()
export class TimesheetService {
  constructor(
    @InjectRepository(TimesheetEntry) private repo: Repository<TimesheetEntry>,
    @InjectRepository(Worker) private workerRepo: Repository<Worker>,
    @InjectRepository(WorkerContract) private contractRepo: Repository<WorkerContract>,
  ) {}

  /** Các tháng có dữ liệu chấm công (mới nhất trước). */
  async availableMonths(): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('t')
      .select("DATE_FORMAT(t.work_date, '%Y-%m')", 'ym')
      .distinct(true)
      .orderBy('ym', 'DESC')
      .getRawMany<{ ym: string }>()
    return rows.map((r) => r.ym)
  }

  /** Bảng tổng hợp công/lương theo tháng cho từng nhân viên. */
  async summaries(q: QuerySummariesDto): Promise<MonthlySummaryRow[]> {
    const ym = q.yearMonth || (await this.availableMonths())[0]
    if (!ym) return []

    const entries = await this.repo
      .createQueryBuilder('t')
      .where("DATE_FORMAT(t.work_date, '%Y-%m') = :ym", { ym })
      .getMany()
    if (entries.length === 0) return []

    const byWorker = new Map<string, TimesheetEntry[]>()
    for (const e of entries) {
      const arr = byWorker.get(e.workerId) ?? []
      arr.push(e)
      byWorker.set(e.workerId, arr)
    }

    const workerIds = [...byWorker.keys()]
    const [workers, contracts] = await Promise.all([
      this.workerRepo.find({ where: { id: In(workerIds) } }),
      this.contractRepo.find({ where: { workerId: In(workerIds), isActive: true } }),
    ])
    const workerById = new Map(workers.map((w) => [w.id, w]))
    const contractByWorker = new Map(contracts.map((c) => [c.workerId, c]))

    // GHI CHÚ: giống prototype, `siteId` được nhận nhưng KHÔNG dùng để lọc.
    const rows: MonthlySummaryRow[] = []
    for (const [workerId, workerEntries] of byWorker) {
      const w = workerById.get(workerId)
      if (!w) continue
      if (
        q.search &&
        !w.fullName.toLowerCase().includes(q.search.toLowerCase()) &&
        !w.code.toLowerCase().includes(q.search.toLowerCase())
      ) continue

      const c = contractByWorker.get(workerId)
      const anyPending = workerEntries.some((e) => e.status === 'pending_approval' || e.status === 'draft')
      const allowanceSum = (c?.allowanceResponsibility ?? 0) + (c?.allowanceAttendance ?? 0)

      rows.push({
        workerId,
        yearMonth: ym,
        totalWorkdays: workerEntries.filter((e) => e.dayType === 'workday').length,
        totalRegularHours: workerEntries.reduce((s, e) => s + e.regularHours, 0),
        totalOtHours: workerEntries.reduce((s, e) => s + e.overtimeHours, 0),
        totalLeaveDays: workerEntries.filter((e) => e.dayType === 'leave_paid' || e.dayType === 'leave_unpaid').length,
        totalAbsentDays: workerEntries.filter((e) => e.dayType === 'absent').length,
        totalPay: workerEntries.reduce((s, e) => s + e.payAmount, 0),
        baseSalary: c?.baseSalary ?? null,
        allowance: allowanceSum || null,
        status: anyPending ? 'submitted' : 'approved',
        worker: { id: w.id, code: w.code, fullName: w.fullName },
      })
    }

    return rows.sort((a, b) => a.worker.code.localeCompare(b.worker.code))
  }

  /** Các bản ghi ngày công của 1 nhân viên trong tháng, sắp theo ngày tăng dần. */
  async entriesFor(workerId: string, yearMonth: string): Promise<TimesheetEntry[]> {
    return this.repo
      .createQueryBuilder('t')
      .where('t.worker_id = :workerId', { workerId })
      .andWhere("DATE_FORMAT(t.work_date, '%Y-%m') = :ym", { ym: yearMonth })
      .orderBy('t.work_date', 'ASC')
      .getMany()
  }

  /** Duyệt toàn bộ ngày công đang chờ của 1 nhân viên trong tháng. */
  async approveMonth(workerId: string, yearMonth: string): Promise<{ updated: number }> {
    const result = await this.repo
      .createQueryBuilder()
      .update(TimesheetEntry)
      .set({ status: 'approved', approvedAt: () => 'NOW()', updatedAt: () => 'NOW()' })
      .where('worker_id = :workerId', { workerId })
      .andWhere("DATE_FORMAT(work_date, '%Y-%m') = :ym", { ym: yearMonth })
      .andWhere('status != :approved', { approved: 'approved' })
      .execute()

    return { updated: result.affected ?? 0 }
  }
}
