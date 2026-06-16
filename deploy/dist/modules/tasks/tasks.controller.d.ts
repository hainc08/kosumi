import { TasksService } from './tasks.service';
import { AssignWorkerDto } from './dto/assign-worker.dto';
import { TransferWorkerDto } from './dto/transfer-worker.dto';
export declare class TasksController {
    private svc;
    constructor(svc: TasksService);
    activeTasks(): Promise<import("./tasks.service").TaskWithRelations[]>;
    availableWorkers(siteId?: string): Promise<import("./tasks.service").WorkerWithDisplay[]>;
    tasksForQuote(quoteId: string): Promise<import("./tasks.service").TaskWithRelations[]>;
    transfer(dto: TransferWorkerDto): Promise<import("./entities/task-assignment.entity").TaskAssignment>;
    saveAssignments(draft: Record<string, string[]>): Promise<number>;
    assign(id: string, dto: AssignWorkerDto): Promise<import("./entities/task-assignment.entity").TaskAssignment>;
    unassign(id: string, dto: AssignWorkerDto): Promise<void>;
}
