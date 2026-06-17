"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCode = makeCode;
exports.nextQuoteCode = nextQuoteCode;
exports.addDays = addDays;
function makeCode(prefix, seq, pad = 3) {
    return `${prefix}${String(seq).padStart(pad, '0')}`;
}
function nextQuoteCode(existingCodes) {
    const nums = existingCodes.map((c) => parseInt(c.replace(/^WS/, ''), 10)).filter((n) => !Number.isNaN(n));
    const max = nums.length ? Math.max(...nums) : 80;
    return 'WS' + String(max + 1).padStart(4, '0');
}
function addDays(iso, days) {
    const d = iso ? new Date(iso) : new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}
//# sourceMappingURL=code.util.js.map