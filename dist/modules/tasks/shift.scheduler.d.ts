import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { TasksService } from './tasks.service';
export declare class ShiftScheduler implements OnModuleInit, OnModuleDestroy {
    private readonly svc;
    private readonly logger;
    private timer;
    private lastClockOutDay;
    constructor(svc: TasksService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    tick(now: Date): Promise<void>;
}
