import { DataSource, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskAssignment } from './entities/task-assignment.entity';
import { Worker } from '../workers/entities/worker.entity';
import { QuoteItem } from '../quotes/entities/quote-item.entity';
export type WorkerMini = {
    id: string;
    code: string;
    fullName: string;
    initials: string;
    avatarColor: string;
};
export type TaskAssignmentWithWorker = TaskAssignment & {
    worker?: WorkerMini;
};
export type TaskWithRelations = Task & {
    assignments: TaskAssignmentWithWorker[];
    activeWorkers: WorkerMini[];
    section?: string | null;
};
export type WorkerWithDisplay = Worker & {
    initials: string;
    avatarColor: string;
};
export declare class TasksService {
    private repo;
    private assignmentRepo;
    private workerRepo;
    private quoteItemRepo;
    private dataSource;
    constructor(repo: Repository<Task>, assignmentRepo: Repository<TaskAssignment>, workerRepo: Repository<Worker>, quoteItemRepo: Repository<QuoteItem>, dataSource: DataSource);
    private toMini;
    private enrich;
    private loadActiveAssignments;
    private enrichMany;
    tasksForQuote(quoteId?: string): Promise<TaskWithRelations[]>;
    tasksForProject(projectId?: string): Promise<TaskWithRelations[]>;
    generateFromQuote(quoteId: string): Promise<{
        created: number;
    }>;
    generateForProject(projectId: string): Promise<{
        created: number;
    }>;
    activeTasksAll(): Promise<TaskWithRelations[]>;
    availableWorkers(_siteId?: string): Promise<WorkerWithDisplay[]>;
    assign(taskId: string, workerId: string): Promise<TaskAssignment>;
    unassign(taskId: string, workerId: string): Promise<void>;
    transfer(workerId: string, fromTaskId: string, toTaskId: string): Promise<TaskAssignment>;
    saveAssignments(draft: Record<string, string[]>): Promise<number>;
}
