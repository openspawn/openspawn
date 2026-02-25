"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.statfile = exports.statDir = exports.lockfile = void 0;
var _lockfile = _interopRequireDefault(require("lockfile"));
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const statDir = name => {
  return new Promise((resolve, reject) => {
    // test to see if the directory exists
    const dirPath = _nodePath.default.dirname(name);
    _nodeFs.default.stat(dirPath, function (err, stats) {
      if (err) {
        return reject(err);
      } else if (!stats.isDirectory()) {
        return resolve(new Error(`${_nodePath.default.dirname(name)} is not a directory`));
      } else {
        return resolve(null);
      }
    });
  });
};
exports.statDir = statDir;
const statfile = name => {
  return new Promise((resolve, reject) => {
    // test to see if the directory exists
    _nodeFs.default.stat(name, function (err, stats) {
      if (err) {
        return reject(err);
      } else if (!stats.isFile()) {
        return resolve(new Error(`${_nodePath.default.dirname(name)} is not a file`));
      } else {
        return resolve(null);
      }
    });
  });
};
exports.statfile = statfile;
const lockfile = name => {
  return new Promise(resolve => {
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
      retryWait: 100
    };
    const lockFileName = `${name}.lock`;
    _lockfile.default.lock(lockFileName, lockOpts, () => {
      resolve();
    });
  });
};
exports.lockfile = lockfile;
//# sourceMappingURL=utils.js.map