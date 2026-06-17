"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveInitials = deriveInitials;
exports.avatarColorFor = avatarColorFor;
const PALETTE = ['#1D4ED8', '#16A34A', '#D97706', '#7C3AED', '#DC2626', '#0891B2'];
function deriveInitials(fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1)
        return parts[0].charAt(0).toUpperCase();
    const first = parts[0].charAt(0);
    const last = parts[parts.length - 1].charAt(0);
    return (first + last).toUpperCase();
}
function avatarColorFor(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++)
        h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return PALETTE[h % PALETTE.length];
}
//# sourceMappingURL=worker-display.util.js.map