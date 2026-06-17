import { ClientLogEvent } from './dto/client-log.dto';
export declare class LogsService {
    ingest(events: ClientLogEvent[], ctx: {
        ip?: string;
        userAgent?: string;
    }): {
        received: number;
    };
    tail(lines: number): {
        file: string;
        lines: string[];
    };
}
