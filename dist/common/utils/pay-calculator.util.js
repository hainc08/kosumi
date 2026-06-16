"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STANDARD_WORKDAYS = void 0;
exports.isPaidDay = isPaidDay;
exports.computeDayPay = computeDayPay;
exports.STANDARD_WORKDAYS = 26;
function isPaidDay(dayType) {
    return dayType === 'workday' || dayType === 'leave_paid' || dayType === 'holiday';
}
function computeDayPay(i) {
    const totalMonthly = (i.baseSalary ?? 0) + (i.allowanceResponsibility ?? 0) + (i.allowanceAttendance ?? 0);
    switch (i.contractType) {
        case 'official':
        case 'probation':
            return isPaidDay(i.dayType) ? Math.round(totalMonthly / exports.STANDARD_WORKDAYS) : 0;
        case 'piece_rate':
            return 0;
    }
}
//# sourceMappingURL=pay-calculator.util.js.map