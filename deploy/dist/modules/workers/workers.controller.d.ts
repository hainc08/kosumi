import { WorkersService } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { QueryWorkerDto } from './dto/query-worker.dto';
export declare class WorkersController {
    private svc;
    constructor(svc: WorkersService);
    findAll(q: QueryWorkerDto): Promise<import("./workers.service").WorkerWithContract[]>;
    findOne(id: string): Promise<import("./workers.service").WorkerWithContract>;
    create(dto: CreateWorkerDto): Promise<import("./workers.service").WorkerWithContract>;
    update(id: string, dto: UpdateWorkerDto): Promise<import("./workers.service").WorkerWithContract>;
    setStatus(id: string, status: string): Promise<import("./workers.service").WorkerWithContract>;
    remove(id: string): Promise<void>;
}
