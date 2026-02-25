"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lockFileWithOptions = lockFileWithOptions;
exports.readFile = void 0;
exports.statDir = statDir;
exports.statFile = statFile;
exports.unlockFileNext = unlockFileNext;
var _lockfile = _interopRequireDefault(require("lockfile"));
var fsP = _interopRequireWildcard(require("node:fs/promises"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _nodeUtil = require("node:util");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const readFile = exports.readFile = fsP.readFile;
const statPromise = fsP.stat;
// https://github.com/npm/lockfile/issues/33
const lfLock = (0, _nodeUtil.promisify)(_lockfile.default.lock);
const lfUnlock = (0, _nodeUtil.promisify)(_lockfile.default.unlock);

/**
 * Test to see if the directory exists
 * @param name
 * @returns
 */
async function statDir(name) {
  const dirPath = _nodePath.default.dirname(name);
  const stats = await statPromise(dirPath);
  if (!stats.isDirectory()) {
    throw new Error(`${_nodePath.default.dirname(name)} is not a directory`);
  }
  return;
}

/**
 *  test to see if the directory exists
 * @param name
 * @returns
 */
async function statFile(name) {
  const stats = await statPromise(name);
  if (!stats.isFile()) {
    throw new Error(`${_nodePath.default.dirname(name)} is not a file`);
  }
  return;
}

/**
 * Lock a file
 * @param name name of the file to lock
 */
async function lockFileWithOptions(name, options) {
  const lockOpts = {
    // time (ms) to wait when checking for stale locks
    wait: 1000,
    // how often (ms) to re-check stale locks
    pollPeriod: 100,
    // locks are considered stale after 5 minutes
    stale: 5 * 60 * 1000,
    // number of times to attempt to create a lock
    retries: 100,
    // time (ms) between tries
    retryWait: 100,
    ...options
  };
  await lfLock(`${name}.lock`, lockOpts);
}

// unlocks file by removing existing lock file
async function unlockFileNext(name) {
  const lockFileName = `${name}.lock`;
  return lfUnlock(lockFileName);
}
//# sourceMappingURL=utils.js.map