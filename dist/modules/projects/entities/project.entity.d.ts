export declare class Project {
    id: string;
    code: string;
    name: string;
    customerId: string | null;
    projectType: string;
    siteId: string | null;
    contractValue: number | null;
    startDate: string | null;
    deadline: string;
    actualEndDate: string | null;
    progressPct: number;
    status: string;
    description: string | null;
    managerId: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
