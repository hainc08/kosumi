import { TimesheetService } from './timesheet.service';
import { QuerySummariesDto } from './dto/query-summaries.dto';
import { ApproveMonthDto } from './dto/approve-month.dto';
export declare class TimesheetController {
    private svc;
    constructor(svc: TimesheetService);
    months(): Promise<string[]>;
    summaries(q: QuerySummariesDto): Promise<import("./timesheet.service").MonthlySummaryRow[]>;
    entries(workerId: string, yearMonth: string): Promise<import("./entities/timesheet-entry.entity").TimesheetEntry[]>;
    approve(dto: ApproveMonthDto): Promise<{
        updated: number;
    }>;
}
