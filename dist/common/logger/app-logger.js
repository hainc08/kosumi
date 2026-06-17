"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOGGER_CONFIG = exports.appLog = void 0;
exports.redact = redact;
exports.writeLog = writeLog;
const fs_1 = require("fs");
const path_1 = require("path");
const ORDER = ['debug', 'info', 'warn', 'error'];
const MIN_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_DIR = process.env.LOG_DIR || (0, path_1.join)(process.cwd(), 'logs');
const TO_FILE = process.env.LOG_TO_FILE !== 'false';
const SENSITIVE = /^(password|pass|token|secret|authorization|auth|jwt|accesstoken|refreshtoken)$/i;
const MAX_STR = 2000;
function enabled(level) {
    return ORDER.indexOf(level) >= ORDER.indexOf(MIN_LEVEL);
}
function redact(value, depth = 0) {
    if (value == null)
        return value;
    if (typeof value === 'string')
        return value.length > MAX_STR ? value.slice(0, MAX_STR) + '…(cắt)' : value;
    if (typeof value !== 'object')
        return value;
    if (depth > 6)
        return '…(sâu)';
    if (Array.isArray(value))
        return value.slice(0, 100).map((v) => redact(v, depth + 1));
    const out = {};
    for (const [k, v] of Object.entries(value)) {
        out[k] = SENSITIVE.test(k) ? '***' : redact(v, depth + 1);
    }
    return out;
}
let dirReady = false;
function ensureDir() {
    if (dirReady)
        return;
    try {
        (0, fs_1.mkdirSync)(LOG_DIR, { recursive: true });
        dirReady = true;
    }
    catch { }
}
function fileForToday() {
    const d = new Date().toISOString().slice(0, 10);
    return (0, path_1.join)(LOG_DIR, `app-${d}.log`);
}
function writeLog(level, scope, message, meta) {
    if (!enabled(level))
        return;
    const entry = {
        ts: new Date().toISOString(),
        level,
        scope,
        msg: message,
        ...(meta ? redact(meta) : {}),
    };
    const line = JSON.stringify(entry);
    const head = `[${entry.ts}] ${level.toUpperCase().padEnd(5)} ${scope} ${message}`;
    if (level === 'error')
        console.error(head, meta ?? '');
    else if (level === 'warn')
        console.warn(head);
    else
        console.log(head);
    if (!TO_FILE)
        return;
    ensureDir();
    (0, fs_1.appendFile)(fileForToday(), line + '\n', (err) => {
        if (err)
            console.error('[logger] không ghi được file log:', err.message);
    });
}
exports.appLog = {
    debug: (scope, msg, meta) => writeLog('debug', scope, msg, meta),
    info: (scope, msg, meta) => writeLog('info', scope, msg, meta),
    warn: (scope, msg, meta) => writeLog('warn', scope, msg, meta),
    error: (scope, msg, meta) => writeLog('error', scope, msg, meta),
};
exports.LOGGER_CONFIG = { LOG_DIR, MIN_LEVEL, TO_FILE, fileForToday };
//# sourceMappingURL=app-logger.js.map