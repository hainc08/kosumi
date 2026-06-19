export declare const SHIFT_END_HOUR = 17;
export declare const SHIFT_END_MIN = 0;
export declare const OT_START_HOUR = 17;
export declare const OT_START_MIN = 15;
export declare function isOvertimeTime(now: Date): boolean;
export declare function computeOtEndAt(base: Date, otHours: number): Date;
