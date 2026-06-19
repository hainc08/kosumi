import { TasksService } from './tasks.service';
import { AssignWorkerDto } from './dto/assign-worker.dto';
import { TransferWorkerDto } from './dto/transfer-worker.dto';
export declare class TasksController {
    private svc;
    constructor(svc: TasksService);
    activeTasks(): Promise<import("./tasks.service").TaskWithRelations[]>;
    availableWorkers(siteId?: string): Promise<import("./tasks.service").WorkerWithDisplay[]>;
    completed(): Promise<(import("./entities/task.entity").Task & {
        assignments: import("./tasks.service").TaskAssignmentWithWorker[];
        activeWorkers: import("./tasks.service").WorkerMini[];
        section?: string | null;
    } & {
        workers: import("./tasks.service").WorkerMini[];
        totalMinutes: number;
        overtimeMinutes: number;
    })[]>;
    clockOut(): Promise<{
        ended: number;
    }>;
    tasks(quoteId?: string, projectId?: string): Promise<import("./tasks.service").TaskWithRelations[]>;
    generateFromQuote(quoteId: string): Promise<{
        created: number;
    }>;
    generateForProject(projectId: string): Promise<{
        created: number;
    }>;
    transfer(dto: TransferWorkerDto): Promise<import("./entities/task-assignment.entity").TaskAssignment>;
    saveAssignments(body: {
        draft: Record<string, string[]>;
        otHours?: number;
    }): Promise<number>;
    assign(id: string, dto: AssignWorkerDto): Promise<import("./entities/task-assignment.entity").TaskAssignment>;
    unassign(id: string, dto: AssignWorkerDto): Promise<void>;
    complete(id: string): Promise<import("./entities/task.entity").Task>;
}
