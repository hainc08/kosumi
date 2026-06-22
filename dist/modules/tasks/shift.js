"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OT_START_MIN = exports.OT_START_HOUR = exports.SHIFT_END_MIN = exports.SHIFT_END_HOUR = void 0;
exports.isOvertimeTime = isOvertimeTime;
exports.computeOtEndAt = computeOtEndAt;
exports.SHIFT_END_HOUR = 17;
exports.SHIFT_END_MIN = 0;
exports.OT_START_HOUR = 17;
exports.OT_START_MIN = 15;
function isOvertimeTime(now) {
    const h = now.getHours(), m = now.getMinutes();
    return h > exports.SHIFT_END_HOUR || (h === exports.SHIFT_END_HOUR && m >= exports.SHIFT_END_MIN);
}
function computeOtEndAt(base, otHours) {
    const d = new Date(base);
    d.setHours(exports.OT_START_HOUR, exports.OT_START_MIN, 0, 0);
    d.setMinutes(d.getMinutes() + Math.round(otHours * 60));
    return d;
}
//# sourceMappingURL=shift.js.map