export declare class ClientLogEvent {
    level?: string;
    event: string;
    sessionId?: string;
    ts?: string;
    url?: string;
    data?: unknown;
}
export declare class ClientLogBatchDto {
    events: ClientLogEvent[];
}
