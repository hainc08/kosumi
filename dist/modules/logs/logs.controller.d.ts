import type { Request } from 'express';
import { LogsService } from './logs.service';
import { ClientLogBatchDto } from './dto/client-log.dto';
export declare class LogsController {
    private svc;
    constructor(svc: LogsService);
    client(dto: ClientLogBatchDto, req: Request): {
        received: number;
    };
    tail(token?: string, lines?: string): {
        file: string;
        lines: string[];
    };
}
