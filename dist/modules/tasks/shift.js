"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OT_START_MIN = exports.OT_START_HOUR = exports.SHIFT_END_MIN = exports.SHIFT_END_HOUR = void 0;
exports.parseHm = parseHm;
exports.formatHm = formatHm;
exports.isOvertimeTime = isOvertimeTime;
exports.computeOtEndAt = computeOtEndAt;
exports.otMinutesOf = otMinutesOf;
function parseHm(raw, fbH, fbM) {
    const m = /^(\d{1,2}):(\d{2})$/.exec((raw ?? '').trim());
    if (!m)
        return { hour: fbH, min: fbM };
    const hour = Number(m[1]), min = Number(m[2]);
    if (hour < 0 || hour > 23 || min < 0 || min > 59)
        return { hour: fbH, min: fbM };
    return { hour, min };
}
const _shiftEnd = parseHm(process.env.SHIFT_END, 17, 0);
const _otStart = parseHm(process.env.OT_START, 17, 15);
exports.SHIFT_END_HOUR = _shiftEnd.hour;
exports.SHIFT_END_MIN = _shiftEnd.min;
exports.OT_START_HOUR = _otStart.hour;
exports.OT_START_MIN = _otStart.min;
function formatHm(hour, min) {
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}
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
function otMinutesOf(startedAt, endedAt) {
    const otStartOfDay = new Date(startedAt);
    otStartOfDay.setHours(exports.OT_START_HOUR, exports.OT_START_MIN, 0, 0);
    const from = startedAt > otStartOfDay ? startedAt : otStartOfDay;
    return Math.max(0, Math.round((+endedAt - +from) / 60000));
}
//# sourceMappingURL=shift.js.map