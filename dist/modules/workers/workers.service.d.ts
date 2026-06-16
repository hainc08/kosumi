import { DataSource, Repository } from 'typeorm';
import { Worker } from './entities/worker.entity';
import { WorkerContract } from './entities/worker-contract.entity';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { QueryWorkerDto } from './dto/query-worker.dto';
export type WorkerWithContract = Worker & {
    activeContract: WorkerContract | null;
    initials: string;
    avatarColor: string;
};
export declare class WorkersService {
    private repo;
    private contractRepo;
    private dataSource;
    constructor(repo: Repository<Worker>, contractRepo: Repository<WorkerContract>, dataSource: DataSource);
    private enrich;
    private enrichOne;
    findAll(q: QueryWorkerDto): Promise<WorkerWithContract[]>;
    findOne(id: string): Promise<WorkerWithContract>;
    create(dto: CreateWorkerDto): Promise<WorkerWithContract>;
    update(id: string, dto: UpdateWorkerDto): Promise<WorkerWithContract>;
    setStatus(id: string, status: string): Promise<WorkerWithContract>;
    remove(id: string): Promise<void>;
}
