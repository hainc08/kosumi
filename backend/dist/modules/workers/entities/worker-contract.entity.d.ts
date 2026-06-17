export declare class WorkerContract {
    id: string;
    workerId: string;
    contractType: string;
    startDate: string;
    endDate: string | null;
    baseSalary: number | null;
    allowanceResponsibility: number | null;
    allowanceAttendance: number | null;
    ratePerUnit: number | null;
    unitName: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
