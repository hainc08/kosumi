export declare class TimesheetEntry {
    id: string;
    workerId: string;
    workDate: string;
    siteId: string | null;
    regularHours: number;
    overtimeHours: number;
    dayType: string;
    contractType: string;
    rateNormal: number | null;
    rateOvertime: number | null;
    payAmount: number;
    status: string;
    approvedBy: string | null;
    approvedAt: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}
