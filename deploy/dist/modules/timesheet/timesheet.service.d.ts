import { Repository } from 'typeorm';
import { TimesheetEntry } from './entities/timesheet-entry.entity';
import { Worker } from '../workers/entities/worker.entity';
import { WorkerContract } from '../workers/entities/worker-contract.entity';
import { QuerySummariesDto } from './dto/query-summaries.dto';
export interface MonthlySummaryRow {
    workerId: string;
    yearMonth: string;
    totalWorkdays: number;
    totalRegularHours: number;
    totalOtHours: number;
    totalLeaveDays: number;
    totalAbsentDays: number;
    totalPay: number;
    baseSalary: number | null;
    allowance: number | null;
    status: 'submitted' | 'approved';
    worker: {
        id: string;
        code: string;
        fullName: string;
    };
}
export declare class TimesheetService {
    private repo;
    private workerRepo;
    private contractRepo;
    constructor(repo: Repository<TimesheetEntry>, workerRepo: Repository<Worker>, contractRepo: Repository<WorkerContract>);
    availableMonths(): Promise<string[]>;
    summaries(q: QuerySummariesDto): Promise<MonthlySummaryRow[]>;
    entriesFor(workerId: string, yearMonth: string): Promise<TimesheetEntry[]>;
    approveMonth(workerId: string, yearMonth: string): Promise<{
        updated: number;
    }>;
}
