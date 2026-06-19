export declare class TaskAssignment {
    id: string;
    taskId: string;
    workerId: string;
    assignedAt: Date;
    startedAt: Date | null;
    endedAt: Date | null;
    isActive: boolean;
    isOvertime: boolean;
    otEndAt: Date | null;
    transferredFromTaskId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
