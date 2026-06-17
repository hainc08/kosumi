export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export declare function redact(value: unknown, depth?: number): unknown;
declare function fileForToday(): string;
export declare function writeLog(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>): void;
export declare const appLog: {
    debug: (scope: string, msg: string, meta?: Record<string, unknown>) => void;
    info: (scope: string, msg: string, meta?: Record<string, unknown>) => void;
    warn: (scope: string, msg: string, meta?: Record<string, unknown>) => void;
    error: (scope: string, msg: string, meta?: Record<string, unknown>) => void;
};
export declare const LOGGER_CONFIG: {
    LOG_DIR: string;
    MIN_LEVEL: LogLevel;
    TO_FILE: boolean;
    fileForToday: typeof fileForToday;
};
export {};
