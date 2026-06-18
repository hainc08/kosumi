import { LogsService } from './logs.service';
import { ClientLogBatchDto } from './dto/client-log.dto';
export declare class LogsController {
    private readonly svc;
    constructor(svc: LogsService);
    client(dto: ClientLogBatchDto, req: {
        ip?: string;
        socket?: {
            remoteAddress?: string;
        };
        headers: Record<string, string>;
    }): {
        received: number;
    };
    tail(token: string, lines: string): {
        file: string;
        lines: string[];
    };
}
