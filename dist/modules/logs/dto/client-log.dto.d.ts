export declare class ClientLogEvent {
    level?: 'debug' | 'info' | 'warn' | 'error' | string;
    event: string;
    sessionId?: string;
    ts?: string;
    url?: string;
    data?: unknown;
}
export declare class ClientLogBatchDto {
    events: ClientLogEvent[];
}
