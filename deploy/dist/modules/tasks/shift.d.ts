export declare function parseHm(raw: string | undefined, fbH: number, fbM: number): {
    hour: number;
    min: number;
};
export declare const SHIFT_END_HOUR: number;
export declare const SHIFT_END_MIN: number;
export declare const OT_START_HOUR: number;
export declare const OT_START_MIN: number;
export declare function formatHm(hour: number, min: number): string;
export declare function isOvertimeTime(now: Date): boolean;
export declare function computeOtEndAt(base: Date, otHours: number): Date;
export declare function otMinutesOf(startedAt: Date, endedAt: Date): number;
